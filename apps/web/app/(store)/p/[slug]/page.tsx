import { cardProducts } from "@/features/catalog/catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, availability } from "@/features/catalog/catalog";
import { getCatalog } from "@/features/catalog/catalog-server";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ProductGrid } from "@/features/catalog/product-grid";
import { AddToBag } from "@/features/cart/add-to-bag";
import { money } from "@/features/checkout/domain";
import {
  SaveDesign,
  RecordProductView,
  SavedDesigns,
} from "@/features/cart/saved-designs";
import { businessProfile } from "@/features/catalog/business-profile";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    products = await getCatalog();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();
  const category = CATEGORIES.find((entry) => entry.slug === product.category);
  const options = product.familySlug
    ? products.filter(
        (p) => p.familySlug === product.familySlug && p.optionLabel,
      )
    : [];
  const related = products
    .filter((p) => p.slug !== slug && p.subcategory === product.subcategory)
    .slice(0, 4);
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <RecordProductView slug={slug} />
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="underline">
          Home
        </Link>
        <span>/</span>
        <Link href={"/shop?category=" + product.category} className="underline">
          {category?.label}
        </Link>
        <span>/</span>
        <span>{product.title}</span>
      </nav>
      <div className="grid items-start gap-8 md:grid-cols-2">
        <ProductGallery
          key={slug}
          images={product.images}
          title={product.title}
        />
        <section className="space-y-5">
          <p className="text-sm text-muted-foreground">{product.subcategory}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {product.title}
          </h1>
          <p className="text-xl font-medium">
            {product.priceMinor === null
              ? "Price coming soon"
              : money(product.priceMinor, product.currency)}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {product.description}
          </p>
          <dl className="divide-y rounded-xl border px-4 text-sm">
            <div className="flex justify-between gap-3 py-3">
              <dt>Availability</dt>
              <dd>{availability(product)}</dd>
            </div>
            {product.colors.length > 0 && (
              <div className="flex justify-between gap-3 py-3">
                <dt>Colours shown</dt>
                <dd>{product.colors.join(", ")}</dd>
              </div>
            )}
            <div className="space-y-2 py-3">
              <dt className="font-medium">Materials &amp; finish</dt>
              <dd>{product.materials.join(" · ")}</dd>
              {product.materialStatus !== "confirmed" && (
                <dd className="text-xs text-muted-foreground">
                  Described from the photographs. Exact composition is awaiting
                  confirmation.
                </dd>
              )}
            </div>
            <div className="flex justify-between gap-3 py-3">
              <dt>Dimensions / sizes</dt>
              <dd>
                {[product.sizeLabel, product.dimensions]
                  .filter(Boolean)
                  .join(" · ") || "Awaiting confirmation"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-3">
              <dt>Included pieces</dt>
              <dd>{product.contents || "Awaiting confirmation"}</dd>
            </div>
            <div className="py-3">
              <dt className="font-medium">Delivery</dt>
              <dd className="mt-1">
                Available areas and charges are shown before payment.
              </dd>
            </div>
          </dl>
          {options.length > 1 && (
            <nav aria-label="Available product options" className="space-y-2">
              <h2 className="text-sm font-medium">Choose a size or style</h2>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <Link
                    key={option.slug}
                    href={"/p/" + option.slug}
                    aria-current={option.slug === slug ? "page" : undefined}
                    className={`rounded-md border px-3 py-2 text-sm ${option.slug === slug ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {option.optionLabel}
                    {option.stock === 0 ? " · Out of stock" : ""}
                  </Link>
                ))}
              </div>
            </nav>
          )}
          <AddToBag
            key={slug}
            slug={product.slug}
            stock={product.stock}
            chooseQuantity
          />
          <SaveDesign slug={product.slug} title={product.title} />
          <a
            href={`mailto:${businessProfile.email}?subject=${encodeURIComponent("Product enquiry: " + product.title + " (" + product.slug + ")")}`}
            className="ml-3 inline-block py-2 text-sm underline"
          >
            Ask about this design
          </a>
          {!product.detailsApproved && (
            <p className="text-xs text-muted-foreground">
              You can save this design in your bag. Ordering opens once its
              details, price and stock are confirmed.
            </p>
          )}
          <Link href="/cart" className="inline-block text-sm underline">
            View your bag
          </Link>
        </section>
      </div>
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">More in this collection</h2>
          <ProductGrid products={related} />
        </section>
      )}
      <SavedDesigns
        products={cardProducts(products)}
        kind="recent"
        exclude={slug}
      />
    </main>
  );
}
