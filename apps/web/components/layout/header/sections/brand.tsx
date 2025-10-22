"use client";

import React from "react";
import Link from "next/link";
import { Store } from "lucide-react";

type BrandProps = {
  className?: string
}

export function Brand({ className }: Readonly<BrandProps>) {
    return (
    <Link
      href="/"
      aria-label="Go to homepage"
      className={["group inline-flex items-center gap-2", className].filter(Boolean).join(" ")}
    >
      {/* Placeholder logo: replace with your SVG later */}
      <span
        className="
          inline-flex h-8 w-8 items-center justify-center rounded-md
          bg-primary/10 text-primary group-hover:bg-primary/15
          transition-colors
        "
        aria-hidden
      >
        <Store className="h-5 w-5" />
      </span>

      {/* Wordmark */}
      <span className="text-lg font-semibold tracking-tight">
        Everything Beaded
      </span>
    </Link>
  )
}
