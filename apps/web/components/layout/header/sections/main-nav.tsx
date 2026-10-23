import Link from "next/link";

export function MainNav() {
  return (
    <div className="flex items-center gap-5 overflow-x-auto whitespace-nowrap pb-1 text-sm">
      <Link href="/shop" className="hover:underline">
        Shop
      </Link>
      <Link href="/categories" className="hover:underline">
        Categories
      </Link>
      <Link href="/collections" className="hover:underline">
        Collections
      </Link>
      <Link href="/orders" className="hover:underline">
        Your orders
      </Link>
      <Link href="/contact" className="hover:underline">
        Contact &amp; visit
      </Link>
      <Link href="/about" className="hover:underline">
        About
      </Link>
      <Link href="/help" className="hover:underline">
        Shopping information
      </Link>
    </div>
  );
}
