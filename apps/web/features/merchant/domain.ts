import { CommerceError, record, text } from "../checkout/domain";

export const MERCHANT_CATEGORIES = [
  "earrings",
  "necklaces",
  "bags",
  "sandals",
  "baskets",
  "home-living",
  "art",
];
export type MerchantProduct = {
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  materials: string[];
  material_status: string;
  images: string[];
  attributes: Record<string, unknown>;
  price_minor: number | null;
  stock_quantity: number | null;
  published: boolean;
  details_approved: boolean;
  revision: number;
};
export type MerchantOrder = {
  id: string;
  reference: string;
  status: string;
  fulfillment_status: string;
  customer_name: string;
  email: string;
  phone: string;
  address: Record<string, string>;
  zone_name: string;
  currency: string;
  total_minor: number;
  created_at: string;
  revision: number;
  tracking_number: string | null;
  tracking_url: string | null;
  order_items: {
    slug: string;
    title: string;
    quantity: number;
    unit_minor: number;
    product_snapshot: Record<string, string>;
  }[];
};
export type MerchantRequest = {
  id: string;
  order_id: string;
  kind: string;
  message: string;
  status: string;
  reply: string;
  revision: number;
  created_at: string;
  orders: { reference: string };
};
export type MerchantActivity = {
  id: number;
  action: string;
  target: string;
  details: Record<string, unknown>;
  created_at: string;
};

export function authIdentity(
  user: { id: string; email_confirmed_at?: string; is_anonymous?: boolean },
  claims: Record<string, unknown>,
  mfa = true,
  now = Math.floor(Date.now() / 1000),
) {
  if (
    !user.email_confirmed_at ||
    user.is_anonymous ||
    claims.sub !== user.id ||
    claims.role !== "authenticated" ||
    typeof claims.exp !== "number" ||
    claims.exp <= now ||
    typeof claims.session_id !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(claims.session_id)
  )
    throw new CommerceError("MERCHANT_SESSION", 401);
  const recent =
    Array.isArray(claims.amr) &&
    claims.amr.some((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const r = entry as Record<string, unknown>;
      return (
        (r.method === "totp" || r.method === "mfa/totp") &&
        typeof r.timestamp === "number" &&
        r.timestamp <= now + 30 &&
        r.timestamp >= now - 900
      );
    });
  if (mfa && (claims.aal !== "aal2" || !recent))
    throw new CommerceError("MERCHANT_MFA", 403);
  return {
    id: user.id,
    session: claims.session_id,
    mfa: claims.aal === "aal2" && recent,
  };
}
export function priceMinor(value: unknown): number | null {
  if (value === "" || value === null) return null;
  if (typeof value !== "string" || !/^\d{1,7}(\.\d{1,2})?$/.test(value.trim()))
    throw new CommerceError("MERCHANT_PRICE");
  const [whole, fraction = ""] = value.trim().split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (minor <= 0 || minor > 100000000)
    throw new CommerceError("MERCHANT_PRICE");
  return minor;
}
function integer(value: unknown, min: number, max: number) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw new CommerceError("MERCHANT_INPUT");
  return Number(value);
}
function paragraph(value: unknown, min: number, max: number) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 && code !== 9 && code !== 10 && code !== 13;
    })
  )
    throw new CommerceError("MERCHANT_INPUT");
  return value.trim();
}
function strings(value: unknown, max: number, length = 150) {
  if (!Array.isArray(value) || value.length > max)
    throw new CommerceError("MERCHANT_INPUT");
  return [...new Set(value.map((v) => text(v, 1, length)))];
}
export function productSlug(value: unknown) {
  const slug = text(value, 1, 120);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
    throw new CommerceError("MERCHANT_INPUT");
  return slug;
}
export function validateMutation(action: unknown, value: unknown) {
  const d = record(value);
  switch (action) {
    case "product.create":
    case "product.save": {
      const category = text(d.category, 1, 30);
      if (
        !MERCHANT_CATEGORIES.includes(category) ||
        !["visual", "confirmed"].includes(String(d.material_status)) ||
        typeof d.published !== "boolean" ||
        typeof d.details_approved !== "boolean"
      )
        throw new CommerceError("MERCHANT_INPUT");
      const attributes = record(d.attributes);
      const attrs: Record<string, unknown> = {
        colors: strings(attributes.colors ?? [], 20, 60),
      };
      for (const key of [
        "sizeLabel",
        "dimensions",
        "contents",
        "familySlug",
        "optionLabel",
      ])
        attrs[key] = text(
          attributes[key] ?? "",
          0,
          key === "contents" ? 500 : 120,
        );
      const images = strings(d.images, 30, 500),
        description = paragraph(d.description, d.published ? 10 : 0, 6000);
      if (d.published && images.length === 0)
        throw new CommerceError("MERCHANT_INPUT");
      return {
        title: text(d.title, 1, 180),
        category,
        subcategory: text(d.subcategory, 0, 100),
        description,
        materials: strings(d.materials, 20),
        material_status: d.material_status,
        images,
        attributes: attrs,
        published: d.published,
        details_approved: d.details_approved,
      };
    }
    case "price.save":
      return { price_minor: priceMinor(d.price) };
    case "stock.adjust": {
      if (d.mode !== "initial" && d.mode !== "adjust")
        throw new CommerceError("MERCHANT_INPUT");
      const quantity = integer(
        d.quantity,
        d.mode === "initial" ? 0 : -1000000,
        1000000,
      );
      if (d.mode === "adjust" && quantity === 0)
        throw new CommerceError("MERCHANT_INPUT");
      return { mode: d.mode, quantity, reason: text(d.reason, 5, 500) };
    }
    case "order.fulfill": {
      if (d.status !== "dispatched" && d.status !== "delivered")
        throw new CommerceError("MERCHANT_INPUT");
      const tracking_number = text(
        d.tracking_number ?? "",
        d.status === "dispatched" ? 2 : 0,
        150,
      );
      const tracking_url = text(d.tracking_url ?? "", 0, 1000);
      if (tracking_url) {
        let url;
        try {
          url = new URL(tracking_url);
        } catch {
          throw new CommerceError("MERCHANT_INPUT");
        }
        if (url.protocol !== "https:" || url.username || url.password)
          throw new CommerceError("MERCHANT_INPUT");
      }
      return { status: d.status, tracking_number, tracking_url };
    }
    case "request.reply": {
      if (d.status !== "reviewing" && d.status !== "closed")
        throw new CommerceError("MERCHANT_INPUT");
      return { status: d.status, reply: paragraph(d.reply, 3, 4000) };
    }
    default:
      throw new CommerceError("MERCHANT_INPUT");
  }
}
