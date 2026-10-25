import { readBoundedBody } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { ApiError, laravel, sessionToken } from "@/lib/api";
import { routeError, verifyOrigin } from "@/lib/route-utils";
import { MAX_IMAGE_BYTES, MAX_MULTIPART_BYTES } from "@/lib/policies";
import type { Product } from "@/lib/types";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    verifyOrigin(request);
    const token = await sessionToken();
    if (!token)
      throw new ApiError(401, {
        message: "Please sign in to upload an image.",
      });
    const { id } = await context.params;
    if (!/^\d+$/.test(id))
      throw new ApiError(404, { message: "Product not found." });
    if (Number(request.headers.get("content-length")) > MAX_MULTIPART_BYTES)
      throw new ApiError(413, {
        message: "Choose an image smaller than 5 MB.",
      });
    let body: FormData;
    try {
      const bytes = await readBoundedBody(request, MAX_MULTIPART_BYTES);
      body = await new Response(bytes, {
        headers: { "Content-Type": request.headers.get("content-type") || "" },
      }).formData();
    } catch (error) {
      if (error instanceof RangeError)
        throw new ApiError(413, {
          message: "Choose an image smaller than 5 MB.",
        });
      throw new ApiError(422, { message: "Choose a valid image file." });
    }
    const image = body.get("image");
    if (
      !(image instanceof File) ||
      image.size === 0 ||
      image.size > MAX_IMAGE_BYTES
    )
      throw new ApiError(422, {
        message: "Choose a JPEG, PNG, or WebP image up to 5 MB.",
      });
    const upload = new FormData();
    upload.set("image", image);
    const result = await laravel<{ data: Product }>(
      `/products/${id}/image`,
      { method: "POST", body: upload },
      token,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return routeError(error);
  }
}
