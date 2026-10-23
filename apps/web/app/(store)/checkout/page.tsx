import { getCatalog } from "@/features/catalog/catalog-server";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import {
  databaseConfigured,
  paymentConfigured,
  paymentMode,
} from "@/features/commerce/config";
import { storeSettings } from "@/features/commerce/database";

export const dynamic = "force-dynamic";
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>;
}) {
  const products = await getCatalog();
  const selection = (await searchParams).items;
  const selectedSlugs =
    typeof selection === "string"
      ? [...new Set(selection.split(","))]
          .filter((slug) => products.some((p) => p.slug === slug))
          .slice(0, 100)
      : undefined;
  const config = databaseConfigured() ? await storeSettings() : null;
  const settings = config?.settings;
  const enabled =
    paymentConfigured() &&
    !!settings?.ordering_enabled &&
    !!settings.policies_approved &&
    !!settings.prices_include_tax;
  return (
    <CheckoutForm
      products={products}
      selectedSlugs={selectedSlugs}
      zones={config?.zones ?? []}
      enabled={enabled}
      countryCode={settings?.country_code ?? "GH"}
      testMode={paymentConfigured() && paymentMode() === "test"}
    />
  );
}
