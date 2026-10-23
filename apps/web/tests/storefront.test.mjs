import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function loadTypeScript(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8").replace(
    'import catalogue from "./catalogue.json"',
    "const catalogue = " +
      readFileSync(
        new URL("../features/catalog/catalogue.json", import.meta.url),
        "utf8",
      ),
  );
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

const { getLocalCatalog, filterProducts, CATEGORIES, canOrder } =
  await loadTypeScript("../features/catalog/catalog.ts");
const { readCart, parseCart, setQuantity, MAX_QUANTITY } = await loadTypeScript(
  "../features/cart/cart-state.ts",
);

const products = getLocalCatalog();
const slugs = products.map((product) => product.slug);

test("catalogue products have real assets and no unconfirmed commercial values", () => {
  assert.equal(products.length, 806);
  assert.equal(
    new Set(products.flatMap((product) => product.images)).size,
    1473,
  );
  assert.equal(new Set(slugs).size, products.length);
  for (const product of products) {
    assert.ok(
      CATEGORIES.some((category) => category.slug === product.category),
    );
    assert.ok(product.description.length > 70);
    assert.equal(product.priceMinor, null);
    assert.equal(product.stock, null);
    assert.equal(product.detailsApproved, false);
    assert.equal(canOrder(product), false);
    assert.equal("reviews" in product, false);
    for (const image of product.images)
      assert.ok(
        existsSync(new URL(`../public${image}`, import.meta.url)),
        image,
      );
  }
});

test("search combines words, category and product type", () => {
  const matching = filterProducts(products, "circular blue", "earrings");
  assert.ok(matching.some((p) => p.slug === "blue-circle-earrings"));
  assert.ok(matching.every((p) => p.category === "earrings"));
  assert.deepEqual(filterProducts(products, "nonexistent"), []);
  assert.deepEqual(filterProducts(products, "", "unknown"), []);
  assert.deepEqual(filterProducts(products, "", "", "", "", true), []);
  assert.ok(filterProducts(products, "elephant").length > 0);
  assert.ok(
    filterProducts(products, "", "earrings", "", "Long beaded earrings").every(
      (p) => p.subcategory === "Long beaded earrings",
    ),
  );
});

test("prices sort with unpriced products last and ordering needs price, stock and approval", () => {
  const base = products[0];
  const fixture = [
    { ...base, slug: "unknown" },
    {
      ...base,
      slug: "high",
      priceMinor: 2000,
      stock: 3,
      detailsApproved: true,
    },
    { ...base, slug: "low", priceMinor: 1000, stock: 0, detailsApproved: true },
  ];
  assert.deepEqual(
    filterProducts(fixture, "", "", "price").map((p) => p.slug),
    ["low", "high", "unknown"],
  );
  assert.deepEqual(
    filterProducts(fixture, "", "", "price-desc").map((p) => p.slug),
    ["high", "low", "unknown"],
  );
  assert.deepEqual(
    filterProducts(fixture, "", "", "", "", true).map((p) => p.slug),
    ["high"],
  );
});

test("sorting affects results without mutating catalogue order", () => {
  const original = products.map((product) => product.slug);
  const ascending = filterProducts(products, "", "", "name");
  const descending = filterProducts(products, "", "", "name-desc");
  assert.deepEqual(
    descending.map((item) => item.slug),
    ascending.map((item) => item.slug).reverse(),
  );
  assert.deepEqual(
    products.map((product) => product.slug),
    original,
  );
});

test("corrupt or unavailable browser storage produces an empty bag", () => {
  for (const value of [null, "", "{broken", "null", "{}", "42"])
    assert.deepEqual(parseCart(value, slugs), []);
});

test("restoring a bag rejects unknown products and invalid quantities", () => {
  const slug = slugs[0];
  assert.deepEqual(
    readCart(
      [
        null,
        {},
        { slug: "missing", quantity: 1 },
        ...[-2, 0, 1.5, Infinity, "2"].map((quantity) => ({ slug, quantity })),
      ],
      slugs,
    ),
    [],
  );
});

test("restoring duplicates clamps quantities and discards untrusted extra fields", () => {
  const slug = slugs[0];
  assert.deepEqual(
    readCart(
      [
        { slug, quantity: 15, price: 1 },
        { slug, quantity: 15 },
      ],
      slugs,
    ),
    [{ slug, quantity: MAX_QUANTITY }],
  );
});

test("bag supports add, quantity change, persistence round trip and removal", () => {
  const [first, second] = slugs;
  let items = setQuantity([], first, 1, slugs);
  items = setQuantity(items, first, 2, slugs);
  items = setQuantity(items, second, 1, slugs);
  assert.equal(
    items.reduce((total, item) => total + item.quantity, 0),
    3,
  );
  assert.deepEqual(parseCart(JSON.stringify(items), slugs), items);
  items = setQuantity(items, first, 0, slugs);
  assert.deepEqual(items, [{ slug: second, quantity: 1 }]);
  assert.deepEqual(setQuantity(items, second, 0, slugs), []);
});

test("quantity updates cannot introduce unknown products or bypass limits", () => {
  const slug = slugs[0];
  const items = [{ slug, quantity: 1 }];
  assert.deepEqual(setQuantity(items, "unknown", 2, slugs), items);
  for (const quantity of [-1, 1.5, NaN])
    assert.deepEqual(setQuantity(items, slug, quantity, slugs), items);
  assert.deepEqual(setQuantity(items, slug, 999, slugs), [
    { slug, quantity: MAX_QUANTITY },
  ]);
  assert.deepEqual(parseCart(JSON.stringify(items), []), []);
});
