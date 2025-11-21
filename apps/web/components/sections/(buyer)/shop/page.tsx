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

import { BuyerShopHeader } from "./subsections/shop-header"


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
            <BuyerShopHeader slug="sample-shop" />

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