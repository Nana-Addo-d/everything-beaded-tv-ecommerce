"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { FilterState } from "./filter-types"
import { parseQueryToState, serializeStateToQuery } from "./filter-schema"

/**
 * useFilters
 * - Reads current URLSearchParams → FilterState
 * - Exposes state + setters
 * - Writes changes back to URL (shallow replace, keeps scroll)
 */
export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse URL -> state (memoized per URL change)
  const stateFromUrl = React.useMemo<FilterState>(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "")
    return parseQueryToState(sp)
  }, [searchParams])

  const [state, setState] = React.useState<FilterState>(stateFromUrl)

  // Keep local state in sync when URL changes externally (back/forward, links)
  React.useEffect(() => {
    setState(stateFromUrl)
  }, [stateFromUrl])

  // Push state -> URL (shallow, no scroll reset)
  const commit = React.useCallback((next: FilterState) => {
    const params = serializeStateToQuery(next)
    const qs = params.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    router.replace(url, { scroll: false })
  }, [pathname, router])

  // Public API
  const update = React.useCallback((patch: Partial<FilterState>) => {
    const next = { ...state, ...patch }
    setState(next)
    commit(next)
  }, [state, commit])

  const clearAll = React.useCallback(() => {
    setState({})
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  return {
    state,
    setState,   // advanced scenarios
    update,     // merge & commit
    clearAll,   // reset
    commit,     // commit explicit state
  }
}
