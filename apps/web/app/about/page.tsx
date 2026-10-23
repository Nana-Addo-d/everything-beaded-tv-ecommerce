import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <h1 className="text-2xl font-semibold">
        Everything Beaded &amp; Trading Ventures
      </h1>
      <p className="text-muted-foreground">
        Welcome to the Everything Beaded storefront. Our catalogue brings the
        collection together in one place.
      </p>
      <p className="text-sm text-muted-foreground">
        Discover beadwork, woven textures and decorative designs across our
        jewellery, bags, sandals and home collections. Each listing shows
        photographs from the collection and its current ordering availability.
      </p>
      <Link href="/shop" className="inline-block underline">
        Explore the catalogue
      </Link>
    </main>
  );
}
