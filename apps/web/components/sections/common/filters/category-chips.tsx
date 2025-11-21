"use client"

import * as React from "react"
import { Button } from "@components/button"
import { useFilters } from "./use-filters"

type Cat = { slug: string; label: string }
const CATS: Cat[] = [
  { slug: "home-living/decor", label: "Home & Living" },
  { slug: "home-living/baskets", label: "Baskets" },
  { slug: "home-living/textiles-throws", label: "Textiles & Throws" },
  { slug: "fashion-accessories/apparel", label: "Apparel" },
  { slug: "fashion-accessories/jewelry", label: "Jewelry" },
  { slug: "art-sculpture/stone-soapstone", label: "Stone/Soapstone" },
  { slug: "art-sculpture/wood-carvings", label: "Wood Carvings" },
  { slug: "kids-toys", label: "Kids & Toys" },
  { slug: "music-instruments", label: "Music & Instruments" },
  { slug: "stationery-gifts", label: "Stationery & Gifts" },
]

export function CategoryChips() {
  const { state, update } = useFilters()
  const active = state.cat ?? ""

  const toggle = (slug: string) => {
    update({ cat: active === slug ? undefined : slug })
  }

  return (
    <div
      role="toolbar"
      aria-label="Categories"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {CATS.map((c) => {
        const isActive = active === c.slug
        return (
          <Button
            key={c.slug}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="h-8 shrink-0 rounded-full"
            onClick={() => toggle(c.slug)}
            aria-pressed={isActive}
          >
            {c.label}
          </Button>
        )
      })}
    </div>
  )
}
