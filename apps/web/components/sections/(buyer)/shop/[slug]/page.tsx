// apps/web/app/(store)/shop/[slug]/page.tsx
import * as React from "react"
import BuyerShopSection from "@/components/sections/(buyer)/shop/page"

type PageProps = {
    params: { slug: string }
}

export default function ShopPage({ params }: PageProps) {
    // Later: fetch shop data by params.slug (RSC)
    return <BuyerShopSection />
}
