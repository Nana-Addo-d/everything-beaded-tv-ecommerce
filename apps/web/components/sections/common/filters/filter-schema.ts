// apps/web/components/sections/common/filters/filter-schema.ts
// -----------------------------------------------------------------------------
// Parse <-> Serialize URLSearchParams for FilterState using compact keys.
// Keep this file in sync with filter-types.ts key comments.
// -----------------------------------------------------------------------------

import type {
  FilterState,
  AvailabilityFlag,
  ShippingOption,
  ImpactBadge,
  TechniqueSlug,
  MaterialSlug,
  MotifSlug,
  Range,
  SortKey,
} from "./filter-types"

// ------------------------------- helpers -------------------------------------

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

const toNum = (s: string | null): number | null => {
  if (s == null || s.trim() === "") return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const parseBool1 = (s: string | null | undefined): boolean | undefined => {
  if (s === "1") return true
  if (s === "0") return false
  return undefined
}

const boolTo1 = (b?: boolean): "1" | undefined => (b ? "1" : undefined)

const splitList = (s: string | null | undefined): string[] | undefined => {
  if (!s) return undefined
  const arr = s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
  return arr.length ? arr : undefined
}

const joinList = (arr?: string[]): string | undefined =>
  arr?.length ? [...arr].sort((a, b) => a.localeCompare(b)).join(",") : undefined

const parseRange = (s: string | null | undefined): Range | undefined => {
  if (!s) return undefined
  const [a, b] = s.split("..", 2)
  const min = toNum(a ?? null)
  const max = toNum(b ?? null)
  if (min == null && max == null) return undefined
  return [min, max]
}

const rangeToString = (r?: Range): string | undefined => {
  if (!r) return undefined
  const [min, max] = r
  const a = isNum(min) ? String(min) : ""
  const b = isNum(max) ? String(max) : ""
  if (!a && !b) return undefined
  return `${a}..${b}`
}

const setIf = (params: URLSearchParams, key: string, val?: string | null) => {
  if (val == null || val === "") return
  params.set(key, val)
}

// --------------------------- parse: URL -> state -----------------------------

export function parseQueryToState(searchParams: URLSearchParams): FilterState {
  const q = (k: string) => searchParams.get(k)

  const state: FilterState = {}

  // Category
  state.cat = q("cat") ?? undefined

  // Quick chips / numerics
  state.price = parseRange(q("price"))
  state.inStock = parseBool1(q("stock"))
  state.onSale = parseBool1(q("sale"))
  state.ratingMin = toNum(q("rate")) ?? undefined

  // Identity & Origin
  state.origin = splitList(q("origin"))
  state.coop = splitList(q("coop"))

  // Impact & Craft
  state.impact = splitList(q("impact")) as ImpactBadge[] | undefined
  state.tech = splitList(q("tech")) as TechniqueSlug[] | undefined
  state.mat = splitList(q("mat")) as MaterialSlug[] | undefined
  state.motif = splitList(q("motif")) as MotifSlug[] | undefined
  state.color = splitList(q("color"))

  // Size & Dimensions
  // NOTE: size is an ARRAY in FilterState; parse as list.
  state.size = splitList(q("size"))
  state.w = parseRange(q("w"))
  state.h = parseRange(q("h"))
  state.d = parseRange(q("d"))
  state.wt = parseRange(q("wt"))

  // Availability & lead time
  state.avail = splitList(q("avail")) as AvailabilityFlag[] | undefined
  state.lead = parseRange(q("lead"))
  state.custom = parseBool1(q("custom"))
  state.bundle = parseBool1(q("bundle"))
  state.gift = parseBool1(q("gift"))

  // Shipping & Seller
  state.shipFrom = splitList(q("shipFrom"))
  state.ship = splitList(q("ship")) as ShippingOption[] | undefined
  state.rating = toNum(q("rating")) ?? undefined
  state.ret = q("ret") === "free" ? "free" : undefined
  state.warr = toNum(q("warr")) ?? undefined
  state.story = parseBool1(q("story"))

  // Sort
  state.sort = (q("sort") ?? undefined) as SortKey | undefined

  return state
}

// ------------------------- serialize: state -> URL ---------------------------

export function serializeStateToQuery(state: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  // Category
  setIf(params, "cat", state.cat)

  // Quick chips / numerics
  setIf(params, "price", rangeToString(state.price))
  setIf(params, "stock", boolTo1(state.inStock))
  setIf(params, "sale", boolTo1(state.onSale))
  setIf(params, "rate", isNum(state.ratingMin!) ? String(state.ratingMin) : undefined)

  // Identity & Origin
  setIf(params, "origin", joinList(state.origin))
  setIf(params, "coop", joinList(state.coop))

  // Impact & Craft
  setIf(params, "impact", joinList(state.impact))
  setIf(params, "tech", joinList(state.tech))
  setIf(params, "mat", joinList(state.mat))
  setIf(params, "motif", joinList(state.motif))
  setIf(params, "color", joinList(state.color))

  // Size & Dimensions
  // NOTE: size is an ARRAY in FilterState; serialize as comma list.
  setIf(params, "size", joinList(state.size))
  setIf(params, "w", rangeToString(state.w))
  setIf(params, "h", rangeToString(state.h))
  setIf(params, "d", rangeToString(state.d))
  setIf(params, "wt", rangeToString(state.wt))

  // Availability & lead time
  setIf(params, "avail", joinList(state.avail))
  setIf(params, "lead", rangeToString(state.lead))
  setIf(params, "custom", boolTo1(state.custom))
  setIf(params, "bundle", boolTo1(state.bundle))
  setIf(params, "gift", boolTo1(state.gift))

  // Shipping & Seller
  setIf(params, "shipFrom", joinList(state.shipFrom))
  setIf(params, "ship", joinList(state.ship))
  setIf(params, "rating", isNum(state.rating!) ? String(state.rating) : undefined)
  setIf(params, "ret", state.ret === "free" ? "free" : undefined)
  setIf(params, "warr", isNum(state.warr!) ? String(state.warr) : undefined)
  setIf(params, "story", boolTo1(state.story))

  // Sort
  setIf(params, "sort", state.sort)

  return params
}
