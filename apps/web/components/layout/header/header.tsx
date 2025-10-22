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
import { Skeleton } from "@components/skeleton"


// NOTE: Keep the imports commented until each file exists to avoid TS errors.
import { Brand } from "./sections/brand"
import { MainNav } from "./sections/main-nav"
import { SearchTrigger } from "./sections/search-trigger"
import { ModeToggle } from "./sections/mode-toggle"
import { HeaderActions } from "./sections/header-actions"

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
                <div className="mx-auto px-4">
                    <div className="flex h-14 items-center justify-between gap-3">
                        {/* Left cluster: Brand + Primary Navigation */}
                        <div className="flex min-w-0 items-center gap-4">
                            {/* <Brand /> render logo + brand name linking to "homepage" */}
                            <div className="shrink-0">
                                <Brand />
                            </div>
                        </div>

                        {/* Center cluster: MainNav + Search (centered) */}
                        <div className="flex-1 flex items-center justify-center gap-4">
                            {/* Main navigation (md+) */}
                            <nav className="hidden md:block">
                                <MainNav />
                            </nav>

                            {/* Search size tuned: narrower on mobile, wider on md+ */}
                            <div className=" max-w-[14rem] sm:max-w-[18rem] md:max-w-[28rem]">
                                <SearchTrigger />
                            </div>
                        </div>

                        {/* Right cluster: notifications, cart, profile, theme toggle */}
                        <div className="flex items-center gap-2">
                            {/* TODO: <HeaderActions /> will contain 🛎, 🛒, profile, theme toggle */}
                                <HeaderActions />
                            {/* Theme toggle */}
                            <div className="ml-1">
                                <ModeToggle />
                            </div>
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