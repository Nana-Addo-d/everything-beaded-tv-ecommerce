import "server-only";
import { CommerceError, paymentMatches } from "../checkout/domain";
import { database, rpc, type Order } from "./database";
import { paymentConfigured, paymentMode, storeOrigin } from "./config";

type ProviderResult = {
  status: boolean;
  data?: Record<string, unknown>;
  message?: string;
  notFound?: boolean;
};
async function paystack(
  path: string,
  body?: Record<string, unknown>,
): Promise<ProviderResult> {
  if (!paymentConfigured())
    throw new CommerceError("ORDERING_UNAVAILABLE", 503);
  let response: Response;
  try {
    response = await fetch(`https://api.paystack.co/${path}`, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new CommerceError("PAYMENT_PENDING", 503);
  }
  const result = (await response
    .json()
    .catch(() => null)) as ProviderResult | null;
  // A documented not-found response is the only absence signal. Network and provider errors remain unknown.
  if (
    path.startsWith("transaction/verify/") &&
    response.status === 400 &&
    result?.message === "Transaction reference not found"
  )
    return { status: false, notFound: true };
  if (!response.ok || !result || typeof result.status !== "boolean")
    throw new CommerceError("PAYMENT_PENDING", 503);
  return result;
}
export async function verifyPayment(order: Order) {
  const result = await paystack(
    `transaction/verify/${encodeURIComponent(order.reference)}`,
  );
  const data = result.data;
  if (!result.status && !result.notFound)
    throw new CommerceError("PAYMENT_PENDING", 503);
  if (result.status && data?.status === "success") {
    // The provider's top-level success only means the lookup succeeded.
    if (!paymentMatches(data, order, paymentMode())) {
      await database(`orders?id=eq.${order.id}&status=eq.pending`, {
        method: "PATCH",
        body: JSON.stringify({ status: "payment_review" }),
      });
      return "payment_review";
    }
    return rpc<string>("record_payment", {
      p_reference: order.reference,
      p_amount: data.amount,
      p_currency: data.currency,
      p_email: (data.customer as { email: string }).email,
    });
  }
  const terminal =
    result.notFound === true ||
    ["failed", "abandoned", "reversed"].includes(String(data?.status));
  if (terminal && new Date(order.expires_at).getTime() <= Date.now())
    return rpc<string>("cancel_unpaid_order", { p_id: order.id });
  return order.status;
}
export async function initializePayment(order: Order) {
  if (order.status !== "pending") return null;
  if (order.payment_url) return order.payment_url;
  if (new Date(order.expires_at).getTime() <= Date.now())
    throw new CommerceError("CHECKOUT_CONFLICT", 409);
  const claimed = await rpc<boolean>("claim_payment_initialization", {
    p_id: order.id,
  });
  if (!claimed) throw new CommerceError("PAYMENT_PENDING", 409);
  // After an uncertain first attempt, reconcile the same reference before retrying initialization.
  if (order.initialization_until) {
    const state = await verifyPayment(order);
    if (state !== "pending") return null;
  }
  const result = await paystack("transaction/initialize", {
    email: order.email,
    amount: order.total_minor,
    currency: order.currency,
    reference: order.reference,
    callback_url: `${storeOrigin()}/orders/${order.id}?returned=1`,
    metadata: { order_id: order.id },
  });
  const target = result.data?.authorization_url;
  if (
    !result.status ||
    typeof target !== "string" ||
    result.data?.reference !== order.reference
  )
    throw new CommerceError("PAYMENT_PENDING", 503);
  const url = new URL(target);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.paystack.com" ||
    url.username ||
    url.password
  )
    throw new CommerceError("PAYMENT_PENDING", 503);
  await database(`orders?id=eq.${order.id}&status=eq.pending`, {
    method: "PATCH",
    body: JSON.stringify({ payment_url: url.href }),
  });
  return url.href;
}
