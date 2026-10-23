import type { Product } from "./catalog";
export const DEPARTMENTS = [
  {
    slug: "home-living",
    label: "Home & living",
    description:
      "Baskets, decorative objects and pieces that make a space your own.",
  },
  {
    slug: "kitchen-dining",
    label: "Kitchen & dining",
    description:
      "Browse serving pieces, table accessories and carved utensils. Check each item's confirmed use before ordering.",
  },
  {
    slug: "fashion-accessories",
    label: "Fashion & accessories",
    description:
      "Beadwork, jewellery, bags and sandals, in a range of colours and patterns.",
  },
] as const;
const TABLE_TYPES = new Set([
  "Carved serving utensils",
  "Woven table mats",
  "Carved coaster holders",
  "Wooden bowls and platters",
  "Painted coaster sets",
  "Animal coaster holders",
  "Woven table runners",
  "Mortar and pestle",
]);
export function departmentOf(
  product: Pick<Product, "category" | "subcategory">,
) {
  if (["earrings", "necklaces", "bags", "sandals"].includes(product.category))
    return "fashion-accessories";
  return TABLE_TYPES.has(product.subcategory)
    ? "kitchen-dining"
    : "home-living";
}
export const COLLECTIONS = [
  {
    slug: "beadwork",
    label: "Colour & beadwork",
    description: "Beaded designs across jewellery, accessories and decoration.",
  },
  {
    slug: "woven",
    label: "Woven textures",
    description: "Explore woven baskets, bags and table pieces.",
  },
  {
    slug: "animal-designs",
    label: "Animals & sculptural forms",
    description: "Animal-inspired objects, ornaments and carved details.",
  },
  {
    slug: "tabletop",
    label: "Around the table",
    description: "A selection of bowls, serving utensils, mats and coasters.",
  },
] as const;
export function inCollection(product: Product, collection: string) {
  const text = `${product.title} ${product.subcategory}`.toLowerCase();
  if (collection === "beadwork") return /bead/.test(text);
  if (collection === "woven") return /woven|basket|table mat/.test(text);
  if (collection === "animal-designs")
    return /animal|elephant|bird|giraffe|zebra|lion|hippo|turtle|rhino/.test(
      text,
    );
  if (collection === "tabletop") return TABLE_TYPES.has(product.subcategory);
  return !collection;
}
export function browseProducts(
  products: Product[],
  department = "",
  collection = "",
) {
  return products.filter(
    (p) =>
      (!department || departmentOf(p) === department) &&
      inCollection(p, collection),
  );
}
