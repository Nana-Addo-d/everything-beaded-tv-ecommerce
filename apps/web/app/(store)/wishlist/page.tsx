import { cardProducts } from "@/features/catalog/catalog";
import Link from "next/link";
import { getCatalog } from "@/features/catalog/catalog-server";
import { SavedDesigns } from "@/features/cart/saved-designs";
export const metadata = {
  title: "Wishlist | Everything Beaded",
  robots: { index: false, follow: false },
};
export default async function WishlistPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <Link href="/shop" className="text-sm underline">
        Continue browsing
      </Link>
      <h1 className="text-3xl font-semibold">Your wishlist</h1>
      <p className="text-sm text-muted-foreground">
        Keep the designs you love here. Saved items stay in this browser and do
        not reserve stock.
      </p>
      <SavedDesigns products={cardProducts(await getCatalog())} />
    </main>
  );
}
