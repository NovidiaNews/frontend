"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import UserBadge from "@/app/components/UserBadge";
import {
  AlertTriangle,
  AtSign,
  Bell,
  Camera,
  Check,
  ChevronDown,
  CircleCheck,
  Crop,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Facebook,
  FileText,
  Globe,
  ImagePlus,
  Instagram,
  KeyRound,
  Link2,
  Link2Off,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Palette,
  Power,
  ScrollText,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Twitter,
  Upload,
  User,
  UserCog,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  NovButton,
  NovIconButton,
  NovInput,
  NovSwitch,
  NovTextarea,
} from "@/app/components/ui";
import { useTheme } from "@/lib/useTheme";
import type { ThemePreference } from "@/lib/useTheme";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES, flagUrl } from "@/lib/translations";
import { cdnUrl } from "@/lib/cdn";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_URL = "/api";

const KNOWN_PROVIDERS = ["google", "discord", "facebook", "apple"];

const SOCIAL_BASE: Record<string, string | null> = {
  instagram: "https://instagram.com/",
  twitter: "https://twitter.com/",
  facebook: "https://facebook.com/",
  discord: null,
};

const inputCls =
  "w-full bg-surface-raised border border-edge rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-ink-subtle transition-colors focus:outline-none shadow-sm focus:ring-2 focus:ring-main/40 focus:border-transparent";
const inputClsError =
  "w-full bg-surface-raised border border-red-400/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-ink-subtle transition-colors focus:outline-none shadow-sm focus:ring-2 focus:ring-red-500/40 focus:border-transparent";

// ---------------------------------------------------------------------------
// Types & config for the GitHub-style navigation
// ---------------------------------------------------------------------------

type SubSectionId =
  | "profile-picture"
  | "profile-background"
  | "profile-details"
  | "profile-socials"
  | "profile-basic"
  | "profile-preview"
  | "account-email"
  | "account-password"
  | "account-devices"
  | "notifications-main"
  | "privacy-export"
  | "privacy-consent"
  | "linked-accounts"
  | "appearance-theme"
  | "appearance-language"
  | "danger-account";

interface SectionConfig {
  id: SubSectionId;
  label: string;
  icon: LucideIcon;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  subs: SectionConfig[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "profile",
    label: "Profil",
    icon: User,
    subs: [
      { id: "profile-picture", label: "Zdjęcie profilowe", icon: Camera },
      { id: "profile-background", label: "Tło profilu", icon: ImagePlus },
      { id: "profile-details", label: "Szczegóły profilu", icon: Sparkles },
      { id: "profile-socials", label: "Social media", icon: AtSign },
      { id: "profile-basic", label: "Podstawowe dane", icon: UserRound },
      { id: "profile-preview", label: "Podgląd profilu", icon: Eye },
    ],
  },
  {
    id: "account",
    label: "Konto",
    icon: UserCog,
    subs: [
      { id: "account-email", label: "Adres e-mail", icon: Mail },
      { id: "account-password", label: "Zmiana hasła", icon: KeyRound },
      { id: "account-devices", label: "Zalogowane urządzenia", icon: Monitor },
    ],
  },
  {
    id: "notifications",
    label: "Powiadomienia",
    icon: Bell,
    subs: [{ id: "notifications-main", label: "Powiadomienia", icon: Bell }],
  },
  {
    id: "privacy",
    label: "Prywatność",
    icon: Shield,
    subs: [
      { id: "privacy-export", label: "Twoje dane (RODO)", icon: FileText },
      { id: "privacy-consent", label: "Zgody i regulamin", icon: ScrollText },
    ],
  },
  {
    id: "linked",
    label: "Połączone konta",
    icon: Link2,
    subs: [{ id: "linked-accounts", label: "Połączone konta", icon: Link2 }],
  },
  {
    id: "appearance",
    label: "Wygląd",
    icon: Palette,
    subs: [
      { id: "appearance-theme", label: "Motyw", icon: Palette },
      { id: "appearance-language", label: "Język", icon: Globe },
    ],
  },
  {
    id: "danger",
    label: "Strefa zagrożenia",
    icon: AlertTriangle,
    subs: [{ id: "danger-account", label: "Konto", icon: AlertTriangle }],
  },
];

const ALL_SECTION_IDS = CATEGORIES.flatMap((c) => c.subs.map((s) => s.id));
const ALL_SUBS = CATEGORIES.flatMap((c) => c.subs);

function getSection(id: SubSectionId): SectionConfig | undefined {
  return ALL_SUBS.find((s) => s.id === id);
}

function normalizeTab(raw: string | null): SubSectionId | null {
  if (raw === "appearance") return "appearance-theme";
  if (raw === "linked") return "linked-accounts";
  if (raw === "notifications") return "notifications-main";
  if (raw === "profile") return "profile-basic";
  if (raw === "security") return "account-email";
  if (raw === "account-disable" || raw === "danger-disable" || raw === "danger-delete") return "danger-account";
  if (raw && (ALL_SECTION_IDS as string[]).includes(raw)) return raw as SubSectionId;
  return null;
}

interface SocialsState {
  instagram: string;
  twitter: string;
  facebook: string;
  discord: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  profilePicture: string;
  backgroundPicture: string;
  headline: string;
  location: string;
  pronouns: string;
  website: string;
  socials: SocialsState;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}const EMPTY_SOCIALS: SocialsState = { instagram: "", twitter: "", facebook: "", discord: "" };

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  bio: "",
  profilePicture: "",
  backgroundPicture: "",
  headline: "",
  location: "",
  pronouns: "",
  website: "",
  socials: { ...EMPTY_SOCIALS },
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

interface NovidiaUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
  backgroundPicture?: string;
  headline?: string;
  location?: string;
  pronouns?: string;
  website?: string;
  socials?: Record<string, unknown>;
  notificationsEnabled?: boolean;
  theme?: string;
  isDisabled?: boolean;
  disabledAt?: string;
  consentToTOS?: boolean;
  isOnboarded?: boolean;
  isVerified?: boolean;
  role?: number;
  createdAt?: string;
  linkedAccounts?: { id: string; provider: string; providerId?: string; createdAt?: string }[];
  [key: string]: unknown;
}

type Toast = { id: number; type: "success" | "error"; text: string };

const str = (v: unknown): string => (typeof v === "string" ? v : v ? String(v) : "");

interface LinkedAccountRow {
  provider: string;
  linked: boolean;
  available: boolean;
}

function getSectionLabel(id: SubSectionId): string {
  return getSection(id)?.label ?? id;
}

