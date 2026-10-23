"use client";
import { useEffect, useState } from "react";
import type { MerchantProduct } from "./domain";
import type { Change } from "./product-editor";
import { ProductImage } from "../catalog/product-image";
export function SalesEditor({
  product,
  currency,
  onSave,
  onDirty,
}: {
  product: MerchantProduct;
  currency: string;
  onSave: Change;
  onDirty: (id: string, dirty: boolean) => void;
}) {
  const initial =
    product.price_minor === null ? "" : (product.price_minor / 100).toFixed(2);
  const [price, setPrice] = useState(initial),
    [quantity, setQuantity] = useState(""),
    [direction, setDirection] = useState("add"),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => setPrice(initial), [initial]);
  useEffect(
    () =>
      onDirty(
        product.slug,
        price !== initial || quantity !== "" || reason !== "",
      ),
    [product.slug, price, initial, quantity, reason, onDirty],
  );
  async function act(action: string, data: unknown) {
    setBusy(true);
    setError("");
    try {
      await onSave(action, product.slug, product.revision, data);
      if (action === "stock.adjust") {
        setQuantity("");
        setReason("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="merchant-panel merchant-sales-row">
      <div className="merchant-product-heading">
        <div className="merchant-thumb">
          <ProductImage src={product.images[0]} title={product.title} />
        </div>
        <div>
          <h3>{product.title}</h3>
          <p className="merchant-muted">{product.slug}</p>
          <p>
            Available:{" "}
            <strong>{product.stock_quantity ?? "Not recorded"}</strong>
          </p>
        </div>
      </div>
      {error && (
        <p className="merchant-error" role="alert">
          {error}
        </p>
      )}
      <div className="merchant-form-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act("price.save", { price });
          }}
        >
          <label>
            Price ({currency})
            <input
              inputMode="decimal"
              placeholder="Not priced"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <button disabled={busy || price === initial}>Save price</button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act("stock.adjust", {
              mode: product.stock_quantity === null ? "initial" : "adjust",
              quantity:
                Number(quantity) *
                (product.stock_quantity !== null && direction === "remove"
                  ? -1
                  : 1),
              reason,
            });
          }}
        >
          {product.stock_quantity !== null && (
            <label>
              Stock change
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <option value="add">Add available stock</option>
                <option value="remove">Remove available stock</option>
              </select>
            </label>
          )}
          <label>
            {product.stock_quantity === null
              ? "Opening available quantity"
              : "Adjustment quantity"}
            <input
              type="number"
              inputMode="numeric"
              min={product.stock_quantity === null ? 0 : 1}
              max={1000000}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label>
            Reason
            <input
              minLength={5}
              maxLength={500}
              placeholder="Opening count, restock, damage…"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button disabled={busy || !quantity || reason.trim().length < 5}>
            {product.stock_quantity === null
              ? "Record opening stock"
              : "Apply adjustment"}
          </button>
        </form>
      </div>
      <p className="merchant-muted">
        Available stock excludes existing reservations. Count complete sale
        units. Adjustments are recorded in Activity.
      </p>
    </article>
  );
}
