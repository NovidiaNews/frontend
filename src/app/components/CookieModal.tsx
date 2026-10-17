"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NovButton, NovSwitch } from "@/app/components/ui";

const GA_MEASUREMENT_ID = "G-27CFRN327T";

export default function CookieModal() {
  const [showModal, setShowModal] = useState(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("novidia_cookie_consent");
      if (!consent) return true;
      try {
        JSON.parse(consent);
        return false;
      } catch {
        return true;
      }
    }
    return false;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("novidia_cookie_consent");
      if (consent) {
        try {
          const parsed = JSON.parse(consent);
          return !!parsed.analytics;
        } catch {
          return true;
        }
      }
    }
    return true;
  });

  const loadGA = () => {
    if (typeof window === "undefined") return;
    delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`];

    if (!document.getElementById("google-analytics-script")) {
      const script1 = document.createElement("script");
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script1.id = "google-analytics-script";
      document.head.appendChild(script1);

      const script2 = document.createElement("script");
      script2.id = "google-analytics-init";
      script2.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `;
      document.head.appendChild(script2);
    }
  };

  const disableGA = () => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  };

  useEffect(() => {
    const consent = localStorage.getItem("novidia_cookie_consent");
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        if (parsed.analytics) {
          loadGA();
        } else {
          disableGA();
        }
      } catch {
        // Handled by showModal initializer
      }
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      "novidia_cookie_consent",
      JSON.stringify({ essentials: true, analytics: true })
    );
    loadGA();
    setShowModal(false);
  };

  const handleDenyAll = () => {
    localStorage.setItem(
      "novidia_cookie_consent",
      JSON.stringify({ essentials: true, analytics: false })
    );
    disableGA();
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      "novidia_cookie_consent",
      JSON.stringify({ essentials: true, analytics: analyticsEnabled })
    );
    if (analyticsEnabled) {
      loadGA();
    } else {
      disableGA();
    }
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <AnimatePresence>
      <div className={"fixed inset-0 z-[200] bg-app/70 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto font-montserrat"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={"bg-surface border border-edge shadow-card rounded-2xl p-6 md:p-8 pt-8 md:pt-10 max-w-md w-full flex flex-col gap-5 relative select-none"}
        >
          <div className={"w-full text-center"}>
            <h3 className={"font-bold text-2xl text-ink font-fraunces tracking-tight"}>
              Ciasteczka? Gdzie?!
            </h3>
          </div>

          <p className={"text-sm text-ink-muted font-medium leading-relaxed text-center"}>
            Ta strona używa niezbędnych plików cookies do uwierzytelniania i zapisywania motywu. Za zgodą zbieramy również opcjonalne statystyki: Google Analytics, własne statystyki odwiedzin oraz profil urządzenia (rozdzielczość ekranu, zainstalowane czcionki, agent użytkownika, karta graficzna i inne — pełna lista w Polityce prywatności).
          </p>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: -40 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0, marginTop: -40 }}
                className={"overflow-y-auto max-h-60 pr-1 flex flex-col gap-3.5 border-t border-edge pt-4 scrollbar-none overflow-none"}
              >
                <div className={"flex flex-col gap-1.5 p-3 rounded-xl bg-surface-raised border border-edge"}>
                  <div className={"flex items-center justify-between"}>
                    <span className={"text-xs font-bold text-ink"}>Niezbędne pliki (Essential)</span>
                    <NovSwitch checked disabled size="sm" onChange={() => {}} className="opacity-60" />
                  </div>
                  <p className={"text-[10px] text-ink-muted leading-relaxed font-medium"}>
                    Umożliwiają poprawne działanie podstawowych funkcji witryny, takich jak motyw graficzny (theme), uwierzytelnianie użytkownika czy zapamiętywanie preferencji sesji. Nie można ich wyłączyć.
                  </p>
                </div>

                <div className={"flex flex-col gap-1.5 p-3 rounded-xl bg-surface-raised border border-edge"}>
                  <div className={"flex items-center justify-between"}>
                    <span className={"text-xs font-bold text-ink"}>Analityczne (Google Analytics + odwiedziny)</span>
                    <NovSwitch
                      checked={analyticsEnabled}
                      onChange={setAnalyticsEnabled}
                      size="sm"
                    />
                  </div>
                  <p className={"text-[10px] text-ink-muted leading-relaxed font-medium"}>
                    Pomagają nam zbierać statystyki o ruchu na stronie: Google Analytics oraz własne statystyki odwiedzin. Przy tej samej zgodzie zapisujemy profil urządzenia: rozdzielczość i głębię kolorów ekranu, proporcje okna, listę wykrytych czcionek, agenta użytkownika, platformę, język, strefę czasową, liczbę rdzeni, pamięć urządzenia, parametry karty graficznej (WebGL) oraz ustawienia systemowe (motyw, ograniczenie animacji). Adres IP jest skracany o ostatni oktet i szyfrowany jednokierunkowym hashem (SHA-256), a dane odwiedzin są automatycznie usuwane po 90 dniach. Bez zgody żadne odwiedziny ani dane urządzenia nie są rejestrowane.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={"w-full flex justify-center mt-1"}>
            {!isExpanded ? (
              <NovButton
                type="button"
                variant="plain"
                onClick={() => setIsExpanded(true)}
                className={"w-full text-center py-1 text-xs font-bold text-ink-muted hover:text-ink hover:underline"}
              >
                Dostosuj preferencje plików cookies
              </NovButton>
            ) : (
              <NovButton
                type="button"
                variant="plain"
                onClick={() => setIsExpanded(false)}
                className={"w-full text-center py-1 text-xs font-bold text-ink-muted hover:text-ink"}
              >
                Zwiń opcje szczegółowe
              </NovButton>
            )}
          </div>

          <div className={"flex flex-col gap-3"}>
            {!isExpanded ? (
              <div className={"flex gap-3"}>
                <NovButton
                  type="button"
                  variant="outline"
                  size="none"
                  onClick={handleDenyAll}
                  className={"w-1/2 py-3 rounded-xl"}
                >
                  Odrzuć opcjonalne
                </NovButton>
                <NovButton
                  type="button"
                  variant="main"
                  size="lg"
                  fullWidth
                  onClick={handleAcceptAll}
                >
                  Akceptuj wszystkie
                </NovButton>
              </div>
            ) : (
              <NovButton
                type="button"
                variant="main"
                size="lg"
                fullWidth
                onClick={handleSavePreferences}
              >
                Zatwierdź wybrane
              </NovButton>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
