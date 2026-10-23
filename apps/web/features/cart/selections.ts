export const SAVED_KEY = "everything-beaded:saved:v1";
export const RECENT_KEY = "everything-beaded:recent:v1";
export const MAX_SAVED = 200;
export const MAX_RECENT = 12;
export function selectionIds(
  value: unknown,
  valid: readonly string[],
  limit: number,
): string[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(valid);
  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string" && known.has(id),
      ),
    ),
  ].slice(0, limit);
}
export function parseSelection(
  raw: string | null,
  valid: readonly string[],
  limit: number,
) {
  try {
    return selectionIds(JSON.parse(raw ?? "[]"), valid, limit);
  } catch {
    return [];
  }
}
export function recordView(
  current: string[],
  slug: string,
  valid: readonly string[],
) {
  return selectionIds(
    valid.includes(slug) ? [slug, ...current] : current,
    valid,
    MAX_RECENT,
  );
}
export function addQuantity(current: number, amount: number, limit: number) {
  return Number.isSafeInteger(amount) && amount > 0 && current + amount <= limit
    ? current + amount
    : null;
}
