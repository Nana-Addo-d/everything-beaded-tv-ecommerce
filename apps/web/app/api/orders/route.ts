import { NextRequest } from "next/server";
import { databaseConfigured } from "@/features/commerce/config";
import { database } from "@/features/commerce/database";
import { failure, guestSession, hash, respond } from "@/features/commerce/http";
export async function GET(request: NextRequest) {
  try {
    let session: string;
    try {
      session = guestSession(request);
    } catch {
      return respond({ orders: [], hasSession: false, hasMore: false });
    }
    if (!databaseConfigured())
      return respond({ orders: [], hasSession: true, hasMore: false });
    const page = Math.min(
      1000,
      Math.max(
        1,
        parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1,
      ),
    );
    const rows = await database<unknown[]>(
      `orders?access_hash=eq.${hash(session)}&select=id,reference,status,fulfillment_status,currency,total_minor,created_at&order=created_at.desc,id.desc&offset=${(page - 1) * 20}&limit=21`,
    );
    return respond({
      orders: rows.slice(0, 20),
      hasSession: true,
      hasMore: rows.length > 20,
    });
  } catch (error) {
    return failure(error);
  }
}
