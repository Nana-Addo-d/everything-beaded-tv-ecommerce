import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { boundedBody, failure, respond } from "@/features/commerce/http";
import { validSignature } from "@/features/commerce/webhook-signature";
import { rpc } from "@/features/commerce/database";

export async function POST(request: NextRequest) {
  try {
    const raw = await boundedBody(request, 262144);
    if (
      !validSignature(
        raw,
        request.headers.get("x-paystack-signature"),
        process.env.PAYSTACK_SECRET_KEY,
      )
    )
      return respond({ error: "FORBIDDEN" }, 401);
    let event: { event?: unknown; data?: { reference?: unknown } };
    try {
      event = JSON.parse(raw);
    } catch {
      return respond({ error: "INVALID_REQUEST" }, 400);
    }
    if (event.event !== "charge.success") return respond({ received: true });
    const reference = event.data?.reference;
    if (typeof reference !== "string" || !/^eb-[0-9a-f]{32}$/.test(reference))
      return respond({ received: true });
    await rpc("receive_payment_event", {
      p_hash: createHash("sha256").update(raw).digest("hex"),
      p_reference: reference,
    });
    // The event and reconciliation job are committed before acknowledging delivery.
    return respond({ received: true });
  } catch (error) {
    return failure(error);
  }
}
