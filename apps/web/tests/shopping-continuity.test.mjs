import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
async function sourceModule(path) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}
const selections = await sourceModule("../features/cart/selections.ts");
const discovery = await sourceModule("../features/catalog/discovery.ts");
const products = JSON.parse(
  readFileSync(
    new URL("../features/catalog/catalogue.json", import.meta.url),
    "utf8",
  ),
);
test("saved selections reject malformed, duplicate and removed products", () => {
  assert.deepEqual(selections.parseSelection("{bad", ["one"], 200), []);
  assert.deepEqual(selections.parseSelection('{"id":"one"}', ["one"], 200), []);
  assert.deepEqual(
    selections.selectionIds(
      ["one", "one", "removed", 7, null, "two"],
      ["one", "two"],
      200,
    ),
    ["one", "two"],
  );
  assert.deepEqual(selections.selectionIds(["one", "two"], ["one", "two"], 1), [
    "one",
  ]);
});
test("viewing history moves a product to the front without changing the original list", () => {
  const known = Array.from({ length: 20 }, (_, i) => `p${i}`),
    old = known.slice(0, 12);
  const next = selections.recordView(old, "p7", known);
  assert.equal(next[0], "p7");
  assert.equal(next.length, 12);
  assert.equal(new Set(next).size, 12);
  assert.deepEqual(old, known.slice(0, 12));
  assert.deepEqual(selections.recordView(old, "unknown", known), old);
  assert.equal(selections.recordView(old, "p15", known).includes("p11"), false);
});
test("quantity additions reject the whole addition beyond stock or the bag limit", () => {
  assert.equal(selections.addQuantity(18, 2, 20), 20);
  assert.equal(selections.addQuantity(18, 3, 20), null);
  assert.equal(selections.addQuantity(2, 2, 3), null);
  for (const value of [0, -1, 1.5, NaN, Infinity])
    assert.equal(selections.addQuantity(0, value, 20), null);
  assert.equal(selections.addQuantity(0, 1, 0), null);
});
test("departments account for every published design exactly once", () => {
  const groups = discovery.DEPARTMENTS.map((d) =>
    discovery.browseProducts(products, d.slug),
  );
  assert.equal(groups.flat().length, 806);
  assert.equal(new Set(groups.flat().map((p) => p.slug)).size, 806);
  assert.ok(groups.every((group) => group.length > 0));
  assert.equal(
    discovery.departmentOf({
      category: "home-living",
      subcategory: "Carved serving utensils",
    }),
    "kitchen-dining",
  );
  assert.equal(
    discovery.departmentOf({
      category: "home-living",
      subcategory: "Painted decorative dishes",
    }),
    "home-living",
  );
  assert.deepEqual(discovery.browseProducts(products, "unknown"), []);
});
test("curated collections filter original identities without inventing variants or stock", () => {
  const before = JSON.stringify(products);
  for (const collection of discovery.COLLECTIONS) {
    const result = discovery.browseProducts(products, "", collection.slug);
    assert.ok(result.length > 0);
    assert.ok(
      result.every(
        (p) =>
          products.includes(p) && p.priceMinor === null && p.stock === null,
      ),
    );
  }
  assert.equal(JSON.stringify(products), before);
  assert.deepEqual(discovery.browseProducts(products, "", "unknown"), []);
});
