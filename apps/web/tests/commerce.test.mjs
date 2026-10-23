import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}
const { parseBag, parseCustomer, paymentMatches, uuid } = await load(
  "../features/checkout/domain.ts",
);
const { validSignature } = await load(
  "../features/commerce/webhook-signature.ts",
);
const customer = {
  name: "Test Buyer",
  email: "BUYER@example.test",
  phone: "+233 200 000000",
  address: {
    line1: "Test street 1",
    city: "Test city",
    region: "Test region",
    countryCode: "GH",
  },
};
const order = {
  reference: "eb-test-reference",
  total_minor: 2500,
  currency: "GHS",
  email: "buyer@example.test",
};
const verified = {
  status: "success",
  reference: order.reference,
  amount: 2500,
  currency: "GHS",
  domain: "test",
  customer: { email: order.email },
};

test("checkout rejects forged quantities, duplicate products and empty bags", () => {
  for (const value of [
    null,
    {},
    [],
    [{ slug: "a", quantity: 0 }],
    [{ slug: "a", quantity: 1.5 }],
    [{ slug: "a", quantity: 21 }],
    [{ slug: "../a", quantity: 1 }],
    [
      { slug: "a", quantity: 1 },
      { slug: "a", quantity: 1 },
    ],
  ])
    assert.throws(() => parseBag(value));
  assert.deepEqual(
    parseBag([
      { slug: "b", quantity: 2, price: 1 },
      { slug: "a", quantity: 1 },
    ]),
    [
      { slug: "a", quantity: 1 },
      { slug: "b", quantity: 2 },
    ],
  );
});
test("customer details are bounded, normalized and reject control characters", () => {
  assert.equal(parseCustomer(customer).email, "buyer@example.test");
  assert.equal(parseCustomer(customer).address.line2, "");
  for (const value of [
    { ...customer, name: "A\nB" },
    { ...customer, email: "invalid" },
    { ...customer, phone: "<script>" },
    { ...customer, address: { ...customer.address, countryCode: "gh" } },
    { ...customer, name: "x".repeat(101) },
  ])
    assert.throws(() => parseCustomer(value));
});
test("checkout identifiers must be random UUIDs", () => {
  assert.equal(
    uuid("ae8ac333-9293-42ab-b218-03d89d687584"),
    "ae8ac333-9293-42ab-b218-03d89d687584",
  );
  for (const id of [null, "1", "ae8ac333-9293-12ab-b218-03d89d687584"])
    assert.throws(() => uuid(id));
});
test("payment success needs matching transaction, total, currency, customer and environment", () => {
  assert.equal(paymentMatches(verified, order, "test"), true);
  for (const data of [
    { ...verified, status: true },
    { ...verified, status: "pending" },
    { ...verified, amount: "2500" },
    { ...verified, amount: 1 },
    { ...verified, reference: "wrong" },
    { ...verified, currency: "USD" },
    { ...verified, domain: "live" },
    { ...verified, customer: { email: "other@example.test" } },
    { ...verified, customer: null },
  ])
    assert.equal(paymentMatches(data, order, "test"), false);
});
test("webhooks authenticate the exact raw payload before it is trusted", () => {
  const body = '{"event":"charge.success","data":{"reference":"test"}}',
    key = "test-only-signing-key";
  const signature = createHmac("sha512", key).update(body).digest("hex");
  assert.equal(validSignature(body, signature, key), true);
  assert.equal(validSignature(body + " ", signature, key), false);
  assert.equal(validSignature(body, signature, "wrong-key"), false);
  assert.equal(validSignature(body, null, key), false);
  assert.equal(validSignature(body, "ab", key), false);
  assert.equal(validSignature(body, signature, undefined), false);
});
