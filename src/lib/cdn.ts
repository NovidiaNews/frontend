// "use client" is intentionally omitted: this helper is safe for both
// server components and client components.

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/+$/, "") || "";

/**
 * Prefixes a media path with the configured CDN origin when one is set.
 * Absolute URLs pass through unchanged; relative paths are resolved so that
 * "/media/x.png" and "media/x.png" both work.
 */
export function cdnUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("<svg")) {
    return path;
  }
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${CDN_URL}${clean}`;
}

/** True when a CDN is configured at build time. */
export const hasCdn = Boolean(CDN_URL);