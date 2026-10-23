import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const require = createRequire(import.meta.url);
function compiled(source) {
  return (
    "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ).toString("base64")
  );
}
const checkout = compiled(
  readFileSync(
    new URL("../features/checkout/domain.ts", import.meta.url),
    "utf8",
  ),
);
const source = readFileSync(
  new URL("../features/merchant/domain.ts", import.meta.url),
  "utf8",
).replace('"../checkout/domain"', JSON.stringify(checkout));
const { priceMinor, authIdentity, validateMutation } = await import(
  compiled(source)
);
const now = 1800000000,
  user = {
    id: "11111111-1111-4111-8111-111111111111",
    email_confirmed_at: "2026-10-22T12:00:00Z",
  };
const claims = {
  sub: user.id,
  role: "authenticated",
  exp: now + 3600,
  session_id: "22222222-2222-4222-8222-222222222222",
  aal: "aal2",
  amr: [{ method: "totp", timestamp: now - 10 }],
};
test("merchant prices use exact minor units and preserve unknown prices", () => {
  assert.equal(priceMinor("12.34"), 1234);
  assert.equal(priceMinor("0.29"), 29);
  assert.equal(priceMinor("1000000"), 100000000);
  assert.equal(priceMinor(""), null);
  for (const invalid of ["0", "-1", "1.001", "1e3", "NaN", "1000000.01", 1.23])
    assert.throws(() => priceMinor(invalid));
});
test("merchant identity requires verified current claims, never profile metadata", () => {
  assert.equal(authIdentity(user, claims, true, now).mfa, true);
  for (const invalid of [
    { ...claims, sub: "someone-else" },
    { ...claims, exp: now },
    { ...claims, role: "service_role" },
    { ...claims, session_id: "invalid" },
  ])
    assert.throws(() => authIdentity(user, invalid, true, now));
  assert.throws(() =>
    authIdentity(
      {
        ...user,
        email_confirmed_at: undefined,
        user_metadata: { role: "owner" },
      },
      claims,
      false,
      now,
    ),
  );
  assert.throws(() =>
    authIdentity({ ...user, is_anonymous: true }, claims, false, now),
  );
});
test("fresh MFA is independent of refreshed iat and aal2 alone", () => {
  assert.equal(
    authIdentity(
      user,
      { ...claims, amr: [{ method: "mfa/totp", timestamp: now }] },
      true,
      now,
    ).mfa,
    true,
  );
  for (const amr of [
    [],
    ["totp"],
    [{ method: "password", timestamp: now }],
    [{ method: "totp", timestamp: now - 901 }],
    [{ method: "totp", timestamp: now + 31 }],
  ])
    assert.throws(
      () => authIdentity(user, { ...claims, amr, iat: now }, true, now),
      /MERCHANT_MFA/,
    );
  assert.throws(
    () => authIdentity(user, { ...claims, aal: "aal1" }, true, now),
    /MERCHANT_MFA/,
  );
  assert.equal(
    authIdentity(user, { ...claims, aal: "aal1" }, false, now).mfa,
    false,
  );
});
const product = {
  title: "Confirmed design",
  category: "earrings",
  subcategory: "Beaded earrings",
  description: "Owner supplied product description.",
  materials: ["Beadwork"],
  material_status: "visual",
  images: ["/images/products/example.jpg"],
  attributes: {
    colors: ["Blue"],
    contents: "One pair",
    privateNote: "Do not overwrite import metadata",
  },
  published: true,
  details_approved: true,
  price_minor: 1,
  stock_quantity: 999,
  revision: 50,
};
test("product edits whitelist metadata and cannot alter price, stock or identity", () => {
  const clean = validateMutation("product.save", product);
  assert.equal(clean.price_minor, undefined);
  assert.equal(clean.stock_quantity, undefined);
  assert.equal(clean.revision, undefined);
  assert.equal(clean.attributes.privateNote, undefined);
  assert.throws(() =>
    validateMutation("product.save", { ...product, images: [] }),
  );
  assert.throws(() =>
    validateMutation("product.save", { ...product, category: "invented" }),
  );
  assert.throws(() =>
    validateMutation("product.save", { ...product, details_approved: "true" }),
  );
});
test("stock adjustments require integer sale units and a reason", () => {
  assert.deepEqual(
    validateMutation("stock.adjust", {
      mode: "initial",
      quantity: 0,
      reason: "Opening count",
    }),
    { mode: "initial", quantity: 0, reason: "Opening count" },
  );
  assert.equal(
    validateMutation("stock.adjust", {
      mode: "adjust",
      quantity: -3,
      reason: "Damaged stock",
    }).quantity,
    -3,
  );
  for (const quantity of [0, 1.5, NaN, 1000001])
    assert.throws(() =>
      validateMutation("stock.adjust", {
        mode: "adjust",
        quantity,
        reason: "Restocked",
      }),
    );
  assert.throws(() =>
    validateMutation("stock.adjust", {
      mode: "initial",
      quantity: -1,
      reason: "Opening count",
    }),
  );
});
test("fulfilment cannot accept payment changes or unsafe tracking links", () => {
  assert.throws(() => validateMutation("order.fulfill", { status: "paid" }));
  assert.throws(() => validateMutation("payment.markPaid", {}));
  for (const tracking_url of [
    "javascript:alert(1)",
    "http://example.test",
    "https://name:pass@example.test",
  ])
    assert.throws(() =>
      validateMutation("order.fulfill", {
        status: "dispatched",
        tracking_number: "REF",
        tracking_url,
      }),
    );
  assert.equal(
    validateMutation("order.fulfill", {
      status: "dispatched",
      tracking_number: "REF",
      tracking_url: "https://example.test/track",
    }).status,
    "dispatched",
  );
});
test("customer request replies are bounded and do not accept refund commands", () => {
  assert.deepEqual(
    validateMutation("request.reply", {
      status: "closed",
      reply: "Resolved after review",
      refund: 500,
    }),
    { status: "closed", reply: "Resolved after review" },
  );
  for (const input of [
    { status: "submitted", reply: "Test" },
    { status: "closed", reply: "" },
    { status: "reviewing", reply: "x".repeat(4001) },
  ])
    assert.throws(() => validateMutation("request.reply", input));
});
const sharp = (await import(pathToFileURL(require.resolve("sharp")).href))
  .default;
const imageSource = readFileSync(
  new URL("../features/merchant/images-server.ts", import.meta.url),
  "utf8",
)
  .replace('import "server-only";', "")
  .replace(
    '"sharp"',
    JSON.stringify(pathToFileURL(require.resolve("sharp")).href),
  )
  .replace('"../checkout/domain"', JSON.stringify(checkout));
const { prepareProductPhoto } = await import(compiled(imageSource));
test("product upload decodes, bounds and strips metadata from real image bytes", async () => {
  const input = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "#123456" },
  })
    .jpeg()
    .withMetadata({ exif: { IFD0: { Copyright: "Synthetic test metadata" } } })
    .toBuffer();
  const output = await prepareProductPhoto(input),
    meta = await sharp(output).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 2000);
  assert.equal(meta.exif, undefined);
  await assert.rejects(prepareProductPhoto(Buffer.from("<svg></svg>")));
  await assert.rejects(prepareProductPhoto(Buffer.alloc(8 * 1024 * 1024 + 1)));
});
