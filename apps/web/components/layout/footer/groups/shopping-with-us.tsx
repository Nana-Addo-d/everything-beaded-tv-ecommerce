"use client"

/**
 * Footer Group: Shopping With Us
 * - Collapsible on mobile; expanded grid on md+
 * - Replace hrefs with real routes later.
 */

import * as React from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@components/collapsible"

type Item = { label: string; href: string }
const ITEMS: Item[] = [
    { label: "How to Order", href: "/help/how-to-order" },
    { label: "Payment Options", href: "/help/payment-options" },
    { label: "Gift Cards", href: "/gift-cards" },
    { label: "Loyalty Program", href: "/loyalty" },
    { label: "Price Alerts", href: "/alerts/price" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Verified Reviews", href: "/reviews" },
    { label: "Referral Program", href: "/referrals" },
    { label: "Promotions & Coupons", href: "/promotions" },
    ]

export function GroupShoppingWithUs() {
    const [open, setOpen] = React.useState(true)

    return (
        <div>
        {/* Mobile: collapsible */}
        <div className="md:hidden">
            <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger
                className="flex w-full items-center justify-between py-2 text-left text-sm font-semibold"
                aria-label="Shopping With Us"
            >
                <span>Shopping With Us</span>
                <ChevronDown
                className={["h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0"].join(" ")}
                aria-hidden
                />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-1">
                <ul className="space-y-2">
                {ITEMS.map((it) => (
                    <li key={it.href}>
                    <Link href={it.href} className="text-sm text-muted-foreground hover:text-foreground">
                        {it.label}
                    </Link>
                    </li>
                ))}
                </ul>
            </CollapsibleContent>
            </Collapsible>
        </div>

        {/* Desktop: expanded */}
        <div className="hidden md:block">
            <h3 className="mb-3 text-sm font-semibold">Shopping With Us</h3>
            <ul className="space-y-2">
            {ITEMS.map((it) => (
                <li key={it.href}>
                <Link href={it.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {it.label}
                </Link>
                </li>
            ))}
            </ul>
        </div>
        </div>
    )
}
