"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { merchantRequest, useMerchantAuth } from "./client";
export function MerchantSignIn() {
  const recovering = useRef(false);
  const client = useMerchantAuth(),
    router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  const [state, setState] = useState<"login" | "mfa" | "blocked" | "recovery">(
      "login",
    ),
    [factor, setFactor] = useState(""),
    [qr, setQr] = useState(""),
    [secret, setSecret] = useState("");
  const [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const inspect = useCallback(async () => {
    const { data } = await client.auth.getSession();
    if (recovering.current) return;
    if (!data.session) {
      setState("login");
      return;
    }
    const access = await merchantRequest<{ mfa: boolean }>(client, "session");
    if (recovering.current) return;
    if (access.mfa) {
      router.replace("/admin");
      return;
    }
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) throw factors.error;
    if (recovering.current) return;
    setFactor(factors.data.totp.find((f) => f.status === "verified")?.id ?? "");
    setState("mfa");
  }, [client, router]);
  useEffect(() => {
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recovering.current = true;
        setState("recovery");
      }
    });
    void inspect().catch((e) => {
      if (recovering.current) return;
      setError(e.message);
      setState("blocked");
    });
    return () => data.subscription.unsubscribe();
  }, [inspect, client]);
  async function act(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete sign-in.");
    } finally {
      setBusy(false);
    }
  }
  async function enroll() {
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) throw factors.error;
    for (const f of factors.data.all.filter(
      (f) => f.factor_type === "totp" && f.status === "unverified",
    )) {
      const result = await client.auth.mfa.unenroll({ factorId: f.id });
      if (result.error) throw result.error;
    }
    const { data, error } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Store merchant",
      issuer: "Everything Beaded",
    });
    if (error) throw error;
    setFactor(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }
  return (
    <main className="merchant-login">
      <Link href="/" className="merchant-brand">
        Everything Beaded
      </Link>
      <section className="merchant-panel">
        <p className="merchant-eyebrow">Merchant access</p>
        <h1>Manage your store</h1>
        <p className="merchant-muted">
          Sign in with your approved email, then verify your authenticator.
        </p>
        {error && (
          <p className="merchant-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="merchant-notice" role="status">
            {notice}
          </p>
        )}
        {state === "login" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const { error } = await client.auth.signInWithPassword({
                  email,
                  password,
                });
                if (error) throw error;
                setPassword("");
                await inspect();
              });
            }}
          >
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="merchant-primary" disabled={busy}>
              Sign in
            </button>
            <div className="merchant-actions">
              <button
                type="button"
                disabled={busy || !email || password.length < 12}
                onClick={() =>
                  void act(async () => {
                    const { error } = await client.auth.signUp({
                      email,
                      password,
                      options: {
                        emailRedirectTo:
                          window.location.origin + "/admin/sign-in",
                      },
                    });
                    if (error) throw error;
                    setPassword("");
                    setNotice(
                      "Check your email to confirm your account, then return here to sign in. Creating an account does not grant merchant access.",
                    );
                  })
                }
              >
                Create account
              </button>
              <button
                type="button"
                disabled={busy || !email}
                onClick={() =>
                  void act(async () => {
                    const { error } = await client.auth.resetPasswordForEmail(
                      email,
                      { redirectTo: window.location.origin + "/admin/sign-in" },
                    );
                    if (error) throw error;
                    setNotice(
                      "If the address has an account, check its inbox for password recovery.",
                    );
                  })
                }
              >
                Forgot password
              </button>
            </div>
            <p className="merchant-muted">
              For a new account, choose at least 12 characters. Merchant access
              is approved separately.
            </p>
          </form>
        )}
        {state === "mfa" && (
          <div className="merchant-stack">
            <h2>Authenticator verification</h2>
            {!factor ? (
              <>
                <p>
                  Connect an authenticator app to protect product, stock and
                  order changes.
                </p>
                <button
                  className="merchant-primary"
                  disabled={busy}
                  onClick={() => void act(enroll)}
                >
                  Set up authenticator
                </button>
              </>
            ) : (
              <>
                {qr && (
                  <>
                    <Image
                      unoptimized
                      src={
                        qr.startsWith("data:")
                          ? qr
                          : "data:image/svg+xml;charset=utf-8," +
                            encodeURIComponent(qr)
                      }
                      alt="Scan with your authenticator app"
                      width={220}
                      height={220}
                    />
                    <details>
                      <summary>Enter the setup key manually</summary>
                      <code className="merchant-secret">{secret}</code>
                    </details>
                  </>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(async () => {
                      const { error } =
                        await client.auth.mfa.challengeAndVerify({
                          factorId: factor,
                          code,
                        });
                      if (error) throw error;
                      setCode("");
                      setQr("");
                      setSecret("");
                      await inspect();
                    });
                  }}
                >
                  <label>
                    Six-digit authenticator code
                    <input
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      required
                    />
                  </label>
                  <button
                    className="merchant-primary"
                    disabled={busy || code.length !== 6}
                  >
                    Verify and continue
                  </button>
                </form>
              </>
            )}
            <p className="merchant-muted">
              Verification lasts 15 minutes. If you lose the authenticator,
              contact the account administrator for identity-verified recovery.
            </p>
          </div>
        )}
        {state === "recovery" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const { error } = await client.auth.updateUser({ password });
                if (error) throw error;
                setPassword("");
                const { error: signOutError } = await client.auth.signOut();
                if (signOutError) throw signOutError;
                recovering.current = false;
                setState("login");
                setNotice(
                  "Password updated. Sign in again and verify your authenticator.",
                );
              });
            }}
          >
            <label>
              New password
              <input
                type="password"
                minLength={12}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="merchant-primary" disabled={busy}>
              Save password
            </button>
          </form>
        )}
        {state !== "login" && (
          <button
            disabled={busy}
            onClick={() =>
              void act(async () => {
                const { error } = await client.auth.signOut();
                if (error) throw error;
                recovering.current = false;
                setState("login");
                setQr("");
                setSecret("");
              })
            }
          >
            Sign out / use another account
          </button>
        )}
      </section>
    </main>
  );
}
