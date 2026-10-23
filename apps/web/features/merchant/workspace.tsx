"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  WalletCards,
  ShoppingBag,
  MessagesSquare,
  History,
  LayoutDashboard,
  ArrowUpRight,
} from "lucide-react";
import { ProductImage } from "../catalog/product-image";
import { money } from "../checkout/domain";
import {
  merchantRequest,
  MerchantRequestError,
  useMerchantAuth,
} from "./client";
import {
  MERCHANT_CATEGORIES,
  type MerchantProduct,
  type MerchantOrder,
  type MerchantRequest,
  type MerchantActivity,
} from "./domain";
import { ProductEditor, type Change } from "./product-editor";
import { SalesEditor } from "./sales-editor";
import { OrderEditor, RequestEditor } from "./order-editor";
const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "sales", label: "Prices & stock", icon: WalletCards },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "requests", label: "Customer requests", icon: MessagesSquare },
  { id: "activity", label: "Activity", icon: History },
];
type Row = MerchantProduct | MerchantOrder | MerchantRequest | MerchantActivity;
type Summary = {
  products: number;
  unpriced: number;
  unknownStock: number;
  ordersToPrepare: number;
  openRequests: number;
  orderingEnabled: boolean;
  currency: string;
};
export function MerchantWorkspace() {
  const client = useMerchantAuth(),
    router = useRouter();
  const [ready, setReady] = useState(false),
    [email, setEmail] = useState(""),
    [section, setSection] = useState("overview"),
    [rows, setRows] = useState<Row[]>([]),
    [summary, setSummary] = useState<Summary | null>(null);
  const [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [query, setQuery] = useState(""),
    [q, setQ] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState("");
  const [selected, setSelected] = useState<
      MerchantProduct | MerchantOrder | "new" | null
    >(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [locked, setLocked] = useState(false),
    [editorDirty, setEditorDirty] = useState(false),
    [salesDirty, setSalesDirty] = useState<string[]>([]);
  const pending = useRef(new Map<string, { payload: string; key: string }>()),
    generation = useRef(0);
  const dirty = editorDirty || salesDirty.length > 0;
  const [resetEditors, setResetEditors] = useState(0);
  const handleError = useCallback(
    (e: unknown) => {
      setError(
        e instanceof Error ? e.message : "The store connection is unavailable.",
      );
      if (e instanceof MerchantRequestError) {
        if (e.code === "MERCHANT_MFA") setLocked(true);
        if (e.status === 401 || e.code === "MERCHANT_FORBIDDEN") {
          setReady(false);
          setRows([]);
          setSelected(null);
          router.replace("/admin/sign-in");
        }
      }
    },
    [router],
  );
  useEffect(() => {
    let mounted = true;
    void merchantRequest<{ email: string; mfa: boolean }>(client, "session")
      .then((data) => {
        if (!data.mfa) {
          router.replace("/admin/sign-in");
          return;
        }
        if (mounted) {
          setEmail(data.email);
          setReady(true);
        }
      })
      .catch(handleError);
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        generation.current++;
        setReady(false);
        setRows([]);
        setSelected(null);
        router.replace("/admin/sign-in");
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client, router, handleError]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        q,
        category,
        status,
      });
      const data =
        section === "overview"
          ? await merchantRequest<Summary>(client, "overview")
          : await merchantRequest<{ rows: Row[]; hasMore: boolean }>(
              client,
              `${section === "sales" ? "products" : section}?${params}`,
            );
      if (ticket !== generation.current) return;
      if ("rows" in data) {
        setRows(data.rows);
        setMore(data.hasMore);
      } else setSummary(data);
      setLocked(false);
    } catch (e) {
      if (ticket === generation.current) handleError(e);
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, [client, section, page, q, category, status, handleError]);
  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);
  const markSalesDirty = useCallback(
    (id: string, value: boolean) =>
      setSalesDirty((current) =>
        value
          ? current.includes(id)
            ? current
            : [...current, id]
          : current.filter((s) => s !== id),
      ),
    [],
  );
  function leave() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return false;
    if (dirty) setResetEditors((value) => value + 1);
    setEditorDirty(false);
    setSalesDirty([]);
    setSelected(null);
    return true;
  }
  function navigate(id: string) {
    if (!leave()) return;
    setSection(id);
    setPage(1);
    setQ("");
    setQuery("");
    setStatus("");
    setCategory("");
    setNotice("");
    setRows([]);
  }
  const save: Change = async (action, target, revision, data) => {
    const payload = JSON.stringify({ action, target, revision, data }),
      previous = pending.current.get(target);
    const operation =
      previous?.payload === payload
        ? previous
        : { payload, key: crypto.randomUUID() };
    pending.current.set(target, operation);
    try {
      await merchantRequest(client, "changes", {
        action,
        target,
        revision,
        data,
        key: operation.key,
      });
      pending.current.delete(target);
      setNotice(
        "Saved. The storefront and customer order pages will read the updated record.",
      );
      setLocked(false);
      if (section === "sales" || section === "requests") {
        markSalesDirty(target, false);
        const current = await merchantRequest<{ rows: Row[] }>(
          client,
          (section === "sales" ? "products?id=" : "requests?request=") +
            encodeURIComponent(target),
        );
        setRows((rows) =>
          rows.map((row) =>
            ("slug" in row ? row.slug === target : row.id === target)
              ? (current.rows[0] ?? row)
              : row,
          ),
        );
      } else {
        setEditorDirty(false);
        setSelected(null);
        await load();
      }
    } catch (e) {
      handleError(e);
      throw e;
    }
  };
  if (!ready)
    return (
      <main className="merchant-login">
        <h1>Merchant workspace</h1>
        <p role="status">{error || "Checking your store access…"}</p>
        <Link href="/admin/sign-in">Go to sign-in</Link>
      </main>
    );
  return (
    <div className="merchant-shell">
      <aside className="merchant-sidebar">
        <Link href="/admin" className="merchant-brand">
          Everything
          <br />
          Beaded<span>Merchant workspace</span>
        </Link>
        <nav aria-label="Merchant sections">
          {sections.map((s) => (
            <button
              key={s.id}
              aria-current={section === s.id ? "page" : undefined}
              onClick={() => navigate(s.id)}
            >
              <s.icon size={19} />
              {s.label}
              {s.id === "requests" && !!summary?.openRequests && (
                <span>{summary.openRequests}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="merchant-sidebar-bottom">
          <Link href="/" target="_blank">
            View storefront <ArrowUpRight size={16} />
          </Link>
          <p>{email}</p>
          <button
            onClick={() => {
              if (!leave()) return;
              void client.auth
                .signOut()
                .then(({ error }) => {
                  if (error) throw error;
                  router.replace("/admin/sign-in");
                })
                .catch(handleError);
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="merchant-main">
        <header className="merchant-page-heading">
          <div>
            <p className="merchant-eyebrow">
              Everything Beaded & Trading Ventures
            </p>
            <h1>{sections.find((s) => s.id === section)?.label}</h1>
            <p className="merchant-muted">
              {section === "overview"
                ? "Your catalogue and customer work, in one place."
                : section === "products"
                  ? "Review photographs, product details and storefront visibility."
                  : section === "sales"
                    ? "Set real prices and record available stock with a reason."
                    : section === "orders"
                      ? "Review verified payment and record dispatch or delivery."
                      : section === "requests"
                        ? "Read customer questions and keep their order page up to date."
                        : "A record of merchant changes to the store."}
            </p>
          </div>
          <div className="merchant-actions">
            <button
              disabled={busy}
              onClick={() => {
                if (leave()) void load();
              }}
            >
              Refresh
            </button>
            {section === "products" && (
              <button
                className="merchant-primary"
                onClick={() => {
                  if (leave()) setSelected("new");
                }}
              >
                New product
              </button>
            )}
          </div>
        </header>
        {locked && (
          <p className="merchant-notice" role="status">
            Your authenticator verification has expired.{" "}
            <Link href="/admin/sign-in" target="_blank" className="underline">
              Verify in a new tab
            </Link>
            , then return and retry. Your unsaved entries remain here.
          </p>
        )}
        {error && (
          <p role="alert" className="merchant-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="merchant-notice">
            {notice}
          </p>
        )}
        {section === "overview" && summary && (
          <>
            <section className="merchant-metrics">
              {[
                {
                  label: "Catalogue products",
                  count: summary.products,
                  tab: "products",
                },
                {
                  label: "Need a price",
                  count: summary.unpriced,
                  tab: "sales",
                },
                {
                  label: "Need opening stock",
                  count: summary.unknownStock,
                  tab: "sales",
                },
                {
                  label: "Orders to dispatch",
                  count: summary.ordersToPrepare,
                  tab: "orders",
                },
                {
                  label: "Open customer requests",
                  count: summary.openRequests,
                  tab: "requests",
                },
              ].map((card) => (
                <button key={card.label} onClick={() => navigate(card.tab)}>
                  <span>{card.label}</span>
                  <strong>{card.count}</strong>
                  <span>Open section →</span>
                </button>
              ))}
            </section>
            <section className="merchant-panel">
              <h2>
                {summary.orderingEnabled
                  ? "Store ordering is enabled"
                  : "Store ordering is currently closed"}
              </h2>
              <p>
                Prepare your product descriptions, confirmed sale units,{" "}
                {summary.currency} prices and available quantities here. Opening
                checkout also requires approved delivery and store policies and
                a tested payment connection.
              </p>
              <div className="merchant-actions">
                <button onClick={() => navigate("products")}>
                  Review products
                </button>
                <button onClick={() => navigate("sales")}>
                  Set prices & stock
                </button>
              </div>
            </section>
            <section className="merchant-panel">
              <h2>How changes reach customers</h2>
              <p>
                Saved product changes are read by the storefront. Published
                products with missing price, stock or confirmed details remain
                available to browse. Replies appear on the customer’s private
                order page; a reply does not send an email or issue a refund.
              </p>
            </section>
          </>
        )}
        {selected &&
          (section === "products" ? (
            <ProductEditor
              key={
                selected === "new" ? "new" : (selected as MerchantProduct).slug
              }
              product={
                selected === "new" ? null : (selected as MerchantProduct)
              }
              onSave={save}
              onClose={() => {
                leave();
              }}
              onDirty={setEditorDirty}
            />
          ) : (
            <OrderEditor
              key={(selected as MerchantOrder).id}
              order={selected as MerchantOrder}
              onSave={save}
              onClose={() => {
                leave();
              }}
              onDirty={setEditorDirty}
            />
          ))}
        {section !== "overview" && !selected && (
          <>
            <form
              className="merchant-toolbar"
              onSubmit={(e) => {
                e.preventDefault();
                if (leave()) {
                  setQ(query);
                  setPage(1);
                }
              }}
            >
              {["products", "sales", "orders"].includes(section) && (
                <label>
                  {section === "orders" ? "Order reference" : "Find a product"}
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      section === "orders" ? "EB-…" : "Name or product URL code"
                    }
                  />
                </label>
              )}
              {["products", "sales"].includes(section) && (
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(e) => {
                      if (leave()) {
                        setCategory(e.target.value);
                        setPage(1);
                      }
                    }}
                  >
                    <option value="">All categories</option>
                    {MERCHANT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {section !== "activity" && (
                <label>
                  Status
                  <select
                    value={status}
                    onChange={(e) => {
                      if (leave()) {
                        setStatus(e.target.value);
                        setPage(1);
                      }
                    }}
                  >
                    <option value="">All statuses</option>
                    {(section === "orders"
                      ? ["pending", "paid", "cancelled", "payment_review"]
                      : section === "requests"
                        ? ["submitted", "reviewing", "closed"]
                        : ["published", "draft", "unpriced", "unknown-stock"]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll(/[_-]/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {["products", "sales", "orders"].includes(section) && (
                <button disabled={busy}>Search</button>
              )}
            </form>
            {busy && <p role="status">Loading records…</p>}
            {!busy && rows.length === 0 && (
              <div className="merchant-panel merchant-empty">
                <h2>No records to show</h2>
                <p>
                  {section === "orders"
                    ? "Orders appear here when customers place them."
                    : section === "requests"
                      ? "Customer order requests will appear here."
                      : "Try changing the search or filters."}
                </p>
              </div>
            )}
            {section === "products" && (
              <div className="merchant-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Visibility</th>
                      <th>Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as MerchantProduct[]).map((p) => (
                      <tr key={p.slug}>
                        <td>
                          <div className="merchant-product-heading">
                            <div className="merchant-thumb">
                              <ProductImage src={p.images[0]} title={p.title} />
                            </div>
                            <div>
                              <strong>{p.title}</strong>
                              <small>{p.slug}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {p.subcategory}
                          <small>{p.category}</small>
                        </td>
                        <td>
                          <span className="merchant-badge">
                            {p.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td>
                          {p.details_approved ? "Confirmed" : "Needs review"}
                        </td>
                        <td>
                          <button onClick={() => setSelected(p)}>
                            Edit product
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section === "sales" &&
              (rows as MerchantProduct[]).map((p) => (
                <SalesEditor
                  key={p.slug + ":" + resetEditors}
                  product={p}
                  currency={summary?.currency ?? "GHS"}
                  onSave={save}
                  onDirty={markSalesDirty}
                />
              ))}
            {section === "orders" && (
              <div className="merchant-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Payment</th>
                      <th>Fulfilment</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as MerchantOrder[]).map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.reference}</strong>
                          <small>
                            {new Date(o.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>{o.customer_name}</td>
                        <td>{o.status.replaceAll("_", " ")}</td>
                        <td>{o.fulfillment_status}</td>
                        <td>{money(o.total_minor, o.currency)}</td>
                        <td>
                          <button onClick={() => setSelected(o)}>
                            Open order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section === "requests" &&
              (rows as MerchantRequest[]).map((r) => (
                <RequestEditor
                  key={r.id + ":" + r.revision + ":" + resetEditors}
                  request={r}
                  onSave={save}
                  onDirty={markSalesDirty}
                />
              ))}
            {section === "activity" && (
              <div className="merchant-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Change</th>
                      <th>Record</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as MerchantActivity[]).map((a) => (
                      <tr key={a.id}>
                        <td>{new Date(a.created_at).toLocaleString()}</td>
                        <td>{a.action.replaceAll(".", " ")}</td>
                        <td className="merchant-break">{a.target}</td>
                        <td>
                          {Object.entries(a.details).map(([k, v]) => (
                            <small key={k}>
                              {k}: {String(v ?? "not recorded")}
                            </small>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <nav
              className="merchant-pagination"
              aria-label="Merchant records pagination"
            >
              <button
                disabled={busy || page === 1}
                onClick={() => {
                  if (leave()) setPage((p) => p - 1);
                }}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={busy || !more}
                onClick={() => {
                  if (leave()) setPage((p) => p + 1);
                }}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
