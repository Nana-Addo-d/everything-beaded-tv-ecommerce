import Link from "next/link";
import type { Product } from "./catalog";
import {
  DEPARTMENTS,
  COLLECTIONS,
  departmentOf,
  inCollection,
} from "./discovery";
import { ProductImage } from "./product-image";
export function DiscoveryDirectory({
  products,
  collections = false,
}: {
  products: Product[];
  collections?: boolean;
}) {
  const groups = collections ? COLLECTIONS : DEPARTMENTS;
  return (
    <div
      className={`grid gap-6 ${collections ? "sm:grid-cols-2 lg:grid-cols-4" : "lg:grid-cols-3"}`}
    >
      {groups.map((group) => {
        const members = products.filter((p) =>
          collections
            ? inCollection(p, group.slug)
            : departmentOf(p) === group.slug,
        );
        const types = [...new Set(members.map((p) => p.subcategory))].sort();
        const key = collections ? "collection" : "department";
        const href = "/shop?" + new URLSearchParams({ [key]: group.slug });
        return (
          <article
            key={group.slug}
            className="min-w-0 space-y-4 rounded-2xl border p-4"
          >
            <Link href={href}>
              <ProductImage src={members[0]?.image} title={group.label} />
              <h2 className="mt-4 text-xl font-semibold">{group.label}</h2>
            </Link>
            <p className="text-sm leading-6 text-muted-foreground">
              {group.description}
            </p>
            <Link
              href={href}
              className="inline-block text-sm font-medium underline"
            >
              Explore {members.length} designs
            </Link>
            {!collections && (
              <details className="border-t pt-3">
                <summary className="cursor-pointer text-sm">
                  Browse {types.length} product types
                </summary>
                <ul className="mt-3 space-y-3 text-sm">
                  {types.map((type) => (
                    <li key={type}>
                      <Link
                        className="hover:underline"
                        href={
                          "/shop?" +
                          new URLSearchParams({ department: group.slug, type })
                        }
                      >
                        {type}{" "}
                        <span className="text-muted-foreground">
                          (
                          {members.filter((p) => p.subcategory === type).length}
                          )
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}
