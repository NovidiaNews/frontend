import pl from "./locales/pl.json";
import en_uk from "./locales/en_uk.json";
import en_us from "./locales/en_us.json";
import de_de from "./locales/de_de.json";
import fr_fr from "./locales/fr_fr.json";
import ar_sa from "./locales/ar_sa.json";

export type Locale = "pl" | "en_uk" | "en_us" | "de_de" | "fr_fr" | "ar_sa";

export const LANGUAGES: { code: Locale; label: string; flag: string; countryCode: string; dir: "ltr" | "rtl" }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱", countryCode: "pl", dir: "ltr" },
  { code: "en_uk", label: "English (UK)", flag: "🇬🇧", countryCode: "gb", dir: "ltr" },
  { code: "en_us", label: "English (US)", flag: "🇺🇸", countryCode: "us", dir: "ltr" },
  { code: "de_de", label: "Deutsch", flag: "🇩🇪", countryCode: "de", dir: "ltr" },
  { code: "fr_fr", label: "Français", flag: "🇫🇷", countryCode: "fr", dir: "ltr" },
  { code: "ar_sa", label: "العربية", flag: "🇸🇦", countryCode: "sa", dir: "rtl" },
];

export function isRtlLocale(locale: string): boolean {
  return locale === "ar_sa" || locale.startsWith("ar");
}

export function flagUrl(countryCode: string): string {
  return `https://flagcdn.com/w40/${countryCode}.png`;
}

// Locale data lives in `./locales/*.json`
const translations: Record<Locale, Record<string, string>> = {
  pl,
  en_uk,
  en_us,
  de_de,
  fr_fr,
  ar_sa,
};

export function t(locale: Locale, key: string, vars?: Record<string, string>): string {
  const loc = (translations[locale] ? locale : "pl") as Locale;
  let value = translations[loc]?.[key] ?? translations.en_uk[key] ?? translations.pl[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(`{${k}}`, v);
    }
  }
  return value;
}
