import { notFound, redirect } from "next/navigation";

const LEGACY_SHOPS = [
  "sample-shop",
  "kente-works",
  "kisii-craft",
  "mali-textiles",
  "nomad-leather",
];

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!LEGACY_SHOPS.includes(slug)) notFound();
  redirect("/shop");
}
