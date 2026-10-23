import { NextRequest } from "next/server";
import {
  CommerceError,
  parseBag,
  parseCustomer,
  text,
  uuid,
} from "@/features/checkout/domain";
import { rpc, type Order } from "@/features/commerce/database";
import { paymentConfigured } from "@/features/commerce/config";
import {
  failure,
  guestSession,
  hash,
  jsonBody,
  respond,
  sameOrigin,
} from "@/features/commerce/http";
import { initializePayment } from "@/features/commerce/paystack";

export async function POST(request: NextRequest) {
  let session: string | undefined, orderId: string | undefined;
  try {
    sameOrigin(request);
    if (!paymentConfigured())
      throw new CommerceError("ORDERING_UNAVAILABLE", 503);
    const body = await jsonBody(request),
      items = parseBag(body.items),
      customer = parseCustomer(body.customer);
    const zone = text(body.zone, 1, 80),
      key = uuid(body.idempotencyKey);
    if (
      body.acceptedPolicies !== true ||
      !Number.isSafeInteger(body.expectedTotal) ||
      Number(body.expectedTotal) <= 0
    )
      throw new CommerceError("INVALID_DETAILS");
    session = guestSession(request, true);
    const canonical = {
      items,
      customer,
      zone,
      expectedTotal: body.expectedTotal,
    };
    const order = await rpc<Order>("reserve_order", {
      p_items: items,
      p_zone: zone,
      p_customer: customer,
      p_key: key,
      p_request_hash: hash(JSON.stringify(canonical)),
      p_access_hash: hash(session),
      p_expected_total: body.expectedTotal,
    });
    orderId = order.id;
    const paymentUrl = await initializePayment(order);
    return respond({ orderId, paymentUrl }, 200, session);
  } catch (error) {
    return failure(error, session, orderId);
  }
}
