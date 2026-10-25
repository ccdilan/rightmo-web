import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ApiError, laravel, sessionToken } from "@/lib/api";
import { readJson, routeError, verifyOrigin } from "@/lib/route-utils";
import type { ManagedCategory } from "@/lib/types";

export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const token = await sessionToken();
    if (!token)
      throw new ApiError(401, {
        message: "Please sign in to manage categories.",
      });
    const body = await readJson(request);
    const result = await laravel<{ data: ManagedCategory }>(
      "/categories",
      { method: "POST", body: JSON.stringify({ name: body.name }) },
      token,
    );
    revalidatePath("/", "layout");
    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return routeError(error);
  }
}
