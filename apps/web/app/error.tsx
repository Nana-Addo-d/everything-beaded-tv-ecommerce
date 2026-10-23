"use client";
import Link from "next/link";
import { Button } from "@components/button";
export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">
        The store is temporarily unavailable
      </h1>
      <p>
        We could not load the latest catalogue information. Your bag is kept in
        this browser.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="self-center underline">
          Return home
        </Link>
      </div>
    </main>
  );
}
