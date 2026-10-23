import Image from "next/image"
import Link from "next/link"

const COLLECTIONS = [
  { slug: "earrings", title: "Earrings", image: "blue-circle-earrings" },
  { slug: "necklaces", title: "Necklaces", image: "yellow-fringe-necklace" },
  { slug: "bags", title: "Bags", image: "beaded-handbag" },
  { slug: "baskets", title: "Woven baskets", image: "woven-baskets" },
]

export function BuyerFeaturedCollections() {
  return (
    <section aria-label="Browse by category" className="space-y-4">
      <h2 className="text-lg font-semibold">Browse by category</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {COLLECTIONS.map((item) => (
          <Link
            key={item.slug}
            href={`/shop?category=${item.slug}`}
            className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={`/images/catalog/${item.image}.jpg`}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-contain"
              />
            </div>
            <h3 className="p-3 text-sm font-medium">{item.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
