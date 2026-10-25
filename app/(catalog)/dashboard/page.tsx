import Link from "next/link";
import { Suspense } from "react";
import { ApiError, authenticated } from "@/lib/api";
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
      <CatalogFilters categories={categories} query={query.toString()} />
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
          <div className="results-bar">
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
              <h2>No finds just yet.</h2>
              <p>Try a different search or a wider price range.</p>
              <Link className="button secondary" href="/dashboard">
                Explore all products
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
    <Suspense
      fallback={
        <div className="loading-state" role="status">
          <span className="loading-dot" />
          Getting your collection ready…
        </div>
      }
    >
      <Catalog {...props} />
    </Suspense>
  );
}
