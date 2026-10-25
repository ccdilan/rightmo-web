import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ApiError, laravel, sessionToken } from "@/lib/api";
import { MAX_PRODUCT_JSON_BYTES } from "@/lib/policies";
import { productInput } from "@/lib/product-input";
import { readJson, routeError, verifyOrigin } from "@/lib/route-utils";
import type { Product } from "@/lib/types";

export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const token = await sessionToken();
    if (!token)
      throw new ApiError(401, {
        message: "Please sign in to create a product.",
      });
    const body = productInput(await readJson(request, MAX_PRODUCT_JSON_BYTES));
    const result = await laravel<{ data: Product }>(
      "/products",
      { method: "POST", body: JSON.stringify(body) },
      token,
    );
    revalidatePath("/dashboard");
    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return routeError(error);
  }
}
