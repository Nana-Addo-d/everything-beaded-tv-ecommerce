import { notFound } from "next/navigation";
import { OrderStatus } from "@/features/checkout/order-status";
export const metadata = {
  title: "Your order | Everything Beaded",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <OrderStatus key={id} id={id} />;
}
