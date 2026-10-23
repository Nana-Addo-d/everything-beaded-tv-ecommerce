"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@components/button";
import { money } from "../checkout/domain";
type Summary = {
  id: string;
  reference: string;
  status: string;
  fulfillment_status: string;
  currency: string;
  total_minor: number;
  created_at: string;
};
export function OrderHistory() {
  const [orders, setOrders] = useState<Summary[]>([]),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [more, setMore] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    fetch(`/api/orders?page=${page}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message);
        if (active) {
          setOrders(data.orders);
          setMore(data.hasMore);
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load orders.");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [page, retry]);
  const labels: Record<string, string> = {
    pending: "Awaiting payment",
    paid: "Payment received",
    cancelled: "Payment window closed",
    payment_review: "Payment under review",
    preparing: "Being prepared",
    dispatched: "Dispatched",
    delivered: "Delivered",
  };
  return (
    <section className="space-y-5" aria-label="Order history">
      <p className="text-sm text-muted-foreground">
        Orders placed in this browser appear here. Keep your order reference for
        support. Clearing browser cookies removes this browser&apos;s access.
      </p>
      {busy ? (
        <p role="status">Loading orders…</p>
      ) : error ? (
        <div role="alert" className="space-y-3 rounded-xl border p-5">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : orders.length ? (
        <ul className="divide-y rounded-xl border px-5">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <Link
                  href={"/orders/" + order.id}
                  className="break-all font-semibold underline"
                >
                  {order.reference}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {labels[
                    order.status === "paid"
                      ? order.fulfillment_status
                      : order.status
                  ] ?? "Order received"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {money(order.total_minor, order.currency)}
                </p>
                <Link
                  href={"/orders/" + order.id}
                  className="mt-2 inline-block text-sm underline"
                >
                  View order &amp; get help
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3 rounded-xl border p-8">
          <h2 className="text-xl font-semibold">
            No orders in this browser yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Once you place an order, you can follow its payment and delivery
            updates here.
          </p>
          <Link href="/shop" className="inline-block underline">
            Explore the shop
          </Link>
        </div>
      )}
      {!busy && !error && (page > 1 || more) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            disabled={!more}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
