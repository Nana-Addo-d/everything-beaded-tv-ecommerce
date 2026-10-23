import { NextRequest } from "next/server";
import { ownedOrder } from "@/features/orders/order-access";
import { database, rpc } from "@/features/commerce/database";
import {
  failure,
  jsonBody,
  respond,
  sameOrigin,
} from "@/features/commerce/http";
import { CommerceError, text, uuid } from "@/features/checkout/domain";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const order = await ownedOrder(request, (await context.params).id);
    const requests = await database(
      `order_requests?order_id=eq.${order.id}&select=id,kind,message,status,reply,created_at,updated_at&order=created_at.desc&limit=100`,
    );
    return respond({ requests });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const order = await ownedOrder(request, (await context.params).id);
    const body = await jsonBody(request);
    const kind = text(body.kind, 1, 20);
    if (!["question", "cancellation", "return", "damaged"].includes(kind))
      throw new CommerceError("INVALID_REQUEST");
    const message =
      typeof body.message === "string"
        ? body.message.replace(/\r\n/g, "\n").trim()
        : "";
    if (
      message.length < 10 ||
      message.length > 2000 ||
      Array.from(message).some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 && code !== 9 && code !== 10;
      })
    )
      throw new CommerceError("INVALID_SUPPORT_MESSAGE");
    const result = await rpc<{ id: string }>("request_order_support", {
      p_order: order.id,
      p_access: order.access_hash,
      p_kind: kind,
      p_message: message,
      p_key: uuid(body.key),
    });
    return respond({ request: { id: result.id } }, 201);
  } catch (error) {
    return failure(error);
  }
}
