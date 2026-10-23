import "server-only";
import { createClient } from "@supabase/supabase-js";
import { CommerceError } from "../checkout/domain";
import { rpc } from "../commerce/database";
import { authIdentity } from "./domain";

export async function requireMerchant(request: Request, mfa = true) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || header.length > 12000)
    throw new CommerceError("MERCHANT_SESSION", 401);
  const token = header.slice(7),
    url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new CommerceError("SERVICE_UNAVAILABLE", 503);
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
    },
  });
  const [user, claims] = await Promise.all([
    client.auth.getUser(token),
    client.auth.getClaims(token),
  ]);
  if (user.error || claims.error || !user.data.user || !claims.data)
    throw new CommerceError("MERCHANT_SESSION", 401);
  const actor = authIdentity(user.data.user, claims.data.claims, mfa);
  try {
    const role = await rpc<string>("merchant_access", {
      p_actor: actor.id,
      p_session: actor.session,
      p_mfa: mfa,
    });
    return { ...actor, role, email: user.data.user.email };
  } catch (error) {
    if (
      error instanceof CommerceError &&
      ["MERCHANT_SESSION", "MERCHANT_FORBIDDEN", "MERCHANT_MFA"].includes(
        error.code,
      )
    )
      error.status = error.code === "MERCHANT_SESSION" ? 401 : 403;
    throw error;
  }
}
