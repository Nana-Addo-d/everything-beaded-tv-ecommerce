import { createHmac, timingSafeEqual } from "node:crypto";
export function validSignature(
  body: string,
  signature: string | null,
  key: string | undefined,
) {
  if (!key || !signature || !/^[0-9a-f]{128}$/i.test(signature)) return false;
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    createHmac("sha512", key).update(body).digest(),
  );
}
