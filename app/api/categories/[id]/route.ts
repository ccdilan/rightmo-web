import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ApiError, laravel, sessionToken } from "@/lib/api";
import { readJson, routeError, verifyOrigin } from "@/lib/route-utils";
import type { ManagedCategory } from "@/lib/types";

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
        message: "Please sign in to manage categories.",
      });
    const { id } = await context.params;
    if (!/^\d+$/.test(id))
      throw new ApiError(404, { message: "Category not found." });
    const input = method === "PATCH" ? await readJson(request) : undefined;
    const result = await laravel<{ data: ManagedCategory }>(
      `/categories/${id}`,
      {
        method,
        body: input ? JSON.stringify({ name: input.name }) : undefined,
      },
      token,
    );
    revalidatePath("/", "layout");
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
