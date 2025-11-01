"use client"

/**
 * Footer (2-layer)
 * Location: apps/web/components/layout/footer/footer.tsx
 *
 * Structure
 *  L1: condensed bar (copyright, locale/currency quick glance)
 *  L2: multi-column groups using Collapsible on mobile:
 *      - Customer Services
 *      - Shopping With Us
 *      - Working With Us
 *      - Pay With
 *      - Locale & Currency + Social
 *
 * This wrapper only mounts the shell + skeleton placeholders.
 * Each group will be implemented in its own file (next activities).
 */

import * as React from "react"
import { Separator } from "@components/separator"
import { Skeleton } from "@components/skeleton"

// TODO: Implement these in subsequent steps and then uncomment:
import { GroupCustomerServices } from "./groups/customer-services"
import { GroupShoppingWithUs } from "./groups/shopping-with-us"
import { GroupWorkingWithUs } from "./groups/working-with-us"
import { GroupPayWith } from "./groups/pay-with"
import { GroupLocaleCurrencySocial } from "./groups/locale-currency-social"

type FooterProps = {
    className?: string
}

export function Footer({ className }: Readonly<FooterProps>) {
    return (
        <footer className={["mt-12 bg-muted/10", className].filter(Boolean).join(" ")} aria-label="Site footer">
        {/* Layer 2: Multi-group area (collapsible on mobile) */}
            <div className="mx-auto w-full max-w-full px-4 py-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                {/* Group: Customer Services */}
                    <GroupCustomerServices />

                {/* Group: Shopping With Us */}
                    <GroupShoppingWithUs />
                
                {/* Group: Working With Us */}
                    <GroupWorkingWithUs />
                

                {/* Group: Pay With */}
                <GroupPayWith />

                {/* Group: Locale & Currency + Social */}
                <GroupLocaleCurrencySocial />
                </div>
            </div>

            <Separator />

            {/* Layer 1: Condensed bottom bar */}
            <div className="mx-auto w-full max-w-full px-4 py-4 text-xs text-muted-foreground">
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-24" aria-hidden /> {/* © year + brand */}
                    <span>•</span>
                    <Skeleton className="h-3 w-20" aria-hidden /> {/* Privacy */}
                    <span>•</span>
                    <Skeleton className="h-3 w-16" aria-hidden /> {/* Terms */}
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded" aria-hidden /> {/* Locale pill */}
                    <Skeleton className="h-6 w-16 rounded" aria-hidden /> {/* Currency pill */}
                </div>
                </div>
            </div>
        </footer>
    )
}
