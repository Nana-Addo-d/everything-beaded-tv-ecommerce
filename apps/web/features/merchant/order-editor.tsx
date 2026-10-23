"use client";
import { useState } from "react";
import type { MerchantOrder, MerchantRequest } from "./domain";
import type { Change } from "./product-editor";
import { money } from "../checkout/domain";
export function OrderEditor({
  order,
  onSave,
  onClose,
  onDirty,
}: {
  order: MerchantOrder;
  onSave: Change;
  onClose: () => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="merchant-panel">
      <div className="merchant-section-title">
        <h2>{order.reference}</h2>
        <button disabled={busy} onClick={onClose}>
          Back to orders
        </button>
      </div>
      <div className="merchant-actions">
        <span className="merchant-badge">
          {order.status.replaceAll("_", " ")}
        </span>
        <span className="merchant-badge">{order.fulfillment_status}</span>
      </div>
      <div className="merchant-form-grid">
        <div>
          <h3>Customer & delivery</h3>
          <p>{order.customer_name}</p>
          <p>{order.email}</p>
          <p>{order.phone}</p>
          <p>{Object.values(order.address).filter(Boolean).join(", ")}</p>
          <p>{order.zone_name}</p>
        </div>
        <div>
          <h3>Order total</h3>
          <p className="merchant-stat">
            {money(order.total_minor, order.currency)}
          </p>
          <p>{new Date(order.created_at).toLocaleString()}</p>
          {order.tracking_number && <p>Tracking: {order.tracking_number}</p>}
        </div>
      </div>
      <ul className="merchant-lines">
        {order.order_items.map((line) => (
          <li key={line.slug}>
            <div>
              <strong>
                {line.quantity} × {line.title}
              </strong>
              <p className="merchant-muted">
                {[
                  line.product_snapshot?.sizeLabel,
                  line.product_snapshot?.dimensions,
                  line.product_snapshot?.contents,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span>
              {money(line.unit_minor * line.quantity, order.currency)}
            </span>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="merchant-error">
          {error}
        </p>
      )}
      {order.status === "paid" &&
      ["preparing", "dispatched"].includes(order.fulfillment_status) ? (
        <form
          onChange={() => onDirty(true)}
          onSubmit={(e) => {
            e.preventDefault();
            const fields = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            void onSave("order.fulfill", order.id, order.revision, {
              status:
                order.fulfillment_status === "preparing"
                  ? "dispatched"
                  : "delivered",
              tracking_number: fields.get("reference") ?? "",
              tracking_url: fields.get("tracking") ?? "",
            })
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          <h3>
            {order.fulfillment_status === "preparing"
              ? "Record dispatch"
              : "Confirm delivery"}
          </h3>
          {order.fulfillment_status === "preparing" && (
            <>
              <label>
                Tracking / dispatch reference
                <input
                  name="reference"
                  required
                  minLength={2}
                  maxLength={150}
                />
              </label>
              <label>
                Tracking link (optional)
                <input
                  name="tracking"
                  type="url"
                  placeholder="https://…"
                  maxLength={1000}
                />
              </label>
            </>
          )}
          <label className="merchant-check">
            <input required type="checkbox" />
            <span>
              {order.fulfillment_status === "preparing"
                ? "The goods have been handed over and I have reviewed any customer requests."
                : "I have confirmed that the customer received this order."}
            </span>
          </label>
          <button className="merchant-primary" disabled={busy}>
            {busy
              ? "Saving…"
              : order.fulfillment_status === "preparing"
                ? "Mark dispatched"
                : "Mark delivered"}
          </button>
        </form>
      ) : (
        <p className="merchant-muted">
          {order.status !== "paid"
            ? "Fulfilment is available only after verified payment. Payment status cannot be manually changed here."
            : "This order has completed fulfilment."}
        </p>
      )}
    </section>
  );
}
export function RequestEditor({
  request,
  onSave,
  onDirty,
}: {
  request: MerchantRequest;
  onSave: Change;
  onDirty: (id: string, dirty: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <article className="merchant-panel">
      <div className="merchant-section-title">
        <h3>{request.orders.reference}</h3>
        <span className="merchant-badge">{request.status}</span>
      </div>
      <p>
        <strong>{request.kind.replaceAll("_", " ")}</strong> ·{" "}
        {new Date(request.created_at).toLocaleString()}
      </p>
      <p className="merchant-message">{request.message}</p>
      {request.reply && (
        <div className="merchant-reply">
          <strong>Store reply</strong>
          <p className="merchant-message">{request.reply}</p>
        </div>
      )}
      {error && (
        <p role="alert" className="merchant-error">
          {error}
        </p>
      )}
      {request.status !== "closed" && (
        <form
          onChange={() => onDirty(request.id, true)}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            void onSave("request.reply", request.id, request.revision, {
              status: f.get("status"),
              reply: f.get("reply"),
            })
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          <label>
            Reply to the customer
            <textarea
              name="reply"
              required
              minLength={3}
              maxLength={4000}
              rows={3}
              defaultValue={request.reply}
            />
          </label>
          <label>
            Request status
            <select name="status" defaultValue="reviewing">
              <option value="reviewing">Under review</option>
              <option value="closed">Resolved / closed</option>
            </select>
          </label>
          <p className="merchant-muted">
            The reply appears on the customer’s order page. Closing a request
            does not issue a refund, cancel payment or restock items.
          </p>
          <button disabled={busy}>Save reply & status</button>
        </form>
      )}
    </article>
  );
}
