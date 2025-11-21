// apps/web/components/sections/(buyer)/shop/page.tsx
"use client"

/**
 * Buyer Shop Page Shell
 * - Mirrors the layout of the sample "ShopPage" you shared:
 *   Breadcrumbs
 *   Shop header (summary)
 *   Sidebar filters + main product grid
 *
 * Data will be wired later; this is UI-only scaffolding.
 */

import * as React from "react"
import Link from "next/link"
import { Breadcrumbs } from "@common/breadcrumbs"
import { CategoryFilter } from "@filters/category-filter"
import { Card, CardContent, CardHeader } from "@components/card"
import { Badge } from "@components/badge"
import { Skeleton } from "@components/skeleton"
import { Button } from "@components/button"
import { Star, MapPin, Package, Users, CheckCircle2 } from "lucide-react"

export default function BuyerShopSection() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
            {/* Breadcrumbs: /Browse Marketplace / Shop Name */}
            <Breadcrumbs
                items={[
                    { label: "Browse Marketplace", href: "/browse" },
                    { label: "Sample Shop" }, // TODO: replace with real shop name from data
                ]}
            />

            {/* Shop header (similar to ShopHeader in your example) */}
            <ShopHeaderPlaceholder />

            {/* Main layout: sidebar filters + products */}
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Sidebar filters */}
                <aside className="w-full space-y-4 lg:w-64">
                    <div className="rounded-xl border bg-card p-3">
                        <h2 className="mb-2 text-sm font-semibold tracking-tight">Filter products</h2>
                        {/* Reuse CategoryFilter in a compact mode */}
                        <CategoryFilter showActiveBar={false} />
                    </div>
                </aside>

                {/* Main content: products grid */}
                <section className="flex-1 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <h2 className="text-xl font-semibold tracking-tight">Shop Products</h2>
                        <div className="text-xs text-muted-foreground sm:text-sm">
                            {/* Static text for now; will be dynamic later */}
                            Showing 156 products
                        </div>
                    </div>

                    {/* Placeholder product grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card
                                key={i}
                                className="group flex flex-col overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
                            >
                                <div className="aspect-[4/5] w-full bg-muted" />
                                <CardContent className="flex flex-1 flex-col gap-1 p-3">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                    <div className="mt-2 flex items-center justify-between">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-10" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* (Optional) View more / pagination placeholder */}
                    <div className="flex justify-center pt-2">
                        <Button variant="outline" size="sm">
                            Load more
                        </Button>
                    </div>
                </section>
            </div>
        </section>
    )
}

/**
 * Temporary shop header UI, similar to your ShopHeader component.
 * Later we’ll replace static values with real shop data.
 */
function ShopHeaderPlaceholder() {
    return (
        <Card className="overflow-hidden border bg-card">
            <CardHeader className="flex flex-col gap-4 border-b bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    {/* Shop avatar placeholder */}
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/70" />

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                                Sample Artisan Shop
                            </h1>
                            <Badge variant="outline" className="inline-flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                Verified
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Handmade beaded jewelry and decor pieces with West African motifs and stories.
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.8</span>
                <span>(1,247 reviews)</span>
              </span>
                            <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Ships from Accra, Ghana
              </span>
                            <span className="inline-flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                156 products
              </span>
                            <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                2,304 followers
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
          <span className="inline-flex items-center gap-1">
            <Badge variant="outline" className="text-[11px]">
              Beadwork
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              Kente-inspired
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              Woman-led co-op
            </Badge>
          </span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
            Ships within 5–7 business days • Free local pickup in Accra
          </span>
                </div>
            </CardContent>
        </Card>
    )
}
