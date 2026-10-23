import { getCatalog } from "@/features/catalog/catalog-server";
import { DiscoveryDirectory } from "@/features/catalog/discovery-directory";
export const metadata = { title: "Collections | Everything Beaded" };
export default async function CollectionsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Explore the collections</h1>
      <p className="text-muted-foreground">
        Different ways to discover the same collection, brought together by
        colour, texture and form.
      </p>
      <DiscoveryDirectory products={await getCatalog()} collections />
    </main>
  );
}
