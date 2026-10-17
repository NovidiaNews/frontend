"use client";

import { useCallback, useEffect, useState } from "react";
import { installAccent } from "@/lib/accent";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "novidia-theme";
const PROFILE_KEY = "novidia_user";

/**
 * Keep the cached cloud profile in step with the local preference.
 *
 * AccentSync pushes `novidia_user.theme` back onto the page whenever the two
 * disagree, so a profile that still carries the previous theme would flip the
 * page back the moment anything dispatches `novidia_auth_change` — which is
 * exactly the light→dark→light→dark blink seen when switching from Settings.
 */
function mirrorThemeIntoProfile(pref: ThemePreference) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { theme?: unknown } | null;
    if (!parsed || typeof parsed !== "object" || parsed.theme === pref) return;
    parsed.theme = pref;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
  } catch {
    /* corrupted / unavailable storage — AccentSync falls back to the pref key */
  }
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  // "system" must survive a reload — mapping it to "light" made every
  // system-preference user fall back to the light theme on refresh.
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "light";
}

export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

export function applyTheme(pref: ThemePreference, animate = false) {
  if (typeof window === "undefined") return;
  const dark = resolveTheme(pref) === "dark";
  const root = document.documentElement;
  if (animate) root.classList.add("theme-transition");
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  if (animate) {
    setTimeout(() => root.classList.remove("theme-transition"), 400);
  }
}

/**
 * Overwrite a freshly fetched profile's theme with the local preference.
 *
 * Callers that re-read /users/me and store the reply must not let a reply that
 * predates a local toggle push the previous theme back into the cache — the
 * next `novidia_auth_change` would then flip the page back to it.
 */
export function withLocalTheme<T extends { theme?: unknown }>(profile: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      profile.theme = stored;
    }
  } catch {
    /* storage unavailable — keep the fetched value */
  }
  return profile;
}

/** Lightweight client-side theme manager (no backend sync; callers persist via API). */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() =>
    typeof window === "undefined" ? "light" : getStoredTheme(),
  );

  // Keep the DOM in sync with the preference and follow OS changes in "system" mode.
  useEffect(() => {
    applyTheme(theme);
    // Re-assert the custom theme palette for the newly active mode.
    installAccent();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  // AccentSync writes the preference straight to localStorage (cloud sync) —
  // mirror it into local state so the toggler and the settings panel never
  // disagree with the DOM.
  useEffect(() => {
    const pull = () => {
      const stored = getStoredTheme();
      setThemeState((prev) => (prev === stored ? prev : stored));
    };
    window.addEventListener("novidia_auth_change", pull);
    window.addEventListener("storage", pull);
    return () => {
      window.removeEventListener("novidia_auth_change", pull);
      window.removeEventListener("storage", pull);
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      // Profile first: another tab reacts to each key separately, and seeing the
      // new profile before the preference key avoids it pushing the old theme
      // back for one event.
      mirrorThemeIntoProfile(next);
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — ignore */
    }
    setThemeState(next);
  }, []);

  return { theme, setTheme, resolvedTheme: resolveTheme(theme) };
}