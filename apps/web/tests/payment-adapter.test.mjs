import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
const domain = moduleUrl(
  readFileSync(
    new URL("../features/checkout/domain.ts", import.meta.url),
    "utf8",
  ),
);
const db = moduleUrl(
  "export const database=(...args)=>globalThis.paymentHarness.database(...args); export const rpc=(...args)=>globalThis.paymentHarness.rpc(...args)",
);
const config = moduleUrl(
  'export const paymentConfigured=()=>true;export const paymentMode=()=>"test";export const storeOrigin=()=>"https://store.example.test"',
);
let source = readFileSync(
  new URL("../features/commerce/paystack.ts", import.meta.url),
  "utf8",
);
source = source
  .replace(/import "server-only";?/, "")
  .replaceAll('"../checkout/domain"', JSON.stringify(domain))
  .replaceAll('"./database"', JSON.stringify(db))
  .replaceAll('"./config"', JSON.stringify(config));
const { verifyPayment, initializePayment } = await import(moduleUrl(source));
const order = {
  id: "8b9b97b8-b562-440d-8fd1-73bbcf47c039",
  reference: "eb-8b9b97b8b562440d8fd173bbcf47c039",
  total_minor: 2500,
  currency: "GHS",
  email: "buyer@example.test",
  status: "pending",
  payment_url: null,
  initialization_until: null,
  expires_at: new Date(Date.now() + 1800000).toISOString(),
};
function harness(t, response, status = 200) {
  const original = globalThis.fetch,
    requests = [],
    calls = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    if (response instanceof Error) throw response;
    return new Response(JSON.stringify(response), { status });
  };
  globalThis.paymentHarness = {
    database: async (...args) => calls.push({ type: "database", args }),
    rpc: async (name, args) => {
      calls.push({ type: "rpc", args: [name, args] });
      return name === "claim_payment_initialization"
        ? true
        : name === "record_payment"
          ? "paid"
          : "cancelled";
    },
  };
  t.after(() => {
    globalThis.fetch = original;
    delete globalThis.paymentHarness;
  });
  return { requests, calls };
}
test("a successful provider lookup with a pending transaction cannot mark an order paid", async (t) => {
  const { calls } = harness(t, { status: true, data: { status: "pending" } });
  assert.equal(await verifyPayment(order), "pending");
  assert.equal(calls.length, 0);
});
test("provider outages keep stock reserved even after the payment window expires", async (t) => {
  const { calls } = harness(t, new Error("offline"));
  await assert.rejects(
    () => verifyPayment({ ...order, expires_at: "2020-01-01T00:00:00Z" }),
    (error) => error.code === "PAYMENT_PENDING",
  );
  assert.equal(calls.length, 0);
});
test("explicit not-found responses release expired reservations through the transaction", async (t) => {
  const { calls } = harness(
    t,
    { status: false, message: "Transaction reference not found" },
    400,
  );
  assert.equal(
    await verifyPayment({ ...order, expires_at: "2020-01-01T00:00:00Z" }),
    "cancelled",
  );
  assert.equal(calls[0].args[0], "cancel_unpaid_order");
});
test("verified payments persist only after all transaction fields match", async (t) => {
  const { calls } = harness(t, {
    status: true,
    data: {
      status: "success",
      reference: order.reference,
      amount: 2500,
      currency: "GHS",
      domain: "test",
      customer: { email: order.email },
    },
  });
  assert.equal(await verifyPayment(order), "paid");
  assert.deepEqual(calls[0].args, [
    "record_payment",
    {
      p_reference: order.reference,
      p_amount: 2500,
      p_currency: "GHS",
      p_email: order.email,
    },
  ]);
});
test("a mismatched successful payment requires review instead of fulfillment", async (t) => {
  const { calls } = harness(t, {
    status: true,
    data: {
      status: "success",
      reference: order.reference,
      amount: 1,
      currency: "GHS",
      domain: "test",
      customer: { email: order.email },
    },
  });
  assert.equal(await verifyPayment(order), "payment_review");
  assert.equal(calls[0].type, "database");
  assert.equal(JSON.parse(calls[0].args[1].body).status, "payment_review");
});
test("hosted checkout uses the stored server total and reference", async (t) => {
  const { requests, calls } = harness(t, {
    status: true,
    data: {
      reference: order.reference,
      authorization_url: "https://checkout.paystack.com/test-session",
    },
  });
  assert.equal(
    await initializePayment(order),
    "https://checkout.paystack.com/test-session",
  );
  const payload = JSON.parse(requests[0].init.body);
  assert.equal(payload.amount, order.total_minor);
  assert.equal(payload.reference, order.reference);
  assert.equal(
    payload.callback_url,
    `https://store.example.test/orders/${order.id}?returned=1`,
  );
  assert.equal(calls.at(-1).type, "database");
});
test("provider responses cannot redirect customers to an untrusted payment host", async (t) => {
  const { calls } = harness(t, {
    status: true,
    data: {
      reference: order.reference,
      authorization_url: "https://other.example.test/pay",
    },
  });
  await assert.rejects(
    () => initializePayment(order),
    (error) => error.code === "PAYMENT_PENDING",
  );
  assert.equal(
    calls.some((call) => call.type === "database"),
    false,
  );
});

test("an unexplained provider failure never releases a reservation", async (t) => {
  const { calls } = harness(t, {
    status: false,
    message: "Verification temporarily unavailable",
  });
  await assert.rejects(
    () => verifyPayment({ ...order, expires_at: "2020-01-01T00:00:00Z" }),
    (error) => error.code === "PAYMENT_PENDING",
  );
  assert.equal(calls.length, 0);
});
