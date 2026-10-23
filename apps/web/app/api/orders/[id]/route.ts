import { NextRequest } from "next/server";
import { database } from "@/features/commerce/database";
import { ownedOrder } from "@/features/orders/order-access";
import { failure, respond, sameOrigin } from "@/features/commerce/http";
import { initializePayment, verifyPayment } from "@/features/commerce/paystack";

type Context = { params: Promise<{ id: string }> };
async function authorized(request: NextRequest, context: Context) {
  return ownedOrder(request, (await context.params).id);
}
export async function GET(request: NextRequest, context: Context) {
  try {
    const order = await authorized(request, context);
    const items = await database<
      {
        slug: string;
        title: string;
        quantity: number;
        unit_minor: number;
        product_snapshot: Record<string, string>;
      }[]
    >(
      `order_items?order_id=eq.${order.id}&select=slug,title,quantity,unit_minor,product_snapshot`,
    );
    const events = await database(
      `order_events?order_id=eq.${order.id}&select=status,fulfillment_status,created_at&order=created_at.asc,id.asc&limit=100`,
    );
    return respond({
      order: {
        id: order.id,
        status: order.status,
        reference: order.reference,
        currency: order.currency,
        totalMinor: order.total_minor,
        subtotalMinor: order.subtotal_minor,
        deliveryMinor: order.delivery_minor,
        zoneName: order.zone_name,
        createdAt: order.created_at,
        expiresAt: order.expires_at,
        fulfillmentStatus: order.fulfillment_status,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        dispatchedAt: order.dispatched_at,
        deliveredAt: order.delivered_at,
        items,
        events,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const order = await authorized(request, context);
    if (order.status !== "pending") return respond({ status: order.status });
    const status = await verifyPayment(order);
    if (status !== "pending") return respond({ status });
    const paymentUrl = await initializePayment(order);
    return respond({ status, paymentUrl });
  } catch (error) {
    return failure(error);
  }
}
