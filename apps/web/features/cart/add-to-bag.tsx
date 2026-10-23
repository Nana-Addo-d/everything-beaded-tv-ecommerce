"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@components/button";
import { useCart } from "./cart-provider";
import { MAX_QUANTITY } from "./cart-state";
export function AddToBag({
  slug,
  stock = null,
  chooseQuantity = false,
}: {
  slug: string;
  stock?: number | null;
  chooseQuantity?: boolean;
}) {
  const { add, items, ready } = useCart();
  const [amount, setAmount] = useState(1),
    [message, setMessage] = useState("");
  const quantity = items.find((item) => item.slug === slug)?.quantity ?? 0;
  const limit = Math.min(MAX_QUANTITY, stock ?? MAX_QUANTITY);
  const remaining = Math.max(0, limit - quantity);
  return (
    <div className="space-y-2">
      {chooseQuantity && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Quantity</span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Decrease quantity"
              disabled={amount <= 1}
              onClick={() => setAmount(amount - 1)}
            >
              −
            </Button>
            <output
              aria-label="Quantity to add"
              className="min-w-6 text-center"
            >
              {amount}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Increase quantity"
              disabled={amount >= remaining}
              onClick={() => setAmount(amount + 1)}
            >
              +
            </Button>
          </div>
        </div>
      )}
      <Button
        className="h-auto min-h-11 w-full whitespace-normal px-3 text-sm"
        disabled={!ready || remaining === 0 || amount > remaining}
        onClick={() =>
          setMessage(
            add(slug, amount, limit)
              ? `${amount} added to your bag.`
              : "The quantity could not be added. Check your bag and try again.",
          )
        }
      >
        {stock === 0
          ? "Out of stock"
          : remaining === 0
            ? "Bag quantity limit reached"
            : "Add to bag"}
      </Button>
      {chooseQuantity && quantity > 0 && (
        <p className="text-xs text-muted-foreground">
          {quantity} already in your bag.
          {amount > remaining &&
            " Reduce the quantity to fit the available amount."}
        </p>
      )}
      <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {message && (
          <>
            {message}{" "}
            <Link href="/cart" className="underline">
              View bag
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
