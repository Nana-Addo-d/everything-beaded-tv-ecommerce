import "server-only";
import { CommerceError, ERROR_MESSAGES } from "../checkout/domain";

export async function database<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new CommerceError("ORDERING_UNAVAILABLE", 503);
  const url = new URL(base);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new CommerceError("SERVICE_UNAVAILABLE", 503);
  let response: Response;
  try {
    response = await fetch(`${url.origin}/rest/v1/${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        apikey: key,
        ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new CommerceError("SERVICE_UNAVAILABLE", 503);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const code =
      typeof data.message === "string" && data.message in ERROR_MESSAGES
        ? data.message
        : "SERVICE_UNAVAILABLE";
    throw new CommerceError(code, code === "SERVICE_UNAVAILABLE" ? 503 : 409);
  }
  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}
export function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  return database<T>(`rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}
export type StoreSettings = {
  currency: string;
  country_code: string;
  ordering_enabled: boolean;
  policies_approved: boolean;
  prices_include_tax: boolean;
  support_contact: string;
  delivery_policy: string;
  returns_policy: string;
  privacy_policy: string;
  terms_policy: string;
};
export type DeliveryZone = {
  id: string;
  name: string;
  country_code: string;
  fee_minor: number;
};
export type Order = {
  id: string;
  reference: string;
  access_hash: string;
  status: string;
  email: string;
  customer_name: string;
  total_minor: number;
  subtotal_minor: number;
  delivery_minor: number;
  currency: string;
  payment_url: string | null;
  created_at: string;
  expires_at: string;
  initialization_until: string | null;
  zone_name: string;
  fulfillment_status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
};
export async function getOrder(id: string) {
  const rows = await database<Order[]>(
    `orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  if (!rows[0]) throw new CommerceError("ORDER_NOT_FOUND", 404);
  return rows[0];
}
export async function storeSettings() {
  const [settings, zones] = await Promise.all([
    database<StoreSettings[]>("store_settings?select=*&limit=1"),
    database<DeliveryZone[]>(
      "delivery_zones?enabled=eq.true&select=id,name,country_code,fee_minor&order=name.asc",
    ),
  ]);
  return { settings: settings[0], zones };
}
