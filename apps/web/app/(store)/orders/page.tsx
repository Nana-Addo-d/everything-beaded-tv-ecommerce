import { OrderHistory } from "@/features/orders/order-history";
export const metadata = {
  title: "Your orders | Everything Beaded",
  robots: { index: false, follow: false },
};
export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">Your orders</h1>
      <OrderHistory />
    </main>
  );
}
