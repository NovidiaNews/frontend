import type { Metadata } from "next";
import Navbar from "./components/navigation/navbar";
import { Fraunces, Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieModal from "./components/CookieModal";
import SettingsModal from "./components/SettingsModal";
import VisitTracker from "./components/VisitTracker";
import BirthDatePrompt from "./components/BirthDatePrompt";
import AccentSync from "./components/AccentSync";
import BanGuard from "./components/BanGuard";
import { I18nProvider } from "@/lib/i18n";
import { Suspense } from "react";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Novidia | Twoja szkolna redakcja",
    template: "%s | Novidia",
  },
  description: "Nowoczesna platforma dziennikarska dla uczniów. Twórz, publikuj i rozwijaj swoje pasje z pomocą AI.",
  metadataBase: new URL("https://oliveos.eu"),
  applicationName: "Novidia",
  authors: [{ name: "Zespół Novidia" }],
  creator: "Novidia",
  publisher: "Novidia",

  // Metadata for OpenGraph (Social Media)
  openGraph: {
    title: "Novidia | Twoja szkolna redakcja",
    description: "Nowoczesna platforma dziennikarska dla uczniów. Twórz, publikuj i rozwijaj swoje pasje z pomocą AI.",
    url: "https://oliveos.eu",
    siteName: "Novidia",
    type: "website",
    locale: "pl_PL", // Changed to Polish
    images: [
      {
        url: "/og-image.png", // Ensure this exists in your public folder
        width: 1200,
        height: 630,
        alt: "Novidia - Platforma dla młodych twórców",
      },
    ],
  },

  // Metadata for Twitter
  twitter: {
    card: "summary_large_image",
    title: "Novidia | Twoja szkolna redakcja",
    description: "Nowoczesna platforma dziennikarska dla uczniów.",
    images: ["/twitter-image.png"],
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: [
      {
        url: "/touch-icons/apple-touch-icon-iphone-60x60.png",
        sizes: "60x60",
        type: "image/png",
      },
      {
        url: "/touch-icons/apple-touch-icon-iphone-retina-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/touch-icons/apple-touch-icon-ipad-76x76.png",
        sizes: "76x76",
        type: "image/png",
      },
      {
        url: "/touch-icons/apple-touch-icon-ipad-retina-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
    ],
  },

  manifest: "/site.webmanifest",

  robots: {
    index: true,
    follow: true,
  },
};

// In Next.js 14+, viewport is exported separately
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#36316A",
};

// Applied before first paint so there is no theme flash.
// Reads the stored preference (light | dark | system) and flips the `.dark`
// class on <html>. The `useTheme` hook below mirrors this on the client.
const THEME_SCRIPT = `(function () {
  var stored = 'light';
  try { stored = localStorage.getItem('novidia-theme') || 'light'; } catch (e) {}
  var dark;
  if (stored === 'dark') dark = true;
  else if (stored === 'system') dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  else dark = false;
  var root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';

  var loc = 'pl';
  try { loc = localStorage.getItem('novidia-locale') || 'pl'; } catch (e) {}
  if (loc === 'ar_sa' || loc === 'ar') {
    root.setAttribute('dir', 'rtl');
    root.setAttribute('lang', 'ar');
  } else {
    root.setAttribute('dir', 'ltr');
    root.setAttribute('lang', loc === 'en' ? 'en-GB' : loc.replace('_', '-'));
  }

  // Custom interface theme (Discord-style): one base colour (or gradient)
  // derives both the light and dark palettes (OKLab). Cached in localStorage
  // so they can be applied before first paint without a recompute or a flash
  // of stock colours.
  var accentOn = true;
  try { accentOn = localStorage.getItem('novidia-accent-enabled') !== '0'; } catch (e) {}

  // Start from a clean slate every load: drop a leftover palette tag, the
  // gradient flag, and the inline token copies older builds parked on <html>
  // (inline styles beat every stylesheet and would freeze the light palette).
  var stale = document.getElementById('novidia-accent-theme');
  if (stale) stale.remove();
  root.classList.remove('accent-gradient');
  root.style.removeProperty('--color-brand-gradient');
  ['--color-main','--color-lighter','--color-medium','--color-light','--color-lightest','--color-superwhite','--color-app','--color-surface','--color-surface-raised','--color-edge','--color-edge-strong','--color-ink','--color-ink-muted','--color-ink-subtle','--color-accent','--color-on-brand','--shadow-card']
    .forEach(function (k) { root.style.removeProperty(k); });

  try {
    var palettes = JSON.parse(localStorage.getItem('novidia-accent-palettes') || 'null');
    if (accentOn && palettes && typeof palettes === 'object' && palettes.light && palettes.dark) {
      var lightDecls = '';
      var darkDecls = '';
      Object.keys(palettes.light).forEach(function (k) { lightDecls += k + ':' + palettes.light[k] + ';'; });
      Object.keys(palettes.dark).forEach(function (k) { darkDecls += k + ':' + palettes.dark[k] + ';'; });
      // html:not(.dark) and html.dark both outrank the stock :root and .dark
      // blocks, so the palette follows the class with no per-toggle sync.
      var s = document.createElement('style');
      s.id = 'novidia-accent-theme';
      s.textContent = 'html:not(.dark){' + lightDecls + '}html.dark{' + darkDecls + '}';
      document.head.appendChild(s);
      // Two-stop gradient: brand fills (bg-main) get the gradient image.
      // Applied only when the cache actually carries one, so a solid accent
      // can never leave stale gradient buttons behind.
      if (palettes.gradient) {
        root.classList.add('accent-gradient');
        root.style.setProperty('--color-brand-gradient', palettes.gradient);
      }
    }
  } catch (e) {}

  root.classList.add('theme-transition');
  setTimeout(function () { root.classList.remove('theme-transition'); }, 400);
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-app text-ink transition-colors duration-300">
        <I18nProvider>
        <BanGuard>
          <div id="main-content-wrapper" className="min-h-screen flex flex-col pb-28 xl:pb-0">
            <Navbar navigation={[
              { id: "1", title: "Główna", url: "/" },
              { id: "2", title: "Tematy", url: "/topics" },
              {
                id: "3",
                title: "Kategorie",
                url: "/categories",
                children: [
                  { id: "3-1", title: "Sport", url: "/categories?tag=sport", icon: "sport" },
                  { id: "3-2", title: "Kultura", url: "/categories?tag=culture", icon: "culture" },
                  { id: "3-3", title: "Nauka", url: "/categories?tag=science", icon: "science" },
                  { id: "3-4", title: "Technologia", url: "/categories?tag=technology", icon: "technology" },
                  { id: "3-5", title: "Rozrywka", url: "/categories?tag=entertainment", icon: "entertainment" },
                ],
              },
            ]} />
            <div className="flex-grow">{children}</div>
          </div>
          <CookieModal />
          <Suspense fallback={null}>
            <SettingsModal />
          </Suspense>
          <VisitTracker />
          <BirthDatePrompt />
          <AccentSync />
        </BanGuard>
        </I18nProvider>
      </body>
    </html>
  );
}
