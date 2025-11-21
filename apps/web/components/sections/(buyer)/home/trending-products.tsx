"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@components/button"
import { Badge } from "@components/badge"
import { Card, CardContent, CardFooter } from "@components/card"
import { Star, ShoppingCart } from "lucide-react"

type Product = {
  id: string
  slug: string
  title: string
  price: number
  currency: string
  image: string
  rating: number // 0..5
  reviews: number
  shop: string
  tag?: string // e.g., "New", "Limited"
}

const TRENDING: Product[] = [
  { id: "p1", slug: "brass-beaded-bracelet", title: "Brass Beaded Bracelet", price: 29, currency: "€", image: "/images/products/p1.jpg", rating: 4.6, reviews: 128, shop: "KenteWorks", tag: "Trending" },
  { id: "p2", slug: "sisal-basket-mini", title: "Sisal Basket (Mini)", price: 34, currency: "€", image: "/images/products/p2.jpg", rating: 4.8, reviews: 205, shop: "Sisal & Co" },
  { id: "p3", slug: "bogolanfini-pillow", title: "Bogolanfini Pillow", price: 42, currency: "€", image: "/images/products/p3.jpg", rating: 4.4, reviews: 77, shop: "Mali Textiles" },
  { id: "p4", slug: "soapstone-carved-bird", title: "Soapstone Carved Bird", price: 55, currency: "€", image: "/images/products/p4.jpg", rating: 4.7, reviews: 92, shop: "Kisii Craft" },
  { id: "p5", slug: "kente-headwrap", title: "Kente Headwrap", price: 24, currency: "€", image: "/images/products/p5.jpg", rating: 4.3, reviews: 61, shop: "Asante Weave" },
  { id: "p6", slug: "leather-sling-bag", title: "Leather Sling Bag", price: 69, currency: "€", image: "/images/products/p6.jpg", rating: 4.9, reviews: 318, shop: "Nomad Leather", tag: "New" },
  { id: "p7", slug: "ankara-journal", title: "Ankara Journal", price: 18, currency: "€", image: "/images/products/p7.jpg", rating: 4.2, reviews: 33, shop: "Paper & Pattern" },
  { id: "p8", slug: "bead-anklet", title: "Bead Anklet", price: 22, currency: "€", image: "/images/products/p8.jpg", rating: 4.5, reviews: 147, shop: "Silver Seed" },
]

function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half)
        return (
          <Star
            key={i}
            className="h-3.5 w-3.5"
            fill={filled ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        )
      })}
    </div>
  )
}

export function BuyerTrendingProducts() {
  return (
    <section aria-label="Trending products" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Trending Now</h2>
        <Link href="/trending" className="text-sm underline-offset-4 hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {TRENDING.map((p) => (
          <Card key={p.id} className="group overflow-hidden rounded-xl">
            <Link
              href={`/p/${p.slug}`}
              className="block"
              aria-label={`${p.title} — view details`}
            >
              <div
                className="aspect-square w-full bg-muted bg-cover bg-center transition-transform group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${p.image})` }}
                role="img"
                aria-label={p.title}
              />
            </Link>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/p/${p.slug}`} className="block">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{p.shop}</p>
                </div>
                {p.tag ? <Badge className="shrink-0">{p.tag}</Badge> : null}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stars value={p.rating} />
                  <span className="text-xs text-muted-foreground">({p.reviews})</span>
                </div>
                <div className="text-sm font-semibold">
                  {p.currency}
                  {p.price.toFixed(2)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 pt-0">
              <Button size="sm" className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
