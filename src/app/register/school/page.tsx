"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageSide from "../../components/pexels/ImageSide";
import PasswordInput from "../../components/auth/PasswordInput";
import { NovButton, NovLink, NovIconButton, NovInput, NovSelect, NovTextarea, NovCheckbox, NovToast, NovToastProgress, NovToastCount, NovToastClose } from "@/app/components/ui";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check, Mail, ArrowRight, Upload, X, Building2, ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";

const API_URL = "/api";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const VOIVODESHIPS = [
  "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
  "łódzkie", "małopolskie", "mazowieckie", "opolskie",
  "podkarpackie", "podlaskie", "pomorskie", "śląskie",
  "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie",
];

const COUNTRIES = [
  { code: "+48", iso: "pl", label: "Polska" },
  { code: "+44", iso: "gb", label: "Wielka Brytania" },
  { code: "+49", iso: "de", label: "Niemcy" },
  { code: "+420", iso: "cz", label: "Czechy" },
  { code: "+421", iso: "sk", label: "Słowacja" },
  { code: "+380", iso: "ua", label: "Ukraina" },
  { code: "+1", iso: "us", label: "Stany Zjednoczone" },
  { code: "+33", iso: "fr", label: "Francja" },
  { code: "+39", iso: "it", label: "Włochy" },
  { code: "+34", iso: "es", label: "Hiszpania" },
  { code: "+43", iso: "at", label: "Austria" },
  { code: "+32", iso: "be", label: "Belgia" },
  { code: "+359", iso: "bg", label: "Bułgaria" },
  { code: "+385", iso: "hr", label: "Chorwacja" },
  { code: "+45", iso: "dk", label: "Dania" },
  { code: "+372", iso: "ee", label: "Estonia" },
  { code: "+358", iso: "fi", label: "Finlandia" },
  { code: "+30", iso: "gr", label: "Grecja" },
  { code: "+353", iso: "ie", label: "Irlandia" },
  { code: "+370", iso: "lt", label: "Litwa" },
  { code: "+352", iso: "lu", label: "Luksemburg" },
  { code: "+371", iso: "lv", label: "Łotwa" },
  { code: "+356", iso: "mt", label: "Malta" },
  { code: "+31", iso: "nl", label: "Holandia" },
  { code: "+47", iso: "no", label: "Norwegia" },
  { code: "+351", iso: "pt", label: "Portugalia" },
  { code: "+40", iso: "ro", label: "Rumunia" },
  { code: "+381", iso: "rs", label: "Serbia" },
  { code: "+386", iso: "si", label: "Słowenia" },
  { code: "+41", iso: "ch", label: "Szwajcaria" },
  { code: "+46", iso: "se", label: "Szwecja" },
  { code: "+36", iso: "hu", label: "Węgry" },
];

const formatPhone = (value: string, countryCode: string): string => {
  let digits = value.replace(/\D/g, "");
  const prefix = countryCode.replace(/\D/g, "");
  if (digits.startsWith(prefix)) digits = digits.slice(prefix.length);
  if (countryCode === "+48") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
  return digits;
};

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: any) {
      myConfetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) }));
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  return <canvas ref={canvasRef} className="absolute left-0 top-0 w-full h-full pointer-events-none z-20" />;
}

