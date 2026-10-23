import { NextRequest } from "next/server";
import { parseBag, text, type Quote } from "@/features/checkout/domain";
import { rpc } from "@/features/commerce/database";
import {
  failure,
  guestSession,
  jsonBody,
  respond,
  sameOrigin,
} from "@/features/commerce/http";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    const quote = await rpc<Quote>("checkout_quote", {
      p_items: parseBag(body.items),
      p_zone: text(body.zone, 1, 80),
    });
    return respond({ quote }, 200, guestSession(request, true));
  } catch (error) {
    return failure(error);
  }
}
