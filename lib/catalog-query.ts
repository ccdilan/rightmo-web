export function selectedCategories(query: URLSearchParams): string[] {
  const multiple = query.getAll("category_ids[]");
  return multiple.length
    ? multiple
    : query.has("category_id")
      ? [query.get("category_id")!]
      : [];
}

export function queryFromForm(data: FormData): URLSearchParams {
  const query = new URLSearchParams();
  for (const key of [
    "search",
    "min_price",
    "max_price",
    "min_rating",
    "per_page",
  ]) {
    const value = String(data.get(key) || "").trim();
    if (value && !(key === "per_page" && value === "12")) query.set(key, value);
  }
  for (const value of new Set(data.getAll("category_ids[]").map(String)))
    query.append("category_ids[]", value);
  const sort = String(data.get("sort") || "");
  if (sort) {
    const [field, direction] = sort.split(":");
    query.set("sort_by", field);
    query.set("sort_direction", direction);
  }
  return query;
}

export function withoutFilter(
  query: URLSearchParams,
  key: string,
  value?: string,
): URLSearchParams {
  const next = new URLSearchParams(query);
  if (value === undefined) next.delete(key);
  else next.delete(key, value);
  next.delete("page");
  return next;
}

export function pageNumbers(current: number, last: number): (number | null)[] {
  const pages = [...new Set([1, last, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index) =>
    index > 0 && page - pages[index - 1] > 1 ? [null, page] : [page],
  );
}
