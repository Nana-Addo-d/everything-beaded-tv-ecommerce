"use client";

import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@components/button";
import { useCart } from "@/features/cart/cart-provider";

export function HeaderActions() {
  const { items, saved, ready } = useCart();
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return (
    <>
      <Button asChild variant="ghost" className="gap-2 px-2">
        <Link
          href="/wishlist"
          aria-label={`Wishlist, ${ready ? saved.length : 0} saved designs`}
        >
          <Heart className="h-5 w-5" aria-hidden="true" />
          <span className="hidden lg:inline">Wishlist</span>
        </Link>
      </Button>
      <Button asChild variant="ghost" className="relative gap-2 px-2">
        <Link href="/cart" aria-label={`Bag, ${ready ? count : 0} items`}>
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Bag</span>
          <span aria-live="polite" className="min-w-4 text-center text-xs">
            {ready ? count : 0}
          </span>
        </Link>
      </Button>
    </>
  );
}
