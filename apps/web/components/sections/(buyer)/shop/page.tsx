// apps/web/components/sections/(buyer)/shop/page.tsx
// -----------------------------------------------------------------------------
// Buyer-facing Shop page shell (placeholders).
// We'll replace each block incrementally with real components.
// -----------------------------------------------------------------------------

import * as React from "react"
import { Separator } from "@components/separator"
import { Skeleton } from "@components/skeleton"
import { Badge } from "@components/badge"

export default function BuyerShopSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 space-y-6 md:space-y-8 lg:space-y-10">
            {/* Shop header */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" aria-hidden />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-40" aria-hidden /> {/* Shop name */}
                            <Badge variant="secondary">Verified</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Skeleton className="h-4 w-24" aria-hidden /> {/* Region/City */}
                            <span>•</span>
                            <Skeleton className="h-4 w-16" aria-hidden /> {/* Followers */}
                            <span>•</span>
                            <Skeleton className="h-4 w-20" aria-hidden /> {/* Rating */}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" aria-hidden /> {/* Follow */}
                    <Skeleton className="h-9 w-28 rounded-md" aria-hidden /> {/* Contact */}
                </div>
            </header>

            <Separator />

            {/* (Future) Category/Facet bar specific to shop catalog */}
            <section aria-label="Shop filters">
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-28 rounded-full" aria-hidden />
                    <Skeleton className="h-8 w-24 rounded-full" aria-hidden />
                    <Skeleton className="h-8 w-32 rounded-full" aria-hidden />
                    <Skeleton className="h-8 w-20 rounded-full" aria-hidden />
                </div>
            </section>

            {/* Products grid */}
            <section aria-label="Products" className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold tracking-tight">Products</h2>
                    <Skeleton className="h-8 w-28 rounded-md" aria-hidden /> {/* Sort select */}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-square w-full rounded-xl" aria-hidden />
                            <Skeleton className="h-4 w-3/4" aria-hidden />
                            <Skeleton className="h-3 w-1/3" aria-hidden />
                        </div>
                    ))}
                </div>
            </section>

            {/* About the shop */}
            <section aria-label="About" className="space-y-3">
                <h2 className="text-base font-semibold tracking-tight">About this shop</h2>
                <Skeleton className="h-4 w-5/6" aria-hidden />
                <Skeleton className="h-4 w-4/6" aria-hidden />
                <Skeleton className="h-4 w-3/6" aria-hidden />
            </section>

            {/* Policies */}
            <section aria-label="Policies" className="space-y-3">
                <h2 className="text-base font-semibold tracking-tight">Policies</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Skeleton className="h-20 w-full rounded-xl" aria-hidden />
                    <Skeleton className="h-20 w-full rounded-xl" aria-hidden />
                    <Skeleton className="h-20 w-full rounded-xl" aria-hidden />
                </div>
            </section>

            {/* Reviews */}
            <section aria-label="Reviews" className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold tracking-tight">Reviews</h2>
                    <Skeleton className="h-8 w-24 rounded-md" aria-hidden /> {/* Write review */}
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2 rounded-xl border p-3">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" aria-hidden />
                                <Skeleton className="h-4 w-40" aria-hidden />
                            </div>
                            <Skeleton className="h-4 w-5/6" aria-hidden />
                            <Skeleton className="h-4 w-4/6" aria-hidden />
                        </div>
                    ))}
                </div>
            </section>
        </section>
    )
}
