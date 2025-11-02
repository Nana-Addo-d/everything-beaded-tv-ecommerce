"use client"

/**
 * Footer Group: Locale & Currency + Social
 * - Locale and Currency selectors (shadcn Select)
 * - Social icons that swap assets for dark/light themes
 * - Uses two SVGs per network: e.g., twitter-light.svg / twitter-dark.svg
 *
 * Place your icons under:
 *  apps/web/public/logos/social/{twitter-light.svg,twitter-dark.svg,instagram-light.svg,instagram-dark.svg,...}
 */

import * as React from "react"
import Image from "next/image"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@components/select"
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
} from "@components/tooltip"

type Social = {
    id: string
    label: string
    href: string
    lightSrc: string
    darkSrc: string
}

const SOCIALS: Social[] = [
    {
    id: "twitter",
    label: "Twitter / X",
    href: "https://x.com/",
    lightSrc: "/logos/social/type-1/x-social.svg",
    darkSrc: "/logos/social/type-2/x-social.svg",
    },
    {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/",
    lightSrc: "/logos/social/type-1/instagram.svg",
    darkSrc: "/logos/social/type-2/instagram.svg",
    },
    {
    id: "facebook",
    label: "Facebook",
    href: "https://facebook.com/",
    lightSrc: "/logos/social/type-1/facebook.svg",
    darkSrc: "/logos/social/type-2/facebook.svg",
    },
    {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/",
    lightSrc: "/logos/social/type-1/youTube.svg",
    darkSrc: "/logos/social/type-2/youTube.svg",
    },
    {
    id: "gmail",
    label: "gmail",
    href: "https://gmail.com/",
    lightSrc: "/logos/social/type-1/gmail.svg",
    darkSrc: "/logos/social/type-2/gmail.svg",
    },
    {
    id: "snapchat",
    label: "snapchat",
    href: "https://snapchat.com/",
    lightSrc: "/logos/social/type-1/snapchat.svg",
    darkSrc: "/logos/social/type-2/snapchat.svg",
    },
    {
    id: "linkedin",
    label: "linkedin",
    href: "https://linkedin.com/",
    lightSrc: "/logos/social/type-1/linkedin.svg",
    darkSrc: "/logos/social/type-2/linkedin.svg",
    },
    {
    id: "telegram",
    label: "telegram",
    href: "https://telegram.com/",
    lightSrc: "/logos/social/type-1/telegram.svg",
    darkSrc: "/logos/social/type-2/telegram.svg",
    },
    {
    id: "whatsapp",
    label: "whatsapp",
    href: "https://whatsapp.com/",
    lightSrc: "/logos/social/type-1/whatsapp.svg",
    darkSrc: "/logos/social/type-2/whatsapp.svg",
    },
]

const LOCALES = [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
] as const

const CURRENCIES = [
    { code: "USD", label: "USD — $" },
    { code: "EUR", label: "EUR — €" },
    { code: "GBP", label: "GBP — £" },
    { code: "GHS", label: "GHS — ₵" },
] as const

export function GroupLocaleCurrencySocial() {
    const [locale, setLocale] = React.useState<string>("en")
    const [currency, setCurrency] = React.useState<string>("EUR")

    // Persist simple preferences
    React.useEffect(() => {
        const l = localStorage.getItem("eb.locale") || "en"
        const c = localStorage.getItem("eb.currency") || "EUR"
        setLocale(l)
        setCurrency(c)
    }, [])
    React.useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem("eb.locale", locale)
        window.dispatchEvent(new CustomEvent("eb:prefs", { detail: { locale } }))
    }
    }, [locale])

    React.useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem("eb.currency", currency)
        window.dispatchEvent(new CustomEvent("eb:prefs", { detail: { currency } }))
    }
    }, [currency])


    return (
        <div>
        <h3 className="mb-3 text-sm font-semibold">Locale & Currency</h3>

        <div className="flex flex-col gap-3 sm:flex-row">
            {/* Locale selector */}
            <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="h-9 w-full sm:w-[220px]">
                <SelectValue placeholder="Select locale" />
            </SelectTrigger>
            <SelectContent>
                {LOCALES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                    {l.label}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>

            {/* Currency selector */}
            <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-9 w-full sm:w-[220px]">
                <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
                {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                    {c.label}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        {/* Social icons (light/dark asset swap) */}
        <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold">Follow us</h3>
            <div className="flex flex-wrap items-center gap-2">
            {SOCIALS.map((s) => (
                <TooltipProvider key={s.id} delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card hover:bg-accent transition-colors"
                    >
                        {/* Light icon */}
                        <Image
                        src={s.lightSrc}
                        alt={s.label}
                        width={16}
                        height={16}
                        className="dark:hidden"
                        />
                        {/* Dark icon */}
                        <Image
                        src={s.darkSrc}
                        alt={s.label}
                        width={16}
                        height={16}
                        className="hidden dark:inline"
                        />
                    </a>
                    </TooltipTrigger>
                    <TooltipContent side="top">{s.label}</TooltipContent>
                </Tooltip>
                </TooltipProvider>
            ))}
            </div>
        </div>
        </div>
    )
}
