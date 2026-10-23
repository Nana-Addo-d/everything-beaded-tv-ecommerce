import Link from "next/link";
import { Button } from "@components/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">This page is unavailable</h1>
      <p className="text-muted-foreground">
        The link may be out of date, or this product has not been published.
      </p>
      <Button asChild>
        <Link href="/shop">Browse the catalogue</Link>
      </Button>
    </main>
  );
}
