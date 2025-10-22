"use client";

// apps/web/components/header/header.tsx
// ----------------------------------------------------------------------------
// Header wrapper (acts like an index for atomic header parts).
// Responsibilities:
//  - Provides the sticky shell and layout grid for the header
//  - Hosts atomic sub-components (Brand, MainNav, SearchTrigger, HeaderActions)
//  - Exposes a single <Header /> for use in app/layout.tsx
// ----------------------------------------------------------------------------

import React from "react";
import { Separator } from "@components/separator"

// NOTE: Keep the imports commented until each file exists to avoid TS errors.
// import { Brand } from "./brand"
// import { MainNav } from "./main-nav"
// import { SearchTrigger } from "./search-trigger"
// import { HeaderActions } from "./header-actions"

type HeaderProps = { children?: React.ReactNode }

export function Header({ children }: Readonly<HeaderProps>) {
    return (
        <header
            className="
                sticky top-0 z-50 w-full
                bg-background/70 backdrop-blur
                supports-[backdrop-filter]:bg-background/60
                "
            // Accessibility: landmarks help screen readers jump to header quickly.
                aria-label="Site header"
            >
                <div className="mx-auto max-w-6xl px-4">
                    <div className="flex h-14 items-center justify-between gap-3">
                    {/* Left cluster: Brand + Primary Navigation */}
                    <div className="flex min-w-0 items-center gap-4">
                        {/* TODO: <Brand /> will render logo + brand name linking to "/" */}
                        <div className="w-[140px] shrink-0" aria-hidden>
                        {/* Placeholder to preserve layout until Brand is implemented */}
                        </div>

                        {/* TODO: <MainNav /> will host the NavigationMenu (Buyer/Seller-aware) */}
                        <nav className="hidden md:block min-w-0">
                        {/* Placeholder for Navigation Menu */}
                        </nav>
                    </div>

                    {/* Center cluster: Search trigger (popover) */}
                    <div className="flex-1 max-w-xl">
                        {/* TODO: <SearchTrigger /> will open a command palette / popover search */}
                        <div className="h-9 rounded-xl border border-dashed" aria-hidden />
                    </div>

                    {/* Right cluster: notifications, cart, profile, theme toggle */}
                    <div className="flex items-center gap-2">
                        {/* TODO: <HeaderActions /> will contain 🛎, 🛒, profile, theme toggle */}
                        <div className="w-[180px] h-9 rounded-xl border border-dashed" aria-hidden />
                    </div>
                    </div>
                </div>

                {/* Visual separation from page content */}
                <Separator />

                {/* Optional top-of-page banner area */}
                {children ? <div className="bg-muted/30">{children}</div> : null}
        </header>
    )
}