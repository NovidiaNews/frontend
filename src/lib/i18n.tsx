"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Locale, LANGUAGES, isRtlLocale, t as translate } from "./translations";

const STORAGE_KEY = "novidia-locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "pl";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en") return "en_uk";
  const valid = LANGUAGES.some((l) => l.code === stored);
  return valid ? (stored as Locale) : "pl";
}

interface I18nContextValue {
  locale: Locale;
  isRtl: boolean;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pl",
  isRtl: false,
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);
  const isRtl = isRtlLocale(locale);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale.startsWith("ar") ? "ar" : locale.replace("_", "-");
    html.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch { /* ignore */ }
    setLocaleState(l);
    const html = document.documentElement;
    html.lang = l.startsWith("ar") ? "ar" : l.replace("_", "-");
    html.dir = isRtlLocale(l) ? "rtl" : "ltr";
  }, []);

  const tFn = useCallback((key: string, vars?: Record<string, string>) => translate(locale, key, vars), [locale]);

  return (
    <I18nContext.Provider value={{ locale, isRtl, setLocale, t: tFn }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
