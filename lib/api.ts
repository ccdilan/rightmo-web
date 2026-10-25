import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiErrorBody, User } from "./types";
import { safeReturnTo } from "./policies";
export const SESSION_COOKIE = "rightmo_session";
export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody) { super(body.message); }
}
export async function laravel<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${process.env.API_INTERNAL_URL || "http://127.0.0.1:8080"}/api/v1${path}`, {
      ...init, headers, cache: "no-store", signal: AbortSignal.timeout(init.body instanceof FormData ? 30000 : 10000),
    });
  } catch { throw new ApiError(503, { message: "We couldn't reach the catalog service. Please try again." }); }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status === 401 ? "Your session has expired. Please sign in again." : "The request couldn't be completed. Please try again.";
    throw new ApiError(response.status, { message: typeof body?.message === "string" ? body.message : fallback, ...(body?.errors ? { errors: body.errors } : {}) });
  }
  if (body === null) throw new ApiError(502, { message: "The catalog returned an invalid response. Please try again." });
  return body as T;
}
export async function sessionToken(): Promise<string | undefined> { return (await cookies()).get(SESSION_COOKIE)?.value; }
export async function authenticated<T>(path: string, returnTo = "/dashboard"): Promise<T> {
  const token = await sessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(safeReturnTo(returnTo))}`);
  try { return await laravel<T>(path, {}, token); }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login?expired=1&next=${encodeURIComponent(safeReturnTo(returnTo))}`);
    throw error;
  }
}
export async function currentUser(returnTo = "/dashboard"): Promise<User> { return (await authenticated<{ data: User }>("/auth/me", returnTo)).data; }
