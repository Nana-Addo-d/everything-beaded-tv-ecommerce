import catalogue from "./catalogue.json";

export type Product = {
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  image?: string;
  images: string[];
  materials: string[];
  materialStatus: string;
  colors: string[];
  priceMinor: number | null;
  stock: number | null;
  detailsApproved: boolean;
  sortOrder: number;
  currency?: string;
  sizeLabel?: string;
  dimensions?: string;
  contents?: string;
  familySlug?: string;
  optionLabel?: string;
};
export const CATEGORIES = [
  { slug: "earrings", label: "Earrings" },
  { slug: "necklaces", label: "Necklaces" },
  { slug: "bags", label: "Bags & purses" },
  { slug: "sandals", label: "Sandals" },
  { slug: "baskets", label: "Woven baskets" },
  { slug: "home-living", label: "Home & living" },
  { slug: "art", label: "Wall art" },
] as const;
const featured = [
  "blue-circle-earrings",
  "yellow-fringe-necklace",
  "beaded-handbag",
  "woven-baskets",
  "chess-set",
  "sandals-0807",
  "art-0430",
  "serving-spoons",
];
export function getLocalCatalog(): Product[] {
  return catalogue;
}
export function canOrder(product: Product) {
  return (
    product.detailsApproved &&
    product.priceMinor !== null &&
    product.priceMinor > 0 &&
    product.stock !== null &&
    product.stock > 0
  );
}
export function availability(
  product: Pick<Product, "stock" | "priceMinor" | "detailsApproved">,
) {
  if (product.stock === 0) return "Out of stock";
  if (product.priceMinor === null) return "Price coming soon";
  if (!product.detailsApproved || product.stock === null)
    return "Availability being confirmed";
  return "Available";
}
export type ProductCard = Pick<
  Product,
  | "slug"
  | "title"
  | "subcategory"
  | "image"
  | "priceMinor"
  | "stock"
  | "detailsApproved"
  | "currency"
>;
export function cardProducts(products: Product[]): ProductCard[] {
  return products.map(
    ({
      slug,
      title,
      subcategory,
      image,
      priceMinor,
      stock,
      detailsApproved,
      currency,
    }) => ({
      slug,
      title,
      subcategory,
      image,
      priceMinor,
      stock,
      detailsApproved,
      currency,
    }),
  );
}
export function filterProducts(
  products: Product[],
  query = "",
  category = "",
  sort = "",
  subcategory = "",
  availableOnly = false,
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = products.filter((product) => {
    const label =
      CATEGORIES.find((item) => item.slug === product.category)?.label ?? "";
    const searchable = [
      product.title,
      product.description,
      product.subcategory,
      label,
      ...product.colors,
      ...product.materials,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!category || product.category === category) &&
      (!subcategory || product.subcategory === subcategory) &&
      (!availableOnly || canOrder(product)) &&
      terms.every((term) => searchable.includes(term))
    );
  });
  if (sort === "name") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "name-desc")
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  else if (sort === "price" || sort === "price-desc")
    filtered.sort((a, b) => {
      if (a.priceMinor === null)
        return b.priceMinor === null ? a.sortOrder - b.sortOrder : 1;
      if (b.priceMinor === null) return -1;
      return sort === "price"
        ? a.priceMinor - b.priceMinor
        : b.priceMinor - a.priceMinor;
    });
  else
    filtered.sort((a, b) => {
      const rank = (slug: string) =>
        featured.includes(slug) ? featured.indexOf(slug) : 100;
      return rank(a.slug) - rank(b.slug) || a.sortOrder - b.sortOrder;
    });
  return filtered;
}
