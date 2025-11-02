"use client"

/**
 * Buyer Home Shell (placeholders)
 * Location: components/sections/(buyer)/page.tsx
 *
 * Structure (placeholder-only for now):
 *  - Hero / Welcome
 *  - Breadcrumbs (hidden on root; shown when contextual)
 *  - CategoryFilter (facets)
 *  - Featured Collections
 *  - Trending Products
 *  - Top Shops / Artisans
 *  - Promotions
 *  - Personalized For You
 *  - Recently Viewed
 *  - Guides & Stories
 *
 * Real implementations will live under:
 *  components/sections/(buyer)/subsections/*
 * and will replace the skeleton blocks incrementally.
 */

import * as React from "react"
import { Separator } from "@components/separator"
import { Skeleton } from "@components/skeleton"

export default function BuyerHomeSection() {
    return (
        <section className="space-y-8">
        {/* Hero / Welcome */}
        <div className="rounded-xl border p-4 md:p-6">
            <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-80" />
            </div>
            </div>
            <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
        </div>

        {/* Breadcrumbs (hidden on root in future; shown when contextual) */}
        <div className="hidden md:block">
            <Skeleton className="h-4 w-64" />
        </div>

        {/* CategoryFilter (facets) */}
        <div className="rounded-xl border p-4">
            <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            </div>
        </div>

        <Separator />

        {/* Featured Collections */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-44" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                </div>
            ))}
            </div>
        </section>

        {/* Trending Products */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-52" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                </div>
            ))}
            </div>
        </section>

        {/* Top Shops / Artisans */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-64" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
            </div>
        </section>

        {/* Promotions */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-40" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
            </div>
        </section>

        {/* Personalized For You */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-56" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                </div>
            ))}
            </div>
        </section>

        {/* Recently Viewed */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-52" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-28 shrink-0 rounded-xl" />
            ))}
            </div>
        </section>

        {/* Guides & Stories */}
        <section>
            <div className="mb-3">
            <Skeleton className="h-5 w-48" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/5" />
                </div>
            ))}
            </div>
        </section>
        </section>
    )
}
