// apps/web/components/sections/common/filters/chip-row.tsx
"use client"

import * as React from "react"
import { CategoryChips } from "./category-chips"
import { MoreFilters } from "./more-filters"
import { SortSelect } from "./sort-select"

type ChipRowProps = {
  rightExtras?: React.ReactNode // optional, we’ll default to SortSelect
}

export function ChipRow({ rightExtras }: ChipRowProps) {
  return (
    <div
      role="region"
      aria-label="Filters row"
      className="flex items-center justify-between gap-3"
    >
      {/* Left: categories — horizontal scroll on narrow screens with edge fade */}
      <div className="relative min-w-0 flex-1">
        <div
          className="
            overflow-x-auto pb-1
            [-webkit-mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]
            [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]
          "
        >
          <div className="flex w-max items-center gap-2">
            <CategoryChips />
          </div>
        </div>
      </div>

      {/* Right: Actions — MoreFilters always visible; Sort from sm: */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden sm:block">
          {rightExtras ?? <SortSelect />}
        </div>
        <MoreFilters />
      </div>
    </div>
  )
}
