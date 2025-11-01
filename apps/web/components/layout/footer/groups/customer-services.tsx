"use client"

/**
 * Footer Group: Customer Services
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
    { label: "Help & FAQ", href: "/help" },
    { label: "Shipping & Delivery", href: "/help/shipping" },
    { label: "Returns & Refunds", href: "/help/returns" },
    { label: "Order Tracking", href: "/orders/track" },
    { label: "Size Guides", href: "/help/sizing" },
    { label: "Contact Support", href: "/support" },
]

export function GroupCustomerServices() {
  // Mobile collapsible open by default
    const [open, setOpen] = React.useState(true)

    return (
        <div>
        {/* Heading row (collapsible on mobile) */}
        <div className="md:hidden">
            <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger
                className="flex w-full items-center justify-between py-2 text-left text-sm font-semibold"
                aria-label="Customer Services"
            >
                <span>Customer Services</span>
                <ChevronDown
                className={[
                    "h-4 w-4 transition-transform",
                    open ? "rotate-180" : "rotate-0",
                ].join(" ")}
                aria-hidden
                />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-1">
                <ul className="space-y-2">
                {ITEMS.map((it) => (
                    <li key={it.href}>
                    <Link
                        href={it.href}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        {it.label}
                    </Link>
                    </li>
                ))}
                </ul>
            </CollapsibleContent>
            </Collapsible>
        </div>

        {/* Desktop: always expanded */}
        <div className="hidden md:block">
            <h3 className="mb-3 text-sm font-semibold">Customer Services</h3>
            <ul className="space-y-2">
            {ITEMS.map((it) => (
                <li key={it.href}>
                <Link
                    href={it.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    {it.label}
                </Link>
                </li>
            ))}
            </ul>
        </div>
        </div>
    )
}