function getPasswordStrength(password: string): { label: string; score: number; color: string } {
  if (!password) return { label: "", score: 0, color: "bg-edge" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: "Bardzo słabe", color: "bg-red-500" },
    { label: "Słabe", color: "bg-orange-500" },
    { label: "Średnie", color: "bg-amber-500" },
    { label: "Dobre", color: "bg-lime-500" },
    { label: "Bardzo silne", color: "bg-emerald-500" },
  ];
  const idx = Math.min(score, levels.length - 1);
  return { ...levels[idx], score: idx + 1 };
}// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function AvatarPreview({
  picture,
  fallback,
  size = 80,
  className,
}: {
  picture?: string;
  fallback?: string;
  size?: number;
  className?: string;
}) {
  const isGradient = !!picture && picture.startsWith("linear-gradient");
  const src = cdnUrl(picture);
  return (
    <div
      className={`rounded-full border-2 border-edge-strong bg-surface-raised flex items-center justify-center font-extrabold text-ink-muted overflow-hidden shrink-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        backgroundImage: isGradient ? picture : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!picture && (fallback?.charAt(0).toUpperCase() || "?")}
      {picture && !isGradient && (
        <img src={src ?? picture} referrerPolicy="no-referrer" alt="Avatar" className="w-full h-full object-cover" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banner crop tool (3:1 → 1500×500)
// ---------------------------------------------------------------------------

const BANNER_OUT_W = 1500;
const BANNER_OUT_H = 500;

function BannerCropModal({
  open,
  src,
  onApply,
  onCancel,
}: {
  open: boolean;
  src: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (open) {
      setScale(1.2);
      setOffset({ x: 0, y: 0 });
    }
  }, [open]);

  const shownDims = () => {
    const img = imgRef.current;
    const vw = viewRef.current?.clientWidth || 300;
    const vh = vw / 3;
    if (!img || !img.naturalWidth) return { vw, vh, imgW: vw, imgH: vh, factor: 1 };
    const base = Math.max(vw / img.naturalWidth, vh / img.naturalHeight);
    const s = base * scale;
    return { vw, vh, imgW: img.naturalWidth * s, imgH: img.naturalHeight * s, factor: 1 / s };
  };

  const clampOffset = (x: number, y: number) => {
    const { vw, vh, imgW, imgH } = shownDims();
    return {
      x: Math.min(0, Math.max(vw - imgW, x)),
      y: Math.min(0, Math.max(vh - imgH, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    setOffset(clampOffset(d.ox + (e.clientX - d.startX), d.oy + (e.clientY - d.startY)));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const { vw, vh, factor } = shownDims();
    const canvas = document.createElement("canvas");
    canvas.width = BANNER_OUT_W;
    canvas.height = BANNER_OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      img,
      -offset.x * factor,
      -offset.y * factor,
      vw * factor,
      vh * factor,
      0,
      0,
      BANNER_OUT_W,
      BANNER_OUT_H,
    );
    onApply(canvas.toDataURL("image/jpeg", 0.88));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-ink/40 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-edge p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-superwhite flex items-center justify-center shrink-0">
                <Crop size={16} className="text-main" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-ink font-fraunces tracking-tight">Przytnij tło profilu</h3>
                <p className="text-[11px] text-ink-subtle font-medium mt-0.5">
                  Przeciągnij obraz, aby ustawić kadr. Wynik zostanie zapisany w proporcjach 3:1 (1500 × 500 px).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 select-none">
              <ZoomOut size={15} className="text-ink-subtle shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 cursor-pointer"
                style={{ accentColor: "var(--color-main)" }}
                aria-label="Powiększenie"
              />
              <ZoomIn size={15} className="text-ink-subtle shrink-0" />
            </div>

            {/* 3:1 crop viewport */}
            <div
              ref={viewRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => (drag.current.active = false)}
              className={`relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-edge-strong bg-app touch-none ${
                drag.current.active ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                className="absolute top-0 left-0 max-w-none pointer-events-none select-none object-cover"
                style={{
                  width: `${shownDims().imgW}px`,
                  height: `${shownDims().imgH}px`,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <NovButton
                type="button"
                variant="ghost"
                size="none"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold"
              >
                Anuluj
              </NovButton>
              <NovButton
                type="button"
                variant="main"
                size="none"
                onClick={handleApply}
                className="px-4 py-2 rounded-xl text-xs font-bold"
              >
                Zastosuj przycięcie
              </NovButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Card({
  children,
  tone = "default",
  className,
  clip = true,
}: {
  children: React.ReactNode;
  tone?: "default" | "danger" | "info";
  className?: string;
  clip?: boolean;
}) {
  const border =
    tone === "danger" ? "border-rose-500/40 dark:border-rose-600/50" : tone === "info" ? "border-edge-strong" : "border-edge";
  const bg = tone === "danger" ? "bg-rose-500/[0.02] dark:bg-rose-700/[0.04]" : "bg-surface";
  return (
    <div className={`${bg} border ${border} shadow-card rounded-2xl ${clip ? "overflow-hidden" : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}

function CardHeader({
  title,
  description,
  icon,
  action,
  badge,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-edge flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
            {title}
            {badge && (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-main/15 text-main border border-main/20">
                {badge}
              </span>
            )}
          </h3>
          {description && (
            <p className="text-xs text-ink-subtle font-medium mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function SaveButton({
  dirty,
  saving,
  onClick,
  label = "Zapisz",
}: {
  dirty: boolean;
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <NovButton
      unstyled
      type="button"
      variant="plain"
      onClick={onClick}
      disabled={!dirty || saving}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all cursor-pointer ${
        dirty
          ? "bg-main text-white hover:brightness-110 shadow-md shadow-main/10 disabled:opacity-60 disabled:cursor-not-allowed"
          : "bg-superwhite text-main border border-lightest/70 dark:bg-main/10 dark:text-white dark:border-main/20 disabled:cursor-default"
      }`}
    >
      {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      {label}
    </NovButton>
  );
}

function SidebarSubButton({
  sub,
  active,
  onClick,
}: {
  sub: SectionConfig;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = sub.icon;
  return (
    <NovButton
      unstyled
      type="button"
      variant="plain"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`w-full flex items-center gap-2.5 rounded-lg pl-3 pr-2.5 py-2 text-left transition-all cursor-pointer font-montserrat border ${
        active
          ? "bg-lightest/60 text-main border-lightest/70 shadow-sm"
          : "text-ink-muted hover:bg-surface-raised hover:text-ink hover:border-edge border-transparent"
      }`}
    >
      <Icon size={14} className={`shrink-0 ${active ? "text-main" : "text-ink-subtle"}`} />
      <span className="text-xs font-semibold truncate">{sub.label}</span>
    </NovButton>
  );
}function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      className="fixed top-4 right-4 z-[210] flex flex-col gap-2 items-end pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-lg text-xs font-semibold pointer-events-auto max-w-xs ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {t.type === "success" ? (
              <CircleCheck size={15} className="shrink-0" />
            ) : (
              <AlertTriangle size={15} className="shrink-0" />
            )}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Anuluj",
  tone = "default",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-app/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface border border-edge shadow-card rounded-2xl p-6 space-y-4"
          >
            <div>
              <h3 className="text-sm font-extrabold text-ink font-fraunces tracking-tight">{title}</h3>
              <p className="text-xs text-ink-muted font-medium mt-1.5 leading-relaxed">{description}</p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <NovButton type="button" variant="ghost" size="none" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-bold">
                {cancelLabel}
              </NovButton>
              <NovButton
                type="button"
                variant={tone === "danger" ? "danger" : "main"}
                size="none"
                onClick={onConfirm}
                disabled={busy}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                {confirmLabel}
              </NovButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteAccountDialog({
  open,
  busy,
  password,
  email,
  username,
  onPasswordChange,
  onEmailChange,
  onUsernameChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  busy: boolean;
  password: string;
  email: string;
  username: string;
  onPasswordChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const canConfirm = password.length > 0 && email.length > 0 && username.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-app/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface border border-rose-600/50 shadow-card rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-rose-700" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-ink font-fraunces tracking-tight">
                  Usuń konto Novidia
                </h3>
                <p className="text-xs text-ink-muted font-medium mt-1 leading-relaxed">
                  Konto zostanie oznaczone do usunięcia i usunięte za 7 dni.
                  Możesz je przywrócić logując się w tym czasie.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="delete-password" className="block text-[10px] font-bold text-ink-subtle">
                  Hasło
                </label>
                <NovInput
                  unstyled
                  id="delete-password"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Wpisz swoje hasło"
                  className={`${inputClsError} text-sm`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="delete-email" className="block text-[10px] font-bold text-ink-subtle">
                  Adres e-mail
                </label>
                <NovInput
                  unstyled
                  id="delete-email"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Wpisz swój adres e-mail"
                  className={`${inputClsError} text-sm`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="delete-username" className="block text-[10px] font-bold text-ink-subtle">
                  Nazwa użytkownika
                </label>
                <NovInput
                  unstyled
                  id="delete-username"
                  type="text"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder="Wpisz swoją nazwę użytkownika"
                  className={`${inputClsError} text-sm`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <NovButton type="button" variant="ghost" size="none" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-bold">
                Anuluj
              </NovButton>
              <NovButton
                type="button"
                variant="danger"
                size="none"
                onClick={onConfirm}
                disabled={busy || !canConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                Usuń konto na 7 dni
              </NovButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[10px] font-bold text-ink-subtle">
        {label}
      </label>
      <div className="relative">
        <NovInput
          unstyled
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${error ? inputClsError : inputCls} pr-10`}
        />
        <NovIconButton
          unstyled
          type="button"
          size="sm"
          onClick={onToggleShow}
          tabIndex={-1}
          aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-muted cursor-pointer"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </NovIconButton>
      </div>
      {error ? <p className="text-[10px] font-semibold text-red-500">{error}</p> : hint}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-40 bg-surface-raised rounded" />
        <div className="h-3 w-64 bg-surface-raised/70 rounded" />
      </div>
      <div className="h-28 bg-surface border border-edge rounded-2xl shadow-card" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-14 bg-surface border border-edge rounded-xl" />
        <div className="h-14 bg-surface border border-edge rounded-xl" />
      </div>
      <div className="h-24 bg-surface border border-edge rounded-xl" />
    </div>
  );
}

function GateView({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center px-8 max-w-sm mx-auto">
      <Shield size={44} className="text-red-500 mb-3" />
      <h2 className="text-xl font-bold text-main mb-1.5 font-fraunces tracking-tight">Konto wymagane</h2>
      <p className="text-xs text-ink-muted font-semibold mb-6 leading-relaxed">
        Zaloguj się, aby zyskać dostęp do edycji profilu, zmiany haseł i preferencji.
      </p>
      <NovButton
        type="button"
        variant="main"
        size="none"
        onClick={onLogin}
        fullWidth
        className="px-5 py-3 rounded-xl text-sm font-semibold"
      >
        Przejdź do logowania
      </NovButton>
    </div>
  );
}// ---------------------------------------------------------------------------
// OAuth provider metadata + logos (mirrors login page)
// ---------------------------------------------------------------------------

const PROVIDER_META: Record<string, { label: string; bg: string; hover: string; color: string }> = {
  google: { label: "Google", bg: "bg-white", hover: "hover:bg-zinc-50", color: "text-zinc-700" },
  facebook: { label: "Facebook", bg: "bg-[#1877F2]", hover: "hover:bg-[#166fe5]", color: "text-white" },
  apple: { label: "Apple", bg: "bg-black", hover: "hover:bg-zinc-900", color: "text-white" },
  discord: { label: "Discord", bg: "bg-[#5865F2]", hover: "hover:bg-[#4752c4]", color: "text-white" },
};

function SocialLogoSvg({ provider }: { provider: string }) {
  if (provider === "google") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
  if (provider === "facebook") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
  if (provider === "apple") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  );
  if (provider === "discord") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
  );
  return null;
}

function SocialFieldIcon({ name, size = 11 }: { name: string; size?: number }) {
  if (name === "instagram") return <Instagram size={size} />;
  if (name === "twitter") return <Twitter size={size} />;
  if (name === "facebook") return <Facebook size={size} />;
  if (name === "discord") {
    return (
      <svg viewBox="0 0 24 24" className="fill-current" style={{ width: size, height: size }}>
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
      </svg>
    );
  }
  return null;
}

function themeLabel(pref: ThemePreference): string {
  if (pref === "light") return "Jasny";
  if (pref === "dark") return "Ciemny";
  return "Zgodny z systemem";
}

// ---------------------------------------------------------------------------
// Devices (logged-in sessions) section
// ---------------------------------------------------------------------------

interface KnownIp {
  id: string;
  ip: string | null;
  city: string | null;
  country: string | null;
  userAgent: string | null;
  lastUsedAt: string;
  createdAt: string;
}

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: "Nieznana", os: "Nieznany" };

  let browser = "Inna przeglądarka";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR/")) browser = "Opera";
  else if (ua.includes("Vivaldi/")) browser = "Vivaldi";
  else if (ua.includes("Brave/")) browser = "Brave";

  let os = "Inny";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
}

function formatLocation(ip: string | null, city: string | null, country: string | null): string {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (country) parts.push(country);
  if (ip) parts.push(ip);
  return parts.length > 0 ? parts.join(", ") : "Nieznana lokalizacja";
}

function DevicesSection() {
  const { t } = useI18n();
  const [devices, setDevices] = useState<KnownIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/known-ips`, { credentials: "include" });
      if (res.ok) setDevices(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const removeDevice = async (id: string) => {
    setRemoving(id);
    try {
      const res = await fetch(`${API_URL}/users/me/known-ips/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silent
    } finally {
      setRemoving(null);
    }
  };

  const signOutOthers = async () => {
    setSigningOutAll(true);
    try {
      const res = await fetch(`${API_URL}/users/me/known-ips/sign-out-others`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await fetchDevices();
      }
    } catch {
      // silent
    } finally {
      setSigningOutAll(false);
    }
  };

  return (
    <Card clip={false}>
      <CardHeader
        title={t("settings.account.devices")}
        icon={<Monitor size={15} className="text-main shrink-0" />}
        description={t("settings.account.devicesDesc")}
        action={
          devices.length > 1 && (
            <NovButton
              type="button"
              variant="danger"
              size="none"
              onClick={signOutOthers}
              disabled={signingOutAll}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
            >
              {signingOutAll && <Loader2 size={12} className="animate-spin mr-1" />}
              {t("settings.account.signOutAll")}
            </NovButton>
          )
        }
      />
      <div className="px-5 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-ink-subtle">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">{t("settings.account.loadingDevices")}</span>
          </div>
        ) : devices.length === 0 ? (
          <p className="text-xs text-ink-subtle text-center py-6">
            {t("settings.account.noDevices")}
          </p>
        ) : (
          devices.map((device) => {
            const { browser, os } = parseUserAgent(device.userAgent);
            const location = formatLocation(device.ip, device.city, device.country);
            const isCurrentDevice = devices.indexOf(device) === 0;

            return (
              <div
                key={device.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isCurrentDevice
                    ? "border-main/30 bg-main/5"
                    : "border-edge bg-surface-raised"
                }`}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-edge">
                  {os === "Windows" || os === "macOS" || os === "Linux" ? (
                    <Monitor size={18} className="text-ink-subtle" />
                  ) : (
                    <Smartphone size={18} className="text-ink-subtle" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink truncate">
                      {browser} · {os}
                    </span>
                    {isCurrentDevice && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-main/15 text-main border border-main/20">
                        {t("settings.account.currentDevice")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-subtle mt-0.5 truncate">
                    {location}
                  </p>
                  <p className="text-[10px] text-ink-subtle mt-0.5">
                    {t("settings.account.lastActive")}: {new Date(device.lastUsedAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {!isCurrentDevice && (
                  <NovButton
                    type="button"
                    variant="danger"
                    size="none"
                    onClick={() => removeDevice(device.id)}
                    disabled={removing === device.id}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0"
                  >
                    {removing === device.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <LogOut size={12} />
                    )}
                  </NovButton>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Language section
// ---------------------------------------------------------------------------

function LanguageSection() {
  const { locale, setLocale, t } = useI18n();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = LANGUAGES.filter(
    (l) =>
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()),
  );

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Card clip={false}>
      <CardHeader
        title={t("settings.appearance.language")}
        icon={<Globe size={15} className="text-main shrink-0" />}
        description={t("settings.appearance.languageDesc")}
        badge="alpha"
      />
      <div className="px-5 py-5">
        <div ref={ref} className="relative z-10">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-3 bg-surface-raised border border-edge rounded-xl px-4 py-3 text-sm font-medium text-ink hover:border-edge-strong transition-colors cursor-pointer"
          >
            <img src={flagUrl(current.countryCode)} alt={current.label} className="w-6 h-[18px] rounded-sm object-cover shadow-sm" />
            <span className="flex-1 text-left">{current.label}</span>
            <ChevronDown size={16} className={`text-ink-subtle transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 z-50 mt-2 bg-surface border border-edge rounded-xl shadow-card overflow-hidden"
              >
                <div className="p-2 border-b border-edge">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("settings.appearance.langSearch")}
                    className="w-full bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-main/30"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {filtered.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLocale(l.code);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        l.code === locale
                          ? "bg-main/10 text-main"
                          : "text-ink hover:bg-surface-raised"
                      }`}
                    >
                      <img src={flagUrl(l.countryCode)} alt={l.label} className="w-6 h-[18px] rounded-sm object-cover shadow-sm" />
                      <span>{l.label}</span>
                      {l.code === locale && <Check size={14} className="ml-auto text-main" />}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-xs text-ink-subtle text-center py-4">No results</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SettingsModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme: themePref, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();

  const isOpen = searchParams.get("settings") === "true";

  const [activeSection, setActiveSection] = useState<SubSectionId>("profile-basic");
  const [pendingNav, setPendingNav] = useState<SubSectionId | "close" | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => new Set(["profile"]));

  const [user, setUser] = useState<NovidiaUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [basicErrors, setBasicErrors] = useState<Record<string, string>>({});
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingSectionId, setSavingSectionId] = useState<SubSectionId | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [bannerCropOpen, setBannerCropOpen] = useState(false);
  const [bannerCropSource, setBannerCropSource] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [providersFetched, setProvidersFetched] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pfpPickerOpen, setPfpPickerOpen] = useState(false);
  const [pfpDragging, setPfpDragging] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setSocial = (key: keyof SocialsState, value: string) =>
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }));

  const DICEBEAR_STYLES = [
    "weave",
    "squircles",
    "shape-grid",
    "patchwork",
    "loops",
    "initials",
    "disco",
    "bottts-neutral",
    "initial-face",
    "adventurer-neutral",
    "voxel-bot",
    "sprouts",
  ] as const;

  const dicebearUrl = (style: string, seed: string) =>
    `https://api.dicebear.com/10.x/${style}/png?seed=${encodeURIComponent(seed || "user")}&width=256&height=256`;

  const pfpSeed = form.firstName || form.lastName || form.username || "user";

  const handlePfpDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setPfpDragging(true);
  };
  const handlePfpDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setPfpDragging(false);
  };
  const handlePfpDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPfpDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerToast("error", "Wybierz plik graficzny (JPG, PNG, GIF...).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      triggerToast("error", "Rozmiar pliku nie może przekraczać 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setField("profilePicture", reader.result as string);
      setPfpPickerOpen(false);
    };
    reader.onerror = () => triggerToast("error", "Nie udało się odczytać pliku.");
    reader.readAsDataURL(file);
  };

  const triggerToast = (type: "success" | "error", text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 4500);
  };

  const buildFormFromUser = (u: NovidiaUser): FormState => {
    const socials = (u.socials ?? {}) as Record<string, unknown>;
    return {
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      username: u.username || "",
      bio: u.bio || "",
      profilePicture: u.profilePicture || "",
      backgroundPicture: u.backgroundPicture || "",
      headline: str(u.headline),
      location: str(u.location),
      pronouns: str(u.pronouns),
      website: str(u.website),
      socials: {
        instagram: str(socials.instagram),
        twitter: str(socials.twitter),
        facebook: str(socials.facebook),
        discord: str(socials.discord),
      },
      email: u.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  };

  // Sync active section from URL (validated + backward-compatible)
  useEffect(() => {
    const id = normalizeTab(searchParams.get("tab"));
    if (id && isOpen) setActiveSection(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isOpen]);

  // Load initial data whenever settings is opened
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen) return;
    setIsInitializing(true);
    const storedUser = localStorage.getItem("novidia_user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as NovidiaUser;
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          setToken(null);
          setForm(buildFormFromUser(parsedUser));
          setNotificationsEnabled(parsedUser.notificationsEnabled !== false);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }

    const tabId = normalizeTab(searchParams.get("tab"));
    const initialSection = tabId ?? "profile-basic";
    setActiveSection(initialSection);
    const initialCat = CATEGORIES.find((c) => c.subs.some((s) => s.id === initialSection));
    setExpandedCats(initialCat ? new Set([initialCat.id]) : new Set(["profile"]));

    setBasicErrors({});
    setEmailErrors({});
    setPasswordErrors({});
    setDeleteDialogOpen(false);
    setDisableDialogOpen(false);
    setDeletePassword("");
    setDeleteEmail("");
    setDeleteUsername("");
    setPendingNav(null);
    setIsInitializing(false);

    if (storedUser) {
      fetch(`${API_URL}/users/me`, {
        credentials: "include",
      })
        .then((r) => {
          if (!r.ok) throw new Error("refresh failed");
          return r.json();
        })
        .then((fresh: NovidiaUser) => {
          if (!fresh || !fresh.id) return;
          localStorage.setItem("novidia_user", JSON.stringify(fresh));
          setUser(fresh);
          setForm(buildFormFromUser(fresh));
          setNotificationsEnabled(fresh.notificationsEnabled !== false);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);// Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("settings-open");
    } else {
      document.body.classList.remove("settings-open");
    }
    return () => {
      document.body.classList.remove("settings-open");
    };
  }, [isOpen]);

  // Seed theme preference from the backend when none is stored locally
  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedPref = localStorage.getItem("novidia-theme");
      if (!storedPref && user?.theme) {
        if (user.theme === "light" || user.theme === "dark" || user.theme === "system") {
          setTheme(user.theme);
        }
      }
    } catch {
      /* storage unavailable — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.theme]);

  // Success toast after an OAuth link redirect (?settings=true&tab=linked&linked=<provider>)
  useEffect(() => {
    if (!isOpen) return;
    if (searchParams.get("tab") === "linked") {
      const provider = searchParams.get("linked");
      if (provider) {
        const meta = PROVIDER_META[provider];
        triggerToast("success", `Połączono konto ${meta?.label ?? provider}.`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchParams]);

  // Fetch the list of enabled OAuth providers
  useEffect(() => {
    if (!isOpen || !user) return;
    setProvidersFetched(false);
    fetch(`${API_URL}/auth/providers`)
      .then((r) => r.json())
      .then((d: { providers?: string[] }) => {
        const list = Array.isArray(d.providers) ? d.providers : [];
        setProviders(list);
        setProvidersFetched(true);
      })
      .catch(() => setProvidersFetched(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  // Track the section currently in view inside the scrollable content column
  useEffect(() => {
    if (!isOpen || isInitializing || !user) return;
    const main = mainRef.current;
    if (!main) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        let best = visible[0];
        for (const e of visible) {
          if (e.target.getBoundingClientRect().top < best.target.getBoundingClientRect().top) best = e;
        }
        setActiveSection((best.target as HTMLElement).id as SubSectionId);
      },
      { root: main, rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    for (const sub of ALL_SUBS) {
      const el = document.getElementById(sub.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isInitializing, user?.id]);

  // Scroll to the URL-provided section right after the modal mounts
  useEffect(() => {
    if (!isOpen || isInitializing || !user) return;
    const id = normalizeTab(searchParams.get("tab"));
    if (id) {
      const t = window.setTimeout(() => scrollToSection(id, "auto"), 60);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isInitializing, user?.id]);

  // Keep the active section's category expanded in the sidebar
  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.subs.some((s) => s.id === activeSection));
    if (cat && !expandedCats.has(cat.id)) {
      setExpandedCats((prev) => {
        const next = new Set(prev);
        next.add(cat.id);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };const scrollToSection = (id: SubSectionId, behavior: ScrollBehavior = "smooth") => {
    setActiveSection(id);
    const el = document.getElementById(id);
    const main = mainRef.current;
    if (el && main) {
      const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + 8;
      main.scrollTo({ top: main.scrollTop + top, behavior });
    }
  };

  const closeSettings = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("settings");
    params.delete("tab");
    const query = params.toString() ? `?${params.toString()}` : "";
    setPendingNav(null);
    setDeleteDialogOpen(false);
    setDisableDialogOpen(false);
    setDeletePassword("");
    setDeleteEmail("");
    setDeleteUsername("");
    router.push(`${pathname}${query}`);
  };

  // -------------------------------------------------------------------------
  // Dirty tracking
  // -------------------------------------------------------------------------

  const dirtySections = useMemo(() => {
    if (!user) return {};
    const f = form;
    const uSocials = (user.socials ?? {}) as Record<string, unknown>;
    return {
      "profile-picture": f.profilePicture !== (user.profilePicture || ""),
      "profile-background": f.backgroundPicture !== (user.backgroundPicture || ""),
      "profile-details":
        f.headline !== (user.headline || "") ||
        f.location !== (user.location || "") ||
        f.pronouns !== (user.pronouns || "") ||
        f.website !== (user.website || ""),
      "profile-socials":
        f.socials.instagram !== str(uSocials.instagram) ||
        f.socials.twitter !== str(uSocials.twitter) ||
        f.socials.facebook !== str(uSocials.facebook) ||
        f.socials.discord !== str(uSocials.discord),
      "profile-basic":
        f.firstName !== (user.firstName || "") ||
        f.lastName !== (user.lastName || "") ||
        f.username !== (user.username || "") ||
        f.bio !== (user.bio || ""),
      "account-email": f.email !== (user.email || "") || f.currentPassword.length > 0,
      "account-password": f.newPassword.length > 0 || f.confirmPassword.length > 0,
    };
  }, [form, user]) as Record<string, boolean>;

  const anyDirty = useMemo(() => Object.values(dirtySections).some(Boolean), [dirtySections]);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validateBasic = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedUsername = form.username.trim();
    if (!trimmedUsername) errors.username = "Nazwa użytkownika jest wymagana.";
    else if (trimmedUsername.length < 3) errors.username = "Minimum 3 znaki.";
    else if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) errors.username = "Dozwolone: litery, cyfry, _ oraz .";
    if (form.bio.length > 500) errors.bio = "Biogram jest zbyt długi.";
    setBasicErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEmail = (): boolean => {
    const errors: Record<string, string> = {};
    const email = form.email.trim();
    const emailChanged = email !== (user?.email || "");
    if (!email) errors.email = "Adres e-mail jest wymagany.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Nieprawidłowy format adresu e-mail.";
    if (emailChanged && !form.currentPassword) errors.currentPassword = "Podaj aktualne hasło, aby potwierdzić zmianę e-maila.";
    setEmailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};
    const wantsChange = form.newPassword.length > 0 || form.confirmPassword.length > 0;
    if (wantsChange) {
      if (form.newPassword.length < 8) errors.newPassword = "Hasło musi mieć min. 8 znaków.";
      if (form.newPassword !== form.confirmPassword) errors.confirmPassword = "Hasła nie są identyczne.";
      if (!form.currentPassword) errors.currentPassword = "Podaj aktualne hasło, aby zmienić hasło.";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDirtySections = (ids: SubSectionId[]): boolean => {
    let ok = true;
    if (ids.includes("profile-basic")) ok = validateBasic() && ok;
    if (ids.includes("account-email")) ok = validateEmail() && ok;
    if (ids.includes("account-password")) ok = validatePassword() && ok;
    return ok;
  };// -------------------------------------------------------------------------
  // Saving
  // -------------------------------------------------------------------------

  const patchUser = async (payload: Record<string, unknown>): Promise<NovidiaUser> => {
    const res = await fetch(`${API_URL}/users/${user?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(errData.message || "Błąd podczas zapisywania zmian.");
    }
    return (await res.json()) as NovidiaUser;
  };

  const applyUserUpdate = (extra: Partial<NovidiaUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged: NovidiaUser = { ...prev, ...extra };
      localStorage.setItem("novidia_user", JSON.stringify(merged));
      return merged;
    });
    window.dispatchEvent(new Event("novidia_auth_change"));
  };

  const stripSecrets = (payload: Record<string, unknown>): Partial<NovidiaUser> => {
    const copy = { ...payload };
    delete copy.password;
    delete copy.currentPassword;
    return copy as Partial<NovidiaUser>;
  };

  const buildSectionPayload = (id: SubSectionId): Record<string, unknown> => {
    const f = form;
    switch (id) {
      case "profile-picture":
        return { profilePicture: f.profilePicture };
      case "profile-background":
        return { backgroundPicture: f.backgroundPicture || null };
      case "profile-details":
        return { headline: f.headline, location: f.location, pronouns: f.pronouns, website: f.website };
      case "profile-socials":
        return { socials: { ...f.socials } };
      case "profile-basic":
        return { firstName: f.firstName, lastName: f.lastName, username: f.username, bio: f.bio };
      case "account-email":
        return { email: f.email, ...(f.currentPassword ? { currentPassword: f.currentPassword } : {}) };
      case "account-password":
        return { currentPassword: f.currentPassword, ...(f.newPassword ? { password: f.newPassword } : {}) };
      default:
        return {};
    }
  };

  const saveSection = async (id: SubSectionId): Promise<boolean> => {
    if (!user) return false;
    const payload = buildSectionPayload(id);
    setSavingSectionId(id);
    try {
      const updated = await patchUser(payload);
      applyUserUpdate(updated);
      if (id === "account-email") {
        setForm((prev) => ({ ...prev, currentPassword: "" }));
        setEmailErrors({});
      } else if (id === "account-password") {
        setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        setPasswordErrors({});
      }
      return true;
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "błąd zapisu";
      applyUserUpdate(stripSecrets(payload));
      triggerToast("error", `Zapisano lokalnie (brak połączenia z API: ${msg})`);
      return false;
    } finally {
      setSavingSectionId(null);
    }
  };

  const handleSaveOne = async (id: SubSectionId) => {
    if (!user) return;
    if (!validateDirtySections([id])) {
      triggerToast("error", "Popraw błędy w formularzu i spróbuj ponownie.");
      return;
    }
    await saveSection(id);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    const ids = (Object.keys(dirtySections) as SubSectionId[]).filter((id) => dirtySections[id]);
    if (ids.length === 0) return;
    if (!validateDirtySections(ids)) {
      triggerToast("error", "Popraw błędy w formularzach i spróbuj ponownie.");
      return;
    }
    let saved = 0;
    for (const id of ids) {
      if (await saveSection(id)) saved++;
    }
  };

  const discardAll = () => {
    if (!user) return;
    setForm(buildFormFromUser(user));
    setBasicErrors({});
    setEmailErrors({});
    setPasswordErrors({});
  };// -------------------------------------------------------------------------
  // Navigation & unsaved-changes handling
  // -------------------------------------------------------------------------

  const requestSection = (id: SubSectionId) => {
    if (anyDirty && id !== activeSection) {
      setPendingNav(id);
      return;
    }
    scrollToSection(id);
  };

  const requestClose = () => {
    if (anyDirty) {
      setPendingNav("close");
      return;
    }
    closeSettings();
  };

  const confirmDiscardNav = () => {
    discardAll();
    if (pendingNav === "close") {
      closeSettings();
    } else if (pendingNav) {
      scrollToSection(pendingNav);
    }
    setPendingNav(null);
  };

  // Escape key precedence: delete/disable dialog -> pendingNav dialog -> close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteDialogOpen || disableDialogOpen) {
        setDeleteDialogOpen(false);
        setDisableDialogOpen(false);
        return;
      }
      if (pendingNav !== null) {
        setPendingNav(null);
        return;
      }
      requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, deleteDialogOpen, disableDialogOpen, pendingNav, anyDirty]);

  // -------------------------------------------------------------------------
  // Media uploads
  // -------------------------------------------------------------------------

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, onResult: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerToast("error", "Wybierz plik graficzny (JPG, PNG, GIF...).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      triggerToast("error", "Rozmiar pliku nie może przekraczać 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onResult(reader.result as string);
    };
    reader.onerror = () => triggerToast("error", "Nie udało się odczytać pliku.");
    reader.readAsDataURL(file);
    e.target.value = "";
  };// -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  const handleSaveNotifications = async (next: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(next);
    if (!user) {
      triggerToast("error", "Zapisano lokalnie (brak połączenia z API: brak danych logowania)");
      return;
    }
    try {
      const updated = await patchUser({ notificationsEnabled: next });
      applyUserUpdate(updated);
    } catch (err) {
      console.error(err);
      applyUserUpdate({ notificationsEnabled: next });
      triggerToast("error", `Zapisano lokalnie (brak połączenia z API: ${err instanceof Error ? err.message : "nie udało się zsynchronizować"})`);
    }
    void previous;
  };

  // -------------------------------------------------------------------------
  // Account lifecycle: disable / enable / delete / export / sign out
  // -------------------------------------------------------------------------

  const handleDisableAccount = async () => {
    if (!user) return;
    setDisabling(true);
    try {
      const res = await fetch(`${API_URL}/users/me/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Nie udało się wyłączyć konta.");
      }
      const data = (await res.json().catch(() => null)) as NovidiaUser | null;
      applyUserUpdate(data && data.id ? data : { isDisabled: true, disabledAt: new Date().toISOString() });
      setDisableDialogOpen(false);
      triggerToast("success", "Konto zostało wyłączone. Możesz je przywrócić w każdej chwili.");
    } catch (err) {
      console.error(err);
      triggerToast("error", err instanceof Error ? err.message : "Nie udało się wyłączyć konta.");
    } finally {
      setDisabling(false);
    }
  };

  const handleEnableAccount = async () => {
    if (!user) return;
    setReactivating(true);
    try {
      const res = await fetch(`${API_URL}/users/me/enable`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Nie udało się przywrócić konta.");
      }
      const data = (await res.json().catch(() => null)) as NovidiaUser | null;
      applyUserUpdate(data && data.id ? data : { isDisabled: false });
      triggerToast("success", "Twoje konto zostało przywrócone.");
    } catch (err) {
      console.error(err);
      triggerToast("error", err instanceof Error ? err.message : "Nie udało się przywrócić konta.");
    } finally {
      setReactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!deletePassword || !deleteEmail || !deleteUsername) return;
    setDeletingAccount(true);
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          password: deletePassword,
          email: deleteEmail,
          username: deleteUsername,
        }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Błąd podczas usuwania konta.");
      }
      triggerToast("success", "Konto zostało oznaczone do usunięcia. Zostanie trwale usunięte za 7 dni.");
      setDeleteDialogOpen(false);
      setDeletePassword("");
      setDeleteEmail("");
      setDeleteUsername("");
    } catch (err) {
      triggerToast("error", err instanceof Error ? err.message : "Nie udało się usunąć konta.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("novidia_user");
    window.dispatchEvent(new Event("novidia_auth_change"));
    closeSettings();
    router.push("/");
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const res = await fetch(`${API_URL}/users/me/export`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Nie udało się pobrać danych.");
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `novidia-dane-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("success", "Plik z Twoimi danymi został pobrany.");
    } catch (err) {
      console.error(err);
      triggerToast("error", err instanceof Error ? err.message : "Nie udało się pobrać danych.");
    } finally {
      setExportingData(false);
    }
  };// -------------------------------------------------------------------------
  // Linked accounts
  // -------------------------------------------------------------------------

  const linkedList = useMemo(
    () => (user?.linkedAccounts ?? []).map((la) => la.provider),
    [user?.linkedAccounts]
  );

  const providerRows = useMemo<LinkedAccountRow[]>(() => {
    const available = providersFetched ? providers : KNOWN_PROVIDERS;
    const availableSet = new Set(available);
    const seen = new Set<string>();
    const rows: LinkedAccountRow[] = [];
    for (const p of [...available, ...linkedList]) {
      if (seen.has(p)) continue;
      seen.add(p);
      rows.push({ provider: p, linked: linkedList.includes(p), available: availableSet.has(p) });
    }
    return rows;
  }, [providers, providersFetched, linkedList]);

  const linkedAt = (provider: string): string => {
    const la = (user?.linkedAccounts ?? []).find((a) => a.provider === provider);
    if (!la?.createdAt) return "";
    const d = new Date(la.createdAt);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pl-PL");
  };

  const handleLink = (provider: string) => {
    try {
      window.location.assign(`${API_URL}/auth/${provider}/link`);
    } catch {
      triggerToast(
        "error",
        `Nie udało się otworzyć autoryzacji (${PROVIDER_META[provider]?.label ?? provider}). Spróbuj ponownie później.`,
      );
    }
  };

  const handleUnlink = async (provider: string) => {
    if (!user) return;
    setUnlinkingProvider(provider);
    try {
      const res = await fetch(`${API_URL}/users/me/links/${provider}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Nie udało się odłączyć konta.");
      }
      const linkedAccounts = (user.linkedAccounts ?? []).filter((la) => la.provider !== provider);
      applyUserUpdate({ linkedAccounts });
      triggerToast("success", `Odłączono konto ${PROVIDER_META[provider]?.label ?? provider}.`);
    } catch (err) {
      console.error(err);
      triggerToast("error", err instanceof Error ? err.message : "Nie udało się odłączyć konta.");
    } finally {
      setUnlinkingProvider(null);
    }
  };

  // -------------------------------------------------------------------------
  // Appearance
  // -------------------------------------------------------------------------

  const handleSelectTheme = async (next: ThemePreference) => {
    if (next === themePref) return;
    setTheme(next);
    if (!user) return;
    try {
      const updated = await patchUser({ theme: next });
      applyUserUpdate(updated);
    } catch (err) {
      console.error(err);
      applyUserUpdate({ theme: next });
      triggerToast("error", `Zapisano lokalnie (brak połączenia z API: ${err instanceof Error ? err.message : "błąd synchronizacji"})`);
    }
  };

  const strength = getPasswordStrength(form.newPassword);
  const displayName = `${form.firstName} ${form.lastName}`.trim() || form.username;
  const websiteHref = form.website
    ? /^https?:\/\//i.test(form.website)
      ? form.website
      : `https://${form.website}`
    : "";
  const createdAtLabel = user?.createdAt
    ? (() => {
        const d = new Date(user.createdAt);
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pl-PL");
      })()
    : "";// -------------------------------------------------------------------------
  // Section bodies
  // -------------------------------------------------------------------------

  const renderSectionBody = (sub: SectionConfig) => {
    switch (sub.id) {
      case "profile-picture":
        return (
          <Card>
            <CardHeader
              title={t("settings.picture.title")}
              icon={<Camera size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["profile-picture"]}
                  saving={savingSectionId === "profile-picture"}
                  onClick={() => handleSaveOne("profile-picture")}
                />
              }
            />
            <div className="px-5 py-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <AvatarPreview picture={form.profilePicture} fallback={form.username} size={80} />
                </div>
                <div className="flex-grow space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                    <NovButton
                      unstyled
                      type="button"
                      variant="plain"
                      onClick={() => setPfpPickerOpen(true)}
                      className="bg-surface-raised hover:bg-surface border border-edge text-ink-muted px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <Camera size={15} />
                      <span className="hidden sm:inline">{t("settings.picture.selectDisk")}</span>
                      <span className="sm:hidden">Wybierz zdjęcie</span>
                    </NovButton>
                    {form.profilePicture && (
                      <NovButton
                        unstyled
                        type="button"
                        variant="plain"
                        onClick={() => setField("profilePicture", "")}
                        className="text-rose-700 hover:text-rose-800 font-semibold text-xs cursor-pointer"
                      >
                        {t("settings.picture.remove")}
                      </NovButton>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-subtle font-medium text-center sm:text-left">
                    {t("settings.picture.formatHint")}
                  </p>
                </div>
              </div>

              {pfpPickerOpen && (
                <div className="border border-edge rounded-2xl bg-surface-raised/50 p-4 sm:p-5 space-y-4 sm:space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      {t("settings.picture.title")}
                    </span>
                    <NovButton
                      unstyled
                      type="button"
                      variant="plain"
                      onClick={() => setPfpPickerOpen(false)}
                      className="text-ink-subtle hover:text-ink transition-colors"
                    >
                      <X size={16} />
                    </NovButton>
                  </div>

                  <div
                    className="flex justify-center"
                    onDragOver={handlePfpDragOver}
                    onDragLeave={handlePfpDragLeave}
                    onDrop={handlePfpDrop}
                  >
                    <div className="relative group">
                      <div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                          pfpDragging
                            ? "border-main scale-105 animate-[shake_0.3s_ease-in-out_infinite]"
                            : "border-edge group-hover:border-main/50"
                        }`}
                      >
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <Upload size={18} className={pfpDragging ? "text-main" : "text-ink-subtle group-hover:text-main transition-colors"} />
                          <span className="text-[9px] font-semibold text-ink-subtle group-hover:text-main transition-colors">
                            {t("settings.picture.upload")}
                          </span>
                          <NovInput
                            unstyled
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              handleImageFile(e, (v) => {
                                setField("profilePicture", v);
                                setPfpPickerOpen(false);
                              });
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <style>{`
                        @keyframes shake {
                          0%, 100% { transform: translateX(0); }
                          20% { transform: translateX(-4px) rotate(-2deg); }
                          40% { transform: translateX(4px) rotate(2deg); }
                          60% { transform: translateX(-3px) rotate(-1deg); }
                          80% { transform: translateX(3px) rotate(1deg); }
                        }
                      `}</style>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
                      {t("settings.picture.illustrations")}
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                      {DICEBEAR_STYLES.map((style) => {
                        const url = dicebearUrl(style, pfpSeed);
                        const isSelected = form.profilePicture === url;
                        return (
                          <NovButton
                            unstyled
                            key={style}
                            type="button"
                            variant="plain"
                            onClick={() => {
                              setField("profilePicture", url);
                              setPfpPickerOpen(false);
                            }}
                            className={`relative flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                              isSelected
                                ? "border-main bg-main/5 shadow-md"
                                : "border-edge hover:border-main/30"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-edge">
                              <img
                                src={url}
                                alt={style}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <span className="text-[9px] font-semibold text-ink-subtle capitalize truncate w-full text-center">
                              {style.replace("-", " ")}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-main flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </div>
                            )}
                          </NovButton>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-ink-subtle text-center font-medium pt-1">
                      z DiceBear
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case "profile-background":
        return (
          <Card>
            <CardHeader
              title="Tło profilu"
              icon={<ImagePlus size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["profile-background"]}
                  saving={savingSectionId === "profile-background"}
                  onClick={() => handleSaveOne("profile-background")}
                />
              }
            />
            <div className="px-5 py-5 space-y-4">
              <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden border border-edge bg-surface-raised flex items-center justify-center">
                {form.backgroundPicture ? (
                  <img
                    src={cdnUrl(form.backgroundPicture) ?? form.backgroundPicture}
                    alt="Tło profilu"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus size={20} className="text-ink-subtle" />
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="bg-surface-raised hover:bg-surface border border-edge text-ink-muted px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                  <ImagePlus size={15} />
                  Wybierz z dysku
                  <NovInput
                    unstyled
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageFile(e, (v) => {
                        setBannerCropSource(v);
                        setBannerCropOpen(true);
                      })
                    }
                    className="hidden"
                  />
                </label>
                {form.backgroundPicture && (
                  <NovButton
                    unstyled
                    type="button"
                    variant="plain"
                    onClick={() => setField("backgroundPicture", "")}
                    className="text-rose-700 hover:text-rose-800 font-semibold text-xs cursor-pointer"
                  >
                    Usuń tło
                  </NovButton>
                )}
              </div>
              <p className="text-[10px] text-ink-subtle font-medium">
                Opcjonalne zdjęcie w tle profilu. Zalecany rozmiar: 1500 × 500 px (proporcje 3:1). PNG, JPG lub GIF,
                maksymalnie 2MB. Zdjęcie można przyciąć po wybraniu pliku.
              </p>
            </div>
          </Card>
        );case "profile-details":
        return (
          <Card>
            <CardHeader
              title="Szczegóły profilu"
              icon={<Sparkles size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["profile-details"]}
                  saving={savingSectionId === "profile-details"}
                  onClick={() => handleSaveOne("profile-details")}
                />
              }
            />
            <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="headline" className="block text-[10px] font-bold text-ink-subtle">
                  Nagłówek
                </label>
                <NovInput
                  unstyled
                  id="headline"
                  type="text"
                  value={form.headline}
                  onChange={(e) => setField("headline", e.target.value)}
                  placeholder="Twój krótki nagłówek..."
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="location" className="block text-[10px] font-bold text-ink-subtle">
                  Lokalizacja
                </label>
                <div className="relative">
                  <NovInput
                    unstyled
                    id="location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="Miasto, kraj"
                    className={`${inputCls} pl-9`}
                  />
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pronouns" className="block text-[10px] font-bold text-ink-subtle">
                  Zaimki
                </label>
                <NovInput
                  unstyled
                  id="pronouns"
                  type="text"
                  value={form.pronouns}
                  onChange={(e) => setField("pronouns", e.target.value)}
                  placeholder="np. on/jego, ona/jej"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="website" className="block text-[10px] font-bold text-ink-subtle">
                  Strona internetowa
                </label>
                <div className="relative">
                  <NovInput
                    unstyled
                    id="website"
                    type="text"
                    value={form.website}
                    onChange={(e) => setField("website", e.target.value)}
                    placeholder="https://twojastrona.pl"
                    className={`${inputCls} pl-9`}
                  />
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
                </div>
              </div>
            </div>
          </Card>
        );

      case "profile-socials":
        return (
          <Card>
            <CardHeader
              title="Social media"
              icon={<AtSign size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["profile-socials"]}
                  saving={savingSectionId === "profile-socials"}
                  onClick={() => handleSaveOne("profile-socials")}
                />
              }
            />
            <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ["instagram", "Instagram"],
                  ["twitter", "X / Twitter"],
                  ["facebook", "Facebook"],
                  ["discord", "Discord"],
                ] as [keyof SocialsState, string][]
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <label
                    htmlFor={`social-${key}`}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-ink-subtle"
                  >
                    <SocialFieldIcon name={key} />
                    {label}
                  </label>
                  <NovInput
                    unstyled
                    id={`social-${key}`}
                    type="text"
                    value={form.socials[key]}
                    onChange={(e) => setSocial(key, e.target.value)}
                    placeholder={key === "discord" ? "nazwa_użytkownika" : "@nazwa"}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </Card>
        );case "profile-basic":
        return (
          <Card>
            <CardHeader
              title="Podstawowe dane"
              icon={<UserRound size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["profile-basic"]}
                  saving={savingSectionId === "profile-basic"}
                  onClick={() => handleSaveOne("profile-basic")}
                />
              }
            />
            <div className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="block text-[10px] font-bold text-ink-subtle">
                    Imię
                  </label>
                  <NovInput
                    unstyled
                    id="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    placeholder="Wpisz imię"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="block text-[10px] font-bold text-ink-subtle">
                    Nazwisko
                  </label>
                  <NovInput
                    unstyled
                    id="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    placeholder="Wpisz nazwisko"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-[10px] font-bold text-ink-subtle">
                  Nazwa użytkownika (pseudonim)
                </label>
                <NovInput
                  unstyled
                  id="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  placeholder="Wpisz pseudonim"
                  className={basicErrors.username ? inputClsError : inputCls}
                />
                {basicErrors.username && (
                  <p className="text-[10px] font-semibold text-red-500">{basicErrors.username}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio" className="block text-[10px] font-bold text-ink-subtle">
                    Biogram
                  </label>
                  <span className={`text-[10px] font-bold ${form.bio.length > 500 ? "text-red-500" : "text-ink-subtle"}`}>
                    {form.bio.length}/500
                  </span>
                </div>
                <NovTextarea
                  unstyled
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  placeholder="Napisz kilka słów o sobie..."
                  maxLength={500}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                {basicErrors.bio && (
                  <p className="text-[10px] font-semibold text-red-500">{basicErrors.bio}</p>
                )}
              </div>
            </div>
          </Card>
        );

      case "profile-preview":
        return (
          <Card>
            <CardHeader
              title="Podgląd profilu"
              icon={<Eye size={15} className="text-main shrink-0" />}
              description="Podgląd aktualizuje się na żywo z formularza — zmiany zapiszesz przyciskami „Zapisz”."
            />
            <div className="p-5">
              <div className="bg-surface border border-edge shadow-card rounded-2xl overflow-hidden">
                <div className="relative">
                  <div className="h-24 sm:h-28 w-full flex items-center justify-center">
                    {form.backgroundPicture ? (
                      <img
                        src={cdnUrl(form.backgroundPicture) ?? form.backgroundPicture}
                        alt="Tło profilu"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-tr from-main via-medium to-light opacity-50" />
                    )}
                  </div>
                  <div className="absolute -bottom-8 left-5">
                    <AvatarPreview
                      picture={form.profilePicture}
                      fallback={displayName}
                      size={72}
                    />
                  </div>
                </div>
                <div className="pt-11 px-5 pb-5 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-extrabold text-ink truncate">{displayName}</p>
                    {form.pronouns && (
                      <span className="text-[11px] font-semibold text-ink-subtle">({form.pronouns})</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink-muted">
                    @{form.username}
                    {form.headline && <span className="text-ink-subtle font-medium"> · {form.headline}</span>}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold text-ink-muted">
                    {form.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-ink-subtle" />
                        {form.location}
                      </span>
                    )}
                    {websiteHref && (
                      <a
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-main hover:underline"
                      >
                        <Globe size={12} />
                        {form.website}
                      </a>
                    )}
                  </div>
                  {form.bio && (
                    <p className="text-xs text-ink-muted font-medium leading-relaxed whitespace-pre-wrap">
                      {form.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {(
                      [
                        ["instagram", form.socials.instagram],
                        ["twitter", form.socials.twitter],
                        ["facebook", form.socials.facebook],
                        ["discord", form.socials.discord],
                      ] as [string, string][]
                    )
                      .filter(([, v]) => v.trim().length > 0)
                      .map(([key, v]) => {
                        const base = SOCIAL_BASE[key];
                        const href = base ? `${base}${v.replace(/^@/, "")}` : null;
                        return (
                          <a
                            key={key}
                            href={href ?? undefined}
                            target={href ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-raised border border-edge text-[11px] font-semibold text-ink-muted hover:text-main hover:border-main/40 transition-colors"
                          >
                            <SocialFieldIcon name={key} size={11} />
                            {v.replace(/^@/, "")}
                          </a>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );case "account-email":
        return (
          <Card>
            <CardHeader
              title="Adres e-mail"
              icon={<Mail size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["account-email"]}
                  saving={savingSectionId === "account-email"}
                  onClick={() => handleSaveOne("account-email")}
                />
              }
            />
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[10px] font-bold text-ink-subtle">
                  Adres e-mail konta
                </label>
                <NovInput
                  unstyled
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={emailErrors.email ? inputClsError : inputCls}
                />
                {emailErrors.email && (
                  <p className="text-[10px] font-semibold text-red-500">{emailErrors.email}</p>
                )}
              </div>
              <PasswordField
                id="emailCurrentPassword"
                label="Aktualne hasło"
                value={form.currentPassword}
                onChange={(v) => setField("currentPassword", v)}
                placeholder="Wymagane do zmiany adresu e-mail"
                show={showCurrentPassword}
                onToggleShow={() => setShowCurrentPassword((v) => !v)}
                error={emailErrors.currentPassword}
                hint={
                  <p className="text-[10px] text-ink-subtle font-medium">
                    Zmiana adresu e-mail wymaga potwierdzenia aktualnym hasłem.
                  </p>
                }
              />
            </div>
          </Card>
        );

      case "account-password":
        return (
          <Card>
            <CardHeader
              title="Zmiana hasła"
              icon={<LockKeyhole size={15} className="text-main shrink-0" />}
              action={
                <SaveButton
                  dirty={!!dirtySections["account-password"]}
                  saving={savingSectionId === "account-password"}
                  onClick={() => handleSaveOne("account-password")}
                />
              }
            />
            <div className="px-5 py-5 space-y-4">
              <PasswordField
                id="currentPassword"
                label="Aktualne hasło"
                value={form.currentPassword}
                onChange={(v) => setField("currentPassword", v)}
                placeholder="Wymagane do zmiany hasła"
                show={showCurrentPassword}
                onToggleShow={() => setShowCurrentPassword((v) => !v)}
                error={passwordErrors.currentPassword}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField
                  id="newPassword"
                  label="Nowe hasło"
                  value={form.newPassword}
                  onChange={(v) => setField("newPassword", v)}
                  placeholder="Min. 8 znaków"
                  show={showNewPassword}
                  onToggleShow={() => setShowNewPassword((v) => !v)}
                  error={passwordErrors.newPassword}
                  hint={
                    form.newPassword ? (
                      <div className="pt-1 space-y-1">
                        <div className="h-1 w-full rounded-full bg-edge overflow-hidden flex gap-0.5">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-full flex-1 rounded-full transition-colors ${
                                i < strength.score ? strength.color : "bg-edge"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-semibold text-ink-muted">{strength.label}</p>
                      </div>
                    ) : undefined
                  }
                />
                <PasswordField
                  id="confirmPassword"
                  label="Potwierdź nowe hasło"
                  value={form.confirmPassword}
                  onChange={(v) => setField("confirmPassword", v)}
                  placeholder="Powtórz hasło"
                  show={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword((v) => !v)}
                  error={passwordErrors.confirmPassword}
                />
              </div>
            </div>
          </Card>
        );

      case "notifications-main":
        return (
          <Card>
            <CardHeader
              title="Powiadomienia i komunikaty"
              icon={<Bell size={15} className="text-main shrink-0" />}
            />
            <div className="px-5 py-5">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-raised border border-edge shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bell size={18} className="text-main shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">Powiadomienia o artykułach</p>
                    <p className="text-[10px] text-ink-subtle truncate mt-0.5">
                      Informuj o nowych ocenach i komentarzach do publikacji
                    </p>
                  </div>
                </div>
                <NovSwitch
                  checked={notificationsEnabled}
                  onChange={handleSaveNotifications}
                  size="md"
                  className="bg-edge!"
                />
              </div>
              <p className="text-[10px] text-ink-subtle font-medium mt-3">
                Zmiany zapisują się automatycznie.
              </p>
            </div>
          </Card>
        );case "privacy-export":
        return (
          <Card>
            <CardHeader
              title="Twoje dane (RODO)"
              icon={<FileText size={15} className="text-main shrink-0" />}
            />
            <div className="px-5 py-5 flex items-start gap-3">
              <Database size={20} className="text-main shrink-0 mt-0.5" />
              <div className="flex-grow space-y-3">
                <p className="text-xs text-ink-muted leading-relaxed font-medium">
                  Zgodnie z art. 15 i 20 RODO możesz w każdej chwili pobrać kopię wszystkich danych
                  osobowych przechowywanych na Twoim koncie (w tym artykułów) w formacie JSON.
                </p>
                <NovButton
                  unstyled
                  type="button"
                  variant="plain"
                  onClick={handleExportData}
                  disabled={exportingData}
                  className="bg-main/10 hover:bg-main/15 text-main border border-main/20 hover:border-main/40 font-semibold rounded-xl px-4 py-2 text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {exportingData ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Pobierz moje dane
                </NovButton>
              </div>
            </div>
          </Card>
        );

      case "privacy-consent":
        return (
          <Card>
            <CardHeader
              title="Zgody i regulamin"
              icon={<ScrollText size={15} className="text-main shrink-0" />}
            />
            <div className="px-5 py-4 divide-y divide-edge">
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ScrollText size={15} className="text-ink-subtle shrink-0" />
                  <p className="text-xs font-semibold text-ink">Zgoda na regulamin serwisu</p>
                </div>
                {user?.consentToTOS ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 shrink-0">
                    <CircleCheck size={12} />
                    Wyrażono zgodę
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 shrink-0">
                    <AlertTriangle size={12} />
                    Brak zgody
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Database size={15} className="text-ink-subtle shrink-0" />
                  <p className="text-xs font-semibold text-ink">Data utworzenia konta</p>
                </div>
                <span className="text-[10px] font-bold text-ink-subtle shrink-0">
                  {createdAtLabel || "—"}
                </span>
              </div>
              <div className="flex items-center gap-4 py-3 flex-wrap">
                <a
                  href="/tos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-main hover:underline"
                >
                  Regulamin serwisu
                  <ExternalLink size={11} />
                </a>
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-main hover:underline"
                >
                  Polityka prywatności
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </Card>
        );case "linked-accounts":
        return (
          <Card>
            <CardHeader
              title="Połączone konta"
              icon={<Link2 size={15} className="text-main shrink-0" />}
              description="Zaloguj się na swoje konto Novidia przez jednego z dostawców OAuth."
            />
            <div className="px-5 py-5 space-y-4">
              <div className="divide-y divide-edge border border-edge rounded-xl overflow-hidden">
                {providerRows.map((row) => {
                  const meta = PROVIDER_META[row.provider];
                  const label = meta?.label ?? row.provider;
                  const date = linkedAt(row.provider);
                  return (
                    <div key={row.provider} className="flex items-center justify-between gap-3 px-4 py-3.5 bg-surface">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-full bg-surface-raised border border-edge flex items-center justify-center shrink-0">
                          {SocialLogoSvg({ provider: row.provider })}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink">{label}</p>
                          <p className="text-[10px] text-ink-subtle font-medium truncate mt-0.5">
                            {row.linked
                              ? `Połączono${date ? ` ${date}` : ""}`
                              : row.available
                              ? "Nie połączono"
                              : "Niedostępny"}
                          </p>
                        </div>
                      </div>
                      {row.linked ? (
                        <NovButton
                          unstyled
                          type="button"
                          variant="plain"
                          onClick={() => handleUnlink(row.provider)}
                          disabled={unlinkingProvider !== null}
                          className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-500/10 border border-rose-600/30 hover:border-rose-600/60 rounded-xl px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                        >
                          {unlinkingProvider === row.provider ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Link2Off size={12} />
                          )}
                          Odłącz
                        </NovButton>
                      ) : (
                        <NovButton
                          unstyled
                          type="button"
                          variant="plain"
                          onClick={() => handleLink(row.provider)}
                          disabled={!row.available || unlinkingProvider !== null}
                          className="bg-main text-white hover:brightness-110 text-[11px] font-bold rounded-xl px-3.5 py-1.5 shadow-md shadow-main/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                        >
                          <Link2 size={12} />
                          Połącz
                        </NovButton>
                      )}
                    </div>
                  );
                })}
              </div>
              {providerRows.some((r) => !r.available) && (
                <p className="text-[10px] text-ink-subtle font-medium">
                  Niektóre z połączonych usług są chwilowo niedostępne i nie można obecnie połączyć z nimi nowych kont.
                </p>
              )}
              <p className="text-[10px] text-ink-subtle font-medium">
                Połączenie konta wymaga jednorazowej autoryzacji. Możesz je odłączyć w dowolnym
                momencie — chyba że będzie to jedyny sposób logowania na Twoje konto.
              </p>
            </div>
          </Card>
        );

      case "appearance-theme":
        return (
          <Card>
            <CardHeader
              title="Motyw"
              icon={<Palette size={15} className="text-main shrink-0" />}
              description="Wybierz wygląd interfejsu Novidia."
              badge="alpha"
            />
            <div className="px-5 py-5">
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { id: "light", label: "Jasny", icon: Sun, caption: "Klasyczny, jasny interfejs" },
                    { id: "dark", label: "Ciemny", icon: Moon, caption: "Ciemny interfejs" },
                    { id: "system", label: "Zgodny z systemem", icon: Monitor, caption: "Dopasowuje się automatycznie" },
                  ] as { id: ThemePreference; label: string; icon: LucideIcon; caption: string }[]
                ).map((t) => {
                  const active = themePref === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTheme(t.id)}
                      aria-pressed={active}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center cursor-pointer transition-all ${
active
  ? "border-main bg-main/10 text-main shadow-card"
  : "border-edge bg-surface-raised text-ink-muted hover:border-edge-strong hover:text-ink"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-bold">{t.label}</span>
                      <span className="text-[10px] font-medium opacity-70">{t.caption}</span>
                      {active && <Check size={14} className="text-main" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-ink-subtle font-medium mt-3">
                Aktualnie: {themeLabel(themePref)}
                {themePref === "system" && ` (${resolvedTheme === "dark" ? "ciemny" : "jasny"})`}. Motyw
                jest zapisywany na Twoim koncie.
              </p>
            </div>
          </Card>
        );
      case "appearance-language":
        return (
          <LanguageSection />
        );
      case "danger-account":
        return (
          <Card tone="danger">
            <CardHeader
              title="Konto — strefa zagrożenia"
              icon={<AlertTriangle size={15} className="text-rose-700 shrink-0" />}
            />
            <div className="px-5 py-5 space-y-5">
              {/* Disable / reactivate */}
              <div className="space-y-3">
                {user?.isDisabled ? (
                  <>
                    <p className="text-sm font-bold text-ink">Twoje konto jest wyłączone</p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Twoje konto zostało wyłączone
                      {user.disabledAt ? ` w dniu ${new Date(user.disabledAt).toLocaleDateString("pl-PL")}` : ""}
                      . Dane nie zostały usunięte — w każdej chwili możesz je przywrócić.
                    </p>
                    <NovButton
                      type="button"
                      variant="main"
                      size="none"
                      onClick={handleEnableAccount}
                      disabled={reactivating}
                      className="px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      {reactivating && <Loader2 size={13} className="animate-spin" />}
                      Przywróć konto
                    </NovButton>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-ink">Wyłączenie konta</p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Wyłączenie tymczasowo ukryje Twój profil i zatrzyma aktywność, ale nie usunie żadnych
                      danych. Możesz przywrócić konto w każdej chwili.
                    </p>
                    <NovButton
                      type="button"
                      variant="danger"
                      size="none"
                      onClick={() => setDisableDialogOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      <Power size={13} />
                      Wyłącz konto
                    </NovButton>
                  </>
                )}
              </div>

              <div className="border-t border-edge" />

              {/* Permanent deletion */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-ink">Usunięcie konta</p>
          <p className="text-xs text-ink-muted leading-relaxed">
            Trwałe usunięcie konta nastąpi za 7 dni. W tym czasie możesz przywrócić konto logując się.
          </p>
                <NovButton
                  type="button"
                  variant="danger"
                  size="none"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold"
                >
                  <Trash2 size={13} />
                  Chcę usunąć konto
                </NovButton>
          <p className="text-[10px] text-ink-subtle font-medium">
            Aby potwierdzić, wpisz hasło, e-mail i nazwę użytkownika w oknie dialogowym.
          </p>
              </div>
            </div>
          </Card>
        );

      case "account-devices":
        return <DevicesSection />;

      default:
        return null;
    }
  };return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] bg-app flex flex-col font-montserrat select-none"
          role="dialog"
          aria-modal="true"
          aria-label={t("settings.title")}
        >
          <ToastStack toasts={toasts} />

          {/* Header */}
          <header className="shrink-0 border-b border-edge px-3 sm:px-9 py-5 flex items-center justify-between bg-app/90 backdrop-blur-sm z-30">
            <div className="min-w-0">
              <h1 className="font-extrabold text-xl sm:text-2xl font-fraunces text-main leading-tight">
                {t("settings.title")}
              </h1>
              <p className="text-[11px] text-ink-subtle font-medium mt-0.5 hidden sm:block">
                {t("settings.subtitle")}
              </p>
            </div>
            <NovIconButton
              type="neutral"
              label={t("settings.close")}
              onClick={requestClose}
            >
              <X size={16} />
            </NovIconButton>
          </header>

          {/* Body */}
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-edge bg-surface">
              {user && (
                <div className="flex items-center gap-3 mx-3 mt-3 mb-1 px-4 py-4 rounded-2xl bg-surface-raised border border-edge shadow-card relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-linear-to-tr from-main via-medium to-light opacity-15 blur-2xl pointer-events-none" />
                  <div className="relative z-10 shrink-0">
                    <AvatarPreview picture={user.profilePicture} fallback={user.username} size={44} />
                  </div>
                  <div className="relative z-10 min-w-0">
                    <p className="text-sm font-bold text-ink truncate flex items-center gap-1.5">
                      {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}
                      <UserBadge role={user.role} isVerified={user.isVerified} size={14} />
                    </p>
                    <p className="text-[11px] text-ink-muted font-semibold truncate">@{user.username}</p>
                  </div>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const catActive = cat.subs.some((s) => s.id === activeSection);
                  const expanded = expandedCats.has(cat.id);
                  return (
                    <div key={cat.id}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        aria-expanded={expanded}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer font-montserrat ${
                          catActive ? "text-main" : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        <ChevronDown
                          size={13}
                          className={`shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}
                        />
                        <Icon size={15} className={`shrink-0 ${catActive ? "text-main" : "text-ink-subtle"}`} />
                        <span className="text-xs font-bold truncate">{cat.label}</span>
                      </button>
                      {expanded && (
                        <div className="ml-1 mt-0.5 space-y-0.5 border-l border-edge">
                          {cat.subs.map((sub) => (
                            <SidebarSubButton
                              key={sub.id}
                              sub={sub}
                              active={activeSection === sub.id}
                              onClick={() => requestSection(sub.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {user && (
                <div className="border-t border-edge p-3">
                  <NovButton
                    unstyled
                    type="button"
                    variant="plain"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-ink-muted hover:bg-rose-500/10 hover:text-rose-700 transition-colors cursor-pointer font-montserrat"
                  >
                    <LogOut size={16} />
                    {t("settings.logout")}
                  </NovButton>
                </div>
              )}
            </aside>

            {/* Mobile quick nav */}
            <nav className="md:hidden border-b border-edge bg-surface">
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-edge bg-surface-raised">
                  <AvatarPreview picture={user.profilePicture} fallback={user.username} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate flex items-center gap-1.5">
                      {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}
                      <UserBadge role={user.role} isVerified={user.isVerified} size={14} />
                    </p>
                  </div>
                  <NovButton
                    unstyled
                    type="button"
                    variant="plain"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer font-montserrat shrink-0"
                  >
                    <LogOut size={14} />
                    {t("settings.logout")}
                  </NovButton>
                </div>
              )}
              <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                {ALL_SUBS.map((sub) => {
                  const Icon = sub.icon;
                  const active = activeSection === sub.id;
                  return (
                    <NovButton
                      unstyled
                      key={sub.id}
                      type="button"
                      variant="plain"
                      onClick={() => requestSection(sub.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 font-montserrat border ${
                        active
                          ? "bg-superwhite text-main border-lightest/70 shadow-sm"
                          : "bg-surface border-edge text-ink-muted"
                      }`}
                    >
                      <Icon size={13} />
                      {sub.label}
                    </NovButton>
                  );
                })}
              </div>
            </nav>

            {/* Main content */}
            <main ref={mainRef} className="flex-1 overflow-y-auto bg-app">
              <div className="max-w-3xl mx-auto px-4 sm:px-10 py-8 sm:py-10 pb-32 space-y-10">
                {isInitializing ? (
                  <SettingsSkeleton />
                ) : !user ? (
                  <GateView
                    onLogin={() => {
                      closeSettings();
                      router.push("/login");
                    }}
                  />
                ) : (
                  CATEGORIES.flatMap((cat) =>
                    cat.subs.map((sub) => (
                      <section key={sub.id} id={sub.id} className="scroll-mt-4">
                        <div className="mb-4">
                          <h2 className="text-ink text-lg sm:text-xl font-fraunces font-bold tracking-tight">
                            {sub.label}
                          </h2>
                        </div>
                        {renderSectionBody(sub)}
                      </section>
                    ))
                  )
                )}
              </div>
            </main>
          </div>

          {/* Sticky unsaved-changes bar */}
          <AnimatePresence>
            {user && anyDirty && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="fixed bottom-0 left-0 right-0 md:left-72 border-t border-edge bg-surface px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
              >
                <p className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                  <span className="truncate">{t("settings.unsaved")}</span>
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <NovButton
                    type="button"
                    variant="plain"
                    size="none"
                    onClick={discardAll}
                    className="text-xs font-semibold text-ink-muted hover:text-ink px-3 py-2 rounded-xl hover:bg-surface-raised cursor-pointer"
                  >
                    {t("settings.discard")}
                  </NovButton>
                  <NovButton
                    unstyled
                    type="button"
                    variant="plain"
                    size="none"
                    onClick={handleSaveAll}
                    disabled={savingSectionId !== null}
                    className="bg-main text-white text-xs font-semibold rounded-xl px-4 py-2 shadow-md shadow-main/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingSectionId !== null ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {t("settings.saveChanges")}
                  </NovButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ConfirmDialog
            open={pendingNav !== null}
            title={t("settings.unsavedTitle")}
            description={t("settings.unsavedDesc")}
            confirmLabel={t("settings.discardChanges")}
            tone="danger"
            onConfirm={confirmDiscardNav}
            onCancel={() => setPendingNav(null)}
          />

          <ConfirmDialog
            open={disableDialogOpen}
            title={t("settings.danger.disableDialogTitle")}
            description={t("settings.danger.disableDialogDesc")}
            confirmLabel={t("settings.danger.disableBtn")}
            tone="danger"
            busy={disabling}
            onConfirm={handleDisableAccount}
            onCancel={() => setDisableDialogOpen(false)}
          />

          <DeleteAccountDialog
            open={deleteDialogOpen}
            busy={deletingAccount}
            password={deletePassword}
            email={deleteEmail}
            username={deleteUsername}
            onPasswordChange={setDeletePassword}
            onEmailChange={setDeleteEmail}
            onUsernameChange={setDeleteUsername}
            onConfirm={handleDeleteAccount}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setDeletePassword("");
              setDeleteEmail("");
              setDeleteUsername("");
            }}
          />

          <BannerCropModal
            open={bannerCropOpen}
            src={bannerCropSource}
            onApply={(dataUrl) => {
              setField("backgroundPicture", dataUrl);
              setBannerCropOpen(false);
              setBannerCropSource("");
            }}
            onCancel={() => {
              setBannerCropOpen(false);
              setBannerCropSource("");
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}