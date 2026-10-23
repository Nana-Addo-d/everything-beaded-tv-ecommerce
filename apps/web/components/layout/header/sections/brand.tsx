import Image from "next/image";
import Link from "next/link";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Everything Beaded home"
      className={["inline-flex shrink-0 items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/logos/brand/eb.png"
        alt=""
        width={36}
        height={36}
        className="rounded-md object-contain"
      />
      <span className="hidden text-base font-semibold tracking-tight sm:inline">
        Everything Beaded
      </span>
      <span className="text-base font-semibold sm:hidden">EB</span>
    </Link>
  );
}
