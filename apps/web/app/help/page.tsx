import Link from "next/link";
import { databaseConfigured } from "@/features/commerce/config";
import { storeSettings } from "@/features/commerce/database";
import { businessProfile } from "@/features/catalog/business-profile";

export default async function HelpPage() {
  const settings = databaseConfigured()
    ? (await storeSettings()).settings
    : null;
  const policies = [
    ["Delivery", settings?.delivery_policy],
    ["Returns", settings?.returns_policy],
    ["Privacy", settings?.privacy_policy],
    ["Terms of sale", settings?.terms_policy],
  ];
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-semibold">Shopping information</h1>
      <section className="space-y-2">
        <h2 className="font-semibold">Ordering from the collection</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Browse the collections, open a design to see its photographs, and add
          your selections to your bag. An item can be ordered once its price,
          details and stock are confirmed. You will see delivery costs and the
          total before continuing to payment.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Your bag and order</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Your bag is saved in this browser when storage is available. Adding an
          item does not reserve stock. Checkout uses your contact and delivery
          details without requiring a shopper account. Keep your order
          reference; the order-status page is available in the browser used at
          checkout.
        </p>
      </section>
      {policies.map(([label, value]) => (
        <section key={label} className="space-y-2">
          <h2 className="font-semibold">{label}</h2>
          <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {value ||
              "This information is being confirmed and will be published before online ordering opens."}
          </p>
        </section>
      ))}
      <section className="space-y-2">
        <h2 className="font-semibold">Contact the store</h2>
        <p className="text-sm text-muted-foreground">
          {settings?.support_contact || businessProfile.email}
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Order updates and requests</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Your orders are available in the browser used at checkout. Open an
          order to see its progress or request help with delivery, cancellation,
          a return or an incorrect item. The store reviews requests before
          confirming any action.
        </p>
        <Link href="/orders" className="inline-block text-sm underline">
          View your orders
        </Link>
      </section>
      <Link href="/shop" className="inline-block underline">
        Back to the collection
      </Link>
    </main>
  );
}
