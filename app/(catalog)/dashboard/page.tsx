import Link from "next/link";
import { Suspense } from "react";
import { ApiError, authenticated } from "@/lib/api";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { pageNumbers } from "@/lib/catalog-query";
import { catalogQuery } from "@/lib/policies";
import { displayCurrency, formatPrice } from "@/lib/format";
import type { Category, ProductPage, SearchParams } from "@/lib/types";
import { CatalogFilters } from "@/components/catalog-filters";
import { ProductImage } from "@/components/product-image";
import { Icon } from "@/components/icons";
export const metadata = { title: "Product catalog" };
async function Catalog({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = catalogQuery(params);
  const returnTo = `/dashboard${query.size ? `?${query}` : ""}`;
  let products: ProductPage | undefined;
  let categories: Category[] = [];
  let validation = "";
  const results = await Promise.allSettled([
    authenticated<ProductPage>(`/products?${query}`, returnTo),
    authenticated<{ data: Category[] }>("/categories", returnTo),
  ]);
  if (results[1].status === "fulfilled") categories = results[1].value.data;
  else throw results[1].reason;
  if (results[0].status === "fulfilled") products = results[0].value;
  else if (
    results[0].reason instanceof ApiError &&
    results[0].reason.status === 422
  )
    validation =
      Object.values(results[0].reason.body.errors || {})
        .flat()
        .join(" ") || results[0].reason.message;
  else throw results[0].reason;
  const currency = displayCurrency();
  function pageLink(page: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `/dashboard?${next}`;
  }
  return (
    <>
      {params.notice === "deleted" ? (
        <p className="notice success-notice" role="status">
          Product deleted from the collection.
        </p>
      ) : null}
      <div className="page-heading">
        <div>
          <span className="eyebrow">CURATED BY YOU</span>
          <h1>
            Product catalog<span className="heading-dot">.</span>
          </h1>
          <p>A little inspiration. A lot to discover.</p>
        </div>
        <div className="heading-actions">
          <span className="collection-count">
            <Icon name="box" size={18} />
            {products?.meta.total ?? "—"} products
          </span>
          <Link className="button primary" href="/products/new">
            <Icon name="plus" size={17} />
            Add product
          </Link>
        </div>
      </div>
      <CatalogFilters
        categories={categories}
        query={query.toString()}
        currency={currency}
      />
      {validation ? (
        <div className="empty-state">
          <h2>Let’s adjust those filters.</h2>
          <p role="alert">{validation}</p>
          <Link className="button secondary" href="/dashboard">
            Reset filters
          </Link>
        </div>
      ) : null}
      {products ? (
        <>
          <div
            className="results-bar"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p>
              <strong>{query.size ? "Your results" : "The collection"}</strong>
              <span>
                {products.meta.total
                  ? `${products.meta.from ?? 0}–${products.meta.to ?? 0} of ${products.meta.total} products`
                  : "No products found"}
              </span>
            </p>
            <span className="results-hint">Something for your everyday</span>
          </div>
          {products.data.length ? (
            <div className="product-grid">
              {products.data.map((product, index) => (
                <Link
                  href={`/products/${product.id}`}
                  className="product-card"
                  key={product.id}
                >
                  <div className="card-image-wrap">
                    <ProductImage
                      src={product.image_url}
                      name={product.name}
                      priority={index < 3}
                    />
                    <span className="card-arrow">
                      <Icon name="arrow" size={18} />
                    </span>
                  </div>
                  <div className="product-card-content">
                    <div className="product-meta">
                      <span>{product.category.name}</span>
                      <span className="rating">
                        <Icon name="star" size={14} />
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                    <h2>{product.name}</h2>
                    <div className="card-bottom">
                      <strong>{formatPrice(product.price, currency)}</strong>
                      <span>
                        View product
                        <Icon name="arrow" size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="search" size={36} />
              <h2>
                {products.meta.total
                  ? "This page has no products."
                  : query.size
                    ? "No products match these filters."
                    : "Your collection starts here."}
              </h2>
              <p>
                {products.meta.total
                  ? "The collection may have changed. Return to the first page."
                  : query.size
                    ? "Remove a category, lower the minimum rating, or widen the price range."
                    : "Add your first product to start building the shared catalog."}
              </p>
              <Link
                className="button secondary"
                href={
                  products.meta.total
                    ? pageLink(1)
                    : query.size
                      ? "/dashboard"
                      : "/products/new"
                }
              >
                {products.meta.total
                  ? "Go to first page"
                  : query.size
                    ? "Clear filters"
                    : "Add product"}
              </Link>
            </div>
          )}
          <nav className="pagination" aria-label="Product pages">
            <span>
              Page {products.meta.current_page} of {products.meta.last_page}
            </span>
            <div>
              {products.meta.current_page > 1 ? (
                <Link
                  className="button secondary small"
                  href={pageLink(products.meta.current_page - 1)}
                >
                  <Icon name="back" size={16} />
                  Previous
                </Link>
              ) : (
                <span
                  className="button secondary small disabled"
                  aria-disabled="true"
                >
                  <Icon name="back" size={16} />
                  Previous
                </span>
              )}
              <div className="page-numbers">
                {pageNumbers(
                  products.meta.current_page,
                  products.meta.last_page,
                ).map((page, index) =>
                  page === null ? (
                    <span key={`gap-${index}`} aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <Link
                      key={page}
                      href={pageLink(page)}
                      className="page-number"
                      aria-label={`Page ${page}`}
                      aria-current={
                        page === products.meta.current_page ? "page" : undefined
                      }
                    >
                      {page}
                    </Link>
                  ),
                )}
              </div>
              {products.meta.current_page < products.meta.last_page ? (
                <Link
                  className="button secondary small"
                  href={pageLink(products.meta.current_page + 1)}
                >
                  Next
                  <Icon name="arrow" size={16} />
                </Link>
              ) : (
                <span
                  className="button secondary small disabled"
                  aria-disabled="true"
                >
                  Next
                  <Icon name="arrow" size={16} />
                </span>
              )}
            </div>
          </nav>
        </>
      ) : null}
    </>
  );
}
export default function Dashboard(props: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Catalog {...props} />
    </Suspense>
  );
}
