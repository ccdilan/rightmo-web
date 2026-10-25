"use client";
import { useRouter } from "next/navigation";
import { useId, useTransition, type FormEvent } from "react";
import {
  queryFromForm,
  selectedCategories,
  withoutFilter,
} from "@/lib/catalog-query";
import type { Category } from "@/lib/types";
import { Icon } from "./icons";

export function CatalogFilters({
  categories,
  query,
  currency,
}: {
  categories: Category[];
  query: string;
  currency: string;
}) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const current = new URLSearchParams(query);
  const selected = selectedCategories(current);
  function navigate(next: URLSearchParams) {
    startTransition(() =>
      router.push(`/dashboard${next.size ? `?${next}` : ""}`, {
        scroll: false,
      }),
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const maximum = form.elements.namedItem("max_price") as HTMLInputElement;
    const minimum = String(data.get("min_price") || "");
    maximum.setCustomValidity(
      minimum && maximum.value && Number(maximum.value) < Number(minimum)
        ? "Maximum price must be at least the minimum price."
        : "",
    );
    if (!form.reportValidity()) return;
    navigate(queryFromForm(data));
  }
  const chips: { key: string; value?: string; label: string }[] = [];
  if (current.get("search"))
    chips.push({ key: "search", label: `Search: ${current.get("search")}` });
  for (const categoryId of selected)
    chips.push({
      key: current.has("category_id") ? "category_id" : "category_ids[]",
      value: current.has("category_id") ? undefined : categoryId,
      label:
        categories.find((category) => String(category.id) === categoryId)
          ?.name || `Category ${categoryId}`,
    });
  if (current.has("min_price"))
    chips.push({
      key: "min_price",
      label: `Min ${current.get("min_price")} ${currency}`,
    });
  if (current.has("max_price"))
    chips.push({
      key: "max_price",
      label: `Max ${current.get("max_price")} ${currency}`,
    });
  if (current.has("min_rating"))
    chips.push({
      key: "min_rating",
      label: `${current.get("min_rating")} stars & up`,
    });
  return (
    <div className="catalog-discovery">
      <form
        key={query}
        className="filter-panel"
        onSubmit={submit}
        aria-label="Filter products"
        aria-busy={pending}
        onInput={(event) => {
          const form = event.currentTarget;
          (
            form.elements.namedItem("max_price") as HTMLInputElement
          ).setCustomValidity("");
        }}
      >
        <fieldset disabled={pending} className="filter-fields">
          <legend className="sr-only">Find products</legend>
          <div className="discovery-top">
            <div className="discovery-search">
              <label htmlFor={`${id}-search`}>Search products</label>
              <div className="search-field">
                <Icon name="search" size={19} />
                <input
                  id={`${id}-search`}
                  name="search"
                  type="search"
                  placeholder="Try wireless studio…"
                  defaultValue={current.get("search") || ""}
                  maxLength={160}
                  aria-describedby={`${id}-search-hint`}
                />
              </div>
              <p id={`${id}-search-hint`} className="control-hint">
                Match every word in the product name, in any order. Up to 8
                words.
              </p>
            </div>
            <div className="discovery-control">
              <label htmlFor={`${id}-sort`}>Sort by</label>
              <select
                id={`${id}-sort`}
                name="sort"
                defaultValue={
                  current.has("sort_by")
                    ? `${current.get("sort_by")}:${current.get("sort_direction") || "desc"}`
                    : ""
                }
              >
                <option value="">Newest first</option>
                <option value="price:asc">Price: low to high</option>
                <option value="price:desc">Price: high to low</option>
                <option value="rating:desc">Rating: highest first</option>
                <option value="rating:asc">Rating: lowest first</option>
              </select>
            </div>
          </div>
          <fieldset className="category-options">
            <legend>
              Categories{" "}
              <span className="control-hint">Choose any · none means all</span>
            </legend>
            <div className="category-choices">
              {categories.map((category) => (
                <label key={category.id} className="category-choice">
                  <input
                    type="checkbox"
                    name="category_ids[]"
                    value={category.id}
                    defaultChecked={selected.includes(String(category.id))}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="discovery-bottom">
            <div className="discovery-control">
              <label htmlFor={`${id}-min`}>Min price ({currency})</label>
              <input
                id={`${id}-min`}
                name="min_price"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                placeholder="No minimum"
                defaultValue={current.get("min_price") || ""}
              />
            </div>
            <div className="discovery-control">
              <label htmlFor={`${id}-max`}>Max price ({currency})</label>
              <input
                id={`${id}-max`}
                name="max_price"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                placeholder="No maximum"
                defaultValue={current.get("max_price") || ""}
              />
            </div>
            <div className="discovery-control">
              <label htmlFor={`${id}-rating`}>Minimum rating</label>
              <select
                id={`${id}-rating`}
                name="min_rating"
                defaultValue={current.get("min_rating") || ""}
              >
                <option value="">Any rating</option>
                {[4.5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} stars & up
                  </option>
                ))}
                {current.has("min_rating") &&
                !["4.5", "4", "3", "2", "1"].includes(
                  current.get("min_rating")!,
                ) ? (
                  <option value={current.get("min_rating")!}>
                    {current.get("min_rating")} stars & up
                  </option>
                ) : null}
              </select>
            </div>
            <div className="discovery-control">
              <label htmlFor={`${id}-size`}>Per page</label>
              <select
                id={`${id}-size`}
                name="per_page"
                defaultValue={current.get("per_page") || "12"}
              >
                {[12, 24, 48].map((size) => (
                  <option key={size} value={size}>
                    {size} products
                  </option>
                ))}
                {current.has("per_page") &&
                !["12", "24", "48"].includes(current.get("per_page")!) ? (
                  <option value={current.get("per_page")!}>
                    {current.get("per_page")} products
                  </option>
                ) : null}
              </select>
            </div>
          </div>
          <div className="discovery-actions">
            <p className="control-hint">
              Combine filters, then apply to update your results.
            </p>
            <button className="button primary" disabled={pending} type="submit">
              {pending ? "Applying…" : "Apply filters"}
              <Icon name="search" size={16} />
            </button>
          </div>
        </fieldset>
      </form>
      {chips.length ? (
        <div className="active-filters" aria-label="Applied filters">
          <span>Applied:</span>
          {chips.map((chip) => (
            <button
              className="filter-chip"
              key={`${chip.key}-${chip.value || ""}`}
              type="button"
              disabled={pending}
              onClick={() =>
                navigate(withoutFilter(current, chip.key, chip.value))
              }
              aria-label={`Remove ${chip.label}`}
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            className="text-button"
            disabled={pending}
            onClick={() => navigate(new URLSearchParams())}
          >
            Clear all filters
          </button>
        </div>
      ) : null}
      <span className="sr-only" role="status">
        {pending ? "Updating product results…" : ""}
      </span>
    </div>
  );
}
