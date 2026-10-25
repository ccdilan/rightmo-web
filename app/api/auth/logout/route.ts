import { NextResponse } from "next/server";
import { ApiError, laravel, sessionToken, SESSION_COOKIE } from "@/lib/api";
import { cookieOptions, routeError, verifyOrigin } from "@/lib/route-utils";
export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const token = await sessionToken();
    if (token) {
      try {
        await laravel("/auth/logout", { method: "POST" }, token);
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      }
    }
    const response = new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    return routeError(error);
  }
}
