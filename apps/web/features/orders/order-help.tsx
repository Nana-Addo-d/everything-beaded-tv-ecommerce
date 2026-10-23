"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@components/button";
type RequestRow = {
  id: string;
  kind: string;
  message: string;
  status: string;
  reply: string;
  created_at: string;
};
const labels: Record<string, string> = {
  question: "Order or delivery question",
  cancellation: "Cancellation request",
  return: "Return request",
  damaged: "Damaged or incorrect item",
};
export function OrderHelp({ id }: { id: string }) {
  const [requests, setRequests] = useState<RequestRow[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/orders/${id}/requests`, {
        cache: "no-store",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setRequests(data.requests);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your requests.",
      );
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = JSON.stringify({
      kind: fields.get("kind"),
      message: fields.get("message"),
    });
    if (attempt.current?.payload !== payload)
      attempt.current = { payload, key: crypto.randomUUID() };
    try {
      const r = await fetch(`/api/orders/${id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...JSON.parse(payload),
          key: attempt.current.key,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      form.reset();
      attempt.current = null;
      setNotice("Your request is saved. The store's reply will appear below.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save your request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="space-y-4 rounded-xl border p-5"
      aria-label="Order support"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Need help with this order?</h2>
        <Button variant="ghost" onClick={() => void load()}>
          Refresh replies
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Ask about delivery or request a cancellation or return. Requests are
        reviewed by the store; submitting one does not cancel the order, approve
        a return or issue a refund.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          Request type
          <select
            name="kind"
            className="mt-1 block min-h-11 w-full rounded-md border bg-background px-3"
          >
            {Object.entries(labels).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Your message
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            className="mt-1 block w-full rounded-md border bg-background p-3"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Include the item and the help you need. Do not include payment
          passwords or card details.
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving request…" : "Send request to the store"}
        </Button>
      </form>
      {requests.length > 0 && (
        <ul className="space-y-3 border-t pt-4">
          {requests.map((r) => (
            <li
              key={r.id}
              className="space-y-2 rounded-lg bg-muted/35 p-4 text-sm"
            >
              <p className="font-medium">
                {labels[r.kind] ?? "Order request"} ·{" "}
                {r.status === "closed"
                  ? "Closed"
                  : r.status === "reviewing"
                    ? "Under review"
                    : "Submitted"}
              </p>
              <p className="whitespace-pre-wrap break-words">{r.message}</p>
              {r.reply && (
                <div className="border-l-2 pl-3">
                  <p className="font-medium">Store reply</p>
                  <p className="whitespace-pre-wrap break-words">{r.reply}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
