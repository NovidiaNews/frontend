"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { API_URL } from "@/lib/api";

let cachedIp: string | null = null;
let ipPromise: Promise<string | null> | null = null;
let deviceProfile: Record<string, unknown> | null = null;

function getPublicIp(): Promise<string | null> {
  if (cachedIp) return Promise.resolve(cachedIp);
  if (ipPromise) return ipPromise;
  ipPromise = fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) })
    .then((r) => r.json())
    .then((d) => { cachedIp = d.ip; return d.ip; })
    .catch(() => null);
  return ipPromise;
}

// Fonts that ship with common OS/browser installs — probing them gives a
// reasonably distinguishing font fingerprint without enumerating every family
// the browser can render.
const PROBE_FONTS = [
  "Arial", "Arial Black", "Calibri", "Cambria", "Comic Sans MS", "Consolas",
  "Courier New", "Garamond", "Georgia", "Helvetica", "Impact", "Lucida Console",
  "Microsoft YaHei", "Palatino Linotype", "Segoe UI", "Tahoma", "Times New Roman",
  "Trebuchet MS", "Verdana", "Candara", "Corbel", "Franklin Gothic Medium",
  "Gill Sans", "Optima", "Futura", "Menlo", "Monaco", "San Francisco",
  "Ubuntu", "DejaVu Sans", "Liberation Sans", "Noto Sans", "Roboto",
  "Open Sans", "Lato", "Montserrat", "Source Sans Pro", "JetBrains Mono",
  "SF Pro Text", "HarmonyOS Sans", "MiSans", "Inter",
];

function detectFonts(): string[] | null {
  try {
    const base = document.createElement("canvas").getContext("2d")!;
    base.font = "72px monospace";
    const baseWidth = base.measureText("mmmmmmmmmmlli").width;
    const serif = document.createElement("canvas").getContext("2d")!;
    serif.font = "72px serif";
    const serifWidth = serif.measureText("mmmmmmmmmmlli").width;
    if (baseWidth === serifWidth) return null; // font masking in use — result is unreliable

    const ctx = document.createElement("canvas").getContext("2d")!;
    const found: string[] = [];
    for (const font of PROBE_FONTS) {
      ctx.font = `72px "${font}", monospace`;
      if (ctx.measureText("mmmmmmmmmmlli").width !== baseWidth) found.push(font);
    }
    return found;
  } catch {
    return null;
  }
}

function detectWebgl(): { vendor: string; renderer: string } | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;
    return {
      vendor: String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? ""),
      renderer: String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? ""),
    };
  } catch {
    return null;
  }
}

function buildDeviceProfile(): Record<string, unknown> {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number; rtt?: number } };
  const screenData = typeof screen !== "undefined" ? screen : null;
  const gl = detectWebgl();

  return {
    screen: screenData
      ? {
          width: screenData.width,
          height: screenData.height,
          availWidth: screenData.availWidth,
          availHeight: screenData.availHeight,
          colorDepth: screenData.colorDepth,
          pixelDepth: screenData.pixelDepth,
          orientation: screenData.orientation?.type ?? null,
        }
      : null,
    viewport:
      typeof window !== "undefined"
        ? { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio }
        : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    userAgentData:
      typeof navigator !== "undefined" && "userAgentData" in navigator
        ? {
            mobile: (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ?? null,
            platform: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? null,
          }
        : null,
    platform: typeof navigator !== "undefined" ? navigator.platform : null,
    languages: typeof navigator !== "undefined" ? [navigator.language, ...(navigator.languages ?? [])].filter(Boolean) : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    timezoneOffset: new Date().getTimezoneOffset(),
    touchSupport: typeof navigator !== "undefined" ? navigator.maxTouchPoints ?? 0 : 0,
    cookiesEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : null,
    doNotTrack: typeof navigator !== "undefined" ? navigator.doNotTrack : null,
    hardware: {
      cores: typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? null : null,
      deviceMemoryGb: nav.deviceMemory ?? null,
      online: typeof navigator !== "undefined" ? navigator.onLine : null,
    },
    network: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType ?? null,
          downlinkMbps: nav.connection.downlink ?? null,
          rttMs: nav.connection.rtt ?? null,
        }
      : null,
    graphics: gl,
    fonts: detectFonts(),
    storage: {
      localStorage: (() => {
        try {
          localStorage.setItem("__novidia_probe", "1");
          localStorage.removeItem("__novidia_probe");
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem("__novidia_probe", "1");
          sessionStorage.removeItem("__novidia_probe");
          return true;
        } catch {
          return false;
        }
      })(),
    },
    colorScheme: typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : null,
    reducedMotion: typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : null,
    collectedAt: new Date().toISOString(),
  };
}

function getDeviceProfile(): Record<string, unknown> | null {
  if (deviceProfile) return deviceProfile;
  if (typeof window === "undefined") return null;
  try {
    deviceProfile = buildDeviceProfile();
    return deviceProfile;
  } catch {
    return null;
  }
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
        body: JSON.stringify({ path: pathname, device: getDeviceProfile() ?? undefined }),
        signal: controller.signal,
        credentials: "include",
      }).catch(() => {});
    });

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
