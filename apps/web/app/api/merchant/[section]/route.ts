import { NextRequest } from "next/server";
import { requireMerchant } from "@/features/merchant/auth-server";
import { database, rpc } from "@/features/commerce/database";
import {
  failure,
  jsonBody,
  respond,
  sameOrigin,
} from "@/features/commerce/http";
import { CommerceError, text, uuid } from "@/features/checkout/domain";
import {
  MERCHANT_CATEGORIES,
  productSlug,
  validateMutation,
} from "@/features/merchant/domain";
import catalogue from "@/features/catalog/catalogue.json";
type Context = { params: Promise<{ section: string }> };
const localImages = new Set(catalogue.flatMap((p) => p.images));
const productFields =
  "slug,title,category,subcategory,description,materials,material_status,images,attributes,price_minor,stock_quantity,published,details_approved,revision";
const orderFields =
  "id,reference,status,fulfillment_status,customer_name,email,phone,address,zone_name,currency,total_minor,created_at,revision,tracking_number,tracking_url,order_items(slug,title,quantity,unit_minor,product_snapshot)";
export async function GET(request: NextRequest, context: Context) {
  try {
    const { section } = await context.params;
    const actor = await requireMerchant(request, section !== "session");
    if (section === "session")
      return respond({ email: actor.email, role: actor.role, mfa: actor.mfa });
    if (section === "overview")
      return respond(
        await rpc("merchant_summary", {
          p_actor: actor.id,
          p_session: actor.session,
        }),
      );
    const page = Math.min(
      10000,
      Math.max(
        1,
        parseInt(request.nextUrl.searchParams.get("page") ?? "1") || 1,
      ),
    );
    const query = new URLSearchParams({
      limit: "26",
      offset: String((page - 1) * 25),
    });
    const q = (request.nextUrl.searchParams.get("q") ?? "")
      .replace(/[^\p{L}\p{N} -]/gu, "")
      .trim()
      .slice(0, 80);
    const status = request.nextUrl.searchParams.get("status"),
      id = request.nextUrl.searchParams.get("id");
    let table: string;
    if (section === "products") {
      table = "products";
      query.set("select", productFields);
      query.set("order", "sort_order.asc,slug.asc");
      if (q) query.set("or", `(title.ilike.*${q}*,slug.ilike.*${q}*)`);
      const category = request.nextUrl.searchParams.get("category");
      if (category && MERCHANT_CATEGORIES.includes(category))
        query.set("category", "eq." + category);
      if (status === "draft") query.set("published", "eq.false");
      if (status === "published") query.set("published", "eq.true");
      if (status === "unpriced") query.set("price_minor", "is.null");
      if (status === "unknown-stock") query.set("stock_quantity", "is.null");
      if (id) query.set("slug", "eq." + productSlug(id));
    } else if (section === "orders") {
      table = "orders";
      query.set("select", orderFields);
      query.set("order", "created_at.desc,id.desc");
      if (q) query.set("reference", "ilike.*" + q + "*");
      if (
        status &&
        ["pending", "paid", "cancelled", "payment_review"].includes(status)
      )
        query.set("status", "eq." + status);
      if (id) query.set("id", "eq." + uuid(id));
    } else if (section === "requests") {
      table = "order_requests";
      query.set(
        "select",
        "id,order_id,kind,message,status,reply,revision,created_at,orders(reference)",
      );
      query.set("order", "created_at.desc,id.desc");
      if (status && ["submitted", "reviewing", "closed"].includes(status))
        query.set("status", "eq." + status);
      if (id) query.set("order_id", "eq." + uuid(id));
      const requestId = request.nextUrl.searchParams.get("request");
      if (requestId) query.set("id", "eq." + uuid(requestId));
    } else if (section === "activity") {
      table = "merchant_activity";
      query.set("select", "id,action,target,details,created_at");
      query.set("order", "created_at.desc,id.desc");
    } else throw new CommerceError("MERCHANT_NOT_FOUND", 404);
    const rows = await database<unknown[]>(`${table}?${query}`);
    return respond({
      rows: rows.slice(0, 25),
      hasMore: rows.length > 25,
      page,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const actor = await requireMerchant(request);
    if ((await context.params).section !== "changes")
      throw new CommerceError("MERCHANT_NOT_FOUND", 404);
    const body = await jsonBody(request),
      action = text(body.action, 1, 30);
    const target =
      action.startsWith("order.") || action.startsWith("request.")
        ? uuid(body.target)
        : productSlug(body.target);
    if (
      action !== "product.create" &&
      (!Number.isSafeInteger(body.revision) || Number(body.revision) < 1)
    )
      throw new CommerceError("MERCHANT_INPUT");
    const data = validateMutation(action, body.data);
    if ("images" in data && Array.isArray(data.images)) {
      for (const image of data.images) {
        if (localImages.has(image)) continue;
        const media = await database<unknown[]>(
          `merchant_media?path=eq.${encodeURIComponent(image)}&select=path&limit=1`,
        );
        if (!media.length) throw new CommerceError("MERCHANT_IMAGE");
      }
    }
    const result = await rpc("merchant_write", {
      p_actor: actor.id,
      p_session: actor.session,
      p_key: uuid(body.key),
      p_action: action,
      p_target: target,
      p_expected: body.revision ?? 0,
      p_data: data,
    });
    return respond({ result });
  } catch (error) {
    return failure(error);
  }
}
