"use client";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import type { Category } from "@/lib/types";
import { Icon } from "./icons";
export function CatalogFilters({ categories, query }: { categories: Category[]; query: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current = new URLSearchParams(query);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["search", "category_id", "min_price", "max_price"]) { const value = String(data.get(key) || "").trim(); if (value) next.set(key, value); }
    const sort = String(data.get("sort") || "");
    if (sort) { const [field, direction] = sort.split(":"); next.set("sort_by", field); next.set("sort_direction", direction); }
    if (current.has("per_page")) next.set("per_page", current.get("per_page")!);
    startTransition(() => router.push(`/dashboard${next.size ? `?${next}` : ""}`));
  }
  return <form key={query} className="filter-panel" onSubmit={submit} aria-label="Filter products" aria-busy={pending}>
    <div className="filter-top">
      <div className="search-field"><Icon name="search" size={19} /><label className="sr-only" htmlFor="search">Search products</label><input id="search" name="search" placeholder="Search your collection…" defaultValue={current.get("search") || ""} maxLength={160} /></div>
      <div className="select-field"><label className="sr-only" htmlFor="category">Category</label><select id="category" name="category_id" defaultValue={current.get("category_id") || ""}><option value="">All categories</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      <div className="select-field"><label className="sr-only" htmlFor="sort">Sort products</label><select id="sort" name="sort" defaultValue={current.has("sort_by") ? `${current.get("sort_by")}:${current.get("sort_direction") || "desc"}` : ""}><option value="">Newest first</option><option value="price:asc">Price: low to high</option><option value="price:desc">Price: high to low</option><option value="rating:desc">Rating: highest first</option><option value="rating:asc">Rating: lowest first</option></select></div>
    </div>
    <div className="filter-bottom"><span className="filter-label">Price range</span><label className="sr-only" htmlFor="min-price">Minimum price</label><input id="min-price" name="min_price" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Min" defaultValue={current.get("min_price") || ""} /><span className="range-dash">—</span><label className="sr-only" htmlFor="max-price">Maximum price</label><input id="max-price" name="max_price" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Max" defaultValue={current.get("max_price") || ""} /><button className="button primary small" disabled={pending} type="submit">{pending ? "Applying…" : "Apply filters"}</button>{current.size ? <button className="text-button" type="button" onClick={() => startTransition(() => router.push("/dashboard"))}>Clear all</button> : null}</div>
  </form>;
}
