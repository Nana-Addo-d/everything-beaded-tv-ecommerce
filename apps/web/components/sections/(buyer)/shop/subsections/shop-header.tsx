"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@components/card"
import { Badge } from "@components/badge"
import { Button } from "@components/button"
import { Star, MapPin, Package, Users, CheckCircle2 } from "lucide-react"
import type { Shop } from "../mock-shops"

type BuyerShopHeaderProps = {
    shop?: Shop | null
}

export function BuyerShopHeader({ shop }: BuyerShopHeaderProps) {
    // simple fallback if slug not found
    if (!shop) {
        return (
            <Card className="overflow-hidden border bg-card">
                <CardHeader className="p-4">
                    <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                        Shop not found
                    </h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        The shop you’re looking for may have moved or is unavailable.
                    </p>
                </CardHeader>
            </Card>
        )
    }

    const followersNF = React.useMemo(
        () => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
        []
    )

    return (
        <Card className="overflow-hidden border bg-card">
            <CardHeader className="flex flex-col gap-4 border-b bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    {/* Shop avatar placeholder */}
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/70" />

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                                {shop.name}
                            </h1>
                            <Badge variant="outline" className="inline-flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                Verified
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            {/* placeholder description for now */}
                            Handmade pieces from {shop.region}. Stories, craft, and culture in every item.
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{shop.rating.toFixed(1)}</span>
              </span>
                            <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                                {shop.region}
              </span>
                            <span className="inline-flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                                {shop.products} products
              </span>
                            <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                                {followersNF.format(shop.followers)} followers
              </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="#contact">Contact shop</Link>
                    </Button>
                    <Button size="sm" variant="default">
                        Follow
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                    <Badge variant="outline" className="text-[11px]">
                        Beadwork
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                        Kente-inspired
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                        Woman-led co-op
                    </Badge>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
            Ships within 5–7 business days • Free local pickup (example copy)
          </span>
                </div>
            </CardContent>
        </Card>
    )
}
