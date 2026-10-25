import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApiError, authenticated } from "@/lib/api";
import type { Product } from "@/lib/types";
import { displayCurrency, formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { ImageUpload } from "@/components/image-upload";
import { Icon } from "@/components/icons";
export const metadata = { title: "Product details" };
async function Details({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let product: Product;
  try {
    product = (
      await authenticated<{ data: Product }>(
        `/products/${id}`,
        `/products/${id}`,
      )
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <>
      <Link href="/dashboard" className="back-link">
        <Icon name="back" size={17} />
        Back to collection
      </Link>
      <div className="detail-grid">
        <div className="detail-image">
          <ProductImage src={product.image_url} name={product.name} priority />
        </div>
        <section className="detail-info">
          <span className="category-badge">{product.category.name}</span>
          <h1>{product.name}</h1>
          <span className="rating detail-rating">
            <Icon name="star" size={18} />
            {product.rating.toFixed(1)}
            <span>Product rating</span>
          </span>
          <p className="detail-price">
            {formatPrice(product.price, displayCurrency())}
          </p>
          <div className="detail-description">
            <h2>A closer look</h2>
            <p>
              {product.description ||
                "This product is part of your collection. Add an image to give it a little more personality."}
            </p>
          </div>
          <dl className="product-facts">
            <div>
              <dt>Category</dt>
              <dd>{product.category.name}</dd>
            </div>
            <div>
              <dt>Product ID</dt>
              <dd>RM-{String(product.id).padStart(4, "0")}</dd>
            </div>
          </dl>
        </section>
      </div>
      <ImageUpload productId={product.id} />
    </>
  );
}
export default function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="loading-state" role="status">
          Opening your product…
        </div>
      }
    >
      <Details {...props} />
    </Suspense>
  );
}
