// apps/web/components/sections/common/filters/more-filters.tsx
"use client"

/**
 * MoreFilters (UI shell)
 * - Renders a button: “More filters (n)”
 * - Opens a responsive Dialog with placeholder sections
 * - No real facet controls yet; just the scaffold
 */

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@components/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@components/dialog"
import { Separator } from "@components/separator"
import { Skeleton } from "@components/skeleton"
import type { FilterState, Range } from "./filter-types"
import { useFilters } from "./use-filters"

// ------------------------- helpers -------------------------

const hasRange = (r?: Range) => Array.isArray(r) && (r[0] != null || r[1] != null)
const hasArray = (v?: unknown[]) => Array.isArray(v) && v.length > 0
const hasBool = (v?: boolean) => v !== undefined
const hasVal = <T,>(v?: T | null) => v !== undefined && v !== null

/** Count currently applied (excluding cat & sort) for the badge */
function countActive(f: FilterState): number {
  let n = 0
  // quick chips
  if (hasRange(f.price)) n++
  if (hasBool(f.inStock)) n++
  if (hasBool(f.onSale)) n++
  if (hasVal(f.ratingMin)) n++

  // identity & craft
  if (hasArray(f.origin)) n += f.origin!.length
  if (hasArray(f.coop)) n += f.coop!.length
  if (hasArray(f.impact)) n += f.impact!.length
  if (hasArray(f.tech)) n += f.tech!.length
  if (hasArray(f.mat)) n += f.mat!.length
  if (hasArray(f.motif)) n += f.motif!.length
  if (hasArray(f.color)) n += f.color!.length

  // size & dims
  if (hasArray(f.size as string[] | undefined)) n += (f.size as string[]).length
  if (hasRange(f.w)) n++
  if (hasRange(f.h)) n++
  if (hasRange(f.d)) n++
  if (hasRange(f.wt)) n++

  // availability
  if (hasArray(f.avail)) n += f.avail!.length
  if (hasRange(f.lead)) n++
  if (hasBool(f.custom)) n++
  if (hasBool(f.bundle)) n++
  if (hasBool(f.gift)) n++

  // shipping & seller
  if (hasArray(f.shipFrom)) n += f.shipFrom!.length
  if (hasArray(f.ship)) n += f.ship!.length
  if (hasVal(f.rating)) n++
  if (f.ret === "free") n++
  if (hasVal(f.warr)) n++
  if (hasBool(f.story)) n++

  return n
}

// ------------------------- component -------------------------

export function MoreFilters() {
  const { state, clearAll } = useFilters()
  const [open, setOpen] = React.useState(false)
  const active = countActive(state)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-full">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          More filters{active > 0 ? ` (${active})` : ""}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="px-4 py-3">
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Narrow results by origin, materials, availability, shipping, and more.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Body: placeholder sections (replace with real facets later) */}
        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-auto p-4 md:grid-cols-2">
          {/* Identity & Origin */}
          <section>
            <h3 className="mb-2 text-sm font-medium">Identity &amp; Origin</h3>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-1/2 rounded" />
            </div>
          </section>

          {/* Craft & Materials */}
          <section>
            <h3 className="mb-2 text-sm font-medium">Craft &amp; Materials</h3>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-2/3 rounded" />
            </div>
          </section>

          {/* Size & Dimensions */}
          <section>
            <h3 className="mb-2 text-sm font-medium">Size &amp; Dimensions</h3>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-3/4 rounded" />
              <Skeleton className="h-8 w-1/2 rounded" />
            </div>
          </section>

          {/* Availability & Shipping */}
          <section>
            <h3 className="mb-2 text-sm font-medium">Availability &amp; Shipping</h3>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-2/3 rounded" />
            </div>
          </section>
        </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between px  -4 py-3 sm:justify-between">
          <Button variant="ghost" onClick={clearAll}>
            Clear all
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Apply</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
