import { Suspense } from "react";
import { authenticated } from "@/lib/api";
import type { ManagedCategory } from "@/lib/types";
import { CategoryManager } from "@/components/category-manager";
import { LoadingSkeleton } from "@/components/loading-skeleton";

export const metadata = { title: "Categories" };
async function Categories() {
  const { data } = await authenticated<{ data: ManagedCategory[] }>(
    "/categories",
    "/categories",
  );
  return <CategoryManager categories={data} />;
}
export default function CategoriesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton kind="form" label="categories" />}>
      <Categories />
    </Suspense>
  );
}
