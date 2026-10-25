import { NextResponse } from "next/server";
import { ApiError, laravel, SESSION_COOKIE } from "@/lib/api";
import { cookieOptions, readJson, routeError, verifyOrigin } from "@/lib/route-utils";
import { safeReturnTo } from "@/lib/policies";
import type { User } from "@/lib/types";
export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const body = await readJson(request);
    if (typeof body.email !== "string" || typeof body.password !== "string") throw new ApiError(422, { message: "Email and password are required." });
    const result = await laravel<{ data: { user: User; token: string; expires_at: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email: body.email, password: body.password }) });
    const response = NextResponse.json({ user: result.data.user, redirect: safeReturnTo(body.next) }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, result.data.token, cookieOptions(new Date(result.data.expires_at)));
    return response;
  } catch (error) { return routeError(error); }
}
