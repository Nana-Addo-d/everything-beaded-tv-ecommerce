import { CartPage } from "@/features/cart/cart-page";
import { getCatalog } from "@/features/catalog/catalog-server";

export default async function Page() {
  return <CartPage products={await getCatalog()} />;
}
