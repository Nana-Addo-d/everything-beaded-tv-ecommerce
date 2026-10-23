import { cardProducts } from "@/features/catalog/catalog";
import { BuyerHero } from "./home/hero";
import { BuyerFeaturedCollections } from "./home/featured-collections";
import { BuyerTrendingProducts } from "./home/trending-products";
import { SavedDesigns } from "@/features/cart/saved-designs";
import { getCatalog } from "@/features/catalog/catalog-server";

export default async function BuyerHomeSection() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <BuyerHero />
      <BuyerFeaturedCollections />
      <BuyerTrendingProducts />
      <SavedDesigns products={cardProducts(await getCatalog())} kind="recent" />
    </section>
  );
}
