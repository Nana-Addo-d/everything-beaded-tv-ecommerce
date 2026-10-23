import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const http = moduleUrl(
  `import {CommerceError} from ${JSON.stringify(domain)}; export const hash=value=>globalThis.orderAccessHarness.hash(value);export function guestSession(request){if(!request.session)throw new CommerceError('ORDER_NOT_FOUND',404);return request.session;}`,
);
const database = moduleUrl(
  "export const getOrder=id=>globalThis.orderAccessHarness.getOrder(id);",
);
let source = readFileSync(
  new URL("../features/orders/order-access.ts", import.meta.url),
  "utf8",
)
  .replace('import "server-only";', "")
  .replace('"../checkout/domain"', JSON.stringify(domain))
  .replace('"../commerce/database"', JSON.stringify(database))
  .replace('"../commerce/http"', JSON.stringify(http));
const { ownedOrder } = await import(moduleUrl(source));
const owner = "a".repeat(64),
  other = "b".repeat(64),
  id = "0199b75d-a863-4044-81a2-234567890123";
let lookups = 0;
globalThis.orderAccessHarness = {
  hash: (value) => createHash("sha256").update(value).digest("hex"),
  getOrder: async (orderId) => {
    lookups++;
    return {
      id: orderId,
      access_hash: createHash("sha256").update(owner).digest("hex"),
    };
  },
};
test("order access requires a guest session before querying private data", async () => {
  lookups = 0;
  await assert.rejects(
    ownedOrder({}, id),
    (error) => error.code === "ORDER_NOT_FOUND" && error.status === 404,
  );
  assert.equal(lookups, 0);
});
test("a different guest cannot use a known order identifier", async () => {
  await assert.rejects(
    ownedOrder({ session: other }, id),
    (error) => error.code === "ORDER_NOT_FOUND" && error.status === 404,
  );
});
test("the owning guest can read an order and invalid identifiers never query it", async () => {
  assert.equal((await ownedOrder({ session: owner }, id)).id, id);
  lookups = 0;
  await assert.rejects(ownedOrder({ session: owner }, "invalid"));
  assert.equal(lookups, 0);
});
