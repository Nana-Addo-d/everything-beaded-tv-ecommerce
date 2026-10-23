import { readFileSync } from "node:fs";

// Dry run is the default. Re-importing never overwrites prices, stock or reviewed details.
const products = JSON.parse(
  readFileSync(
    new URL("../apps/web/features/catalog/catalogue.json", import.meta.url),
    "utf8",
  ),
);
const rows = products.map((p) => ({
  slug: p.slug,
  title: p.title,
  category: p.category,
  subcategory: p.subcategory,
  description: p.description,
  materials: p.materials,
  material_status: p.materialStatus,
  images: p.images,
  attributes: { colors: p.colors, sourceIndices: p.sourceIndices },
  price_minor: null,
  stock_quantity: null,
  published: true,
  details_approved: false,
  sort_order: p.sortOrder,
}));
if (!process.argv.includes("--apply")) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        products: rows.length,
        priced: 0,
        orderingEnabled: false,
        existingRows: "preserved",
      },
      null,
      2,
    ),
  );
} else {
  const refIndex = process.argv.indexOf("--project-ref"),
    ref = process.argv[refIndex + 1];
  if (
    refIndex < 0 ||
    !ref ||
    !/^[a-z]{20}$/.test(ref) ||
    ref === "gonprnbzawtxcqsplypm"
  )
    throw new Error(
      "Choose the separate store project with --project-ref. The Support Desk project is not a catalogue target.",
    );
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || new URL(url).origin !== `https://${ref}.supabase.co`)
    throw new Error(
      "The configured store URL and server key must match the selected project.",
    );
  for (let i = 0; i < rows.length; i += 100) {
    const response = await fetch(
      `https://${ref}.supabase.co/rest/v1/products?on_conflict=slug`,
      {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          apikey: key,
          ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify(rows.slice(i, i + 100)),
      },
    );
    if (!response.ok)
      throw new Error(
        `Catalogue import stopped at row ${i + 1}; HTTP ${response.status}. Existing rows are preserved and the operation can be retried.`,
      );
  }
  console.log(
    JSON.stringify(
      {
        mode: "applied",
        project: ref,
        processed: rows.length,
        existingRows: "preserved",
        orderingEnabled: false,
      },
      null,
      2,
    ),
  );
}
