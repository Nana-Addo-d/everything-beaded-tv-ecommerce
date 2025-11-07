"use client"

/**
 * SortSelect
 * - Compact select control to change result ordering.
 * - Writes `sort` to URL via useFilters().
 *
 * If you haven't added shadcn Select yet:
 *   pnpm dlx shadcn@latest add select
 */

import * as React from "react"
import { useFilters } from "./use-filters"
import { SORT_OPTIONS, type SortKey } from "./filter-types"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/select"

type Props = {
  className?: string
  placeholder?: string
}

export function SortSelect({ className, placeholder = "Sort" }: Props) {
  const { state, update } = useFilters()

  const onChange = (val: string) => {
    update({ sort: (val || undefined) as SortKey | undefined })
  }

  return (
    <Select value={state.sort ?? ""} onValueChange={onChange}>
      <SelectTrigger className={["h-8 w-[12rem] rounded-full", className].join(" ")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
