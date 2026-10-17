"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImageSide from "@/app/components/pexels/ImageSide";
import PasswordInput from "@/app/components/auth/PasswordInput";
import DateOfBirthPicker from "@/app/components/auth/DateOfBirthPicker";
import OtpInput from "@/app/components/auth/OtpInput";
import {
  NovButton,
  NovLink,
  NovInput,
  NovCheckbox,
  NovToast,
  NovToastProgress,
  NovToastCount,
  NovToastClose,
} from "@/app/components/ui";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, Check, KeyRound, Loader2, Mail, Shield, Cake, School } from "lucide-react";
import confetti from "canvas-confetti";
import { API_URL } from "@/lib/api";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

type Step = "register" | "verify" | "details" | "success";

const MIN_AGE_WITHOUT_GUARDIAN = 13;

function ageFrom(d: Date): number {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    const fire = (ratio: number, opts: Record<string, unknown>) =>
      myConfetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * ratio) }));

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  return <canvas ref={canvasRef} className="absolute left-0 top-0 h-full w-full pointer-events-none z-20" />;
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("register");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: "success" | "error" = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Step 1 — e-mail + username
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // Step 2 — e-mail verification
  const [verificationCode, setVerificationCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(900);

  // Step 3 — password + date of birth + TOS
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [guardianEmail, setGuardianEmail] = useState("");
  const [tosConsent, setTosConsent] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const age = dob ? ageFrom(dob) : null;
  const under13 = age !== null && age < MIN_AGE_WITHOUT_GUARDIAN;

  // Countdown timers
  useEffect(() => {
    if (step !== "verify" || timeLeft <= 0) return;
    const i = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(i);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Step 1: e-mail + username ────────────────────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const newErrors: Record<string, boolean> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = true;
    if (!username || !/^[a-zA-Z0-9_.]{3,32}$/.test(username)) newErrors.username = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        newErrors.username
          ? "Nazwa użytkownika: min. 3 znaki, dozwolone litery, cyfry, _ oraz ."
          : "Podaj poprawny adres e-mail."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd podczas rejestracji.");

      setTimeLeft(900);
      setVerificationCode("");
      setStep("verify");
      showToast("Kod weryfikacyjny został wysłany na Twój e-mail.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Wystąpił błąd.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify e-mail ────────────────────────────────────────────────
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (verificationCode.length < 6) {
      showToast("Wprowadź pełny 6-cyfrowy kod.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd weryfikacji.");

      setTempToken(data.token);
      showToast("E-mail zweryfikowany pomyślnie.", "success");

      if (data.status === "success") {
        localStorage.setItem("novidia_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("novidia_auth_change"));
        setStep("success");
      } else {
        setStep("details");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Wystąpił błąd.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: password + DOB + TOS ─────────────────────────────────────────
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, boolean> = {};
    if (!password || password.length < 8) newErrors.password = true;
    if (password !== confirmPassword) newErrors.confirmPassword = true;
    if (!dob) newErrors.dob = true;
    if (!tosConsent) newErrors.tosConsent = true;
    if (under13 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) newErrors.guardianEmail = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.tosConsent) showToast("Musisz zaakceptować regulamin, aby kontynuować.");
      else if (newErrors.guardianEmail) showToast("Osoby poniżej 13 lat muszą podać e-mail opiekuna.");
      else if (newErrors.dob) showToast("Podaj datę urodzenia.");
      else showToast("Uzupełnij poprawnie wszystkie pola.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/complete-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tempToken ? { Authorization: `Bearer ${tempToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          password,
          birthDate: dob!.toISOString(),
          consentToTOS: tosConsent,
          guardianEmail: under13 ? guardianEmail : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresGuardian) setErrors((prev) => ({ ...prev, guardianEmail: true }));
        throw new Error(data.message || "Błąd ukończenia rejestracji.");
      }

      localStorage.setItem("novidia_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("novidia_auth_change"));
      setStep("success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Wystąpił błąd.");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants: Variants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { x: -100, opacity: 0, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
  };

  const progress = step === "register" ? 1 : step === "verify" ? 2 : step === "details" ? 3 : 4;

  return (
    <div className="w-full h-screen absolute inset-0 pointer-events-none z-1">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-6 pointer-events-none">
        <AnimatePresence>
          {Object.entries(
            toasts.reduce<Record<string, Toast[]>>((acc, t) => {
              if (!acc[t.message]) acc[t.message] = [];
              acc[t.message].push(t);
              return acc;
            }, {}),
          ).map(([message, group]) => {
            const latest = group[group.length - 1];
            return (
              <motion.div
                key={message}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="relative pointer-events-auto"
              >
                <div className="pointer-events-auto flex flex-col gap-1.5 max-w-sm min-w-17.5">
                  <div className="flex items-center justify-between gap-3 w-full px-1">
                    <NovToastProgress type={latest.type} progressKey={latest.id} />
                    {group.length > 1 && <NovToastCount type={latest.type} count={group.length} />}
                    <NovToastClose
                      onDismiss={() => setToasts((prev) => prev.filter((item) => item.message !== message))}
                      type={latest.type}
                    />
                  </div>
                  <NovToast stack stackCount={group.length} type={latest.type} message={latest.message} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <main className="relative w-full h-screen flex flex-col md:flex-row gap-6 p-4 pt-25">
        <ImageSide />

        <div className="w-full h-full rounded-2xl bg-surface-raised flex pointer-events-auto justify-center overflow-y-auto relative">
          {step === "success" && <Confetti />}
          <div className="w-full max-w-lg flex flex-col self-center p-8 md:p-12 relative">
            {/* Progress */}
            <div className="w-full flex items-center h-1.5 gap-4 mb-8">
              <div
                className="h-1.5 bg-main transition-all duration-500 ease-out rounded-full"
                style={{ flexGrow: (progress / 4) * 100, flexBasis: 0 }}
              />
              {step !== "success" && (
                <div
                  className="h-1.5 bg-surface-raised transition-all duration-500 ease-out rounded-full"
                  style={{ flexGrow: 100 - (progress / 4) * 100, flexBasis: 0 }}
                />
              )}
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step 1 ── */}
              {step === "register" && (
                <motion.div key="register" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-main/10 text-main flex items-center justify-center">
                        <Mail size={22} />
                      </div>
                      <h1 className="text-4xl font-bold tracking-tight text-main font-fraunces">Załóż konto</h1>
                    </div>
                    <p className="text-ink-muted font-medium text-sm ml-13">
                      Zacznij od adresu e-mail i nazwy użytkownika — wyślemy Ci kod weryfikacyjny.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
                    <NovInput
                      type="email"
                      placeholder="Adres e-mail *"
                      value={email}
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(e) => {
                        // E-mails are case-insensitive — fold as you type and stop
                        // mobile keyboards capitalising the first letter.
                        const raw = e.target.value.replace(/\s+/g, "");
                        setEmail(raw.includes("@") ? raw.toLowerCase() : raw);
                        setErrors((p) => ({ ...p, email: false }));
                      }}
                      error={errors.email}
                      className="h-14 text-center"
                    />
                    <NovInput
                      type="text"
                      placeholder="Nazwa użytkownika *"
                      value={username}
                      autoComplete="username"
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrors((p) => ({ ...p, username: false }));
                      }}
                      error={errors.username}
                      className="h-14 text-center"
                    />
                    <p className="text-[11px] text-ink-subtle text-center -mt-1.5">
                      3–32 znaki: litery, cyfry, podkreślenie oraz kropka.
                    </p>

                    <NovButton type="submit" variant="main" size="xl" fullWidth className="mt-2" disabled={loading}>
                      {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>
                          <span>Wyślij kod weryfikacyjny</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </NovButton>

                    <p className="text-xs text-ink-muted text-center font-medium">
                      Masz już konto?{" "}
                      <NovLink href="/login" className="text-main font-semibold hover:underline">
                        Zaloguj się
                      </NovLink>
                    </p>

                    <div className="mt-3 pt-4 border-t border-edge">
                      <p className="text-xs text-ink-muted text-center font-medium mb-2">
                        Rejestrujesz się w imieniu szkoły?
                      </p>
                      <NovLink
                        href="/register/school"
                        className="flex items-center justify-center gap-2 w-full rounded-xl border border-edge bg-surface px-4 py-3 text-xs font-bold text-ink-muted hover:text-main hover:border-main/40 hover:bg-main/5 transition-colors"
                      >
                        <School size={15} />
                        <span>Zarejestruj szkołę</span>
                        <ArrowRight size={14} />
                      </NovLink>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── Step 2 ── */}
              {step === "verify" && (
                <motion.div key="verify" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-main/10 text-main flex items-center justify-center">
                        <Shield size={22} />
                      </div>
                      <h1 className="text-4xl font-bold tracking-tight text-main font-fraunces">Zweryfikuj e-mail</h1>
                    </div>
                    <p className="text-ink-muted font-medium text-sm ml-13">
                      Wysłaliśmy 6-cyfrowy kod na <span className="font-semibold text-ink">{email}</span>.
                    </p>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="flex flex-col gap-3.5">
                    <OtpInput
                      value={verificationCode}
                      onChange={setVerificationCode}
                      disabled={loading}
                      autoFocus
                    />
                    {/* Only warn about expiry in the last 2:30 */}
                    {timeLeft <= 150 && (
                      <p className="text-xs text-amber-600 text-center font-semibold">
                        Kod wygasa za {formatTime(timeLeft)}.
                      </p>
                    )}

                    <NovButton
                      type="submit"
                      variant="main"
                      size="xl"
                      fullWidth
                      className="mt-2"
                      disabled={loading || verificationCode.length < 6}
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>
                          <span>Potwierdź kod</span>
                          <Check size={16} />
                        </>
                      )}
                    </NovButton>
                  </form>
                </motion.div>
              )}

              {/* ── Step 3 ── */}
              {step === "details" && (
                <motion.div key="details" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-main/10 text-main flex items-center justify-center">
                        <KeyRound size={22} />
                      </div>
                      <h1 className="text-4xl font-bold tracking-tight text-main font-fraunces">Dokończ konto</h1>
                    </div>
                    <p className="text-ink-muted font-medium text-sm ml-13">
                      Ustaw hasło i datę urodzenia, aby korzystać z Novidii.
                    </p>
                  </div>

                  <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-3.5">
                    <PasswordInput
                      placeholder="Hasło *"
                      value={password}
                      onChange={(v) => {
                        setPassword(v);
                        setErrors((p) => ({ ...p, password: false }));
                      }}
                    />
                    {errors.password && <p className="text-[11px] text-rose-600 -mt-2">Minimum 8 znaków.</p>}
                    <PasswordInput
                      placeholder="Powtórz hasło *"
                      value={confirmPassword}
                      showStrengthMeter={false}
                      onChange={(v) => {
                        setConfirmPassword(v);
                        setErrors((p) => ({ ...p, confirmPassword: false }));
                      }}
                    />
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-600 -mt-2">Hasła nie są identyczne.</p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <Cake size={15} className="text-ink-subtle" />
                      <span className="text-xs font-bold text-ink-muted">Data urodzenia *</span>
                    </div>
                    <DateOfBirthPicker
                      value={dob}
                      onChange={(d) => {
                        setDob(d);
                        setErrors((p) => ({ ...p, dob: false }));
                      }}
                    />

                    {under13 && (
                      <div className="flex flex-col gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-3">
                        <p className="text-xs font-bold text-amber-800">Konto dla osoby poniżej 13 lat</p>
                        <p className="text-[11px] text-amber-700 font-medium">
                          Potrzebujemy adresu e-mail opiekuna prawnego. Konto będzie miało ograniczone
                          ustawienia (m.in. brak możliwości usunięcia konta i upublicznienia daty urodzenia).
                        </p>
                        <NovInput
                          type="email"
                          placeholder="E-mail opiekuna prawnego *"
                          value={guardianEmail}
                          onChange={(e) => {
                            setGuardianEmail(e.target.value);
                            setErrors((p) => ({ ...p, guardianEmail: false }));
                          }}
                          error={errors.guardianEmail}
                          className="h-12 text-center"
                        />
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 mt-1 cursor-pointer select-none">
                      <NovCheckbox
                        checked={tosConsent}
                        onChange={(v) => {
                          setTosConsent(v);
                          setErrors((p) => ({ ...p, tosConsent: false }));
                        }}
                      />
                      <span className="text-[11px] text-ink-muted font-medium leading-relaxed">
                        Akceptuję{" "}
                        <a href="/tos" target="_blank" rel="noopener noreferrer" className="text-main font-semibold hover:underline">
                          Regulamin serwisu
                        </a>{" "}
                        oraz{" "}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-main font-semibold hover:underline">
                          Politykę prywatności
                        </a>
                        . *
                      </span>
                    </label>
                    {errors.tosConsent && <p className="text-[11px] text-rose-600 -mt-2">Zgoda jest wymagana.</p>}

                    <NovButton type="submit" variant="main" size="xl" fullWidth className="mt-1" disabled={loading}>
                      {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>
                          <span>Utwórz konto</span>
                          <Check size={16} />
                        </>
                      )}
                    </NovButton>
                  </form>
                </motion.div>
              )}

              {/* ── Success ── */}
              {step === "success" && (
                <motion.div key="success" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-6 items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Check size={32} />
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-main font-fraunces">Witaj w Novidii!</h1>
                  <p className="text-ink-muted font-medium text-sm">
                    Twoje konto jest gotowe. Miłego pisania!
                  </p>
                  <NovButton
                    type="button"
                    variant="main"
                    size="xl"
                    fullWidth
                    onClick={() => router.push("/")}
                  >
                    Przejdź do strony głównej
                  </NovButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
