const catalogKeys = new Set([
  "search",
  "category_id",
  "min_rating",
  "min_price",
  "max_price",
  "sort_by",
  "sort_direction",
  "page",
  "per_page",
]);
export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/dashboard";
  try {
    const parsed = new URL(value, "https://rightmo.invalid");
    if (
      parsed.origin !== "https://rightmo.invalid" ||
      !(
        parsed.pathname === "/dashboard" ||
        parsed.pathname === "/products/new" ||
        /^\/products\/\d+(?:\/edit)?$/.test(parsed.pathname)
      )
    )
      return "/dashboard";
    return parsed.pathname + parsed.search;
  } catch {
    return "/dashboard";
  }
}
export function isSameOrigin(origin: string | null, expected: string): boolean {
  try {
    return origin !== null && origin === new URL(expected).origin;
  } catch {
    return false;
  }
}
export function catalogQuery(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "category_ids[]") {
      for (const item of Array.isArray(value)
        ? value
        : value === undefined
          ? []
          : [value])
        query.append(key, item);
      continue;
    }
    if (
      catalogKeys.has(key) &&
      typeof value === "string" &&
      value.trim() !== ""
    )
      query.set(key, value.trim());
  }
  return query;
}
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_MULTIPART_BYTES = 6 * 1024 * 1024;

export const MAX_PRODUCT_JSON_BYTES = 64 * 1024;
