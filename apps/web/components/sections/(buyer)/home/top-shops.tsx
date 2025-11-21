"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@components/card"
import { Button } from "@components/button"
import { Badge } from "@components/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@components/avatar"
import { Star, MapPin, Users, Store } from "lucide-react"

type Shop = {
  id: string
  slug: string
  name: string
  region: string
  rating: number
  followers: number
  products: number
  impact?: "fairtrade" | "woman_led" | "coop_made"
  logo?: string
}

const SHOPS: Shop[] = [
  {
    id: "s1",
    slug: "kente-works",
    name: "KenteWorks",
    region: "Kumasi, Ghana",
    rating: 4.8,
    followers: 2_304,
    products: 128,
    impact: "woman_led",
    logo: "/images/shops/kente-works.jpg",
  },
  {
    id: "s2",
    slug: "kisii-craft",
    name: "Kisii Craft",
    region: "Kisii, Kenya",
    rating: 4.7,
    followers: 1_962,
    products: 89,
    impact: "fairtrade",
    logo: "/images/shops/kisii-craft.jpg",
  },
  {
    id: "s3",
    slug: "mali-textiles",
    name: "Mali Textiles",
    region: "Ségou, Mali",
    rating: 4.6,
    followers: 1_104,
    products: 76,
    impact: "coop_made",
    logo: "/images/shops/mali-textiles.jpg",
  },
  {
    id: "s4",
    slug: "nomad-leather",
    name: "Nomad Leather",
    region: "Marrakesh, Morocco",
    rating: 4.9,
    followers: 3_581,
    products: 154,
    logo: "/images/shops/nomad-leather.jpg",
  },
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

export function BuyerTopShops() {

    const followersNF = React.useMemo(
    () => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
    []
  )

  return (
    <section aria-label="Top shops & artisans" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Top Shops</h2>
        <Link href="/shops" className="text-sm underline-offset-4 hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {SHOPS.map((s) => (
          <Card key={s.id} className="overflow-hidden rounded-xl">
            <CardHeader className="flex flex-row items-center gap-3 p-3 pb-0">
              <Avatar className="h-10 w-10">
                {s.logo ? (
                  <AvatarImage src={s.logo} alt={s.name} />
                ) : (
                  <AvatarFallback>
                    <Store className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <Link href={`/shop/${s.slug}`} className="block">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                </Link>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {s.region}
                </p>
              </div>
              {s.impact ? (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {s.impact === "fairtrade" && "Fair-trade"}
                  {s.impact === "woman_led" && "Woman-led"}
                  {s.impact === "coop_made" && "Co-op"}
                </Badge>
              ) : null}
            </CardHeader>

            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stars value={s.rating} />
                  <span className="text-xs text-muted-foreground">{s.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{followersNF.format(s.followers)} followers</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.products} products</p>
            </CardContent>

            <CardFooter className="flex gap-2 p-3 pt-0">
              <Link href={`/shop/${s.slug}`} className="flex-1">
                <Button size="sm" className="w-full">Visit shop</Button>
              </Link>
              <Button size="sm" variant="outline" className="shrink-0">
                Follow
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
