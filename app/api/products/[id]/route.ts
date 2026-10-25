import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ApiError, laravel, sessionToken } from "@/lib/api";
import { MAX_PRODUCT_JSON_BYTES } from "@/lib/policies";
import { productInput } from "@/lib/product-input";
import { readJson, routeError, verifyOrigin } from "@/lib/route-utils";
import type { Product } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

async function mutate(
  request: Request,
  context: Context,
  method: "PATCH" | "DELETE",
) {
  try {
    verifyOrigin(request);
    const token = await sessionToken();
    if (!token)
      throw new ApiError(401, {
        message: "Please sign in to manage products.",
      });
    const { id } = await context.params;
    if (!/^\d+$/.test(id))
      throw new ApiError(404, { message: "Product not found." });
    const body =
      method === "PATCH"
        ? JSON.stringify(
            productInput(await readJson(request, MAX_PRODUCT_JSON_BYTES)),
          )
        : undefined;
    const result = await laravel<{ data: Product }>(
      `/products/${id}`,
      { method, body },
      token,
    );
    revalidatePath("/dashboard");
    revalidatePath(`/products/${id}`);
    revalidatePath(`/products/${id}/edit`);
    return method === "DELETE"
      ? new NextResponse(null, {
          status: 204,
          headers: { "Cache-Control": "no-store" },
        })
      : NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  return mutate(request, context, "PATCH");
}

export async function DELETE(request: Request, context: Context) {
  return mutate(request, context, "DELETE");
}
