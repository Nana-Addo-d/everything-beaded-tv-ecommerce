"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@components/button"
import { Badge } from "@components/badge"
import { Card, CardContent, CardFooter } from "@components/card"
import { Star, Heart, ShoppingCart } from "lucide-react"

type Product = {
  id: string
  slug: string
  title: string
  price: number
  currency: string
  image: string
  rating: number
  reviews: number
  shop: string
  tag?: string
}

const RECS: Product[] = [
  { id: "r1", slug: "woven-placemats-set", title: "Woven Placemats (Set of 4)", price: 26, currency: "€", image: "/images/products/r1.jpg", rating: 4.5, reviews: 86, shop: "Table & Thread" },
  { id: "r2", slug: "kente-scarf-classic", title: "Kente Scarf — Classic", price: 32, currency: "€", image: "/images/products/r2.jpg", rating: 4.7, reviews: 142, shop: "Asante Weave", tag: "Picked for you" },
  { id: "r3", slug: "recycled-brass-rings", title: "Recycled Brass Rings (2pc)", price: 21, currency: "€", image: "/images/products/r3.jpg", rating: 4.3, reviews: 51, shop: "Silver Seed" },
  { id: "r4", slug: "raffia-wall-basket", title: "Raffia Wall Basket", price: 38, currency: "€", image: "/images/products/r4.jpg", rating: 4.6, reviews: 67, shop: "Sisal & Co" },
  { id: "r5", slug: "mudcloth-table-runner", title: "Mudcloth Table Runner", price: 45, currency: "€", image: "/images/products/r5.jpg", rating: 4.4, reviews: 73, shop: "Mali Textiles" },
  { id: "r6", slug: "leather-card-holder", title: "Leather Card Holder", price: 19, currency: "€", image: "/images/products/r6.jpg", rating: 4.8, reviews: 129, shop: "Nomad Leather" },
  { id: "r7", slug: "soapstone-incense-tray", title: "Soapstone Incense Tray", price: 23, currency: "€", image: "/images/products/r7.jpg", rating: 4.2, reviews: 41, shop: "Kisii Craft" },
  { id: "r8", slug: "ankara-scrunchies", title: "Ankara Scrunchies (2pc)", price: 12, currency: "€", image: "/images/products/r8.jpg", rating: 4.1, reviews: 19, shop: "Paper & Pattern" },
]

function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
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

export function BuyerPersonalizedForYou() {
  return (
    <section aria-label="Personalized for you" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Just For You</h2>
        <Link href="/signin" className="text-sm underline-offset-4 hover:underline">
          Sign in to improve recommendations
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {RECS.map((p) => (
          <Card key={p.id} className="group overflow-hidden rounded-xl">
            <Link href={`/p/${p.slug}`} className="block" aria-label={`${p.title} — view details`}>
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

            <CardFooter className="flex gap-2 p-3 pt-0">
              <Button size="sm" variant="outline" className="w-9 p-0" aria-label="Like">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" className="flex-1">
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
