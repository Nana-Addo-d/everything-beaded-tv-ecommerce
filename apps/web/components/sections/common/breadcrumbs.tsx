"use client"

/**
 * Breadcrumbs
 * - Auto-builds crumbs from the current pathname.
 * - Accepts optional override `items` to supply custom labels/links.
 * - Hidden on root ("/") by default via `hideOnRoot`.
 *
 * Requires shadcn/ui breadcrumb:
 *   pnpm dlx shadcn@latest add breadcrumb
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@components/breadcrumb"

type Crumb = { label: string; href?: string }

type Props = {
  items?: Crumb[]        // override/append if provided
  hideOnRoot?: boolean   // default: true
  className?: string
  rootLabel?: string     // default: "Home"
}

function slugToLabel(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export function Breadcrumbs({
  items,
  hideOnRoot = true,
  className,
  rootLabel = "Home",
}: Props) {
  const pathname = usePathname() || "/"

  // When custom items provided, use them as-is (still hide root if requested)
  const autoItems = React.useMemo<Crumb[]>(() => {
    if (items && items.length) return items

    const parts = pathname.split("/").filter(Boolean)
    const acc: Crumb[] = []
    let hrefAcc = ""
    for (const p of parts) {
      hrefAcc += `/${p}`
      acc.push({ href: hrefAcc, label: slugToLabel(p) })
    }
    return acc
  }, [pathname, items])

  const isRoot = pathname === "/" || autoItems.length === 0
  if (hideOnRoot && isRoot) return null

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{rootLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

          {autoItems.map((c, idx) => {
              const isLast = idx === autoItems.length - 1
              const key = c.href ?? `${idx}-${c.label}`

              return (
                  <React.Fragment key={key}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                          {isLast || !c.href ? (
                              // Last crumb OR no href → render as plain page text
                              <BreadcrumbPage>{c.label}</BreadcrumbPage>
                          ) : (
                              // Has href and is not last → render as link
                              <BreadcrumbLink asChild>
                                  <Link href={c.href}>{c.label}</Link>
                              </BreadcrumbLink>
                          )}
                      </BreadcrumbItem>
                  </React.Fragment>
              )
          })}

      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default Breadcrumbs
