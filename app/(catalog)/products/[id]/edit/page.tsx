import Link from "next/link";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApiError, authenticated } from "@/lib/api";
import { displayCurrency } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { ProductForm } from "@/components/product-form";
import { Icon } from "@/components/icons";

export const metadata = { title: "Edit product" };
async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let product: Product;
  let categories: Category[];
  try {
    const [item, options] = await Promise.all([
      authenticated<{ data: Product }>(
        `/products/${id}`,
        `/products/${id}/edit`,
      ),
      authenticated<{ data: Category[] }>(
        "/categories",
        `/products/${id}/edit`,
      ),
    ]);
    product = item.data;
    categories = options.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <div className="editor-page">
      <Link href={`/products/${id}`} className="back-link">
        <Icon name="back" size={17} />
        Back to product
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">REFINE THE DETAILS</span>
          <h1>
            Edit product<span className="heading-dot">.</span>
          </h1>
          <p>Update {product.name} for everyone in your workspace.</p>
        </div>
      </div>
      <ProductForm
        key={JSON.stringify(product)}
        product={product}
        categories={categories}
        currency={displayCurrency()}
      />
    </div>
  );
}
export default function EditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingSkeleton kind="form" />}>
      <EditProduct {...props} />
    </Suspense>
  );
}
