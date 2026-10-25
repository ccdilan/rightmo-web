import Link from "next/link";
import { Suspense } from "react";
import { authenticated } from "@/lib/api";
import { displayCurrency } from "@/lib/format";
import type { Category } from "@/lib/types";
import { ProductForm } from "@/components/product-form";
import { Icon } from "@/components/icons";

export const metadata = { title: "Add product" };
async function NewProduct() {
  const { data: categories } = await authenticated<{ data: Category[] }>(
    "/categories",
    "/products/new",
  );
  return (
    <div className="editor-page">
      <Link href="/dashboard" className="back-link">
        <Icon name="back" size={17} />
        Back to collection
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GROW YOUR COLLECTION</span>
          <h1>
            Add product<span className="heading-dot">.</span>
          </h1>
          <p>Add the details now. You can upload an image after saving.</p>
        </div>
      </div>
      <ProductForm categories={categories} currency={displayCurrency()} />
    </div>
  );
}
export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-state" role="status">
          Getting the product form ready…
        </div>
      }
    >
      <NewProduct />
    </Suspense>
  );
}
