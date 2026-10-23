"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@components/button";
import { ProductImage } from "@/features/catalog/product-image";
import {
  canOrder,
  availability,
  type Product,
} from "@/features/catalog/catalog";
import { money } from "@/features/checkout/domain";
import { useCart } from "./cart-provider";
import { MAX_QUANTITY } from "./cart-state";

export function CartPage({ products }: { products: Product[] }) {
  const { items, ready, storageAvailable, update, saveForLater } = useCart();
  const [excluded, setExcluded] = useState<string[]>([]);
  const visibleItems = items.flatMap((item) => {
    const product = products.find((entry) => entry.slug === item.slug);
    return product ? [{ ...item, product }] : [];
  });
  const selectedItems = visibleItems.filter(
    (item) => !excluded.includes(item.slug),
  );
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <Link href="/shop" className="text-sm underline">
        Continue browsing
      </Link>
      <h1 className="text-2xl font-semibold">Your shopping bag</h1>
      <p className="text-sm text-muted-foreground">
        Keep your selected designs together. Price and stock are checked again
        at checkout; adding to your bag does not reserve an item.
      </p>
      {!storageAvailable && (
        <p role="status" className="rounded-lg border p-3 text-sm">
          Browser storage is unavailable. Your bag will only last for this
          visit.
        </p>
      )}
      {!ready ? (
        <p role="status">Loading your bag…</p>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="font-medium">Your bag is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the catalogue and open a listing to learn more.
          </p>
          <Button asChild className="mt-4">
            <Link href="/shop">Browse catalogue</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y rounded-xl border px-4">
            {visibleItems.map(({ slug, quantity, product }) => (
              <li key={slug} className="flex flex-wrap items-center gap-4 py-4">
                <input
                  type="checkbox"
                  checked={!excluded.includes(slug)}
                  aria-label={`Include ${product.title} in checkout`}
                  className="size-5 shrink-0 accent-current"
                  onChange={(event) =>
                    setExcluded((current) =>
                      event.target.checked
                        ? current.filter((id) => id !== slug)
                        : [...current, slug],
                    )
                  }
                />
                <Link href={`/p/${slug}`} className="w-20 shrink-0">
                  <ProductImage title={product.title} src={product.image} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/p/${slug}`}
                    className="font-medium hover:underline"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.priceMinor === null
                      ? "Price coming soon"
                      : money(product.priceMinor, product.currency)}
                    {` · ${availability(product)}`}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={quantity <= 1}
                      aria-label={`Decrease ${product.title} quantity`}
                      onClick={() => update(slug, quantity - 1)}
                    >
                      −
                    </Button>
                    <output
                      className="min-w-8 text-center"
                      aria-label={`${product.title} quantity`}
                      aria-live="polite"
                    >
                      {quantity}
                    </output>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={
                        quantity >=
                        Math.min(MAX_QUANTITY, product.stock ?? MAX_QUANTITY)
                      }
                      aria-label={`Increase ${product.title} quantity`}
                      onClick={() => update(slug, quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => update(slug, 0)}
                      aria-label={`Remove ${product.title}`}
                    >
                      Remove
                    </Button>
                    <Button variant="ghost" onClick={() => saveForLater(slug)}>
                      Save for later
                    </Button>
                  </div>
                  {product.stock !== null && quantity > product.stock && (
                    <p role="status" className="mt-2 text-sm text-destructive">
                      Only {product.stock} available. Reduce the quantity or
                      save this design for later.
                    </p>
                  )}
                  {product.priceMinor !== null && (
                    <p className="mt-2 text-sm font-medium">
                      Line total:{" "}
                      {money(product.priceMinor * quantity, product.currency)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <section
            className="space-y-3 rounded-xl border p-5"
            aria-label="Bag summary"
          >
            <p className="font-medium">
              {selectedItems.reduce((total, item) => total + item.quantity, 0)}{" "}
              items selected for checkout
            </p>
            {selectedItems.length > 0 &&
              selectedItems.every(
                ({ product }) => product.priceMinor !== null,
              ) && (
                <p className="text-lg font-semibold">
                  Items subtotal:{" "}
                  {money(
                    selectedItems.reduce(
                      (total, item) =>
                        total + (item.product.priceMinor ?? 0) * item.quantity,
                      0,
                    ),
                    selectedItems[0]?.product.currency,
                  )}
                </p>
              )}
            <p className="text-sm text-muted-foreground">
              {selectedItems.length > 0 &&
              selectedItems.every(
                (item) =>
                  canOrder(item.product) &&
                  item.quantity <= (item.product.stock ?? 0),
              )
                ? "Delivery and your final total are calculated at checkout."
                : "Some items are awaiting price or availability confirmation. You can keep them here while the catalogue is updated."}
            </p>
            {selectedItems.length > 0 ? (
              <Button asChild>
                <Link
                  href={
                    "/checkout?items=" +
                    encodeURIComponent(
                      selectedItems.map((item) => item.slug).join(","),
                    )
                  }
                >
                  Continue with selected items
                </Link>
              </Button>
            ) : (
              <Button disabled>Select items to continue</Button>
            )}
            <p className="text-xs text-muted-foreground">
              Unselected items stay in your bag.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
