"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Novidia "disable animations" preference.
 *
 * Stored per-browser in localStorage (`novidia-animations` = "on" | "off").
 * When unset we fall back to the OS-level `prefers-reduced-motion` setting, so
 * users who already asked their system for less motion get it for free.
 *
 * Components that animate in JS (framer-motion, view transitions, confetti)
 * should read this hook and skip the animation when it returns false.
 */
const STORAGE_KEY = "novidia-animations";
const CHANGE_EVENT = "novidia_animations_change";

export function getStoredAnimationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "off") return false;
    if (stored === "on") return true;
  } catch {
    /* storage unavailable — fall through */
  }
  if (typeof window.matchMedia !== "function") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Mirror the preference onto <html> so CSS transitions can be neutralized. */
export function applyAnimationsPreference(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("reduce-motion", !enabled);
}

export function useAnimations() {
  const [animationsEnabled, setEnabledState] = useState<boolean>(() =>
    getStoredAnimationsEnabled(),
  );

  // Keep the <html> class in sync (including the pre-paint default).
  useEffect(() => {
    applyAnimationsPreference(animationsEnabled);
  }, [animationsEnabled]);

  // React to changes from other components/tabs.
  useEffect(() => {
    const sync = () => setEnabledState(getStoredAnimationsEnabled());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setAnimationsEnabled = useCallback((next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
    setEnabledState(next);
    applyAnimationsPreference(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { animationsEnabled, setAnimationsEnabled };
}
