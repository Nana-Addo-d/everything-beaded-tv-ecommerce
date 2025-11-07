"use client"

/**
 * Buyer Hero / Welcome (Carousel)
 * - Uses shadcn/ui Carousel (Embla)
 * - Each slide has its own headline, copy, and CTAs
 * - Responsive; keyboard accessible; dots + arrows
 *
 * TODO: Swap the placeholder images and hrefs with real content.
 */

import * as React from "react"
import Link from "next/link"
import { Button } from "@components/button"
import { Badge } from "@components/badge"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@components/carousel"

type Slide = {
    id: string
    tag?: string
    title: string
    description: string
  image?: string // optional background/image area
    primary: { label: string; href: string }
    secondary?: { label: string; href: string }
}

const SLIDES: Slide[] = [
    {
    id: "s1",
    tag: "New",
    title: "Discover handmade & unique pieces from verified artisans",
    description:
        "Curated collections, fair pricing, and secure checkout. Follow your favorite shops and never miss a drop.",
    image: "/images/hero/slide-1.jpg",
    primary: { label: "Shop now", href: "/shop" },
    secondary: { label: "Explore artisans", href: "/artisans" },
    },
    {
    id: "s2",
    tag: "Trending",
    title: "This week’s picks: bracelets, earrings & anklets",
    description:
        "Handpicked styles from rising creators. Limited runs—grab yours before it’s gone.",
    image: "/images/hero/slide-2.jpg",
    primary: { label: "View picks", href: "/collections/weekly" },
    secondary: { label: "See all jewelry", href: "/c/jewelry" },
    },
    {
    id: "s3",
    tag: "Offer",
    title: "Seasonal promos & bundles",
    description:
        "Save more with curated bundles and shop-wide promotions from top-rated stores.",
    image: "/images/hero/slide-3.jpg",
    primary: { label: "See promotions", href: "/promotions" },
    secondary: { label: "Gift ideas", href: "/collections/gifts" },
    },
]

export function BuyerHero() {

    const [autoplay, setAutoplay] = React.useState(true)
    const wrapperRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
    if (!wrapperRef.current) return
    const root = wrapperRef.current
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = () => {
        const nextBtn = root.querySelector<HTMLButtonElement>("[data-carousel-next]")
        nextBtn?.click()
    }

    const start = () => {
        timer ??= globalThis.setInterval(tick, 4000)
    }
    const stop = () => {
        if (timer != null) {
        globalThis.clearInterval(timer)
        timer = null
        }
    }

    if (autoplay) start()
    else stop()

    return () => stop()
    }, [autoplay])


    return (
        <section aria-label="Highlights" className="relative">
        <div aria-hidden/>

            <Carousel
            ref={wrapperRef as any}
            opts={{ loop: true, align: "start" }}
            className="relative overflow-hidden"
            aria-roledescription="carousel"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
            onFocus={() => setAutoplay(false)}
            onBlur={() => setAutoplay(true)}
            >
            <CarouselContent>
            {SLIDES.map((s) => (
                <CarouselItem key={s.id}>
                <article className="grid items-stretch gap-6 p-5 md:grid-cols-2 md:p-8">
                    {/* Left: copy + CTAs */}
                    <div className="flex flex-col justify-center">
                    {s.tag ? (
                        <Badge variant="secondary" className="mb-2 w-fit">
                        {s.tag}
                        </Badge>
                    ) : null}
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        {s.title}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">
                        {s.description}
                    </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={s.primary.href}>
                        <Button>{s.primary.label}</Button>
                    </Link>
                    {s.secondary ? (
                        <Link href={s.secondary.href}>
                            <Button variant="outline">{s.secondary.label}</Button>
                        </Link>
                    ) : null}
                    </div>
                </div>

                {/* Right: visual (placeholder if no image yet) */}
                <div className="relative">
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border bg-muted">
                        {/* Replace with <Image /> if you add real assets */}
                        {s.image ? (
                    <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${s.image})` }}
                        aria-label="Promotional image"
                        role="img"
                    />
                    ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        Image placeholder
                    </div>
                    )}
                </div>

                  {/* Mini thumbnails/dots could go here if desired */}
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Controls */}
        <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-center justify-between md:inset-x-12">
            <CarouselPrevious
            data-carousel-prev
            className="pointer-events-auto"
            aria-label="Previous slide" />
            <CarouselNext
            data-carousel-next
            className="pointer-events-auto"
            aria-label="Next slide" />
        </div>
        </Carousel>
    </section>
    )
}
