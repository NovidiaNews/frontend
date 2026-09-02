"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "novidia-theme";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "light";
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

/** Lightweight client-side theme manager (no backend sync; callers persist via API). */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() =>
    typeof window === "undefined" ? "light" : getStoredTheme(),
  );

  // Keep the DOM in sync with the preference and follow OS changes in "system" mode.
  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — ignore */
    }
    setThemeState(next);
  }, []);

  return { theme, setTheme, resolvedTheme: resolveTheme(theme) };
}