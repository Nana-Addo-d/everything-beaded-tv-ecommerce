// apps/web/components/sections/(buyer)/shop/mock-shops.ts

export type Shop = {
    id: string
    slug: string
    name: string
    region: string
    rating: number
    followers: number
    products: number
    impact?: "fairtrade" | "woman_led" | "coop_made"
    logo?: string
}

export const MOCK_SHOPS: Shop[] = [
    {
        id: "s1",
        slug: "kente-works",
        name: "KenteWorks",
        region: "Kumasi, Ghana",
        rating: 4.8,
        followers: 2_304,
        products: 128,
        impact: "woman_led",
        logo: "/images/shops/kente-works.jpg",
    },
    {
        id: "s2",
        slug: "kisii-craft",
        name: "Kisii Craft",
        region: "Kisii, Kenya",
        rating: 4.7,
        followers: 1_962,
        products: 89,
        impact: "fairtrade",
        logo: "/images/shops/kisii-craft.jpg",
    },
    {
        id: "s3",
        slug: "mali-textiles",
        name: "Mali Textiles",
        region: "Ségou, Mali",
        rating: 4.6,
        followers: 1_104,
        products: 76,
        impact: "coop_made",
        logo: "/images/shops/mali-textiles.jpg",
    },
    {
        id: "s4",
        slug: "nomad-leather",
        name: "Nomad Leather",
        region: "Marrakesh, Morocco",
        rating: 4.9,
        followers: 3_581,
        products: 154,
        logo: "/images/shops/nomad-leather.jpg",
    },
]

export function getShopBySlug(slug: string) {
    return MOCK_SHOPS.find((s) => s.slug === slug)
}
