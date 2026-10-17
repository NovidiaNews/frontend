"use client";

/**
 * Custom theme engine (Discord-style, free for everyone).
 *
 * One base colour — or a two-stop gradient — derives the ENTIRE interface
 * palette (backgrounds, surfaces, borders, inks, brand ramp) separately for
 * the light and the dark theme, using OKLab/OKLCH so the result stays
 * perceptually even (no muddy greys, no hue drift when we push lightness
 * around).
 *
 * Accent "spec" format: `#RRGGBB` (solid) or `#RRGGBB,#RRGGBB` (gradient).
 * Gradients render through `--color-brand-gradient` on `.bg-main` elements
 * (see globals.css), while the derived palette is based on the OKLab mix of
 * both stops so surrounding chrome still matches.
 *
 * Application strategy:
 *  - both palettes are injected as ONE style tag holding
 *    `html:not(.dark) { … }` (light) + `html.dark { … }` (dark). Each beats
 *    the stock `:root` / `.dark` blocks on specificity, so the cascade
 *    follows the `dark` class by itself — no inline custom properties that
 *    can outlive a theme flip, and no MutationObserver to keep in sync.
 *    Every toggler path (MagicUI, useTheme, AccentSync, the pre-paint
 *    script) therefore behaves the same.
 *
 * Both palettes are cached in localStorage so the pre-paint script in
 * layout.tsx can apply them before first paint (no flash of stock colours).
 */
const STORAGE_KEY = "novidia-accent";
const PALETTES_KEY = `${STORAGE_KEY}-palettes`;
const ENABLED_KEY = `${STORAGE_KEY}-enabled`;
const LEGACY_SHADES_KEY = `${STORAGE_KEY}-shades`;
export const ACCENT_STYLE_ID = "novidia-accent-theme";

export const DEFAULT_ACCENT = "#36316A";

/** Every token the engine owns — used when clearing a custom theme and when
 *  scrubbing the inline copies older builds parked on <html>. */
const TOKEN_KEYS = [
  "--color-main",
  "--color-lighter",
  "--color-medium",
  "--color-light",
  "--color-lightest",
  "--color-superwhite",
  "--color-app",
  "--color-surface",
  "--color-surface-raised",
  "--color-edge",
  "--color-edge-strong",
  "--color-ink",
  "--color-ink-muted",
  "--color-ink-subtle",
  "--color-accent",
  "--color-on-brand",
  "--shadow-card",
] as const;

const GRADIENT_VAR = "--color-brand-gradient";
const GRADIENT_CLASS = "accent-gradient";

export interface ThemePalettes {
  light: Record<string, string>;
  dark: Record<string, string>;
  /** `linear-gradient(...)` for brand fills, or null for solid. */
  gradient?: string | null;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Parse an accent spec: `#hex` or `#hex,#hex` (or multi-stop) → normalized uppercase list, or null. */
export function parseAccentSpec(value: unknown): string[] | null {
  if (typeof value !== "string") return null;
  const parts = value.split(",").map((s) => s.trim());
  if (parts.length < 1 || parts.length > 4) return null;
  if (!parts.every(isHexColor)) return null;
  return parts.map((p) => p.toUpperCase());
}

export function isAccentSpec(value: unknown): boolean {
  return parseAccentSpec(value) !== null;
}

// ---------------------------------------------------------------------------
// OKLab / OKLCH colour maths
// ---------------------------------------------------------------------------

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelToHex(v: number): string {
  return clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
}

interface Oklch {
  L: number;
  C: number;
  h: number; // degrees
}

function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex);
  const rl = srgbToLinear(r / 255);
  const gl = srgbToLinear(g / 255);
  const bl = srgbToLinear(b / 255);

  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    L,
    C: Math.sqrt(a * a + bb * bb),
    h: (Math.atan2(bb, a) * 180) / Math.PI,
  };
}

function oklchToHex(L: number, C: number, hDeg: number): string {
  const targetL = clamp(L, 0, 1);
  let chroma = Math.max(0, C);
  const rad = (hDeg * Math.PI) / 180;

  const build = (c: number): [number, number, number] | null => {
    const a = c * Math.cos(rad);
    const b = c * Math.sin(rad);
    const l_ = targetL + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = targetL - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = targetL - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    const rl = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    if (rl < -0.0005 || rl > 1.0005 || gl < -0.0005 || gl > 1.0005 || bl < -0.0005 || bl > 1.0005) {
      return null;
    }
    return [rl, gl, bl];
  };

  // Reduce chroma until the colour fits the sRGB gamut (hue-preserving).
  for (let i = 0; i < 60 && chroma > 0; i++) {
    const rgb = build(chroma);
    if (rgb) {
      const [rl, gl, bl] = rgb;
      return `#${channelToHex(linearToSrgb(rl) * 255)}${channelToHex(linearToSrgb(gl) * 255)}${channelToHex(
        linearToSrgb(bl) * 255,
      )}`.toUpperCase();
    }
    chroma -= 0.004;
  }

  // Achromatic fallback: plain lightness → grey.
  const grey = clamp(Math.round(targetL * 255), 0, 255);
  const hex = grey.toString(16).padStart(2, "0");
  return `#${hex}${hex}${hex}`.toUpperCase();
}

