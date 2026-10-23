import "server-only";
import sharp from "sharp";
import { CommerceError } from "../checkout/domain";
export async function prepareProductPhoto(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new CommerceError("MERCHANT_IMAGE", 413);
  try {
    const input = sharp(bytes, {
      limitInputPixels: 40000000,
      animated: false,
      failOn: "warning",
    });
    const meta = await input.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
      (meta.pages ?? 1) > 1 ||
      !meta.width ||
      !meta.height
    )
      throw new Error("Unsupported image");
    return await input
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer();
  } catch {
    throw new CommerceError("MERCHANT_IMAGE");
  }
}
