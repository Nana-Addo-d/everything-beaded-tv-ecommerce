import Link from "next/link"
import { getCatalog } from "@/features/catalog/catalog-server"
import { filterProducts } from "@/features/catalog/catalog"
import { ProductGrid } from "@/features/catalog/product-grid"

export async function BuyerTrendingProducts() {
  const products = filterProducts(await getCatalog())
  return (
    <section aria-label="Collection" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Explore the collection</h2>
        <Link href="/shop" className="text-sm underline">
          View all
        </Link>
      </div>
      {products.length ? (
        <ProductGrid products={products.slice(0, 8)} />
      ) : (
        <p className="rounded-xl border p-6 text-sm text-muted-foreground">
          The catalogue is being prepared. Confirmed product details and
          availability will appear here before ordering opens.
        </p>
      )}
    </section>
  )
}
