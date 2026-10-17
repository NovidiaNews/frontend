"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
} from "framer-motion";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    LogOut,
    Settings,
    User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { NovButton, NovIconButton, NovLink } from "@/app/components/ui";
import { cn } from "@/app/components/ui/cn";
import { useI18n } from "@/lib/i18n";
import { sanitizeSvg } from "@/lib/sanitize";
import { categoryIcons } from "./categoryIcons";
import type { Navigation } from "./navbar";

interface BottomNavUser {
    username: string;
    email: string;
    profilePicture?: string;
    firstName?: string;
    lastName?: string;
    role?: number;
    isVerified?: boolean;
}

interface BottomNavProps {
    navigation: Navigation[];
    user: BottomNavUser | null;
    onLogout: () => void;
}

interface Gesture {
    pointerId: number;
    startY: number;
    startPct: number;
    lastY: number;
    lastT: number;
    velocity: number;
    moved: boolean;
    target: EventTarget | null;
}

const SHEET_SPRING = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;
const INSTANT_SPRING = { duration: 0.18 } as const;

function percentOf(value: string | number, height: number): number {
    if (typeof value === "number") {
        return height > 0 ? (value / height) * 100 : 100;
    }
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 100 : parsed;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

const PANEL_TRANSITION =
    "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
const STAGGER_TRANSITION =
    "transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none";
const SAFE_BOTTOM = "max(1.5rem, env(safe-area-inset-bottom))";

export default function BottomNav({ navigation, user, onLogout }: BottomNavProps) {
    const router = useRouter();
    const { t } = useI18n();
    const reduceMotion = useReducedMotion();

    const sheetRef = useRef<HTMLDivElement>(null);
    const heightRef = useRef(0);
    const gestureRef = useRef<Gesture | null>(null);
    const suppressClickRef = useRef(false);
    const suppressClickTimerRef = useRef<number | null>(null);
    const isOpenRef = useRef(false);

    const y = useMotionValue("100%");
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [scrimVisible, setScrimVisible] = useState(false);

    const progress = useTransform(y, (value) => {
        const pct = percentOf(value, heightRef.current);
        return clamp(1 - pct / 100, 0, 1);
    });
    const scrimOpacity = useTransform(progress, [0.03, 0.55], [0, 1]);
    const pillOpacity = useTransform(progress, [0.05, 0.22], [1, 0]);
    const pillScale = useTransform(progress, [0, 0.35], [1, 0.94]);

    useMotionValueEvent(progress, "change", (value) => {
        const nextSheet = value > 0.001;
        const nextScrim = value > 0.03;
        setSheetVisible((prev) => (prev === nextSheet ? prev : nextSheet));
        setScrimVisible((prev) => (prev === nextScrim ? prev : nextScrim));
    });

    useEffect(() => {
        const element = sheetRef.current;
        if (!element) return;
        const measure = () => {
            heightRef.current = element.offsetHeight;
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const openSheet = useCallback(() => {
        if (isOpenRef.current) return;
        isOpenRef.current = true;
        setIsOpen(true);
        animate(y, "0%", reduceMotion ? INSTANT_SPRING : SHEET_SPRING);
    }, [y, reduceMotion]);

    const closeSheet = useCallback(() => {
        if (!isOpenRef.current) return;
        isOpenRef.current = false;
        setIsOpen(false);
        setActiveSubmenu(null);
        animate(y, "100%", reduceMotion ? INSTANT_SPRING : SHEET_SPRING);
    }, [y, reduceMotion]);

    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeSheet();
        };
        const media = window.matchMedia("(min-width: 1280px)");
        const onMediaChange = () => {
            if (media.matches) closeSheet();
        };
        window.addEventListener("keydown", onKeyDown);
        media.addEventListener?.("change", onMediaChange);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            media.removeEventListener?.("change", onMediaChange);
        };
    }, [isOpen, closeSheet]);

    useEffect(
        () => () => {
            if (suppressClickTimerRef.current) window.clearTimeout(suppressClickTimerRef.current);
        },
        []
    );

    const settle = (velocity: number) => {
        const pct = percentOf(y.get(), heightRef.current);
        const value = clamp(1 - pct / 100, 0, 1);
        let open: boolean;
        if (velocity < -700) open = true;
        else if (velocity > 700) open = false;
        else if (velocity < -160) open = value > 0.18;
        else if (velocity > 160) open = value > 0.85;
        else open = value > 0.42;
        if (open) openSheet();
        else closeSheet();
    };

    const beginGesture = (event: React.PointerEvent<HTMLElement>) => {
        if (gestureRef.current || !event.isPrimary) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const height = heightRef.current;
        if (!height) return;

        y.stop();
        const gesture: Gesture = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startPct: percentOf(y.get(), height),
            lastY: event.clientY,
            lastT: performance.now(),
            velocity: 0,
            moved: false,
            target: event.target,
        };
        gestureRef.current = gesture;

        const cleanup = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onCancel);
        };

        const onMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== gesture.pointerId) return;
            const delta = moveEvent.clientY - gesture.startY;
            if (!gesture.moved) {
                if (Math.abs(delta) < 6) return;
                gesture.moved = true;
                suppressClickRef.current = true;
            }
            const liveHeight = heightRef.current;
            if (!liveHeight) return;
            const raw = gesture.startPct + (delta / liveHeight) * 100;
            let pct = raw;
            if (raw < 0) pct = raw * 0.35;
            else if (raw > 100) pct = 100 + (raw - 100) * 0.35;
            y.set(`${Math.round(clamp(pct, -15, 115) * 100) / 100}%`);

            const now = performance.now();
            const elapsed = now - gesture.lastT;
            if (elapsed >= 12) {
                gesture.velocity = ((moveEvent.clientY - gesture.lastY) / elapsed) * 1000;
                gesture.lastY = moveEvent.clientY;
                gesture.lastT = now;
            }
        };

        const finish = (velocity: number) => {
            cleanup();
            gestureRef.current = null;
            if (!gesture.moved) {
                const origin = gesture.target as HTMLElement | null;
                if (!origin?.closest("a,button")) openSheet();
                return;
            }
            settle(velocity);
            if (suppressClickTimerRef.current) window.clearTimeout(suppressClickTimerRef.current);
            suppressClickTimerRef.current = window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 350);
        };

        const onUp = (upEvent: PointerEvent) => {
            if (upEvent.pointerId !== gesture.pointerId) return;
            finish(gesture.velocity);
        };

        const onCancel = (cancelEvent: PointerEvent) => {
            if (cancelEvent.pointerId !== gesture.pointerId) return;
            finish(0);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
    };

    const handleClickCapture = (event: React.MouseEvent) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
    };

    const wheelAccRef = useRef(0);
    const wheelTimerRef = useRef<number | null>(null);

    const handleWheel = (event: React.WheelEvent) => {
        if (isOpenRef.current || event.deltaY >= 0) {
            wheelAccRef.current = 0;
            return;
        }
        wheelAccRef.current += -event.deltaY;
        if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = window.setTimeout(() => {
            wheelAccRef.current = 0;
        }, 300);
        if (wheelAccRef.current > 56) {
            wheelAccRef.current = 0;
            openSheet();
        }
    };

    const handleNav = (event: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        event.preventDefault();
        closeSheet();
        router.prefetch(url);
        window.setTimeout(() => router.push(url), 400);
    };

    const activeNavObj = navigation.find((item) => item.id === activeSubmenu);

    return (
        <>
            {scrimVisible && (
                <motion.div
                    className="fixed inset-0 z-[150] bg-black/45 backdrop-blur-[2px] xl:hidden"
                    style={{ opacity: scrimOpacity }}
                    onClick={closeSheet}
                />
            )}

            <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-[155] flex justify-center px-3 xl:hidden"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
                <motion.div
                    role="navigation"
                    aria-label={t("nav.menu")}
                    aria-hidden={isOpen}
                    inert={isOpen}
                    style={{ opacity: pillOpacity, scale: pillScale }}
                    onPointerDown={beginGesture}
                    onWheel={handleWheel}
                    onClickCapture={handleClickCapture}
                    className={cn(
                        "bg-surface/80 border-edge/60 flex max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-full border p-1.5 shadow-[0_12px_40px_rgba(15,12,50,0.22)] backdrop-blur-xl backdrop-saturate-150 pointer-events-auto select-none touch-none xl:hidden",
                        isOpen && "pointer-events-none"
                    )}
                >
                    {navigation.map((item) =>
                        item.children?.length ? (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setActiveSubmenu(item.id);
                                    openSheet();
                                }}
                                className="text-ink-muted hover:text-ink hover:bg-main/10 min-w-0 shrink truncate rounded-full px-3 py-2 font-montserrat text-xs font-semibold transition-colors sm:text-sm"
                            >
                                {item.title}
                            </button>
                        ) : (
                            <NovLink
                                key={item.id}
                                unstyled
                                href={item.url}
                                onClick={(event) => handleNav(event, item.url)}
                                className="text-ink-muted hover:text-ink hover:bg-main/10 min-w-0 shrink truncate rounded-full px-3 py-2 font-montserrat text-xs font-semibold transition-colors sm:text-sm"
                            >
                                {item.title}
                            </NovLink>
                        )
                    )}
                    <button
                        type="button"
                        onClick={openSheet}
                        aria-label={t("nav.openMenu")}
                        aria-expanded={isOpen}
                        className="bg-main flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-white transition-[filter] hover:brightness-110"
                    >
                        <ChevronUp size={16} className="shrink-0" />
                        <span className="hidden font-montserrat text-xs font-semibold sm:inline">
                            {t("nav.menu")}
                        </span>
                    </button>
                </motion.div>
            </div>

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[160] flex justify-center xl:hidden">
                <motion.div
                    ref={sheetRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("nav.menu")}
                    inert={!isOpen}
                    style={{
                        y,
                        visibility: sheetVisible ? "visible" : "hidden",
                        willChange: "transform",
                    }}
                    className="bg-surface/85 border-edge/60 sheet-max-h pointer-events-auto flex w-full max-w-2xl select-none flex-col overflow-hidden rounded-t-[28px] border-t shadow-[0_-18px_50px_rgba(12,10,40,0.28)] backdrop-blur-2xl backdrop-saturate-150 sm:rounded-t-[32px] xl:hidden"
                >
                    <div
                        onPointerDown={beginGesture}
                        onClickCapture={handleClickCapture}
                        className="cursor-grab active:cursor-grabbing shrink-0 touch-none px-5 pt-3 pb-1"
                    >
                        <div className="bg-ink/40 mx-auto h-1.5 w-12 rounded-full" />
                        <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-ink-subtle font-montserrat text-[13px] font-semibold">
                                {t("nav.menu")}
                            </span>
                            <NovIconButton
                                type="subtle"
                                size="sm"
                                label={t("nav.closeMenu")}
                                onClick={closeSheet}
                            >
                                <ChevronDown size={16} />
                            </NovIconButton>
                        </div>
                    </div>

                    <div className="relative min-h-0 flex-1">
                        <div
                            inert={!!activeSubmenu}
                            aria-hidden={!!activeSubmenu}
                            style={{ paddingBottom: SAFE_BOTTOM }}
                            className={cn(
                                "sheet-scroll absolute inset-0 flex flex-col overflow-y-auto overscroll-contain px-5 pt-1",
                                PANEL_TRANSITION,
                                activeSubmenu ? "-translate-x-full" : "translate-x-0"
                            )}
                        >
                            {navigation.map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{ transitionDelay: `${index * 45}ms` }}
                                    className={cn(
                                        STAGGER_TRANSITION,
                                        isOpen && !activeSubmenu
                                            ? "translate-y-0 opacity-100"
                                            : "translate-y-6 opacity-0"
                                    )}
                                >
                                    {item.children?.length ? (
                                        <NovButton
                                            unstyled
                                            type="button"
                                            variant="plain"
                                            onClick={() => setActiveSubmenu(item.id)}
                                            className="group text-ink-muted hover:text-main flex w-full items-center justify-between text-left font-montserrat text-xl font-semibold transition-colors"
                                        >
                                            <span>{item.title}</span>
                                            <ChevronRight className="text-ink-subtle group-hover:text-main h-6 w-6 transition-colors" />
                                        </NovButton>
                                    ) : (
                                        <NovLink
                                            unstyled
                                            href={item.url}
                                            onClick={(event) => handleNav(event, item.url)}
                                            className="text-ink-muted hover:text-main block w-full font-montserrat text-xl font-semibold transition-colors"
                                        >
                                            {item.title}
                                        </NovLink>
                                    )}
                                </div>
                            ))}

                            <div
                                style={{ transitionDelay: `${navigation.length * 45}ms` }}
                                className={cn(
                                    "border-edge mt-auto flex flex-col gap-4 border-t pt-6",
                                    STAGGER_TRANSITION,
                                    isOpen && !activeSubmenu
                                        ? "translate-y-0 opacity-100"
                                        : "translate-y-6 opacity-0"
                                )}
                            >
                                {user ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="border-edge bg-surface-raised/70 flex items-center gap-3 rounded-2xl border p-3">
                                            {user.profilePicture ? (
                                                user.profilePicture.startsWith("<svg") ? (
                                                    <div
                                                        className="border-edge bg-surface h-12 w-12 overflow-hidden rounded-full border"
                                                        dangerouslySetInnerHTML={{
                                                            __html: sanitizeSvg(user.profilePicture),
                                                        }}
                                                    />
                                                ) : user.profilePicture.startsWith("linear-gradient") ? (
                                                    <div
                                                        className="border-edge h-12 w-12 rounded-full border"
                                                        style={{
                                                            backgroundImage: user.profilePicture,
                                                            backgroundSize: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={user.profilePicture}
                                                        referrerPolicy="no-referrer"
                                                        alt={user.username}
                                                        className="border-edge h-12 w-12 rounded-full border object-cover"
                                                    />
                                                )
                                            ) : (
                                                <div className="bg-surface-raised text-ink-subtle flex h-12 w-12 items-center justify-center rounded-full">
                                                    <UserIcon size={22} />
                                                </div>
                                            )}
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-ink flex items-center gap-1.5 font-montserrat text-base font-bold">
                                                    {user.firstName
                                                        ? `${user.firstName}${user.lastName ? ` ${user.lastName.trim().charAt(0).toUpperCase()}.` : ""}`
                                                        : user.username}
                                                </span>
                                                <span className="text-ink-subtle truncate font-montserrat text-xs">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                        <NovLink
                                            unstyled
                                            href="profile"
                                            onClick={(event) => handleNav(event, "profile")}
                                            className="border-edge bg-surface hover:bg-surface-raised flex items-center gap-3 rounded-2xl border p-3 transition-colors"
                                        >
                                            <UserIcon size={18} className="text-ink-subtle" />
                                            <span className="text-ink font-montserrat text-sm font-semibold">
                                                {t("nav.yourProfile")}
                                            </span>
                                        </NovLink>
                                        <NovLink
                                            unstyled
                                            href="?settings=true"
                                            onClick={() => closeSheet()}
                                            className="border-edge bg-surface hover:bg-surface-raised flex items-center gap-3 rounded-2xl border p-3 transition-colors"
                                        >
                                            <Settings size={18} className="text-ink-subtle" />
                                            <span className="text-ink font-montserrat text-sm font-semibold">
                                                {t("nav.settings")}
                                            </span>
                                        </NovLink>
                                        <NovButton
                                            unstyled
                                            type="button"
                                            variant="plain"
                                            onClick={onLogout}
                                            className="text-rose-600 hover:text-rose-800 flex items-center gap-3 rounded-2xl p-3 text-left font-montserrat text-sm font-semibold transition-colors"
                                        >
                                            <LogOut size={18} />
                                            <span>{t("nav.logout")}</span>
                                        </NovButton>
                                    </div>
                                ) : (
                                    <>
                                        <NovLink
                                            unstyled
                                            href="/register"
                                            onClick={(event) => handleNav(event, "/register")}
                                            className="bg-main w-full rounded-full py-4 text-center font-montserrat text-lg font-medium text-white transition-[filter] hover:brightness-110"
                                        >
                                            {t("nav.register")}
                                        </NovLink>
                                        <NovLink
                                            unstyled
                                            href="/login"
                                            onClick={(event) => handleNav(event, "/login")}
                                            className="bg-surface-raised text-ink hover:bg-superwhite w-full rounded-full py-4 text-center font-montserrat text-lg font-medium transition-colors"
                                        >
                                            {t("nav.login")}
                                        </NovLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div
                            inert={!activeSubmenu}
                            aria-hidden={!activeSubmenu}
                            style={{ paddingBottom: SAFE_BOTTOM }}
                            className={cn(
                                "sheet-scroll absolute inset-0 flex flex-col overflow-y-auto overscroll-contain px-5 pt-1",
                                PANEL_TRANSITION,
                                activeSubmenu ? "translate-x-0" : "translate-x-full"
                            )}
                        >
                            {activeNavObj && (
                                <>
                                    <NovButton
                                        unstyled
                                        type="button"
                                        variant="plain"
                                        onClick={() => setActiveSubmenu(null)}
                                        className="group text-ink-subtle hover:text-ink mb-6 flex items-center gap-2 transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                                        <span className="font-montserrat font-medium">
                                            {t("nav.back")}
                                        </span>
                                    </NovButton>
                                    <h3 className="text-ink mb-6 font-montserrat text-2xl font-bold">
                                        {activeNavObj.title}
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {activeNavObj.children?.map((child, index) => {
                                            const Icon = child.icon ? categoryIcons[child.icon] : null;
                                            return (
                                                <NovLink
                                                    unstyled
                                                    key={child.id}
                                                    href={child.url}
                                                    onClick={(event) => handleNav(event, child.url)}
                                                    style={{ transitionDelay: `${index * 45 + 150}ms` }}
                                                    className={cn(
                                                        "border-edge bg-surface hover:shadow-md flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-[transform,opacity,box-shadow] duration-300 font-montserrat",
                                                        activeSubmenu
                                                            ? "translate-y-0 opacity-100"
                                                            : "pointer-events-none translate-y-6 opacity-0"
                                                    )}
                                                >
                                                    {Icon && (
                                                        <div className="bg-surface-raised/70 rounded-xl p-3">
                                                            <Icon className="text-main h-6 w-6" />
                                                        </div>
                                                    )}
                                                    <span className="text-ink font-montserrat text-lg font-medium">
                                                        {child.title}
                                                    </span>
                                                </NovLink>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
