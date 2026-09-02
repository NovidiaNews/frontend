"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_URL = "/api";

let cachedIp: string | null = null;
let ipPromise: Promise<string | null> | null = null;

function getPublicIp(): Promise<string | null> {
  if (cachedIp) return Promise.resolve(cachedIp);
  if (ipPromise) return ipPromise;
  ipPromise = fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) })
    .then((r) => r.json())
    .then((d) => { cachedIp = d.ip; return d.ip; })
    .catch(() => null);
  return ipPromise;
}

export default function VisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || lastPath.current === pathname) return;
    lastPath.current = pathname;

    const consent = localStorage.getItem("novidia_cookie_consent");
    if (!consent) return;
    try {
      const parsed = JSON.parse(consent);
      if (!parsed.analytics) return;
    } catch {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    getPublicIp().then((ip) => {
      fetch(`${API_URL}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Novidia-Consent": "analytics",
          ...(ip ? { "X-Real-Ip": ip } : {}),
        },
        body: JSON.stringify({ path: pathname }),
        signal: controller.signal,
        credentials: "include",
      }).catch(() => {});
    });

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}