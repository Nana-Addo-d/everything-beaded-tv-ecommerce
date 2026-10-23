import { MerchantAuth } from "@/features/merchant/client";
import "./merchant.css";
export const metadata = {
  title: "Merchant | Everything Beaded",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const url = process.env.SUPABASE_URL,
    publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey)
    return (
      <main className="merchant-login">
        <h1>Merchant sign-in is being configured</h1>
        <p>
          The store authentication connection is unavailable. Please contact the
          account administrator.
        </p>
      </main>
    );
  return (
    <MerchantAuth url={url} publishableKey={publishableKey}>
      {children}
    </MerchantAuth>
  );
}
