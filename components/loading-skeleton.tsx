export function LoadingSkeleton({
  kind = "catalog",
}: {
  kind?: "catalog" | "detail" | "form";
}) {
  return (
    <div className={`loading-skeleton skeleton-${kind}`} role="status">
      <span className="sr-only">
        Loading{" "}
        {kind === "catalog"
          ? "products"
          : kind === "detail"
            ? "product details"
            : "product form"}
        …
      </span>
      <div aria-hidden="true">
        <div className="skeleton-block skeleton-heading" />
        <div className="skeleton-block skeleton-subheading" />
        {kind === "catalog" ? (
          <>
            <div className="skeleton-block skeleton-filters" />
            <div className="product-grid">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="skeleton-card">
                  <div className="skeleton-block skeleton-picture" />
                  <div className="skeleton-block skeleton-line" />
                  <div className="skeleton-block skeleton-line short" />
                </div>
              ))}
            </div>
          </>
        ) : kind === "detail" ? (
          <div className="detail-grid">
            <div className="skeleton-block skeleton-detail-picture" />
            <div>
              {[1, 2, 3, 4].map((line) => (
                <div key={line} className="skeleton-block skeleton-line" />
              ))}
            </div>
          </div>
        ) : (
          <div className="product-form">
            {[1, 2, 3, 4].map((line) => (
              <div key={line} className="skeleton-block skeleton-field" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
