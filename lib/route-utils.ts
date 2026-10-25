import "server-only";
import { readBoundedBody } from "./request-body";
import { NextResponse } from "next/server";
import { ApiError, SESSION_COOKIE } from "./api";
import { isSameOrigin } from "./policies";
export function appOrigin(): string {
  return process.env.APP_ORIGIN || "http://localhost:3000";
}
export function verifyOrigin(request: Request): void {
  if (!isSameOrigin(request.headers.get("origin"), appOrigin()))
    throw new ApiError(403, {
      message: "This request is not allowed. Reload the page and try again.",
    });
}
export function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: new URL(appOrigin()).protocol === "https:",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}
export function routeError(error: unknown): NextResponse {
  const known =
    error instanceof ApiError
      ? error
      : new ApiError(500, {
          message: "Something went wrong. Please try again.",
        });
  const response = NextResponse.json(known.body, {
    status: known.status,
    headers: { "Cache-Control": "no-store" },
  });
  if (known.status === 401)
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const bytes = await readBoundedBody(request, 8192);
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch (error) {
    if (error instanceof RangeError)
      throw new ApiError(413, { message: "The request is too large." });
    throw new ApiError(422, { message: "Please submit a valid form." });
  }
}
