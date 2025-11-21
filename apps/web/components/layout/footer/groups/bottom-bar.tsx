"use client"

import * as React from "react"
import Link from "next/link"

// Shared keys with the Locale & Currency group
const LOCALE_KEY = "eb.locale"
const CURRENCY_KEY = "eb.currency"

// Small hook that reads current prefs and updates on tab changes
function useLocaleCurrency() {
    const [locale, setLocale] = React.useState<string>("en")
    const [currency, setCurrency] = React.useState<string>("EUR")

    React.useEffect(() => {
        // initial read
        setLocale(localStorage.getItem(LOCALE_KEY) || "en")
        setCurrency(localStorage.getItem(CURRENCY_KEY) || "EUR")

        // cross-tab updates
        const onStorage = (e: StorageEvent) => {
        if (e.key === LOCALE_KEY && e.newValue) setLocale(e.newValue)
        if (e.key === CURRENCY_KEY && e.newValue) setCurrency(e.newValue)
        }
        window.addEventListener("storage", onStorage)

        // same-tab voluntary updates (if emitted by the selectors)
        const onPrefs = (e: Event) => {
        const detail = (e as CustomEvent).detail || {}
        if (detail.locale) setLocale(detail.locale)
        if (detail.currency) setCurrency(detail.currency)
        }
        window.addEventListener("eb:prefs", onPrefs as EventListener)

        return () => {
        window.removeEventListener("storage", onStorage)
        window.removeEventListener("eb:prefs", onPrefs as EventListener)
        }
    }, [])

    return { locale, currency }
}

export function BottomBar() {
    const { locale, currency } = useLocaleCurrency()
    const year = new Date().getFullYear()

    return (
        <div className="mx-auto w-full max-w-full px-4 py-4 text-xs text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
            <span>© {year} MarketHub</span>
            <span aria-hidden>•</span>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span aria-hidden>•</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
            </div>

            <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border px-2 py-1">
                Locale: <span className="ml-1 font-medium text-foreground">{locale.toUpperCase()}</span>
            </span>
            <span className="inline-flex items-center rounded-full border px-2 py-1">
                Currency: <span className="ml-1 font-medium text-foreground">{currency}</span>
            </span>
            </div>
        </div>
        </div>
    )
}
