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
import {BuyerHero} from "@/components/sections/(buyer)/home/hero"
import {BuyerFeaturedCollections} from "@/components/sections/(buyer)/home/featured-collections"
import { BuyerTrendingProducts } from "@/components/sections/(buyer)/home/trending-products"
import { BuyerPromotions } from "@/components/sections/(buyer)/home/promotions"
import { BuyerTopShops } from "@/components/sections/(buyer)/home/top-shops"
import { BuyerPersonalizedForYou } from "@/components/sections/(buyer)/home/personalized-for-you"
import { BuyerRecentlyViewed } from "@/components/sections/(buyer)/home/recently-viewed"
import { BuyerGuidesStories } from "@/components/sections/(buyer)/home/guides-stories"
import {CategoryFilter} from "@filters/category-filter"
import { Breadcrumbs } from "@common/breadcrumbs"

export default function BuyerHomeSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 space-y-6 md:space-y-8 lg:space-y-10">
        {/* Hero / Welcome */}
            <BuyerHero />

        {/* Breadcrumbs (hidden on root in future; shown when contextual) */}
        <div className="hidden md:block">
            <Breadcrumbs hideOnRoot />
        </div>

        {/* CategoryFilter (facets) */}
            <CategoryFilter showActiveBar />
        <Separator />

        {/* Featured Collections */}
        <section>
            <BuyerFeaturedCollections />
        </section>

        {/* Trending Products */}
        <section>
            <BuyerTrendingProducts />
        </section>

        {/* Top Shops / Artisans */}
        <section>
            <BuyerTopShops />
        </section>

        {/* Promotions */}
        <section>
            <BuyerPromotions />
        </section>

        {/* Personalized For You */}
        <section>
            <BuyerPersonalizedForYou />
        </section>

        {/* Recently Viewed */}
        <section>
            <BuyerRecentlyViewed />
        </section>

        {/* Guides & Stories */}
        <section>
            <BuyerGuidesStories />
        </section>

        </section>
    )
}