/** Perceptual (OKLab) average of two hex colours — used to seed the palette from a gradient. */
function mixHex(a: string, b: string): string {
  const A = hexToOklch(a);
  const B = hexToOklch(b);
  const rad = Math.PI / 180;
  const ax = A.C * Math.cos(A.h * rad);
  const ay = A.C * Math.sin(A.h * rad);
  const bx = B.C * Math.cos(B.h * rad);
  const by = B.C * Math.sin(B.h * rad);
  const L = (A.L + B.L) / 2;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  return oklchToHex(L, Math.sqrt(mx * mx + my * my), (Math.atan2(my, mx) * 180) / Math.PI);
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Palette derivation
// ---------------------------------------------------------------------------

function deriveThemePalettes(base: string, gradient: string | null): ThemePalettes {
  const { L: L0, C: C0, h: H } = hexToOklch(base.toUpperCase());

  // Brand ramp tone: fixed lightness + chroma scaled for that lightness.
  const tone = (L: number, chromaScale = 1) => oklchToHex(L, C0 * chromaScale, H);
  // Fixed-chroma tone (used for inks where we cap the base saturation).
  const toneC = (L: number, C: number) => oklchToHex(L, C, H);

  const light = {
    "--color-main": tone(clamp(L0, 0.26, 0.58)),
    "--color-lighter": tone(clamp(L0 + 0.12, 0.4, 0.7), 0.9),
    "--color-medium": tone(clamp(L0 + 0.22, 0.5, 0.78), 0.75),
    "--color-light": tone(clamp(L0 + 0.32, 0.6, 0.85), 0.55),
    "--color-lightest": tone(clamp(L0 + 0.44, 0.72, 0.93), 0.35),
    "--color-superwhite": tone(0.965, 0.2),
    "--color-app": tone(0.972, 0.14),
    "--color-surface": tone(0.995, 0.06),
    "--color-surface-raised": tone(0.999, 0),
    "--color-edge": tone(0.925, 0.3),
    "--color-edge-strong": tone(0.855, 0.4),
    "--color-ink": toneC(0.28, Math.min(C0, 0.09)),
    "--color-ink-muted": toneC(0.55, Math.min(C0, 0.075)),
    "--color-ink-subtle": toneC(0.68, Math.min(C0, 0.06)),
    "--color-accent": tone(clamp(L0, 0.26, 0.58)),
    "--color-on-brand": "#FFFFFF",
    "--shadow-card": `0 1px 2px ${hexToRgba(base, 0.05)}, 0 4px 16px ${hexToRgba(base, 0.06)}`,
  };

  const dark = {
    "--color-main": tone(clamp(L0, 0.34, 0.6)),
    "--color-lighter": tone(clamp(L0 + 0.18, 0.55, 0.75), 0.9),
    "--color-medium": tone(clamp(L0 + 0.12, 0.5, 0.68), 0.8),
    "--color-light": tone(clamp(L0 + 0.06, 0.45, 0.62), 0.7),
    "--color-lightest": tone(clamp(L0 + 0.55, 0.88, 0.95), 0.35),
    "--color-superwhite": hexToRgba(base, 0.1),
    "--color-app": toneC(0.145, Math.min(C0 * 0.4, 0.022)),
    "--color-surface": toneC(0.205, Math.min(C0 * 0.45, 0.028)),
    "--color-surface-raised": toneC(0.27, Math.min(C0 * 0.5, 0.032)),
    "--color-edge": toneC(0.36, Math.min(C0 * 0.5, 0.035)),
    "--color-edge-strong": toneC(0.43, Math.min(C0 * 0.5, 0.04)),
    "--color-ink": toneC(0.97, Math.min(C0 * 0.2, 0.02)),
    "--color-ink-muted": toneC(0.75, Math.min(C0 * 0.3, 0.03)),
    "--color-ink-subtle": toneC(0.6, Math.min(C0 * 0.35, 0.035)),
    "--color-accent": toneC(clamp(L0 + 0.3, 0.85, 0.93), Math.min(C0, 0.1)),
    "--color-on-brand": toneC(0.2, Math.min(C0, 0.07)),
    "--shadow-card": "0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4)",
  };

  return { light, dark, gradient };
}

function decls(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function getStoredAccent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return parseAccentSpec(v) ? v : null;
  } catch {
    return null;
  }
}

