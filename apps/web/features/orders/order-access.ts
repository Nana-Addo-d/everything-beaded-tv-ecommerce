import "server-only";
import { NextRequest } from "next/server";
import { CommerceError, uuid } from "../checkout/domain";
import { getOrder } from "../commerce/database";
import { guestSession, hash } from "../commerce/http";
export async function ownedOrder(request: NextRequest, id: string) {
  const access = hash(guestSession(request));
  const order = await getOrder(uuid(id));
  if (order.access_hash !== access)
    throw new CommerceError("ORDER_NOT_FOUND", 404);
  return order;
}
