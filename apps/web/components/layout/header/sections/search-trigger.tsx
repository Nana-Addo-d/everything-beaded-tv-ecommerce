"use client"

/**
 * SearchTrigger (refined)
 * - Looks/behaves like a small search textbox in the header
 * - Rotating placeholder hints with a soft slide/fade transition
 * - Opens the popover (command palette) when focused or on Ctrl/Cmd+K
 * - "Vanish" effect on submit (Enter): quick fade/scale, then clears & closes
 */

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@components/input"
import { Button } from "@components/button"
import { 
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@components/popover"
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@components/command"

const PLACEHOLDERS =
[
    "Search products…",
    "Try “beaded anklet”…",
    "Search shops or artisans…",
    "Find promotions & deals…",
] as const

export function SearchTrigger() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [phIndex, setPhIndex] = React.useState(0)
    const [phPhase, setPhPhase] = React.useState<"in" | "out">("in")
    const [submitting, setSubmitting] = React.useState(false)

// Rotate placeholder every 3s with a tiny fade/slide
    React.useEffect(() => {
        const id = setInterval(() => {
        setPhPhase("out")
    // let the "out" transition run, then switch text and fade back "in"
        const t = setTimeout(() => {
            setPhIndex((i) => (i + 1) % PLACEHOLDERS.length)
            setPhPhase("in")
        }, 160)
        return () => clearTimeout(t)
        }, 3000)
        return () => clearInterval(id)
    }, [])

    // Open with Ctrl/Cmd + K
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
        const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
        const platform = nav.userAgentData?.platform || nav.userAgent || ""
        const isMac = platform.toLowerCase().includes("mac")
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault()
            setOpen((v) => !v)
        }
        }
        globalThis.addEventListener("keydown", handler)
        return () => globalThis.removeEventListener("keydown", handler)
    }, [])

    // Submit handler (Enter inside the textbox)
    const onSubmit = React.useCallback(() => {
        if (!query.trim()) {
        setOpen(true) // empty → just open the palette
        return
        }
        // Vanish effect: quick fade+scale, then clear and close
        setSubmitting(true)
        setTimeout(() => {
        // TODO: route to /search?q=... or trigger action
        setQuery("")
        setSubmitting(false)
        setOpen(false)
        }, 160)
    }, [query])

    // Handle Enter in the input
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
        e.preventDefault()
        onSubmit()
        }
    }

    // --- hover open/close helpers for the popover ---
    const hoverTimer = React.useRef<number | null>(null)
    const onHoverIn = () => {
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
        setOpen(true)
        }
    const onHoverOut = () => {
        hoverTimer.current = window.setTimeout(() => setOpen(false), 120)
        }


    return (
        <Popover open={open} onOpenChange={setOpen}>
        {/* Use the input itself as the trigger. Focus → opens popover. */}
        <PopoverTrigger asChild>
            <div
                className="relative group"
                onMouseEnter={onHoverIn}
                onMouseLeave={onHoverOut}
            >
                <Search
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden
                />
                <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                aria-label="Search"
                role="combobox"
                aria-expanded={open}
                // compact size + hover focus affordance + vanish on submit
                className={[
                    "h-8 md:h-9 pl-8 pr-16 text-sm rounded-xl",
                    "transition-all outline-none",
                    "bg-background/60 hover:bg-background/80 focus:bg-background",
                    "border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/50",
                    "ring-0 hover:ring-1 hover:ring-border focus:ring-2 focus:ring-primary/40",
                    submitting ? "opacity-0 scale-95" : "opacity-100 scale-100",
                ].join(" ")}
                placeholder=""
                />

                {/* Rotating placeholder overlay (slides/fades), only when input is empty */}
                {query.length === 0 && (
                <span
                    aria-hidden
                    className={[
                    "pointer-events-none absolute left-8 right-16 top-0 h-full flex items-center",
                    "text-muted-foreground text-sm select-none",
                    "transition-all duration-150",
                    phPhase === "in" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-0.5",
                    ].join(" ")}
                >
                    {PLACEHOLDERS[phIndex]}
                </span>
                )}

                {/* Shortcut hint (desktop) */}
                <kbd
                className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded border px-1.5 text-[10px] text-muted-foreground group-hover:border-muted-foreground/70"
                aria-hidden
                >
                <span>Ctrl</span> K
                </kbd>
            </div>
        </PopoverTrigger>


        {/* Popover content: command palette */}
        <PopoverContent className="w-[min(90vw,36rem)] p-0" align="start" sideOffset={8}>
            <Command label="Global search">
            <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Type to search products, shops, artisans…"
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Recent">
                <CommandItem value="bracelets" onSelect={() => setQuery("bracelets")}>Bracelets</CommandItem>
                <CommandItem value="earrings" onSelect={() => setQuery("earrings")}>Earrings</CommandItem>
                <CommandItem value="anklets" onSelect={() => setQuery("anklets")}>Anklets</CommandItem>
                </CommandGroup>

                <CommandGroup heading="Categories">
                <CommandItem value="beads" onSelect={() => setQuery("beads")}>Beads</CommandItem>
                <CommandItem value="artisan-shops" onSelect={() => setQuery("artisan-shops")}>Artisan Shops</CommandItem>
                <CommandItem value="promotions" onSelect={() => setQuery("promotions")}>Promotions</CommandItem>
                </CommandGroup>
            </CommandList>

            {/* Submit row */}
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
                <Button size="sm" onClick={onSubmit}>Search</Button>
            </div>
            </Command>
        </PopoverContent>
        </Popover>
    )
}