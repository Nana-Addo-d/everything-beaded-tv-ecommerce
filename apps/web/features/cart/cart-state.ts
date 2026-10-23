export type CartItem = { slug: string; quantity: number };
export const MAX_QUANTITY = 20;
export const CART_STORAGE_KEY = "everything-beaded:bag:v1";

export function readCart(
  value: unknown,
  validSlugs: readonly string[],
): CartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      !validSlugs.includes(item.slug) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    )
      continue;
    quantities.set(
      item.slug,
      Math.min(MAX_QUANTITY, (quantities.get(item.slug) ?? 0) + item.quantity),
    );
  }
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }));
}

export function parseCart(
  serialized: string | null,
  validSlugs: readonly string[],
): CartItem[] {
  try {
    return readCart(JSON.parse(serialized ?? "[]"), validSlugs);
  } catch {
    return [];
  }
}

export function setQuantity(
  items: CartItem[],
  slug: string,
  quantity: number,
  validSlugs: readonly string[],
) {
  const safeItems = readCart(items, validSlugs);
  if (
    !validSlugs.includes(slug) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0
  )
    return safeItems;
  const next = safeItems.filter((item) => item.slug !== slug);
  if (quantity > 0)
    next.push({ slug, quantity: Math.min(quantity, MAX_QUANTITY) });
  return next;
}
