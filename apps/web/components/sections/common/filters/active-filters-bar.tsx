// apps/web/components/sections/common/filters/active-filters-bar.tsx
"use client"

/**
 * ActiveFiltersBar
 * - Renders currently applied filters as removable chips
 * - Uses useFilters() to read/write URL-synced FilterState
 * - Shows a compact "Clear all" when at least one filter is active
 *
 * Notes:
 * - Keep labels lightweight; enrich via i18n/data dictionaries later.
 * - Only renders keys that are present in FilterState.
 */

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@components/button"
import type { FilterState, Range } from "./filter-types"
import { useFilters } from "./use-filters"

const hasRange = (r?: Range) => Array.isArray(r) && (r[0] != null || r[1] != null)
const fmtRange = (r?: Range, unit?: string) => {
  if (!hasRange(r)) return ""
  const [min, max] = r!
  const a = min != null ? `${min}` : ""
  const b = max != null ? `${max}` : ""
  const core = a && b ? `${a}–${b}` : a || `≤${b}`
  return unit ? `${core}${unit}` : core
}

type Chip = {
  key: string
  label: string
  remove: () => void
}

/** Build chips from current FilterState */
function buildChips(state: FilterState, update: (p: Partial<FilterState>) => void): Chip[] {
  const chips: Chip[] = []

  const push = (key: string, label: string, patch: Partial<FilterState>) =>
    chips.push({ key: `${key}:${label}`, label, remove: () => update(patch) })

  // Category
  if (state.cat) {
    push("cat", state.cat, { cat: undefined })
  }

  // Quick chips / numerics
  if (hasRange(state.price)) {
    push("price", `Price ${fmtRange(state.price, "")}`, { price: undefined })
  }
  if (state.inStock !== undefined) {
    push("stock", state.inStock ? "In stock" : "Out of stock", { inStock: undefined })
  }
  if (state.onSale !== undefined) {
    push("sale", state.onSale ? "On sale" : "Not on sale", { onSale: undefined })
  }
  if (state.ratingMin != null) {
    push("rate", `Rating ≥ ${state.ratingMin}`, { ratingMin: undefined })
  }

  // Identity & Origin
  state.origin?.forEach((v, i) =>
    push(`origin-${i}`, `Origin: ${v}`, { origin: state.origin!.filter((x) => x !== v) })
  )
  state.coop?.forEach((v, i) =>
    push(`coop-${i}`, `Co-op: ${v}`, { coop: state.coop!.filter((x) => x !== v) })
  )
  state.impact?.forEach((v, i) =>
    push(`impact-${i}`, `Impact: ${v}`, { impact: state.impact!.filter((x) => x !== v) })
  )

  // Craft & Materials
  state.tech?.forEach((v, i) =>
    push(`tech-${i}`, `Technique: ${v}`, { tech: state.tech!.filter((x) => x !== v) })
  )
  state.mat?.forEach((v, i) =>
    push(`mat-${i}`, `Material: ${v}`, { mat: state.mat!.filter((x) => x !== v) })
  )
  state.motif?.forEach((v, i) =>
    push(`motif-${i}`, `Motif: ${v}`, { motif: state.motif!.filter((x) => x !== v) })
  )
  state.color?.forEach((v, i) =>
    push(`color-${i}`, `Color: ${v}`, { color: state.color!.filter((x) => x !== v) })
  )

  // Size & Dimensions
  if (Array.isArray(state.size)) {
    state.size.forEach((v, i) =>
      push(`size-${i}`, `Size: ${v}`, { size: state.size!.filter((x) => x !== v) })
    )
  }
  if (hasRange(state.w)) push("w", `W ${fmtRange(state.w, "cm")}`, { w: undefined })
  if (hasRange(state.h)) push("h", `H ${fmtRange(state.h, "cm")}`, { h: undefined })
  if (hasRange(state.d)) push("d", `D ${fmtRange(state.d, "cm")}`, { d: undefined })
  if (hasRange(state.wt)) push("wt", `Weight ${fmtRange(state.wt, "kg")}`, { wt: undefined })

  // Buying & Availability
  state.avail?.forEach((v, i) =>
    push(`avail-${i}`, `Availability: ${v}`, { avail: state.avail!.filter((x) => x !== v) })
  )
  if (hasRange(state.lead)) push("lead", `Lead ≤ ${fmtRange(state.lead, "d")}`, { lead: undefined })
  if (state.custom !== undefined) push("custom", "Customizable", { custom: undefined })
  if (state.bundle !== undefined) push("bundle", "Bundle", { bundle: undefined })
  if (state.gift !== undefined) push("gift", "Giftable", { gift: undefined })

  // Shipping & Seller
  state.shipFrom?.forEach((v, i) =>
    push(`shipFrom-${i}`, `Ships from: ${v}`, {
      shipFrom: state.shipFrom!.filter((x) => x !== v),
    })
  )
  state.ship?.forEach((v, i) =>
    push(`ship-${i}`, `Shipping: ${v}`, { ship: state.ship!.filter((x) => x !== v) })
  )
  if (state.rating != null) push("rating", `Min rating ${state.rating}`, { rating: undefined })
  if (state.ret === "free") push("ret", "Free returns", { ret: undefined })
  if (state.warr != null) push("warr", `Warranty ≥ ${state.warr}m`, { warr: undefined })
  if (state.story !== undefined) push("story", "Has story", { story: undefined })

  // Sort is typically not shown as a removable chip; omit here.

  return chips
}

export function ActiveFiltersBar() {
  const { state, update, clearAll } = useFilters()
  const chips = React.useMemo(() => buildChips(state, update), [state, update])

  if (chips.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Active filters"
      className="sticky top-14 z-30 -mb-2 bg-background/60 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/50"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4">
        {/* Chips */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {chips.map((c) => (
            <Button
              key={c.key}
              variant="secondary"
              size="sm"
              className="h-7 shrink-0 rounded-full px-2.5 text-xs"
              onClick={c.remove}
              aria-label={`Remove ${c.label}`}
            >
              <span className="truncate">{c.label}</span>
              <X className="ml-1 h-3 w-3 opacity-70" aria-hidden />
            </Button>
          ))}
        </div>

        {/* Clear all */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0"
          onClick={clearAll}
          aria-label="Clear all filters"
        >
          Clear all
        </Button>
      </div>
    </div>
  )
}
