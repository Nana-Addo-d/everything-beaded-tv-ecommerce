"use client";
import { useEffect, useRef, useState } from "react";
import { ProductImage } from "../catalog/product-image";
import { MERCHANT_CATEGORIES, type MerchantProduct } from "./domain";
import { merchantRequest, useMerchantAuth } from "./client";
export type Change = (
  action: string,
  target: string,
  revision: number,
  data: unknown,
) => Promise<void>;
const empty: MerchantProduct = {
  slug: "",
  title: "",
  category: "earrings",
  subcategory: "",
  description: "",
  materials: [],
  material_status: "visual",
  images: [],
  attributes: {},
  price_minor: null,
  stock_quantity: null,
  published: false,
  details_approved: false,
  revision: 0,
};
export function ProductEditor({
  product,
  onSave,
  onClose,
  onDirty,
}: {
  product: MerchantProduct | null;
  onSave: Change;
  onClose: () => void;
  onDirty: (dirty: boolean) => void;
}) {
  const client = useMerchantAuth(),
    initial = product ?? empty;
  const [draft, setDraft] = useState(initial),
    [materials, setMaterials] = useState(initial.materials.join(", ")),
    [colors, setColors] = useState(
      ((initial.attributes.colors as string[]) ?? []).join(", "),
    );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const baseline = useRef(JSON.stringify([initial, materials, colors]));
  useEffect(
    () =>
      onDirty(JSON.stringify([draft, materials, colors]) !== baseline.current),
    [draft, materials, colors, onDirty],
  );
  const attr = (key: string, value: string) =>
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [key]: value } }));
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const { path } = await merchantRequest<{ path: string }>(
          client,
          "upload",
          undefined,
          form,
        );
        setDraft((d) => ({ ...d, images: [...d.images, path].slice(0, 30) }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="merchant-panel">
      <div className="merchant-section-title">
        <div>
          <p className="merchant-eyebrow">
            {product ? "Product details" : "New product"}
          </p>
          <h2>{product?.title ?? "Create a draft"}</h2>
        </div>
        <button disabled={busy} onClick={onClose}>
          Back to products
        </button>
      </div>
      {error && (
        <p role="alert" className="merchant-error">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          void onSave(
            product ? "product.save" : "product.create",
            draft.slug,
            draft.revision,
            {
              ...draft,
              materials: materials
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              attributes: {
                ...draft.attributes,
                colors: colors
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            },
          )
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      >
        <div className="merchant-form-grid">
          <label>
            Product name
            <input
              required
              maxLength={180}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Product URL code
            <input
              required
              readOnly={!!product}
              maxLength={120}
              pattern="[a-z0-9][a-z0-9-]*"
              placeholder="blue-circle-earrings"
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {MERCHANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product type
            <input
              required
              maxLength={100}
              value={draft.subcategory}
              onChange={(e) =>
                setDraft({ ...draft, subcategory: e.target.value })
              }
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            rows={5}
            maxLength={6000}
            required={draft.published}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <div className="merchant-form-grid">
          <label>
            Materials / finish (comma separated)
            <input
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
            />
          </label>
          <label>
            Material information
            <select
              value={draft.material_status}
              onChange={(e) =>
                setDraft({ ...draft, material_status: e.target.value })
              }
            >
              <option value="visual">Described from photographs</option>
              <option value="confirmed">Confirmed by the merchant</option>
            </select>
          </label>
          <label>
            Colours (comma separated)
            <input value={colors} onChange={(e) => setColors(e.target.value)} />
          </label>
          {(
            [
              ["sizeLabel", "Size label"],
              ["dimensions", "Dimensions"],
              ["contents", "Included pieces / sale unit"],
              ["familySlug", "Related design code (optional)"],
              ["optionLabel", "Option label (optional)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                maxLength={key === "contents" ? 500 : 120}
                value={String(draft.attributes[key] ?? "")}
                onChange={(e) => attr(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <p className="merchant-muted">
          One stock quantity represents one complete sale unit. Related design
          codes link separate, confirmed size or style records; each keeps its
          own price and stock.
        </p>
        <fieldset>
          <legend>Product photographs</legend>
          <p className="merchant-muted">
            First photo is the cover. Upload original JPEG, PNG or WebP files,
            up to 8 MB each. Photos are stored as public product images.
          </p>
          <div className="merchant-photo-grid">
            {draft.images.map((src, index) => (
              <div key={src}>
                <ProductImage
                  src={src}
                  title={draft.title || "Product photograph"}
                />
                <div className="merchant-actions">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        images: [src, ...d.images.filter((p) => p !== src)],
                      }))
                    }
                  >
                    Make cover
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        images: d.images.filter((p) => p !== src),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label>
            Upload photographs
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy || draft.images.length >= 30}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </fieldset>
        <label className="merchant-check">
          <input
            type="checkbox"
            checked={draft.details_approved}
            onChange={(e) =>
              setDraft({ ...draft, details_approved: e.target.checked })
            }
          />
          <span>
            I confirm the product identity, size/style and included pieces are
            correct.
          </span>
        </label>
        <label className="merchant-check">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) =>
              setDraft({ ...draft, published: e.target.checked })
            }
          />
          <span>Show this product in the storefront</span>
        </label>
        <p className="merchant-muted">
          Published products also need a confirmed price, available stock and
          open store checkout before customers can purchase.
        </p>
        <button className="merchant-primary" disabled={busy}>
          {busy ? "Saving…" : "Save product"}
        </button>
      </form>
    </section>
  );
}
