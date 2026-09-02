"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Locale, t as translate } from "./translations";

const STORAGE_KEY = "novidia-locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "pl";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "pl";
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pl",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "pl";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch { /* ignore */ }
    setLocaleState(l);
    document.documentElement.lang = l === "en" ? "en" : "pl";
  }, []);

  const tFn = useCallback((key: string, vars?: Record<string, string>) => translate(locale, key, vars), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