/** Both cached palettes (light + dark + gradient), or null when the stock theme applies. */
export function getStoredPalettes(): ThemePalettes | null {
  if (typeof window === "undefined") return null;
  try {
    const spec = getStoredAccent();
    const stops = spec ? parseAccentSpec(spec) : null;
    // No accent at all — or the default colour, which is simply the stock
    // palette. Clear any leftover cache so a stale derived palette can never
    // be injected in place of the built-in one.
    if (!stops || (stops.length === 1 && stops[0] === DEFAULT_ACCENT.toUpperCase())) {
      if (spec !== null || localStorage.getItem(PALETTES_KEY) !== null) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PALETTES_KEY);
        localStorage.removeItem(LEGACY_SHADES_KEY);
      }
      return null;
    }

    const raw = localStorage.getItem(PALETTES_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ThemePalettes;
        if (parsed && typeof parsed === "object" && parsed.light && parsed.dark) {
          // The accent spec is the source of truth for whether a gradient should
          // be painted. If the two ever drift apart (a failed/partial write, or a
          // stale copy), rebuild instead of keeping a gradient the user no longer
          // has selected.
          if (Boolean(parsed.gradient) === (stops.length > 1)) return parsed;
        }
      } catch {
        /* corrupt cache — rebuild below */
      }
    }
    // Cache missing, corrupt, or out of step: rebuilding keeps the custom theme
    // alive instead of silently dropping it back to stock.
    return storeAndReturnPalettes(stops);
  } catch {
    return null;
  }
}

/** Derive + persist the palettes for an already-validated list of stops. */
function storeAndReturnPalettes(stops: string[]): ThemePalettes | null {
  try {
    const gradient = stops.length > 1 ? `linear-gradient(135deg, ${stops.join(", ")})` : null;
    let base = stops[0];
    for (let i = 1; i < stops.length; i++) base = mixHex(base, stops[i]);
    const palettes = { ...deriveThemePalettes(base, gradient), gradient };
    localStorage.setItem(PALETTES_KEY, JSON.stringify(palettes));
    return palettes;
  } catch {
    return null;
  }
}

/** Custom theming on/off (local preference — gates application, not storage). */
export function isAccentEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setAccentEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
  installAccent();
}

// "Preview not yet saved to the account" marker — AccentSync must not
// clobber an unsaved local preview with the (older) server value.
const PENDING_KEY = `${STORAGE_KEY}-pending`;

export function isAccentPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAccentPending(pending: boolean) {
  try {
    if (pending) localStorage.setItem(PENDING_KEY, "1");
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function storeAccent(spec: string | null) {
  try {
    const colors = parseAccentSpec(spec);
    const isDefault = colors && colors.length === 1 && colors[0] === DEFAULT_ACCENT.toUpperCase();
    if (colors && !isDefault) {
      const gradient =
        colors.length > 1 ? `linear-gradient(135deg, ${colors.join(", ")})` : null;
      let base = colors[0];
      for (let i = 1; i < colors.length; i++) {
        base = mixHex(base, colors[i]);
      }
      // Derive before touching storage: if the maths ever throws, the previous
      // accent must survive intact instead of leaving a spec without palettes
      // (which used to silently drop the whole custom theme back to stock).
      const palettes = JSON.stringify({ ...deriveThemePalettes(base, gradient), gradient });
      localStorage.setItem(STORAGE_KEY, colors.join(","));
      localStorage.setItem(PALETTES_KEY, palettes);
      localStorage.removeItem(LEGACY_SHADES_KEY);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PALETTES_KEY);
      localStorage.removeItem(LEGACY_SHADES_KEY);
    }
  } catch {
    /* storage unavailable */
  }
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

function applyGradient(palettes: ThemePalettes | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (palettes?.gradient) {
    root.classList.add(GRADIENT_CLASS);
    root.style.setProperty(GRADIENT_VAR, palettes.gradient);
  } else {
    root.classList.remove(GRADIENT_CLASS);
    root.style.removeProperty(GRADIENT_VAR);
  }
}

/** Install (or remove) the custom theme from the cached palettes. */
export function installAccent() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const palettes = isAccentEnabled() ? getStoredPalettes() : null;

  let style = document.getElementById(ACCENT_STYLE_ID) as HTMLStyleElement | null;

  // Older builds parked the light tokens inline on <html>; inline styles beat
  // every stylesheet, so they would keep the light palette alive in dark mode.
  TOKEN_KEYS.forEach((k) => root.style.removeProperty(k));

  if (!palettes) {
    style?.remove();
    applyGradient(null);
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = ACCENT_STYLE_ID;
    document.head.appendChild(style);
  }
  // `html:not(.dark)` / `html.dark` both outrank the stock `:root` and `.dark`
  // blocks, so the palette follows the class with no per-toggle bookkeeping.
  style.textContent = `html:not(.dark){${decls(palettes.light)}}html.dark{${decls(palettes.dark)}}`;
  applyGradient(palettes);
}

/** Persist + apply (or clear) the custom theme for the given accent spec. */
export function applyAccent(spec: string | null | undefined) {
  if (typeof document === "undefined") return;
  storeAccent(typeof spec === "string" && parseAccentSpec(spec) ? spec : null);
  installAccent();
}
