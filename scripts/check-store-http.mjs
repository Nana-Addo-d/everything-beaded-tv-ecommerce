import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:3101");
if (!["127.0.0.1", "localhost"].includes(base.hostname))
  throw new Error(
    "This check is restricted to a local store without provider credentials.",
  );
const products = JSON.parse(
  readFileSync(
    new URL("../apps/web/features/catalog/catalogue.json", import.meta.url),
  ),
);
const categories = [...new Set(products.map((p) => p.category))];
let checks = 0;
async function page(path, expected = 200, contains) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, expected, path);
  const html = await response.text();
  if (contains)
    assert.ok(html.includes(contains), `${path}: missing ${contains}`);
  checks++;
  return html;
}
const home = await page("/", 200, "Everything Beaded");
for (const path of [
  "/shop",
  "/cart",
  "/checkout",
  "/help",
  "/about",
  "/wishlist",
  "/categories",
  "/collections",
  "/orders",
  "/contact",
])
  await page(path);
for (const department of [
  "home-living",
  "kitchen-dining",
  "fashion-accessories",
])
  await page("/shop?department=" + department, 200, "Shop the collection");
for (const collection of ["beadwork", "woven", "animal-designs", "tabletop"])
  await page("/shop?collection=" + collection, 200, "Shop the collection");
const history = await page("/api/orders", 200);
assert.deepEqual(JSON.parse(history).orders, []);
const unknownOrder = "0199b75d-a863-4044-81a2-234567890123";
await page(`/api/orders/${unknownOrder}`, 404);
await page(`/api/orders/${unknownOrder}/requests`, 404);
const robots = await page("/robots.txt", 200, "Disallow: /");
assert.ok(robots.startsWith("User-Agent: *"));
const privatePage = await page("/orders", 200);
assert.ok(privatePage.includes("noindex"));
const protectedResponse = await fetch(new URL("/api/orders", base));
assert.equal(protectedResponse.headers.get("cache-control"), "no-store");
assert.equal(
  protectedResponse.headers.get("x-content-type-options"),
  "nosniff",
);
assert.equal(protectedResponse.headers.get("x-frame-options"), "DENY");
for (const category of categories) {
  await page("/shop?category=" + category, 200, "Shop the collection");
  for (const product of products
    .filter((p) => p.category === category)
    .slice(0, 2))
    await page("/p/" + product.slug, 200, "Price coming soon");
}
await page("/shop?page=34", 200, "Page <!-- -->34<!-- --> of <!-- -->34");
await page("/shop?q=not-a-real-design", 200, "No products to show");
await page("/shop?available=yes", 200, "No products to show");
await page("/shop?q=elephant&sort=name", 200, "Elephant");
await page("/p/not-a-product", 404);
await page("/orders/not-a-uuid", 404);
await page("/shop/sample-shop", 307);
const checkout = await page("/checkout?status=success&paid=true", 200);
assert.equal(checkout.includes("Payment received"), false);
for (const [path, headers, expected] of [
  ["/api/checkout", {}, 403],
  ["/api/checkout", { Origin: base.origin }, 503],
  ["/api/checkout/quote", { Origin: "https://untrusted.example.test" }, 403],
  ["/api/payments/paystack/webhook", {}, 401],
  ["/api/internal/commerce-jobs", {}, 401],
  [
    `/api/orders/${unknownOrder}/requests`,
    { Origin: "https://untrusted.example.test" },
    403,
  ],
  [`/api/orders/${unknownOrder}/requests`, { Origin: base.origin }, 404],
]) {
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: "{}",
  });
  assert.equal(response.status, expected, path);
  checks++;
}
const assets = [
  ...new Set([
    ...products.flatMap((p) => p.images),
    ...Array.from(home.matchAll(/src="([^\"]+)"/g), (m) =>
      m[1].replaceAll("&amp;", "&"),
    ).filter((p) => p.startsWith("/images/") || p.startsWith("/_next/image")),
  ]),
];
let cursor = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < assets.length) {
      const path = assets[cursor++];
      const response = await fetch(new URL(path, base), {
        method: path.startsWith("/_next/image") ? "GET" : "HEAD",
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 200, path);
      assert.ok(
        response.headers.get("content-type")?.startsWith("image/"),
        path,
      );
    }
  }),
);
console.log(
  JSON.stringify(
    {
      origin: base.origin,
      pageAndApiChecks: checks,
      images: assets.length,
      categories: categories.length,
      browserInteraction: false,
      providerPayments: false,
    },
    null,
    2,
  ),
);
