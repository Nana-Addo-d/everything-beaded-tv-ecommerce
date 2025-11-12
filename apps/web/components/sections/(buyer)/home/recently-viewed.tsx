"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@components/button"

type Item = {
  id: string
  slug: string
  title: string
  image: string
}

// Fallback placeholders (until we hook up real tracking)
const PLACEHOLDER: Item[] = [
  { id: "rv1", slug: "mini-sisal-basket", title: "Mini Sisal Basket", image: "/images/products/p2.jpg" },
  { id: "rv2", slug: "brass-bead-anklet", title: "Brass Bead Anklet", image: "/images/products/p8.jpg" },
  { id: "rv3", slug: "bogolanfini-coaster", title: "Bogolanfini Coaster", image: "/images/products/p3.jpg" },
  { id: "rv4", slug: "soapstone-owl", title: "Soapstone Owl", image: "/images/products/p4.jpg" },
  { id: "rv5", slug: "kente-headwrap", title: "Kente Headwrap", image: "/images/products/p5.jpg" },
  { id: "rv6", slug: "leather-card-holder", title: "Leather Card Holder", image: "/images/products/r6.jpg" },
  { id: "rv7", slug: "ankara-journal", title: "Ankara Journal", image: "/images/products/p7.jpg" },
  { id: "rv8", slug: "woven-placemat", title: "Woven Placemat", image: "/images/products/r1.jpg" },
]

/**
 * BuyerRecentlyViewed
 * - Reads client-only history from localStorage (eb.recent).
 * - Renders a horizontally scrollable strip of small cards.
 * - Guards SSR hydration by rendering only after mount.
 *
 * TODO: replace storage format with real tracking:
 *   localStorage.setItem("eb.recent", JSON.stringify([{ id, slug, title, image }, ...]))
 */
export function BuyerRecentlyViewed() {
  const [mounted, setMounted] = React.useState(false)
  const [items, setItems] = React.useState<Item[]>(PLACEHOLDER)

  React.useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem("eb.recent")
      if (raw) {
        const parsed = JSON.parse(raw) as Item[]
        if (Array.isArray(parsed) && parsed.length) {
          setItems(parsed.slice(0, 16))
        }
      }
    } catch {
      // ignore parse errors; keep placeholders
    }
  }, [])

  if (!mounted) return null

  return (
    <section aria-label="Recently viewed" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Recently Viewed</h2>
        <div className="flex items-center gap-2">
          <Link href="/recent" className="text-sm underline-offset-4 hover:underline">
            View all
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              localStorage.removeItem("eb.recent")
              setItems([])
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1
        [-webkit-mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]
        [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]
      ">
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground px-1 py-6">
            No recent items yet.
          </div>
        ) : (
          items.map((it) => (
            <Link
              key={it.id}
              href={`/p/${it.slug}`}
              className="group relative block h-28 w-28 shrink-0 overflow-hidden rounded-xl border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${it.title} — view details`}
              title={it.title}
            >
              <div
                className="h-full w-full bg-muted bg-cover bg-center transition-transform group-hover:scale-[1.03]"
                style={{ backgroundImage: `url(${it.image})` }}
                role="img"
                aria-label={it.title}
              />
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
