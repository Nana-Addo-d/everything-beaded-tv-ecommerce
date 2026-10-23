import "server-only";
import { cache } from "react";
import { getLocalCatalog, type Product } from "./catalog";
import { database } from "../commerce/database";
import { databaseConfigured } from "../commerce/config";

type CatalogRow = {
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  images: string[];
  materials: string[];
  material_status: string;
  attributes: {
    colors?: string[];
    sizeLabel?: string;
    dimensions?: string;
    contents?: string;
    familySlug?: string;
    optionLabel?: string;
  };
  price_minor: number | null;
  stock_quantity: number | null;
  details_approved: boolean;
  sort_order: number;
};
export const getCatalog = cache(async (): Promise<Product[]> => {
  if (!databaseConfigured()) return getLocalCatalog();
  const rows: CatalogRow[] = [];
  for (let offset = 0; offset < 100000; offset += 500) {
    const page = await database<CatalogRow[]>(
      `products?published=eq.true&select=slug,title,category,subcategory,description,images,materials,material_status,attributes,price_minor,stock_quantity,details_approved,sort_order&order=sort_order.asc,slug.asc&offset=${offset}&limit=500`,
    );
    rows.push(...page);
    if (page.length < 500) break;
  }
  const settings = await database<{ currency: string }[]>(
    "store_settings?select=currency&limit=1",
  );
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    images: row.images,
    image: row.images[0],
    materials: row.materials,
    materialStatus: row.material_status,
    colors: row.attributes?.colors ?? [],
    priceMinor: row.price_minor,
    stock: row.stock_quantity,
    detailsApproved: row.details_approved,
    sortOrder: row.sort_order,
    currency: settings[0]?.currency,
    sizeLabel: row.attributes?.sizeLabel,
    dimensions: row.attributes?.dimensions,
    contents: row.attributes?.contents,
    familySlug: row.attributes?.familySlug,
    optionLabel: row.attributes?.optionLabel,
  }));
});
