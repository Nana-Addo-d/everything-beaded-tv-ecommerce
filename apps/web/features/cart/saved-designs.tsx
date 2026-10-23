"use client";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@components/button";
import { ProductGrid } from "../catalog/product-grid";
import type { ProductCard } from "../catalog/catalog";
import { useCart } from "./cart-provider";
export function SaveDesign({
  slug,
  title,
  compact = false,
}: {
  slug: string;
  title: string;
  compact?: boolean;
}) {
  const { saved, toggleSaved, ready } = useCart();
  const active = saved.includes(slug);
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "default"}
      disabled={!ready}
      aria-pressed={active}
      aria-label={`${active ? "Unsave" : "Save"} ${title}`}
      onClick={() => toggleSaved(slug)}
    >
      <Heart
        className={`size-4 ${active ? "fill-current" : ""}`}
        aria-hidden="true"
      />
      {!compact && (active ? "Saved to wishlist" : "Save to wishlist")}
    </Button>
  );
}
export function RecordProductView({ slug }: { slug: string }) {
  const { remember } = useCart();
  useEffect(() => {
    remember(slug);
  }, [slug, remember]);
  return null;
}
export function SavedDesigns({
  products,
  kind = "saved",
  exclude,
}: {
  products: ProductCard[];
  kind?: "saved" | "recent";
  exclude?: string;
}) {
  const { saved, recent, ready, storageAvailable, clearRecent } = useCart();
  const ids = kind === "saved" ? saved : recent;
  const selected = ids
    .filter((id) => id !== exclude)
    .flatMap((id) => {
      const p = products.find((p) => p.slug === id);
      return p ? [p] : [];
    });
  if (kind === "recent" && !selected.length) return null;
  return (
    <section
      className="space-y-5"
      aria-label={kind === "saved" ? "Saved designs" : "Recently viewed"}
    >
      {kind === "recent" && (
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Recently viewed</h2>
          <Button variant="ghost" onClick={clearRecent}>
            Clear history
          </Button>
        </div>
      )}
      {!storageAvailable && (
        <p role="status" className="rounded-lg border p-3 text-sm">
          Browser storage is unavailable. Your selections will last for this
          visit.
        </p>
      )}
      {!ready ? (
        <p role="status">Loading your selections…</p>
      ) : (
        <ProductGrid
          products={selected}
          emptyTitle={kind === "saved" ? "Your wishlist is empty" : undefined}
          emptyDescription="Save a design with the heart button to find it here later."
        />
      )}
    </section>
  );
}
