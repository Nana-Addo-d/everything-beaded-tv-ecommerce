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
import {BuyerHero} from "./subsections/hero"
import {BuyerFeaturedCollections} from "./subsections/featured-collections"
import { BuyerTrendingProducts } from "./subsections/trending-products"
import { BuyerPromotions } from "./subsections/promotions"
import { BuyerTopShops } from "./subsections/top-shops"
import { BuyerPersonalizedForYou } from "./subsections/personalized-for-you"
import { BuyerRecentlyViewed } from "./subsections/recently-viewed"
import { BuyerGuidesStories } from "./subsections/guides-stories"
import {CategoryFilter} from "@filters/category-filter"
import { Breadcrumbs } from "@common/breadcrumbs"

export default function BuyerHomeSection() {
    return (
        <section className="space-y-8">
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
