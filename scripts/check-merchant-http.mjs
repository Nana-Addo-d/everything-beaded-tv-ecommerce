import assert from "node:assert/strict";
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3100");
if (!["localhost", "127.0.0.1"].includes(base.hostname))
  throw new Error("Use the local test server.");
let checks = 0;
for (const path of ["/admin", "/admin/sign-in"]) {
  const response = await fetch(new URL(path, base));
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(html.includes("noindex"));
  assert.ok(
    html.includes(
      path === "/admin" ? "Checking your store access" : "Manage your store",
    ),
    "Merchant authentication must be configured",
  );
  assert.equal(html.includes("access_hash"), false);
  checks++;
}
for (const path of [
  "session",
  "overview",
  "products",
  "orders",
  "requests",
  "activity",
]) {
  const response = await fetch(new URL("/api/merchant/" + path, base));
  assert.equal(response.status, 401, path);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).error, "MERCHANT_SESSION");
  checks++;
}
for (const path of ["changes", "upload"]) {
  for (const [origin, status] of [
    ["https://untrusted.example.test", 403],
    [base.origin, 401],
  ]) {
    const response = await fetch(new URL("/api/merchant/" + path, base), {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, status, path);
    checks++;
  }
}
const forged = await fetch(new URL("/api/merchant/overview", base), {
  headers: { Authorization: "Bearer forged.invalid.signature" },
});
assert.equal(forged.status, 401);
checks++;
console.log(
  JSON.stringify(
    {
      origin: base.origin,
      checks,
      ownerSignIn: false,
      mfaEnrollment: false,
      browserInteraction: false,
    },
    null,
    2,
  ),
);
