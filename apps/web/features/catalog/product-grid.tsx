import Link from "next/link";
import { Card, CardContent } from "@components/card";
import { AddToBag } from "@/features/cart/add-to-bag";
import { ProductImage } from "./product-image";
import { availability, type ProductCard } from "./catalog";
import { money } from "../checkout/domain";
import { SaveDesign } from "../cart/saved-designs";

export function ProductGrid({
  products,
  emptyTitle = "No products to show",
  emptyDescription = "Try another search or browse all available listings.",
}: {
  products: ProductCard[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!products.length)
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <h2 className="font-semibold">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
        <Link href="/shop" className="mt-4 inline-block text-sm underline">
          Browse all
        </Link>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <Card
          key={product.slug}
          className="min-w-0 overflow-hidden rounded-xl py-0"
        >
          <Link
            href={`/p/${product.slug}`}
            aria-label={`${product.title} — view details`}
          >
            <ProductImage src={product.image} title={product.title} />
          </Link>
          <CardContent className="flex flex-1 flex-col gap-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">
                {product.subcategory}
              </span>
              <SaveDesign slug={product.slug} title={product.title} compact />
            </div>
            <Link
              href={`/p/${product.slug}`}
              className="min-h-10 text-sm font-medium hover:underline"
            >
              {product.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              {product.priceMinor === null
                ? "Price coming soon"
                : money(product.priceMinor, product.currency)}
              {product.priceMinor !== null && ` · ${availability(product)}`}
            </p>
            <div className="mt-auto">
              <AddToBag slug={product.slug} stock={product.stock} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
