import "server-only";
import { CommerceError } from "../checkout/domain";

export function databaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
export function paymentConfigured() {
  const mode = process.env.PAYSTACK_MODE;
  return (
    databaseConfigured() &&
    !!process.env.STORE_ORIGIN &&
    (mode === "test" || mode === "live") &&
    !!process.env.PAYSTACK_SECRET_KEY?.startsWith(`sk_${mode}_`)
  );
}
export function storeOrigin() {
  const raw = process.env.STORE_ORIGIN;
  if (!raw) throw new CommerceError("ORDERING_UNAVAILABLE", 503);
  const url = new URL(raw);
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["127.0.0.1", "localhost"].includes(url.hostname)
    )
  )
    throw new CommerceError("ORDERING_UNAVAILABLE", 503);
  return url.origin;
}
export function paymentMode() {
  return process.env.PAYSTACK_MODE === "live" ? "live" : "test";
}
