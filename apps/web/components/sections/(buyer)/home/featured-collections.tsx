"use client"

import * as React from "react"
import Link from "next/link"

type Collection = {
  slug: string
  title: string
  image: string // public placeholder: /images/collections/...
}

const COLLECTIONS: Collection[] = [
  { slug: "home-living/baskets",            title: "Handwoven Baskets",     image: "/images/collections/baskets.jpg" },
  { slug: "fashion-accessories/jewelry",    title: "Beaded Jewelry",        image: "/images/collections/jewelry.jpg" },
  { slug: "home-living/textiles-throws",    title: "Kente & Textiles",      image: "/images/collections/kente.jpg" },
  { slug: "art-sculpture/stone-soapstone",  title: "Soapstone Sculpture",   image: "/images/collections/soapstone.jpg" },
  { slug: "fashion-accessories/bags",       title: "Leather Bags",          image: "/images/collections/leather.jpg" },
  { slug: "home-living/decor",              title: "Bogolanfini Decor",     image: "/images/collections/bogolanfini.jpg" },
]

export function BuyerFeaturedCollections() {
  return (
    <section aria-label="Featured collections" className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight">Featured Collections</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.slug}
            href={`/c/${c.slug}`}
            className="
              group relative block overflow-hidden rounded-xl border
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
            "
            aria-label={`${c.title} — Shop collection`}
          >
            <div
              className="
                aspect-[4/5] w-full bg-muted bg-cover bg-center transition-transform
                group-hover:scale-[1.02]
              "
              style={{ backgroundImage: `url(${c.image})` }}
              role="img"
              aria-label={c.title}
            />
            <div
              className="
                absolute inset-x-0 bottom-0 z-[1]
                bg-gradient-to-t from-black/60 via-black/20 to-transparent
                px-3 pb-2 pt-8 text-white
              "
            >
              <span className="block text-sm font-medium drop-shadow">
                {c.title}
              </span>
              <span className="mt-0.5 block text-[11px] opacity-90">
                Shop collection →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
