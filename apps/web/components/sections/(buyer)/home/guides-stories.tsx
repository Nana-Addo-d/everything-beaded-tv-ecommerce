"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@components/card"
import { Badge } from "@components/badge"
import { Button } from "@components/button"

type Story = {
  id: string
  slug: string
  title: string
  excerpt: string
  image: string
  tag: "Guide" | "Story"
  readTime: string // keep static to avoid hydration drift
  author: string
}

const STORIES: Story[] = [
  {
    id: "g1",
    slug: "guide-choosing-authentic-kente",
    title: "How to Choose Authentic Kente",
    excerpt:
      "A quick guide to understanding weave types, motifs, and what makes a piece genuinely handcrafted.",
    image: "/images/stories/kente-guide.jpg",
    tag: "Guide",
    readTime: "6 min",
    author: "Asante Weave",
  },
  {
    id: "g2",
    slug: "story-meet-soapstone-artisans",
    title: "Meet the Soapstone Artisans of Kisii",
    excerpt:
      "Behind the scenes with a co-op turning raw stone into graceful, modern forms passed down generations.",
    image: "/images/stories/kisii-artisans.jpg",
    tag: "Story",
    readTime: "5 min",
    author: "Kisii Craft",
  },
  {
    id: "g3",
    slug: "guide-caring-for-mudcloth",
    title: "Caring for Bogolanfini (Mudcloth) Textiles",
    excerpt:
      "Keep natural dyes vibrant with simple, gentle care—washing, drying, and storage tips.",
    image: "/images/stories/mudcloth-care.jpg",
    tag: "Guide",
    readTime: "4 min",
    author: "Mali Textiles",
  },
]

export function BuyerGuidesStories() {
  return (
    <section aria-label="Guides & stories" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Guides & Stories</h2>
          <Link href="/stories" className="text-sm underline-offset-4 hover:underline">
              View all
          </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STORIES.map((s) => (
          <Card key={s.id} className="overflow-hidden rounded-xl">
            <Link
              href={`/apps/web/app/(content)/stories/${s.slug}`}
              className="block"
              aria-label={`${s.title} — read`}
            >
              <div
                className="h-32 w-full bg-muted bg-cover bg-center md:h-40"
                style={{ backgroundImage: `url(${s.image})` }}
                role="img"
                aria-label={s.title}
              />
            </Link>

            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Badge variant={s.tag === "Guide" ? "secondary" : "default"}>{s.tag}</Badge>
                <span className="text-xs text-muted-foreground">{s.readTime} read</span>
              </div>
              <Link href={`/apps/web/app/(content)/stories/${s.slug}`} className="mt-2 block">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug">{s.title}</h3>
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.excerpt}</p>
              <p className="mt-2 text-xs text-muted-foreground">By {s.author}</p>
            </CardContent>

            <CardFooter className="p-3 pt-0">
              <Link href={`/apps/web/app/(content)/stories/${s.slug}`} className="w-full">
                <Button size="sm" variant="outline" className="w-full">
                  Read
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
