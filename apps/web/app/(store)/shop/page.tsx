import Link from "next/link";
import { Button } from "@components/button";
import { CATEGORIES, filterProducts } from "@/features/catalog/catalog";
import { getCatalog } from "@/features/catalog/catalog-server";
import { ProductGrid } from "@/features/catalog/product-grid";
import {
  browseProducts,
  DEPARTMENTS,
  COLLECTIONS,
} from "@/features/catalog/discovery";

type Search = {
  q?: string;
  category?: string;
  sort?: string;
  type?: string;
  available?: string;
  page?: string;
  department?: string;
  collection?: string;
};
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const field = (key: keyof Search) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const query = field("q"),
    category = field("category"),
    sort = field("sort"),
    type = field("type"),
    available = field("available") === "yes",
    department = field("department"),
    collection = field("collection");
  const catalog = await getCatalog();
  const scoped = browseProducts(catalog, department, collection);
  const products = filterProducts(
    scoped,
    query,
    category,
    sort,
    type,
    available,
  );
  const types = [
    ...new Set(
      scoped
        .filter((p) => !category || p.category === category)
        .map((p) => p.subcategory),
    ),
  ].sort();
  const pages = Math.max(1, Math.ceil(products.length / 24));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(field("page"), 10) || 1),
  );
  const pageUrl = (next: number) => {
    const values = new URLSearchParams({
      q: query,
      category,
      sort,
      type,
      page: String(next),
      department,
      collection,
    });
    if (available) values.set("available", "yes");
    return "/shop?" + values.toString();
  };
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/" className="underline">
          Home
        </Link>{" "}
        / Shop
      </nav>
      <div>
        {(department || collection) && (
          <p className="mb-2 text-sm text-muted-foreground">
            {DEPARTMENTS.find((d) => d.slug === department)?.label ??
              COLLECTIONS.find((c) => c.slug === collection)?.label ??
              "Collection"}
          </p>
        )}
        <h1 className="text-3xl font-semibold">Shop the collection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Jewellery, bags, sandals and pieces for your home.
        </p>
      </div>
      <nav aria-label="Departments" className="flex flex-wrap gap-3 text-sm">
        {DEPARTMENTS.map((d) => (
          <Link
            key={d.slug}
            href={"/shop?department=" + d.slug}
            aria-current={department === d.slug ? "page" : undefined}
            className={`rounded-lg border px-4 py-3 ${department === d.slug ? "bg-primary text-primary-foreground" : ""}`}
          >
            {d.label}
          </Link>
        ))}
        <Link className="self-center underline" href="/categories">
          All product types
        </Link>
      </nav>
      <nav aria-label="Collections" className="flex flex-wrap gap-2">
        <Link href="/shop" className="rounded-full border px-4 py-2 text-sm">
          All collections
        </Link>
        {CATEGORIES.map((item) => (
          <Link
            key={item.slug}
            href={"/shop?category=" + item.slug}
            aria-current={category === item.slug ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm ${category === item.slug ? "bg-foreground text-background" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form
        action="/shop"
        className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4"
        key={[query, category, sort, type, available].join(":")}
      >
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="department" value={department} />
        <input type="hidden" name="collection" value={collection} />
        <label className="space-y-1 text-sm">
          Search products
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search design, colour or style"
            className="block h-10 w-full rounded-md border bg-background px-3"
          />
        </label>
        <label className="space-y-1 text-sm">
          Product type
          <select
            name="type"
            defaultValue={type}
            className="block h-10 w-full rounded-md border bg-background px-3"
          >
            <option value="">All product types</option>
            {types.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          Sort by
          <select
            name="sort"
            defaultValue={sort}
            className="block h-10 w-full rounded-md border bg-background px-3"
          >
            <option value="">Featured</option>
            <option value="name">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
            <option value="price">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
        <Button type="submit" className="self-end">
          Apply filters
        </Button>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            name="available"
            type="checkbox"
            value="yes"
            defaultChecked={available}
          />
          Available to order
        </label>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p role="status">
          {products.length} designs{query ? ` matching “${query}”` : ""} · Page{" "}
          {page} of {pages}
        </p>
        {(query ||
          category ||
          sort ||
          type ||
          available ||
          department ||
          collection) && (
          <Link href="/shop" className="underline">
            Clear filters
          </Link>
        )}
      </div>
      <ProductGrid products={products.slice((page - 1) * 24, page * 24)} />
      {pages > 1 && (
        <nav
          aria-label="Catalogue pages"
          className="flex items-center justify-between"
        >
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={pageUrl(page - 1)}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Button asChild variant="outline">
              <Link href={pageUrl(page + 1)}>Next</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
