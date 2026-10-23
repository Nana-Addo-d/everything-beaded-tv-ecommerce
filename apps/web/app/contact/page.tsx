import Link from "next/link";
import { businessProfile as business } from "@/features/catalog/business-profile";
export const metadata = { title: "Contact & visit | Everything Beaded" };
export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <p className="text-sm text-muted-foreground">{business.location}</p>
        <h1 className="mt-2 text-3xl font-semibold">Contact &amp; visit</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Need a closer look at a design, a confirmed size or help choosing a
          piece? Get in touch with Everything Beaded.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="space-y-4 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Talk to the store</h2>
          <a
            className="block break-all underline"
            href={"mailto:" + business.email}
          >
            {business.email}
          </a>
          <div className="flex gap-4 text-sm">
            <a
              href={business.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Facebook
            </a>
            <a
              href={business.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Instagram
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Email opens your email app. Social links open the store&apos;s pages
            so you can send your message there.
          </p>
        </section>
        <section className="space-y-4 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Visit the shop</h2>
          <p>{business.shopAddress}</p>
          <a
            href={business.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block underline"
          >
            Open directions
          </a>
          <p className="text-sm text-muted-foreground">
            Contact the store to confirm opening times and the availability of a
            specific piece before travelling.
          </p>
        </section>
      </div>
      <section className="space-y-3 rounded-xl bg-muted/40 p-6">
        <h2 className="text-xl font-semibold">Help with an existing order</h2>
        <p className="text-sm leading-6">
          Open your order to view payment and delivery updates or send the store
          a request. If you are using a different browser, email the store with
          your order reference.
        </p>
        <Link href="/orders" className="inline-block underline">
          Open your orders
        </Link>
      </section>
    </main>
  );
}
