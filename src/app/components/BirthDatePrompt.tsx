"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Loader2, Lock, X } from "lucide-react";
import DateOfBirthPicker from "./auth/DateOfBirthPicker";
import { NovButton, NovInput } from "@/app/components/ui";
import { API_URL } from "@/lib/api";
import { withLocalTheme } from "@/lib/useTheme";

const MIN_AGE_WITHOUT_GUARDIAN = 13;
const DISMISS_KEY = "novidia_dob_prompt_dismissed";
// Re-attempt at most once a week after a dismiss.
const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function ageFrom(d: Date): number {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

interface MeResponse {
  id?: string;
  birthDate?: string | null;
}

/**
 * "Complete your account" gate: users registered before birth dates were
 * collected (or via OAuth import) get a one-time dialog on site entry asking
 * for their date of birth. Under-13 answers additionally require a guardian e-mail.
 */
export default function BirthDatePrompt() {
  const [open, setOpen] = useState(false);
  const [dob, setDob] = useState<Date | null>(null);
  const [guardianEmail, setGuardianEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const under13 = dob !== null && ageFrom(dob) < MIN_AGE_WITHOUT_GUARDIAN;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Only prompt for logged-in users (auth cookie decides; /users/me 401/404 = guest).
      let storedId: string | null = null;
      try {
        storedId = (JSON.parse(localStorage.getItem("novidia_user") || "null") as MeResponse | null)?.id ?? null;
      } catch {
        storedId = null;
      }
      if (!storedId) return;

      try {
        const res = await fetch(`${API_URL}/users/me`, { credentials: "include" });
        if (!res.ok) return;
        const me = (await res.json()) as MeResponse;
        if (!me?.id || me.birthDate) return;

        let dismissedAt = 0;
        try {
          dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
        } catch {
          dismissedAt = 0;
        }
        if (dismissedAt && Date.now() - dismissedAt < RETRY_AFTER_MS) return;

        if (!cancelled) {
          // Small delay so it doesn't fight with other first-paint UI.
          window.setTimeout(() => {
            if (!cancelled) setOpen(true);
          }, 1200);
        }
      } catch {
        // network issues — stay quiet
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // storage unavailable
    }
    setOpen(false);
  };

  const submit = async () => {
    if (!dob) {
      setError("Podaj poprawną datę urodzenia.");
      return;
    }
    if (under13 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      setError("Osoby poniżej 13 lat muszą podać e-mail opiekuna prawnego.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let storedId: string | null = null;
      try {
        storedId = (JSON.parse(localStorage.getItem("novidia_user") || "null") as MeResponse | null)?.id ?? null;
      } catch {
        storedId = null;
      }
      if (!storedId) throw new Error("no-user");

      const iso = new Date(Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate())).toISOString();
      const res = await fetch(`${API_URL}/users/${storedId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: iso,
          ...(under13 ? { guardianEmail: guardianEmail.trim().toLowerCase() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Nie udało się zapisać daty urodzenia.");
      }

      // Refresh the cached profile so settings/admin views see the new value.
      try {
        const fresh = await fetch(`${API_URL}/users/me`, { credentials: "include" });
        if (fresh.ok) {
          const freshUser = (await fresh.json()) as { theme?: unknown };
          localStorage.setItem("novidia_user", JSON.stringify(withLocalTheme(freshUser)));
        }
      } catch {
        // ignore refresh failure
      }
      window.dispatchEvent(new Event("novidia_auth_change"));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać daty urodzenia.");
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] bg-app/70 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="w-full max-w-md bg-surface border border-edge shadow-card rounded-2xl overflow-hidden"
          >
            <div className="relative px-6 pt-6 pb-4 border-b border-edge bg-surface-raised">
              <div className="absolute -top-14 -right-10 w-40 h-40 rounded-full bg-main/15 blur-2xl pointer-events-none" />
              <button
                type="button"
                onClick={dismiss}
                aria-label="Zamknij"
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-main/10 text-main flex items-center justify-center shrink-0">
                  <Cake size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink font-fraunces tracking-tight">
                    Dokończ swój profil
                  </h2>
                  <p className="text-xs text-ink-muted font-medium mt-0.5">
                    Podaj swoją datę urodzenia — zabierze to 10 sekund.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <DateOfBirthPicker value={dob} onChange={(d) => { setDob(d); setError(null); }} />

              {under13 && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-3">
                  <p className="text-xs font-bold text-amber-800">Konto dla osoby poniżej 13 lat</p>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Potrzebujemy adresu e-mail opiekuna prawnego. Konto będzie miało ograniczone
                    ustawienia (m.in. brak możliwości usunięcia konta i upublicznienia daty
                    urodzenia).
                  </p>
                  <NovInput
                    type="email"
                    placeholder="E-mail opiekuna prawnego *"
                    value={guardianEmail}
                    onChange={(e) => {
                      setGuardianEmail(e.target.value.replace(/\s+/g, "").toLowerCase());
                      setError(null);
                    }}
                    className="h-11 text-center text-sm"
                  />
                </div>
              )}

              <p className="text-[11px] text-ink-subtle font-medium flex items-start gap-1.5">
                <Lock size={12} className="shrink-0 mt-0.5" />
                <span>
                  Data urodzenia jest prywatna. Publicznie widoczny jest wyłącznie przedział
                  wiekowy.
                </span>
              </p>

              {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}

              <div className="flex gap-2 pt-1">
                <NovButton
                  type="button"
                  variant="ghost"
                  size="none"
                  onClick={dismiss}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Później
                </NovButton>
                <NovButton
                  type="button"
                  variant="main"
                  size="none"
                  onClick={submit}
                  disabled={loading || !dob}
                  className="flex-[2] px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {loading && <Loader2 size={13} className="animate-spin mr-1.5" />}
                  Zapisz datę urodzenia
                </NovButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