export default function SchoolRegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<"register" | "verify" | "onboarding" | "success">("register");
  const [registerStep, setRegisterStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const [formData, setFormData] = useState({
    schoolName: "",
    email: "",
    password: "",
    phoneNumber: "",
    city: "",
    address: "",
    postalCode: "",
    voivodeship: "",
    rspoNumber: "",
    website: "",
  });

  const [phoneCountryCode, setPhoneCountryCode] = useState("+48");
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const phoneDropdownRef = useRef<HTMLDivElement>(null);

  const [tosConsent, setTosConsent] = useState(false);

  const [verificationCode, setVerificationCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(900);
  const [resendCooldown, setResendCooldown] = useState(30);

  const [logo, setLogo] = useState<string>("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop Modal State
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const [tempToken, setTempToken] = useState<string | null>(null);

  const [rspoData, setRspoData] = useState<any>(null);
  const [domainVerifying, setDomainVerifying] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
        setPhoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (step !== "verify" || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step !== "verify" || resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Navigate sub-steps with Enter key
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const el = e.target as HTMLElement;
      if (el.tagName === "BUTTON" || el.tagName === "TEXTAREA" || el.closest("select") || el.closest("[role='listbox']") || el.closest(".phone-dropdown")) return;
      const form = el.closest("form");
      if (!form) return;
      const nextBtn = Array.from(form.querySelectorAll<HTMLButtonElement>("button")).find(b => b.textContent?.trim() === "Dalej");
      if (nextBtn) {
        e.preventDefault();
        nextBtn.click();
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const newErrors: Record<string, boolean> = {};
    if (!formData.schoolName) newErrors.schoolName = true;
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = true;
    if (!formData.password || formData.password.length < 8) newErrors.password = true;
    if (!tosConsent) newErrors.tosConsent = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.tosConsent) {
        showToast("Musisz zaakceptować regulamin (TOS), aby założyć konto.");
      } else {
        showToast("Proszę poprawnie uzupełnić wszystkie wyróżnione pola.");
      }
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        phoneNumber: formData.phoneNumber ? `${phoneCountryCode} ${formData.phoneNumber}` : "",
        consentToTOS: tosConsent,
      };
      const res = await fetch(`${API_URL}/schools/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.domainVerification) {
          showToast(data.domainVerification.message || "Domena nie została zweryfikowana jako szkolna.");
        }
        throw new Error(data.message || "Błąd podczas rejestracji szkoły.");
      }

      setRspoData(data.rspoData);
      setTempToken(data.token);
      setTimeLeft(900);
      setResendCooldown(30);
      setStep("verify");
      showToast("Konto szkoły utworzone. Wysłano kod weryfikacyjny na e-mail.", "success");
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (verificationCode.length < 6) {
      showToast("Wprowadź pełny 6-cyfrowy kod.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/schools/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Błąd weryfikacji.");
      }

      setTempToken(data.token);
      showToast("E-mail szkoły zweryfikowany pomyślnie!", "success");

      if (data.status === "success") {
        localStorage.setItem("novidia_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("novidia_auth_change"));
        setStep("success");
      } else {
        setStep("onboarding");
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const res = await fetch(`${API_URL}/schools/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd wysyłania kodu.");
      setTimeLeft(900);
      setResendCooldown(30);
      setVerificationCode("");
      showToast("Nowy kod weryfikacyjny został wysłany!", "success");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Keep cropping offset bounded so users cannot drag/zoom outside image bounds
  useEffect(() => {
    if (!cropImage || imageSize.width === 0 || imageSize.height === 0) return;
    const W = imageSize.width * cropZoom;
    const H = imageSize.height * cropZoom;

    const minX = 96 - W / 2;
    const maxX = -96 + W / 2;
    const minY = 96 - H / 2;
    const maxY = -96 + H / 2;

    setCropOffset((prev) => ({
      x: Math.max(minX, Math.min(maxX, prev.x)),
      y: Math.max(minY, Math.min(maxY, prev.y)),
    }));
  }, [cropZoom, imageSize, cropImage]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setCropImage(reader.result);
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  // Crop drag event handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - cropOffset.x, y: clientY - cropOffset.y });
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const rawX = clientX - dragStart.x;
    const rawY = clientY - dragStart.y;

    if (imageSize.width > 0 && imageSize.height > 0) {
      const W = imageSize.width * cropZoom;
      const H = imageSize.height * cropZoom;
      const minX = 96 - W / 2;
      const maxX = -96 + W / 2;
      const minY = 96 - H / 2;
      const maxY = -96 + H / 2;

      setCropOffset({
        x: Math.max(minX, Math.min(maxX, rawX)),
        y: Math.max(minY, Math.min(maxY, rawY)),
      });
    } else {
      setCropOffset({ x: rawX, y: rawY });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Process Crop and generate base64 output
  const handleCropApply = () => {
    if (!cropImage || !cropImgRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = cropImgRef.current;

    const fitW = imageSize.width;
    const fitH = imageSize.height;

    ctx.clearRect(0, 0, 200, 200);

    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.clip();

    const scaleFactor = 200 / 192;
    ctx.scale(scaleFactor, scaleFactor);

    ctx.translate(96 + cropOffset.x, 96 + cropOffset.y);
    ctx.scale(cropZoom, cropZoom);
    ctx.drawImage(img, -fitW / 2, -fitH / 2, fitW, fitH);

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
    setLogo(croppedBase64);
    setCropImage(null);
    showToast("Logo zostało pomyślnie zaktualizowane.", "success");
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/schools/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({
          logo: logo || undefined,
          description,
          phoneNumber: formData.phoneNumber ? `${phoneCountryCode} ${formData.phoneNumber}` : undefined,
          city: formData.city,
          address: formData.address,
          postalCode: formData.postalCode,
          website: formData.website,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Błąd zapisu profilu szkoły.");
      }

      localStorage.setItem("novidia_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("novidia_auth_change"));
      setStep("success");
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const slideVariants: Variants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { x: -100, opacity: 0, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
  };

  return (
    <div className="w-full h-screen absolute inset-0 pointer-events-none z-1">

      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-6 pointer-events-none">
        <AnimatePresence>
          {Object.entries(
            toasts.reduce<Record<string, Toast[]>>((acc, t) => {
              if (!acc[t.message]) acc[t.message] = [];
              acc[t.message].push(t);
              return acc;
            }, {})
          ).map(([message, group]) => {
            const latestToast = group[group.length - 1];
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
                    <NovToastProgress type={latestToast.type} progressKey={latestToast.id} />
                    {group.length > 1 && (
                      <NovToastCount type={latestToast.type} count={group.length} />
                    )}
                    <NovToastClose
                      onDismiss={() => setToasts((prev) => prev.filter((item) => item.message !== message))}
                      type={latestToast.type}
                    />
                  </div>
                  <NovToast
                    stack
                    stackCount={group.length}
                    type={latestToast.type}
                    message={latestToast.message}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* CROP MODAL OVERLAY */}
      {cropImage && (
        <div className="fixed inset-0 bg-black/70 z-110 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-ink font-montserrat">Dostosuj logo</h3>
              <NovIconButton unstyled type="button" onClick={() => setCropImage(null)} className="text-ink-muted hover:text-ink cursor-pointer">
                <X size={20} />
              </NovIconButton>
            </div>

            <div
              className="w-full h-72 relative overflow-hidden bg-surface-raised rounded-2xl flex items-center justify-center cursor-move"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              <img
                ref={(el) => { cropImgRef.current = el; }}
                src={cropImage}
                alt="To Crop"
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const cropSize = 192;
                  let w = img.naturalWidth;
                  let h = img.naturalHeight;
                  if (w > h) {
                    h = cropSize;
                    w = (img.naturalWidth / img.naturalHeight) * cropSize;
                  } else {
                    w = cropSize;
                    h = (img.naturalHeight / img.naturalWidth) * cropSize;
                  }
                  setImageSize({ width: w, height: h });
                }}
                style={{
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                  width: imageSize.width || "auto",
                  height: imageSize.height || "auto",
                  userSelect: "none",
                }}
                className="max-w-none transition-transform duration-75 select-none"
              />
              <div className="absolute w-48 h-48 rounded-full border-2 border-white pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]" />
            </div>

            <div className="flex flex-col gap-1.5 relative select-none">
              <span className="text-xs text-ink-muted font-semibold font-montserrat">Zoom:</span>
              <div className="w-full h-8 relative flex items-center">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full flex items-center h-1 gap-3 pointer-events-none z-0">
                  <div
                    className="h-1 bg-main rounded-full transition-all duration-75"
                    style={{ flexGrow: Math.max(0.001, ((cropZoom - 1) / 2) * 100), flexBasis: 0 }}
                  />
                  <div className="w-1.25 h-5 rounded-full bg-main shrink-0" />
                  <div
                    className="h-1 bg-surface-raised rounded-full transition-all duration-75"
                    style={{ flexGrow: Math.max(0.001, 100 - ((cropZoom - 1) / 2) * 100), flexBasis: 0 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <NovButton
                type="button"
                variant="outline"
                size="none"
                onClick={() => setCropImage(null)}
                className="w-1/2 py-3 rounded-xl font-semibold text-sm"
              >
                Anuluj
              </NovButton>
              <NovButton
                type="button"
                variant="main"
                size="none"
                onClick={handleCropApply}
                className="w-1/2 py-3 rounded-xl font-semibold text-sm"
              >
                Zatwierdź
              </NovButton>
            </div>
          </div>
        </div>
      )}

      <main className="relative w-full h-screen flex flex-col md:flex-row gap-6 p-4 pt-25">

        <ImageSide />

        <div className="w-full h-full rounded-2xl bg-surface-raised flex pointer-events-auto justify-center overflow-y-auto relative">
          {step === "success" && <Confetti />}
          <div className="w-full max-w-lg flex flex-col self-center p-8 md:p-12 relative">

            <div className="w-full flex items-center h-1.5 gap-4 mb-8">
              <div
                className="h-1.5 bg-main transition-all duration-500 ease-out rounded-full"
                style={{
                  flexGrow: step === "register" ? (registerStep / 6) * 100 : step === "verify" ? (4 / 6) * 100 : step === "onboarding" ? (5 / 6) * 100 : 100,
                  flexBasis: 0,
                }}
              />
              {step !== "success" && (
                <div
                  className="h-1.5 bg-surface-raised transition-all duration-500 ease-out rounded-full"
                  style={{
                    flexGrow: step === "register" ? 100 - (registerStep / 6) * 100 : step === "verify" ? 100 - (4 / 6) * 100 : step === "onboarding" ? 100 - (5 / 6) * 100 : 0.001,
                    flexBasis: 0,
                  }}
                />
              )}
            </div>

            <AnimatePresence mode="wait">
              {step === "register" && (
                <motion.div
                  key="register"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col gap-5"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-main/10 text-main flex items-center justify-center">
                        <Building2 size={22} />
                      </div>
                      <h1 className="text-4xl font-bold tracking-tight text-main font-fraunces">
                        Rejestracja szkoły
                      </h1>
                    </div>
                    <p className="text-ink-muted font-medium text-sm ml-13">
                      Załóż konto swojej szkoły i dołącz do społeczności Novidii.
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex flex-col gap-4 py-2">
                      <div className="w-full h-14 bg-surface-raised rounded-xl animate-pulse" />
                      <div className="w-full h-14 bg-surface-raised rounded-xl animate-pulse" />
                      <div className="w-full h-14 bg-surface-raised rounded-xl animate-pulse" />
                      <div className="flex gap-4">
                        <div className="w-1/2 h-14 bg-surface-raised rounded-xl animate-pulse" />
                        <div className="w-1/2 h-14 bg-surface-raised rounded-xl animate-pulse" />
                      </div>
                      <div className="w-full h-16 bg-surface-raised rounded-xl animate-pulse" />
                      <div className="w-full h-6 bg-surface-raised/70 rounded-lg animate-pulse mt-2" />
                      <div className="w-full h-14 bg-edge-strong rounded-xl animate-pulse mt-4" />
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterSubmit} onKeyDown={handleFormKeyDown} className="flex flex-col gap-3.5">
                      <AnimatePresence mode="wait">
                        {/* === SUB-STEP 1: Basic Info === */}
                        {registerStep === 1 && (
                          <motion.div
                            key="r1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col gap-3.5"
                          >
                            <NovInput
                              type="text"
                              placeholder="Nazwa szkoły *"
                              value={formData.schoolName}
                              onChange={(e) => {
                                setFormData({ ...formData, schoolName: e.target.value });
                                setErrors({ ...errors, schoolName: false });
                              }}
                              error={errors.schoolName}
                              className="h-14 text-center"
                            />

                            <NovInput
                              type="email"
                              placeholder="Szkolny adres e-mail *"
                              value={formData.email}
                              onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                setErrors({ ...errors, email: false });
                              }}
                              error={errors.email}
                              className="h-14 text-center"
                            />
                            <p className="text-[11px] text-ink-subtle -mt-1.5 text-center">
                              Użyj adresu e-mail w domenie szkoły (np. kontakt@twojaszkoła.edu.pl). Darmowe skrzynki (gmail, wp, o2) nie są akceptowane.
                            </p>

                            <NovButton
                              type="button"
                              variant="main"
                              size="xl"
                              fullWidth
                              className="mt-2"
                              onClick={() => {
                                const newErrors: Record<string, boolean> = {};
                                if (!formData.schoolName) newErrors.schoolName = true;
                                if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = true;
                                if (Object.keys(newErrors).length > 0) {
                                  setErrors(newErrors);
                                  showToast("Uzupełnij wymagane pola.");
                                  return;
                                }
                                setRegisterStep(2);
                              }}
                            >
                              <span>Dalej</span>
                              <ArrowRight size={16} />
                            </NovButton>
                          </motion.div>
                        )}

                        {/* === SUB-STEP 2: Location & Contact === */}
                        {registerStep === 2 && (
                          <motion.div
                            key="r2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col gap-3.5"
                          >
                            <div className="flex gap-3">
                              <div className="w-1/2 relative" ref={phoneDropdownRef}>
                                <div className="flex h-14 rounded-xl border border-edge focus-within:ring-2 focus-within:ring-main focus-within:border-transparent">
                                  <NovButton
                                    unstyled
                                    type="button"
                                    onClick={() => { setPhoneDropdownOpen(!phoneDropdownOpen); setCountrySearch(""); }}
                                    className="flex items-center gap-1.5 px-3 bg-surface-raised hover:bg-surface-raised transition-colors cursor-pointer shrink-0 border-r border-edge rounded-l-xl"
                                  >
                                    <img src={`https://flagcdn.com/16x12/${COUNTRIES.find(c => c.code === phoneCountryCode)?.iso}.png`} alt="" className="w-4 h-3 object-cover rounded-[2px]" />
                                    <span className="text-xs font-semibold text-ink-muted">{phoneCountryCode}</span>
                                    <ChevronDown size={12} className={`text-ink-subtle transition-transform ${phoneDropdownOpen ? "rotate-180" : ""}`} />
                                  </NovButton>
                                  <NovInput
                                    unstyled
                                    type="tel"
                                    placeholder="Telefon"
                                    value={formData.phoneNumber}
                                    onChange={(e) => {
                                      const formatted = formatPhone(e.target.value, phoneCountryCode);
                                      setFormData({ ...formData, phoneNumber: formatted });
                                    }}
                                    className="flex-1 min-w-0 px-3 text-center text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                                  />
                                </div>
                                {phoneDropdownOpen && (
                                  <div className="absolute top-16 left-0 w-full bg-surface rounded-xl border border-edge shadow-lg z-20 max-h-64 overflow-hidden flex flex-col">
                                    <div className="p-2 border-b border-edge">
                                      <NovInput
                                        unstyled
                                        type="text"
                                        placeholder="Szukaj kraju..."
                                        value={countrySearch}
                                        onChange={(e) => setCountrySearch(e.target.value)}
                                        className="w-full h-10 rounded-lg px-3 text-sm border border-edge focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                                      />
                                    </div>
                                    <div className="overflow-y-auto max-h-48">
                                      {COUNTRIES.filter((c) => c.label.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch) || c.iso.includes(countrySearch.toLowerCase())).map((c) => (
                                        <NovButton
                                          key={c.code}
                                          unstyled
                                          type="button"
                                          onClick={() => { setPhoneCountryCode(c.code); setPhoneDropdownOpen(false); setCountrySearch(""); }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface-raised transition-colors cursor-pointer ${phoneCountryCode === c.code ? "bg-main/5 font-semibold" : ""}`}
                                        >
                                          <img src={`https://flagcdn.com/16x12/${c.iso}.png`} alt="" className="w-4 h-3 object-cover rounded-[2px]" />
                                          <span className="text-ink">{c.code}</span>
                                          <span className="text-ink-subtle text-xs ml-auto">{c.label}</span>
                                        </NovButton>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="w-1/2 relative">
                                <NovSelect
                                  value={formData.voivodeship}
                                  onChange={(e) => setFormData({ ...formData, voivodeship: e.target.value })}
                                >
                                  <option value="" disabled>Województwo</option>
                                  {VOIVODESHIPS.map((v) => (<option key={v} value={v}>{v}</option>))}
                                </NovSelect>
                              </div>
                            </div>

                            <NovInput
                              type="text"
                              placeholder="Miejscowość"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="h-14 text-center"
                            />

                            <div className="flex gap-3">
                              <NovInput
                                unstyled
                                type="text"
                                placeholder="Adres"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-2/3 h-14 rounded-xl px-4 border border-edge focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent placeholder:text-ink-muted text-ink text-center text-sm"
                              />
                              <NovInput
                                unstyled
                                type="text"
                                placeholder="Kod poczt."
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                className="w-1/3 h-14 rounded-xl px-4 border border-edge focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent placeholder:text-ink-muted text-ink text-center text-sm"
                              />
                            </div>

                            <div className="flex gap-3 mt-1">
                              <NovButton
                                type="button"
                                variant="outline"
                                size="none"
                                onClick={() => setRegisterStep(1)}
                                className="w-1/3 h-14 rounded-xl font-semibold text-sm"
                              >
                                Wstecz
                              </NovButton>
                              <NovButton
                                type="button"
                                variant="main"
                                size="none"
                                onClick={() => setRegisterStep(3)}
                                className="w-2/3 h-14 rounded-xl font-semibold text-sm"
                              >
                                <span>Dalej</span>
                                <ArrowRight size={16} />
                              </NovButton>
                            </div>
                          </motion.div>
                        )}

                        {/* === SUB-STEP 3: Password & Review === */}
                        {registerStep === 3 && (
                          <motion.div
                            key="r3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col gap-3.5"
                          >
                            <PasswordInput
                              value={formData.password}
                              onChange={(val) => {
                                setFormData({ ...formData, password: val });
                                setErrors({ ...errors, password: false });
                              }}
                              placeholder="Utwórz silne hasło"
                              className={errors.password ? "border-2 border-red-500 ring-2 ring-red-500/20" : ""}
                            />

                            <div className="flex gap-3">
                              <NovInput
                                unstyled
                                type="text"
                                placeholder="Nr RSPO (opcjonalnie)"
                                value={formData.rspoNumber}
                                onChange={(e) => setFormData({ ...formData, rspoNumber: e.target.value })}
                                className="w-1/2 h-14 rounded-xl px-4 border border-edge focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent placeholder:text-ink-muted text-ink text-center text-sm"
                              />
                              <NovInput
                                unstyled
                                type="url"
                                placeholder="Strona WWW"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-1/2 h-14 rounded-xl px-4 border border-edge focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent placeholder:text-ink-muted text-ink text-center text-sm"
                              />
                            </div>

                            <div className="flex items-center gap-3 mt-2 px-1">
                              <NovCheckbox
                                checked={tosConsent}
                                onChange={(checked) => { setTosConsent(checked); setErrors({ ...errors, tosConsent: false }); }}
                                error={errors.tosConsent}
                              />
                              <span className="text-ink-muted font-medium text-xs select-none">
                                Akceptuję <NovLink href="/tos" target="_blank" variant="text">Regulamin (TOS)</NovLink> i <NovLink href="/privacy-policy" target="_blank" variant="text">Politykę prywatności</NovLink> serwisu Novidia.
                              </span>
                            </div>

                            <div className="flex gap-3 mt-1">
                              <NovButton
                                type="button"
                                variant="outline"
                                size="none"
                                onClick={() => setRegisterStep(2)}
                                className="w-1/3 h-14 rounded-xl font-semibold text-sm"
                              >
                                Wstecz
                              </NovButton>
                              <NovButton
                                type="submit"
                                variant="main"
                                size="none"
                                className="w-2/3 h-14 rounded-xl font-semibold text-sm"
                              >
                                <span>Zarejestruj</span>
                                <ArrowRight size={16} />
                              </NovButton>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  )}

                  <div className="flex flex-row gap-4 mt-4 justify-center items-center">
                    <p className="text-center text-ink-muted text-xs">
                      Masz już konto szkoły? <NovLink href="/login" variant="text">Zaloguj się</NovLink>
                    </p>
                    <div className="w-1 h-1 bg-edge-strong rounded-full" />
                    <p className="text-center text-ink-muted text-xs">
                      <NovLink href="/register" variant="text">Rejestracja użytkownika</NovLink>
                    </p>
                  </div>
                </motion.div>
              )}

              {step === "verify" && (
                <motion.div
                  key="verify"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-50 text-main rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                      <Mail size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-main font-fraunces mb-2">
                      Potwierdź e-mail szkoły
                    </h1>
                    <p className="text-ink-muted text-sm max-w-sm mx-auto font-montserrat">
                      Wysłaliśmy 6-cyfrowy kod na adres <span className="font-semibold text-ink">{formData.email}</span>.
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex flex-col gap-6 py-2">
                      <div className="w-full h-14 bg-surface-raised rounded-xl animate-pulse" />
                      <div className="w-1/2 h-4 bg-surface-raised rounded animate-pulse mx-auto" />
                      <div className="w-full h-14 bg-edge-strong rounded-xl animate-pulse" />
                    </div>
                  ) : (
                    <form onSubmit={handleVerifySubmit} className="flex flex-col gap-6">
                      <NovInput
                        unstyled
                        type="text"
                        maxLength={6}
                        placeholder="Wpisz 6-cyfrowy kod weryfikacyjny"
                        value={verificationCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "").substring(0, 6);
                          setVerificationCode(val);
                        }}
                        className="w-full h-14 rounded-xl border border-edge text-center font-semibold text-lg text-ink focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent bg-surface shadow-sm placeholder:text-ink-muted placeholder:text-sm placeholder:font-normal"
                      />

                      <NovButton
                        type="submit"
                        variant="main"
                        size="xl"
                        fullWidth
                        disabled={timeLeft <= 0}
                      >
                        <span>Zweryfikuj e-mail</span>
                        <Check size={16} />
                      </NovButton>

                      <div className="flex flex-col items-center gap-1 h-fit">
                        {resendCooldown <= 0 && (
                          <p className="text-ink-muted text-xs font-montserrat flex items-center gap-1.5">
                            Nie dostałeś kodu?{" "}
                            <NovButton
                              type="button"
                              variant="text"
                              size="none"
                              onClick={handleResendCode}
                            >
                              Wyślij ponownie!
                            </NovButton>
                          </p>
                        )}
                      </div>
                    </form>
                  )}

                  <div className="flex justify-center items-center text-xs mt-2 border-t border-edge pt-4">
                    <NovButton
                      unstyled
                      type="button"
                      onClick={() => setStep("register")}
                      className="text-ink-muted hover:text-ink transition-colors font-medium cursor-pointer"
                    >
                      Zmień e-mail
                    </NovButton>
                  </div>
                </motion.div>
              )}

              {step === "onboarding" && (
                <motion.div
                  key="onboarding"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-main font-fraunces">
                      Uzupełnij profil szkoły
                    </h1>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center gap-6 py-4">
                      <div className="w-48 h-6 bg-surface-raised rounded animate-pulse" />
                      <div className="w-32 h-4 bg-surface-raised rounded animate-pulse" />
                      <div className="w-36 h-36 bg-surface-raised rounded-full animate-pulse" />
                      <div className="w-full max-w-xs h-14 bg-edge-strong rounded-xl animate-pulse mt-4" />
                    </div>
                  ) : (
                    <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col items-center gap-5 py-2">
                        <div className="text-center">
                          <h2 className="text-lg font-bold text-ink font-montserrat mb-1">
                            Logo szkoły
                          </h2>
                          <p className="text-xs text-ink-muted font-montserrat">
                            Dodaj logo swojej szkoły lub przejdź dalej.
                          </p>
                        </div>

                        <div className="relative w-36 h-36">
                          <div className="w-full h-full rounded-full shadow-lg overflow-hidden bg-surface-raised flex items-center justify-center border-2 border-dashed border-edge-strong">
                            {logo ? (
                              <img src={logo} alt="Logo" className="w-full h-full object-cover" draggable={false} />
                            ) : (
                              <Building2 size={48} className="text-ink-subtle" />
                            )}
                          </div>
                          <NovIconButton
                            unstyled
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 w-10 h-10 bg-surface-raised hover:bg-surface-raised text-ink-muted rounded-full flex items-center justify-center shadow-lg border-1 border-edge cursor-pointer transition-all"
                          >
                            <Upload size={18} />
                          </NovIconButton>
                          <NovInput unstyled ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                        </div>

                        <NovTextarea
                          placeholder="Opis szkoły (opcjonalnie)"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          maxLength={1000}
                          rows={3}
                          className="py-3"
                        />

                        <NovButton
                          unstyled
                          type="submit"
                          className="w-full max-w-xs h-14 rounded-xl bg-main hover:brightness-115 text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-sm mt-2"
                        >
                          <span>{logo || description ? "Zakończ" : "Pomiń"}</span>
                          <ArrowRight size={16} />
                        </NovButton>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col items-center justify-center text-center gap-6 py-8 relative"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 border border-green-200 text-green-600 flex items-center justify-center mb-2 shadow-sm">
                    <Check size={40} className="stroke-[3px]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-main font-fraunces mb-2">
                      Szkoła zarejestrowana!
                    </h1>
                    <p className="text-ink-muted font-medium text-sm max-w-xs mx-auto">
                      Twoja szkoła dołączyła do społeczności Novidii. Możesz już zarządzać szkolnymi artykułami.
                    </p>
                  </div>
                  <NovButton
                    onClick={() => router.push("/")}
                    variant="main"
                    size="xl"
                    fullWidth
                    className="max-w-xs"
                  >
                    <span>Przejdź do strony głównej</span>
                    <ArrowRight size={16} />
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
