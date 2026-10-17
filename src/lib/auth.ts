"use client";

import { ACCENT_STYLE_ID } from "./accent";

/**
 * Reverts all client-side preferences, stored tokens, theme, accent, and language
 * back to defaults on logout.
 */
export function resetClientStateToDefaults() {
  if (typeof window === "undefined") return;

  try {
    // Auth & user
    localStorage.removeItem("novidia_user");

    // Theme & accent
    localStorage.removeItem("novidia-accent");
    localStorage.removeItem("novidia-accent-palettes");
    localStorage.removeItem("novidia-accent-enabled");
    localStorage.removeItem("novidia-accent-pending");
    localStorage.removeItem("novidia-accent-shades");
    localStorage.removeItem("novidia-theme");

    // Locale & language
    localStorage.removeItem("novidia-locale");

    // Accessibility & animations
    localStorage.removeItem("novidia-animations");
  } catch {
    /* storage unavailable */
  }

  // Reset DOM styles & attributes
  try {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.remove("accent-gradient");
    root.classList.remove("reduce-motion");
    root.style.colorScheme = "light";
    root.lang = "pl";
    root.dir = "ltr";
    root.style.removeProperty("--color-brand-gradient");

    const accentStyle = document.getElementById(ACCENT_STYLE_ID);
    accentStyle?.remove();
  } catch {
    /* ignore DOM errors */
  }

  // Notify listeners across all components (navbar, modals, etc.)
  window.dispatchEvent(new Event("novidia_auth_change"));
  window.dispatchEvent(new Event("storage"));
}
