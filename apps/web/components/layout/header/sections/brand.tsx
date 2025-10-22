"use client";

import React from "react";
import Link from "next/link";

/**
 * Brand
 * - Placeholder logo + brand text
 * - Acts as a link to the homepage
 */

export function Brand() {
    return (
    <Link href="/" className="flex items-center gap-2 font-semibold">
      {/* Placeholder logo box; replace with an img/svg later */}
        <span
        aria-hidden
        className="inline-block size-6 rounded-md bg-foreground/20"
        />
        <span>EB Marketplace</span>
    </Link>
    )
}
