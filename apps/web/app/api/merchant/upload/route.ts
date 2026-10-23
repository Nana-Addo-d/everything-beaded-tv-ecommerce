import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireMerchant } from "@/features/merchant/auth-server";
import { prepareProductPhoto } from "@/features/merchant/images-server";
import { CommerceError } from "@/features/checkout/domain";
import { database } from "@/features/commerce/database";
import { failure, respond, sameOrigin } from "@/features/commerce/http";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await requireMerchant(request);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new CommerceError("MERCHANT_IMAGE", 415);
    const max = 8 * 1024 * 1024 + 8192,
      reader = request.body?.getReader();
    if (!reader || Number(request.headers.get("content-length")) > max)
      throw new CommerceError("MERCHANT_IMAGE", 413);
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new CommerceError("MERCHANT_IMAGE", 413);
      }
      parts.push(value);
    }
    const form = await new Response(Buffer.concat(parts), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new CommerceError("MERCHANT_IMAGE");
    const bytes = await prepareProductPhoto(
      new Uint8Array(await file.arrayBuffer()),
    );
    const base = process.env.SUPABASE_URL!,
      key = process.env.SUPABASE_SECRET_KEY!;
    const client = createClient(base, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      name = randomUUID() + ".webp";
    const { error } = await client.storage
      .from("product-images")
      .upload(name, bytes, { contentType: "image/webp", upsert: false });
    if (error) throw new CommerceError("SERVICE_UNAVAILABLE", 503);
    const path = `${new URL(base).origin}/storage/v1/object/public/product-images/${name}`;
    await database("merchant_media", {
      method: "POST",
      body: JSON.stringify({ path, actor_id: actor.id }),
    });
    await database("merchant_activity", {
      method: "POST",
      body: JSON.stringify({
        actor_id: actor.id,
        action: "photo.uploaded",
        target: name,
        details: { bytes: bytes.length },
      }),
    });
    return respond({ path }, 201);
  } catch (error) {
    return failure(error);
  }
}
