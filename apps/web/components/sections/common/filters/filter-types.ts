// apps/web/components/common/filters/filter-types.ts
// -----------------------------------------------------------------------------
// Core filter model tailored for the artisan, Africa-centric marketplace.
// Keep these types UI-agnostic so they can be reused by API/query builders.
// -----------------------------------------------------------------------------

/**
 * Compact URL keys (for parse/serialize). Keep in sync with filter-schema.ts
 *
 * cat       => category slug path (e.g., "home-living/decor")
 * price     => "min..max" (e.g., "20..120")
 * stock     => "1" | "0"
 * sale      => "1" | "0"
 * rate      => "4" | "4.5"
 * origin    => region:country list (e.g., "west-africa:gh,east-africa:ke")
 * coop      => artisan/co-op slugs
 * impact    => impact badges (comma list)
 * tech      => techniques (comma list)
 * mat       => materials (comma list)
 * motif     => cultural motifs/patterns (comma list)
 * color     => color tokens (comma list)
 * size      => size token (apparel sizes)
 * w|h|d     => ranges "min..max" (cm) for decor dimensions
 * wt        => range "min..max" (kg)
 * avail     => availability flags: ready,mto,oneofakind (comma list)
 * lead      => days range "min..max"
 * custom    => "1"
 * bundle    => "1"
 * gift      => "1"
 * shipFrom  => ISO country codes (comma list)
 * ship      => shipping opts (comma list): free,express,local_pickup,in_country,intl
 * rating    => seller/product rating minimum
 * ret       => "free"
 * warr      => months ">=N"
 * story     => "1"
 * sort      => sort key
 */

// ---------- Canonical unions (use these in UI controls & validation) ----------

export type RegionSlug =
  | "west-africa"
  | "east-africa"
  | "southern-africa"
  | "north-africa"
  | "central-africa"
  | (string & {});

export type AvailabilityFlag =
  | "ready"
  | "mto"
  | "oneofakind"
  | (string & {});


export type ShippingOption =
  | "free"
  | "express"
  | "local_pickup"
  | "in_country"
  | "in_country_only"
  | "intl"
  | (string & {});

export type ImpactBadge =
  | "fairtrade"
  | "woman_led"
  | "coop_made"
  | "upcycled"
  | "co_op"
  | "natural_dyes"
  | "carbon_neutral"
  | (string & {});


export type TechniqueSlug =
  | "beadwork"
  | "adire"
  | "kente_weaving"
  | "bogolanfini"
  | "soapstone_carving"
  | "weaving"
  | "carving"
  | "batik"
  | "mudcloth"
  | "metalwork"
  | "leatherwork"
  | "macrame"
  | (string & {});

export type SortKey =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "best_sellers"
  | (string & {});

// Materials & motifs are open sets but keep a curated starter list for UI
export type MaterialSlug =
  | "cotton"
  | "wool"
  | "sisal"
  | "raffia"
  | "kente"
  | "ankara"
  | "leather"
  | "recycled_brass"
  | "soapstone"
  | "reclaimed_wood"
  | "horn_bone"
  | (string & {});

export type MotifSlug =
  | "kente_asante"
  | "adire_oniko"
  | "bogolanfini_symbols"
  | "ankara_prints"
  | (string & {});

export type ColorToken = string; // e.g., "indigo", "earth", or hex ref
export type CountryCode = string; // ISO-3166 alpha-2 (e.g., "GH", "KE", "MA")
export type CoopSlug = string; // seller/co-op identifier
export type CategoryPath = string; // "home-living/decor", "fashion/jewelry", ...

/**
 * Numeric range represented as tuple [min,max], where either side can be null.
 * Example: price: [20,120]  → "20..120" in query
 */
export type Range = [number | null, number | null];

// ------------------------------ Filter state ---------------------------------

export type FilterState = {
  // Primary chips (quick toggles)
  cat?: CategoryPath;
  price?: Range;            // in user currency (UI); API can re-map to canonical
  inStock?: boolean;
  onSale?: boolean;
  ratingMin?: number;       // e.g., 4 or 4.5

  // Identity & Origin
  origin?: string[];        // region:country tokens, e.g., "west-africa:gh"
  coop?: CoopSlug[];
  impact?: ImpactBadge[];

  // Craft & Materials
  tech?: TechniqueSlug[];
  mat?: MaterialSlug[];
  motif?: MotifSlug[];
  color?: ColorToken[];

  // Size & Dimensions (decor/apparrel)
  size?: string[];            // "xs"|"s"|"m"|"l"|"xl"|custom
  w?: Range;                // width (cm)
  h?: Range;                // height (cm)
  d?: Range;                // diameter/depth (cm)
  wt?: Range;               // weight (kg)

  // Buying & Availability

  avail?: AvailabilityFlag[]; // ready / mto / oneofakind
  lead?: Range;               // days (e.g., [0,14])
  custom?: boolean;           // customizable/personalization available
  bundle?: boolean;           // set/bundle available
  gift?: boolean;             // gift wrap/note available

  // Shipping & Seller
  shipFrom?: CountryCode[];   // origin countries
  ship?: ShippingOption[];    // free, express, local_pickup, in_country, intl
  rating?: number;            // seller/product rating minimum
  ret?: "free" | undefined;   // free returns flag
  warr?: number | undefined;  // warranty months (>=)
  story?: boolean;            // has artisan story/video

  // Sort
  sort?: SortKey;
};

// -------------------------- UI/consumer conveniences --------------------------

export type FilterEvents = {
  onChange?: (next: FilterState) => void;
  onClear?: () => void;
};

/**
 * Minimal defaults for a fresh filter panel. Keep nulls out of URL.
 */
export const DEFAULT_FILTERS: FilterState = {};

/**
 * Helpful constants for UIs (chips, selects). Optional—expand via CMS later.
 */
export const QUICK_PRICE_PRESETS: Array<{ label: string; range: Range }> = [
  { label: "Under €25", range: [0, 25] },
  { label: "€25–€50", range: [25, 50] },
  { label: "€50+", range: [50, null] },
];

export const AVAIL_FLAGS: AvailabilityFlag[] = ["ready", "mto", "oneofakind"];

export const SHIPPING_OPTIONS: ShippingOption[] = [
  "free",
  "express",
  "local_pickup",
  "in_country",
  "in_country_only",
  "intl",
];

export const IMPACT_BADGES: ImpactBadge[] = [
  "fairtrade",
  "woman_led",
  "coop_made",
  "co_op",
  "upcycled",
  "natural_dyes",
  "carbon_neutral",
];

export const TECHNIQUES: TechniqueSlug[] = [
  "weaving",
  "carving",
  "beadwork",
  "batik",
  "mudcloth",
  "metalwork",
  "leatherwork",
  "macrame",
];

export const MATERIALS: MaterialSlug[] = [
  "cotton",
  "wool",
  "sisal",
  "raffia",
  "kente",
  "ankara",
  "leather",
  "recycled_brass",
  "soapstone",
  "reclaimed_wood",
  "horn_bone", // UI can show with policy tooltip
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Rating" },
  { value: "best_sellers", label: "Best sellers" },
];
