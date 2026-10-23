"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@components/button";
import { useCart } from "../cart/cart-provider";
import { canOrder, type Product } from "../catalog/catalog";
import { money, type Customer, type Quote } from "./domain";
import type { DeliveryZone } from "../commerce/database";

type Props = {
  products: Product[];
  zones: DeliveryZone[];
  enabled: boolean;
  countryCode: string;
  testMode: boolean;
  selectedSlugs?: string[];
};
const inputClass = "block h-11 w-full rounded-md border bg-background px-3";
let lastAttempt: { fingerprint: string; key: string } | undefined;
async function attemptKey(payload: unknown) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const fingerprint = Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (lastAttempt?.fingerprint === fingerprint) return lastAttempt.key;
  try {
    const previous = JSON.parse(
      sessionStorage.getItem("eb-checkout-attempt") ?? "null",
    );
    if (
      previous?.fingerprint === fingerprint &&
      typeof previous.key === "string"
    )
      return previous.key as string;
    const key = crypto.randomUUID();
    lastAttempt = { fingerprint, key };
    sessionStorage.setItem("eb-checkout-attempt", JSON.stringify(lastAttempt));
    return key;
  } catch {
    if (lastAttempt?.fingerprint !== fingerprint)
      lastAttempt = { fingerprint, key: crypto.randomUUID() };
    return lastAttempt.key;
  }
}
export function CheckoutForm({
  products,
  zones,
  enabled,
  countryCode,
  testMode,
  selectedSlugs,
}: Props) {
  const { items: bagItems, ready } = useCart();
  const items = selectedSlugs
    ? bagItems.filter((item) => selectedSlugs.includes(item.slug))
    : bagItems;
  const [step, setStep] = useState<"details" | "review">("details");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [zone, setZone] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [orderId, setOrderId] = useState("");
  const [accepted, setAccepted] = useState(false);
  const signature = JSON.stringify(items);
  useEffect(() => {
    setQuote(null);
    setStep("details");
    setAccepted(false);
  }, [signature]);
  const unavailable = items.filter((item) => {
    const p = products.find((p) => p.slug === item.slug);
    return !p || !canOrder(p) || item.quantity > (p.stock ?? 0);
  });
  async function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    const value = (name: string) => String(fields.get(name) ?? "").trim();
    const details: Customer = {
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      address: {
        line1: value("line1"),
        line2: value("line2"),
        city: value("city"),
        region: value("region"),
        countryCode,
      },
    };
    setCustomer(details);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, zone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setQuote(data.quote);
      setStep("review");
      setAccepted(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate your total. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function pay() {
    if (!quote || !customer || !accepted || busy) return;
    setBusy(true);
    setError("");
    const payload = {
      items,
      zone,
      customer,
      expectedTotal: quote.totalMinor,
      acceptedPolicies: true,
    };
    try {
      const idempotencyKey = await attemptKey(payload);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey }),
      });
      const data = await response.json();
      if (data.orderId) setOrderId(data.orderId);
      if (!response.ok) {
        if (data.error === "PRICE_CHANGED") {
          setQuote(null);
          setStep("details");
        }
        throw new Error(data.message);
      }
      if (data.paymentUrl) window.location.assign(data.paymentUrl);
      else window.location.assign("/orders/" + data.orderId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect. Check your order status before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link href="/cart" className="text-sm underline">
        Back to your bag
      </Link>
      <h1 className="text-3xl font-semibold">Checkout</h1>
      {ready && items.length > 0 && (
        <details className="rounded-xl border p-4" open>
          <summary className="cursor-pointer text-sm font-medium">
            Your selected items (
            {items.reduce((n, item) => n + item.quantity, 0)})
          </summary>
          <ul className="mt-3 divide-y">
            {items.map((item) => {
              const product = products.find((p) => p.slug === item.slug);
              return (
                <li
                  key={item.slug}
                  className="flex justify-between gap-4 py-2 text-sm"
                >
                  <Link href={"/p/" + item.slug} className="underline">
                    {item.quantity} × {product?.title ?? item.slug}
                  </Link>
                  <span>
                    {product?.priceMinor != null
                      ? money(
                          product.priceMinor * item.quantity,
                          product.currency,
                        )
                      : "Price coming soon"}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      <ol
        aria-label="Checkout progress"
        className="flex flex-wrap gap-4 text-sm"
      >
        <li aria-current={step === "details" ? "step" : undefined}>
          1. Contact &amp; delivery
        </li>
        <li aria-current={step === "review" ? "step" : undefined}>2. Review</li>
        <li>3. Secure payment</li>
      </ol>
      {testMode && (
        <p role="status" className="rounded-lg border bg-muted p-4">
          Test payment mode. This checkout cannot take live payments.
        </p>
      )}
      {!ready ? (
        <p role="status">Loading your bag…</p>
      ) : !items.length ? (
        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">
            {selectedSlugs
              ? "No selected items remain in your bag"
              : "Your bag is empty"}
          </h2>
          <Link href="/shop" className="mt-3 inline-block underline">
            Browse the collection
          </Link>
        </div>
      ) : !enabled || unavailable.length > 0 ? (
        <section className="space-y-4 rounded-xl border p-6">
          <h2 className="text-lg font-semibold">
            {unavailable.length
              ? "Some items are not ready to order"
              : "Online ordering is not open yet"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Your bag is saved in this browser. Payment will become available
            once prices, stock, delivery and checkout are confirmed.
          </p>
          {unavailable.length > 0 && (
            <ul className="space-y-2 text-sm">
              {unavailable.map((item) => (
                <li key={item.slug}>
                  <Link href={"/p/" + item.slug} className="underline">
                    {products.find((p) => p.slug === item.slug)?.title ??
                      item.slug}
                  </Link>{" "}
                  — price, details or stock awaiting confirmation
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline">
            <Link href="/cart">Review your bag</Link>
          </Button>
        </section>
      ) : (
        <>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive p-4 text-sm"
            >
              {error}
            </p>
          )}
          {orderId && (
            <p className="rounded-lg border p-4 text-sm">
              Order reference created.{" "}
              <Link href={"/orders/" + orderId} className="underline">
                Open your order to check payment or continue.
              </Link>
            </p>
          )}
          <form
            onSubmit={review}
            className={
              step === "details"
                ? "grid gap-4 rounded-xl border p-5 sm:grid-cols-2"
                : "hidden"
            }
          >
            <h2 className="text-lg font-semibold sm:col-span-2">
              Contact &amp; delivery details
            </h2>
            <label className="text-sm">
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              Telephone
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                minLength={7}
                maxLength={30}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              Delivery area
              <select
                required
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a delivery area</option>
                {zones
                  .filter((z) => z.country_code === countryCode)
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Street address / digital address
              <input
                name="line1"
                autoComplete="address-line1"
                required
                minLength={4}
                maxLength={160}
                className={inputClass}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Apartment, landmark or directions (optional)
              <input
                name="line2"
                autoComplete="address-line2"
                maxLength={160}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              City / town
              <input
                name="city"
                autoComplete="address-level2"
                required
                minLength={2}
                maxLength={80}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              Region
              <input
                name="region"
                autoComplete="address-level1"
                required
                minLength={2}
                maxLength={80}
                className={inputClass}
              />
            </label>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Delivery country: {countryCode}. We use these details to process
              and deliver your order.
            </p>
            <Button disabled={busy} type="submit" className="sm:col-span-2">
              {busy ? "Calculating…" : "Review order total"}
            </Button>
          </form>
          {step === "review" && quote && customer && (
            <section className="space-y-5 rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Review your order</h2>
              <ul className="divide-y">
                {quote.items.map((item) => (
                  <li
                    key={item.slug}
                    className="flex justify-between gap-4 py-3 text-sm"
                  >
                    <span>
                      {item.quantity} × {item.title}
                    </span>
                    <span className="whitespace-nowrap">
                      {money(item.quantity * item.unitMinor, quote.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Items</dt>
                  <dd>{money(quote.subtotalMinor, quote.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery · {quote.zoneName}</dt>
                  <dd>{money(quote.deliveryMinor, quote.currency)}</dd>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-semibold">
                  <dt>Total</dt>
                  <dd>{money(quote.totalMinor, quote.currency)}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Prices include applicable taxes. The final total is checked
                again before payment.
              </p>
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                <p className="font-medium">{customer.name}</p>
                <p>
                  {customer.email} · {customer.phone}
                </p>
                <p>
                  {customer.address.line1}, {customer.address.line2}{" "}
                  {customer.address.city}, {customer.address.region}
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-current"
                />
                <span>
                  I have checked my order and agree to the{" "}
                  <Link href="/help" target="_blank" className="underline">
                    delivery, returns and privacy information
                  </Link>
                  .
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <Button disabled={busy || !accepted} onClick={pay}>
                  {busy
                    ? "Connecting to payment…"
                    : testMode
                      ? "Continue to test payment"
                      : "Continue to secure payment"}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setStep("details");
                    setAccepted(false);
                  }}
                >
                  Edit details
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You will complete payment on Paystack. Your order is confirmed
                only after the payment has been verified.
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
