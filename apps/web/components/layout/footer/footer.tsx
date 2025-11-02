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
import { BottomBar } from "./groups/bottom-bar"

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
            <BottomBar />
        </footer>
    )
}
