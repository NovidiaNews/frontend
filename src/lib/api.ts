/**
 * Central API configuration.
 *
 * Novidia's API is deployed as its own service (in production
 * `https://api.novidia.eu`) rather than being proxied through the website.
 * The frontend talks to it directly:
 *
 *   NEXT_PUBLIC_API_URL=https://api.novidia.eu
 *
 * When the variable is missing (local development without env setup) we fall
 * back to the relative `/api` path, which `next.config.ts` rewrites to the
 * local backend. This keeps `npm run dev` working out of the box while
 * production is fully decoupled.
 */
const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

/** Base URL for every API call (no trailing slash). */
export const API_URL = configured ? configured.replace(/\/+$/, "") : "/api";

/** True when the frontend talks to a separate API origin (production). */
export const IS_CROSS_ORIGIN = /^https?:\/\//i.test(API_URL);

/**
 * `fetch` wrapper that always targets the API base and sends cookies, so
 * httpOnly auth cookies keep working when the website and API live on
 * different subdomains.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = /^https?:\/\//i.test(path) ? path : `${API_URL}${path}`;
  return fetch(url, { credentials: "include", ...init });
}
