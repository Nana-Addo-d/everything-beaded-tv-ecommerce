// apps/web/components/layout/header/sections/main-nav.tsx
// ---------------------------------------------------------------------------
// Buyer-facing minimal navigation using shadcn NavigationMenu.
// Items: Shop • Artisans • About
// Notes:
//  - Keep it simple: top-level links only (no dropdowns yet).
//  - This is the "Buyer default" nav. We'll later adapt per mode (Buyer/Seller).
//  - Accessible labels and focus styles included.
// ---------------------------------------------------------------------------

"use client"

import Link from "next/link"
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuTriggerStyle,
} from "@components/navigation-menu"

/** MainNav: minimal buyer nav */
export function MainNav() {
    return (
        <NavigationMenu aria-label="Primary navigation">
            <NavigationMenuList>
                {/* Shop */}
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/shop" aria-label="Browse shop">
                            Shop
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                {/* Artisans */}
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/artisans" aria-label="Discover artisans">
                            Artisans
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                {/* About */}
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/about" aria-label="About this marketplace">
                            About
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}