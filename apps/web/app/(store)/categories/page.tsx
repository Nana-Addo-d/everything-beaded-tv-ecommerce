import { getCatalog } from "@/features/catalog/catalog-server";
import { DiscoveryDirectory } from "@/features/catalog/discovery-directory";
export const metadata = { title: "Categories | Everything Beaded" };
export default async function CategoriesPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Find your next piece</h1>
      <p className="text-muted-foreground">
        Explore by department, then narrow your search to a product type.
      </p>
      <DiscoveryDirectory products={await getCatalog()} />
    </main>
  );
}
