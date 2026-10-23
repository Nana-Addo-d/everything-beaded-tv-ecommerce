"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@components/button";
import { money } from "./domain";
import { useCart } from "../cart/cart-provider";
import { OrderHelp } from "../orders/order-help";

type ViewOrder = {
  fulfillmentStatus: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  id: string;
  status: string;
  reference: string;
  currency: string;
  totalMinor: number;
  subtotalMinor: number;
  deliveryMinor: number;
  zoneName: string;
  events: { status: string; fulfillment_status: string; created_at: string }[];
  items: {
    slug: string;
    title: string;
    quantity: number;
    unit_minor: number;
    product_snapshot?: Record<string, string>;
  }[];
};
const labels: Record<string, string> = {
  pending: "Awaiting payment confirmation",
  paid: "Payment received",
  cancelled: "Payment window closed",
  payment_review: "Payment needs a review",
};
export function OrderStatus({ id }: { id: string }) {
  const [order, setOrder] = useState<ViewOrder | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { items, update, ready } = useCart(),
    cleared = useRef(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/orders/" + id, { cache: "no-store" }),
        data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setOrder(data.order);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load this order.",
      );
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (
      !order ||
      (order.status !== "pending" &&
        (order.status !== "paid" || order.fulfillmentStatus === "delivered"))
    )
      return;
    // Read persisted status; provider reconciliation is handled durably by the worker.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [order, load]);
  useEffect(() => {
    if (!ready || order?.status !== "paid" || cleared.current) return;
    const key = "eb-order-bag-cleared:" + order.id;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "true");
    } catch {
      return;
    }
    cleared.current = true;
    for (const line of order.items) {
      const current = items.find((item) => item.slug === line.slug);
      if (current)
        update(line.slug, Math.max(0, current.quantity - line.quantity));
    }
  }, [order, items, ready, update]);
  async function check(resume: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders/" + id, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (resume && data.paymentUrl) window.location.assign(data.paymentUrl);
      else await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The payment is still being checked.",
      );
    } finally {
      setBusy(false);
    }
  }
  const fulfillmentLabels: Record<string, string> = {
    unfulfilled: "Awaiting preparation",
    preparing: "Being prepared",
    dispatched: "Dispatched",
    delivered: "Delivered",
  };
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href="/shop" className="text-sm underline">
        Back to the store
      </Link>
      <Link href="/orders" className="ml-4 text-sm underline">
        All your orders
      </Link>
      <h1 className="text-3xl font-semibold">
        {order ? (labels[order.status] ?? "Order status") : "Your order"}
      </h1>
      {error && (
        <p role="alert" className="rounded-lg border p-4">
          {error}
        </p>
      )}
      {!order && !error && <p role="status">Loading your order…</p>}
      {order && (
        <>
          <p className="break-all text-sm">
            Reference: <strong>{order.reference}</strong>
          </p>
          <Button variant="outline" disabled={busy} onClick={() => void load()}>
            Refresh order updates
          </Button>
          <p className="text-sm text-muted-foreground">
            {order.status === "paid"
              ? "Your payment has been verified. The delivery status below shows the latest update from the store."
              : order.status === "cancelled"
                ? "The unpaid reservation has ended. Your bag has been kept so you can check current availability and start again."
                : order.status === "payment_review"
                  ? "We could not automatically match this payment to the order. Keep this reference and contact the store. Please do not make another payment."
                  : "Returning from payment does not confirm a purchase. We are checking the payment with the provider. Please avoid starting another order while this is pending."}
          </p>
          {order.status === "paid" && (
            <section className="space-y-2 rounded-xl border p-4 text-sm">
              <h2 className="font-semibold">
                Delivery status:{" "}
                {fulfillmentLabels[order.fulfillmentStatus] ?? "Being prepared"}
              </h2>
              {order.dispatchedAt && (
                <p>
                  Dispatched:{" "}
                  {new Date(order.dispatchedAt).toLocaleDateString()}
                </p>
              )}
              {order.deliveredAt && (
                <p>
                  Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                </p>
              )}
              {order.trackingNumber && (
                <p>Tracking reference: {order.trackingNumber}</p>
              )}
              {order.trackingUrl?.startsWith("https://") && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Track with the delivery provider
                </a>
              )}
            </section>
          )}
          <ul className="divide-y rounded-xl border px-4">
            {order.items.map((line) => (
              <li
                key={line.slug}
                className="flex justify-between gap-3 py-4 text-sm"
              >
                <span>
                  {line.quantity} × {line.title}
                </span>
                <span>
                  {money(line.quantity * line.unit_minor, order.currency)}
                </span>
              </li>
            ))}
          </ul>
          {order.items.some((line) =>
            Object.values(line.product_snapshot ?? {}).some(Boolean),
          ) && (
            <section className="space-y-3 rounded-xl border p-4">
              <h2 className="font-semibold">Your selected details</h2>
              {order.items.map((line) => (
                <div key={line.slug} className="text-sm">
                  <Link
                    href={"/p/" + line.slug}
                    className="font-medium underline"
                  >
                    {line.title}
                  </Link>
                  <p className="mt-1 text-muted-foreground">
                    {[
                      line.product_snapshot?.optionLabel,
                      line.product_snapshot?.sizeLabel,
                      line.product_snapshot?.dimensions,
                      line.product_snapshot?.contents,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </section>
          )}
          {!!order.events?.length && (
            <section className="space-y-3 rounded-xl border p-4">
              <h2 className="font-semibold">Order progress</h2>
              <ol className="space-y-3 border-l pl-4">
                {order.events.map((event, index) => (
                  <li key={index} className="text-sm">
                    <p>
                      {event.status === "paid"
                        ? (fulfillmentLabels[event.fulfillment_status] ??
                          "Payment received")
                        : (labels[event.status] ?? "Order received")}
                    </p>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={event.created_at}
                    >
                      {new Date(event.created_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <OrderHelp id={order.id} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Delivery · {order.zoneName}</dt>
              <dd>{money(order.deliveryMinor, order.currency)}</dd>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd>{money(order.totalMinor, order.currency)}</dd>
            </div>
          </dl>
          {order.status === "pending" && (
            <div className="flex flex-wrap gap-3">
              <Button disabled={busy} onClick={() => check(false)}>
                {busy ? "Checking…" : "Check payment status"}
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => check(true)}
              >
                Continue payment
              </Button>
            </div>
          )}
          {order.status === "cancelled" && (
            <Button asChild>
              <Link href="/cart">Return to your bag</Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            This order is available in the browser used at checkout. Save your
            order reference.
          </p>
        </>
      )}
    </main>
  );
}
