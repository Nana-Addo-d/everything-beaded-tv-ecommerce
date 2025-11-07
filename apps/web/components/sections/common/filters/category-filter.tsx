// apps/web/components/sections/common/filters/category-filter.tsx
"use client"

/**
 * CategoryFilter
 * - Composition wrapper for the buyer filter header area.
 * - Renders (optionally) the sticky ActiveFiltersBar and the ChipRow
 *   with SortSelect on the right.
 */

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ActiveFiltersBar } from "./active-filters-bar"
import { ChipRow } from "./chip-row"
import { SortSelect } from "./sort-select"

type CategoryFilterProps = {
  className?: string
  /** Show the sticky active-chips row under the header */
  showActiveBar?: boolean
}

export function CategoryFilter({ className, showActiveBar = true }: CategoryFilterProps) {
  return (
    <section className={cn("w-full", className)} aria-label="Category & filters">
      {showActiveBar && <ActiveFiltersBar />}

      <div className="rounded-xl p-4">
        <ChipRow rightExtras={<SortSelect />} />
      </div>
    </section>
  )
}

export default CategoryFilter
