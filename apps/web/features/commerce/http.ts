import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CommerceError, ERROR_MESSAGES, record } from "../checkout/domain";

export const SESSION_COOKIE = "eb-guest-session";
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = process.env.STORE_ORIGIN
    ? new URL(process.env.STORE_ORIGIN).origin
    : `${request.nextUrl.protocol}//${request.headers.get("host") ?? request.nextUrl.host}`;
  if (!origin || origin !== expected) throw new CommerceError("FORBIDDEN", 403);
}
export async function boundedBody(request: Request, max = 32768) {
  if (Number(request.headers.get("content-length")) > max)
    throw new CommerceError("INVALID_REQUEST", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new CommerceError("INVALID_REQUEST");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > max) {
      await reader.cancel();
      throw new CommerceError("INVALID_REQUEST", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function jsonBody(request: NextRequest) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new CommerceError("INVALID_REQUEST", 415);
  try {
    return record(JSON.parse(await boundedBody(request)));
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    throw new CommerceError("INVALID_REQUEST");
  }
}
export function guestSession(request: NextRequest, create = false) {
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  if (value && /^[0-9a-f]{64}$/.test(value)) return value;
  if (create) return randomBytes(32).toString("hex");
  throw new CommerceError("ORDER_NOT_FOUND", 404);
}
export function respond(data: unknown, status = 200, session?: string) {
  const response = NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
  if (session)
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return response;
}
export function failure(error: unknown, session?: string, orderId?: string) {
  const known =
    error instanceof CommerceError
      ? error
      : new CommerceError("SERVICE_UNAVAILABLE", 503);
  return respond(
    {
      error: known.code,
      message: ERROR_MESSAGES[known.code] ?? ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      ...(orderId ? { orderId } : {}),
    },
    known.status,
    session,
  );
}
export function secretMatches(
  value: string | null,
  expected: string | undefined,
) {
  if (!expected || expected.length < 32 || !value) return false;
  return timingSafeEqual(Buffer.from(hash(value)), Buffer.from(hash(expected)));
}
