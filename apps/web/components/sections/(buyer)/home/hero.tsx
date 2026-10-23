import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@components/button";
import { getCatalog } from "@/features/catalog/catalog-server";
import { ProductImage } from "@/features/catalog/product-image";
import { DEPARTMENTS } from "@/features/catalog/discovery";
export async function BuyerHero() {
  const products = await getCatalog();
  const highlights = [
    "woven-baskets",
    "beaded-handbag",
    "gold-circle-earrings",
  ].flatMap((slug) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [product] : [];
  });
  return (
    <section
      aria-label="Collection highlights"
      className="grid items-center gap-8 rounded-3xl bg-muted/35 px-5 py-8 md:grid-cols-2 md:p-10"
    >
      <div className="space-y-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Everything Beaded &amp; Trading Ventures
        </p>
        <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
          Colour, craft &amp;
          <br />
          everyday favourites.
        </h1>
        <p className="max-w-md text-base leading-7 text-muted-foreground">
          Find a piece for your home, your table or your own sense of style.
          Explore the collection, one detail at a time.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11 rounded-full px-6">
            <Link href="/shop">
              Explore the shop <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/about">Meet Everything Beaded</Link>
          </Button>
        </div>
        <nav
          aria-label="Explore departments"
          className="flex flex-wrap gap-2 pt-3"
        >
          {DEPARTMENTS.map((d) => (
            <Link
              className="rounded-full border bg-background px-3 py-2 text-xs"
              key={d.slug}
              href={"/shop?department=" + d.slug}
            >
              {d.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="grid grid-cols-2 items-center gap-4">
        {highlights.map((p, i) => (
          <Link
            href={"/p/" + p.slug}
            key={p.slug}
            className={`min-w-0 rounded-2xl border bg-background p-3 shadow-sm ${i === 0 ? "row-span-2" : ""}`}
          >
            <ProductImage src={p.image} title={p.title} priority={i === 0} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{p.title}</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
