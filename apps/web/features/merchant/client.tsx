"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext, useMemo } from "react";
const Context = createContext<SupabaseClient | null>(null);
export function MerchantAuth({
  url,
  publishableKey,
  children,
}: {
  url: string;
  publishableKey: string;
  children: React.ReactNode;
}) {
  const client = useMemo(
    () =>
      createClient(url, publishableKey, {
        auth: {
          storageKey: "everything-beaded-merchant-auth",
          flowType: "pkce",
        },
      }),
    [url, publishableKey],
  );
  return <Context.Provider value={client}>{children}</Context.Provider>;
}
export function useMerchantAuth() {
  const client = useContext(Context);
  if (!client) throw new Error("Merchant sign-in is not configured.");
  return client;
}
export class MerchantRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function merchantRequest<T>(
  client: SupabaseClient,
  path: string,
  body?: unknown,
  form?: FormData,
): Promise<T> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session)
    throw new MerchantRequestError(
      "Sign in to continue.",
      "MERCHANT_SESSION",
      401,
    );
  const response = await fetch("/api/merchant/" + path, {
    method: body || form ? "POST" : "GET",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + data.session.access_token,
      ...(!form && body ? { "Content-Type": "application/json" } : {}),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const result = await response.json();
  if (!response.ok)
    throw new MerchantRequestError(
      result.message ?? "Unable to reach the store.",
      result.error,
      response.status,
    );
  return result;
}
