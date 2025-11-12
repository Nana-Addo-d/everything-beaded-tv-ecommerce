"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@components/button"

type Promo = {
  id: string
  title: string
  body: string
  cta: { label: string; href: string }
  bg: string // tailwind bg or gradient classes
}

const PROMOS: Promo[] = [
  {
    id: "p1",
    title: "Seasonal Sale",
    body: "Up to 30% off select artisan picks.",
    cta: { label: "Shop sale", href: "/promotions/seasonal" },
    bg: "from-rose-500 to-fuchsia-500",
  },
  {
    id: "p2",
    title: "Bundles & Sets",
    body: "Curated combos for better value.",
    cta: { label: "View bundles", href: "/collections/bundles" },
    bg: "from-emerald-500 to-teal-500",
  },
  {
    id: "p3",
    title: "New Arrivals",
    body: "Fresh drops from verified artisans.",
    cta: { label: "Explore new", href: "/new" },
    bg: "from-indigo-500 to-sky-500",
  },
]

export function BuyerPromotions() {
  return (
    <section aria-label="Promotions" className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight">Promotions</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PROMOS.map((p) => (
          <div
            key={p.id}
            className="
              relative overflow-hidden rounded-xl border
              bg-gradient-to-r text-white
              shadow-sm
            "
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold">{p.title}</h3>
              <p className="mt-1 text-xs/5 opacity-90">{p.body}</p>
              <Link href={p.cta.href} className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  {p.cta.label}
                </Button>
              </Link>
            </div>

            {/* Visual accent bar */}
            <div className={`absolute inset-y-0 right-0 w-1/2 opacity-70 bg-gradient-to-l ${p.bg}`} />
          </div>
        ))}
      </div>
    </section>
  )
}
