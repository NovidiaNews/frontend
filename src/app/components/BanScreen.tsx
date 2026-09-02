"use client";

import { Gavel, ArrowLeft, ShieldQuestion } from "lucide-react";
import { NovButton, NovLink } from "@/app/components/ui";

interface BanScreenProps {
  onLoggedOut: () => void;
  unbanDate: string | null;
  banReason: string | null;
}

function formatUnbanDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

export default function BanScreen({ onLoggedOut, unbanDate, banReason }: BanScreenProps) {
  const brokenRules = banReason
    ? banReason.split("\n").filter(Boolean)
    : ["Naruszenie warunków korzystania z usługi"];

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-app">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          {/* Gavel icon */}
          <div className="mb-6">
            <Gavel size={56} className="text-accent" strokeWidth={1.8} />
          </div>

          {/* Header */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-accent font-fraunces mb-4">
            Konto zostało zablokowane
          </h1>

          {/* Body text */}
          <p className="text-[15px] text-ink-muted leading-relaxed mb-2 max-w-xl">
            Twoje konto naruszyło warunki korzystania z usługi. Możesz teraz tylko czytać artykuły
            na stronie.
          </p>

          <p className="text-[15px] text-ink-muted leading-relaxed mb-2 max-w-xl">
            Jeśli posiadasz subskrypcję Novidia+, została ona tymczasowo wstrzymana na czas blokady.
            W okresie blokady nie będziemy pobierać od Ciebie opłat za Novidia+.
          </p>

          <p className="text-[15px] text-ink-muted leading-relaxed mb-8 max-w-xl">
            Pozostały okres subskrypcji zostanie wznowiony po zakończeniu blokady.{" "}
            <a href="mailto:kontakt@novidia.eu?subject=Pytanie%20o%20blokadę" className="text-accent underline underline-offset-2 hover:text-main transition-colors">
              Więcej informacji
            </a>
          </p>

          {/* Broken rules card */}
          <div className="w-full rounded-2xl border border-edge bg-surface px-6 py-5 mb-8 text-left font-mono">
            <p className="text-sm font-bold text-ink mb-3 font-mono">
              Naruszone warunki korzystania z usługi:
            </p>
            <ul className="space-y-1.5 font-mono">
              {brokenRules.map((rule, i) => (
                <li key={i} className="text-sm text-ink-muted pl-1 font-mono">
                  - {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Unban date */}
          {unbanDate && (
            <p className="text-[15px] text-ink-muted mb-8 font-mono">
              Twoje konto zostanie odblokowane:{" "}
              <span className="inline-block rounded-lg border border-edge bg-surface-raised px-3 py-1 text-sm font-bold text-ink ml-1 font-mono">
                {formatUnbanDate(unbanDate)}
              </span>
            </p>
          )}

          {/* Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <NovButton
              type="button"
              variant="main"
              size="none"
              onClick={onLoggedOut}
              className="flex-1 h-13 sm:h-14 rounded-xl px-4 py-3.5 text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              Wyloguj się i wróć na stronę główną
            </NovButton>
            <NovLink
              unstyled
              href="mailto:kontakt@novidia.eu?subject=Odwołanie%20od%20blokady%20konta"
              className="flex-1 h-13 sm:h-14 rounded-xl border border-edge bg-surface text-ink font-semibold hover:bg-surface-raised flex items-center justify-center gap-2.5 transition-all text-sm px-4 py-3.5"
            >
              <ShieldQuestion size={16} className="text-accent" />
              Odwołaj się od kary
            </NovLink>
          </div>
        </div>
      </div>
    </div>
  );
}