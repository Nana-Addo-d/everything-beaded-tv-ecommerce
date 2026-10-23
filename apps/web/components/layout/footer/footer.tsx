import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t bg-muted/10" aria-label="Site footer">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:px-8">
        <div>
          <p className="font-semibold">
            Everything Beaded &amp; Trading Ventures
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Jewellery, bags, sandals and decorative pieces for your home.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap content-start gap-x-5 gap-y-3 text-sm sm:justify-end"
        >
          <Link href="/shop" className="hover:underline">
            Shop
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/help" className="hover:underline">
            Shopping information
          </Link>
          <Link href="/cart" className="hover:underline">
            Your bag
          </Link>
          <Link href="/wishlist" className="hover:underline">
            Wishlist
          </Link>
          <Link href="/orders" className="hover:underline">
            Your orders
          </Link>
          <Link href="/categories" className="hover:underline">
            Categories
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact &amp; visit
          </Link>
        </nav>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Everything Beaded &amp; Trading Ventures
      </div>
    </footer>
  );
}
