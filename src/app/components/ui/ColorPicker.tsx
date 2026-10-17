"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowLeftRight,
  Pipette,
  Check,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "./cn";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_ACCENT } from "@/lib/accent";

export interface ColorPickerProps {
  /**
   * Current colour or gradient as hex spec:
   * `#RRGGBB` (1 stop = solid) or `#RRGGBB,#RRGGBB,...` (2-4 stops = gradient)
   */
  value: string;
  onChange: (hexOrGradient: string) => void;
  /** Accessible label for the picker (translated by caller or defaulted). */
  label?: string;
  /** Accessible label for the hue slider. */
  hueLabel?: string;
  ariaLabelHex?: string;
  className?: string;
  /** Show the hex text field under the sliders. */
  showHexInput?: boolean;
  /** Disables all interaction. */
  disabled?: boolean;
  /** Render inline instead of dropdown popover (default: false = dropdown). */
  inline?: boolean;
  /** Allow gradient editing (default: true). Supports down to 1 color. */
  allowGradient?: boolean;
  /** Maximum color stops allowed (default: 4). */
  maxStops?: number;
}

// ---------------------------------------------------------------------------
// Colour maths (HSV ↔ hex & normalization)
// ---------------------------------------------------------------------------

function normalizeHex(input: string): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim();
  const m3 = /^#?([0-9a-fA-F]{3})$/.exec(v);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const m6 = /^#?([0-9a-fA-F]{6})$/.exec(v);
  if (m6) return `#${m6[1]}`.toUpperCase();
  return null;
}

function parseStops(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [DEFAULT_ACCENT];
  const parts = value
    .split(",")
    .map((s) => normalizeHex(s))
    .filter((s): s is string => Boolean(s));
  return parts.length > 0 ? parts : [DEFAULT_ACCENT];
}

interface Hsv {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

function hexToHsv(hex: string): Hsv {
  const normalized = normalizeHex(hex) ?? DEFAULT_ACCENT;
  const n = parseInt(normalized.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const to = (val: number) =>
    Math.round((val + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`.toUpperCase();
}

function getShiftedHueHex(hex: string, deltaDeg = 45): string {
  const hsv = hexToHsv(hex);
  return hsvToHex({
    h: (hsv.h + deltaDeg + 360) % 360,
    s: Math.max(0.4, hsv.s),
    v: Math.max(0.5, hsv.v),
  });
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const SOLID_PRESETS = [
  { label: "Novidia Navy", value: "#36316A" },
  { label: "Indigo", value: "#4F46E5" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Rose", value: "#E11D48" },
  { label: "Emerald", value: "#059669" },
  { label: "Sky", value: "#0284C7" },
  { label: "Amber", value: "#D97706" },
];

const GRADIENT_PRESETS = [
  { label: "Novidia Dusk", value: "#36316A,#6366F1" },
  { label: "Cyberpunk", value: "#4F46E5,#EC4899" },
  { label: "Ocean Breeze", value: "#0284C7,#0D9488" },
  { label: "Sunset Glow", value: "#F43F5E,#FB923C" },
  { label: "Aurora", value: "#10B981,#06B6D4" },
  { label: "Deep Cosmos", value: "#8B5CF6,#3B82F6" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ColorPicker({
  value,
  onChange,
  label,
  hueLabel,
  ariaLabelHex,
  className,
  showHexInput = true,
  disabled = false,
  inline = false,
  allowGradient = true,
  maxStops = 4,
}: ColorPickerProps) {
  const { t } = useI18n();

  const stops = parseStops(value);
  const isGradient = stops.length > 1;

  const [isOpen, setIsOpen] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  // Keep active index within bounds if stops array shrinks
  const safeActiveIndex = Math.min(activeStopIndex, Math.max(0, stops.length - 1));
  const activeColor = stops[safeActiveIndex] ?? stops[0] ?? DEFAULT_ACCENT;

  // Local HSV state for butter-smooth 60fps/120fps drag updates
  const [localHsv, setLocalHsv] = useState<Hsv>(() => hexToHsv(activeColor));
  const [isDragging, setIsDragging] = useState(false);
  const [hexDraft, setHexDraft] = useState(activeColor);

  const prevColorRef = useRef(activeColor);
  if (!isDragging && prevColorRef.current !== activeColor) {
    prevColorRef.current = activeColor;
    setLocalHsv(hexToHsv(activeColor));
    setHexDraft(activeColor);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestStopsRef = useRef(stops);
  latestStopsRef.current = stops;

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (inline || !isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, inline]);

  const scheduleParentEmit = (newHex: string) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const nextStops = [...latestStopsRef.current];
      nextStops[safeActiveIndex] = newHex;
      onChange(nextStops.join(","));
      rafRef.current = null;
    });
  };

  const handleHsvChange = (next: Hsv, flushImmediate = false) => {
    const clampedHsv: Hsv = {
      h: ((next.h % 360) + 360) % 360,
      s: Math.min(1, Math.max(0, next.s)),
      v: Math.min(1, Math.max(0, next.v)),
    };
    setLocalHsv(clampedHsv);
    const newHex = hsvToHex(clampedHsv);
    setHexDraft(newHex);

    if (flushImmediate) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const nextStops = [...latestStopsRef.current];
      nextStops[safeActiveIndex] = newHex;
      onChange(nextStops.join(","));
    } else {
      scheduleParentEmit(newHex);
    }
  };

  const handleSetMode = (mode: "solid" | "gradient") => {
    if (disabled) return;
    if (mode === "solid") {
      const single = stops[safeActiveIndex] || stops[0] || DEFAULT_ACCENT;
      setActiveStopIndex(0);
      setLocalHsv(hexToHsv(single));
      onChange(single);
    } else {
      if (stops.length === 1) {
        const first = stops[0];
        const companion = getShiftedHueHex(first, 45);
        setActiveStopIndex(1);
        setLocalHsv(hexToHsv(companion));
        onChange(`${first},${companion}`);
      }
    }
  };

  const handleResetDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setActiveStopIndex(0);
    setLocalHsv(hexToHsv(DEFAULT_ACCENT));
    setHexDraft(DEFAULT_ACCENT);
    onChange(DEFAULT_ACCENT);
  };

  const handleAddStop = () => {
    if (disabled || stops.length >= maxStops) return;
    const last = stops[stops.length - 1];
    const newStop = getShiftedHueHex(last, 35);
    const nextStops = [...stops, newStop];
    setActiveStopIndex(nextStops.length - 1);
    setLocalHsv(hexToHsv(newStop));
    onChange(nextStops.join(","));
  };

  const handleRemoveStop = (indexToRemove: number) => {
    if (disabled || stops.length <= 1) return;
    const nextStops = stops.filter((_, idx) => idx !== indexToRemove);
    const nextActive = Math.min(safeActiveIndex, nextStops.length - 1);
    setActiveStopIndex(nextActive);
    setLocalHsv(hexToHsv(nextStops[nextActive] || DEFAULT_ACCENT));
    onChange(nextStops.join(","));
  };

  const handleReverseStops = () => {
    if (disabled || stops.length <= 1) return;
    const nextStops = [...stops].reverse();
    const nextActive = nextStops.length - 1 - safeActiveIndex;
    setActiveStopIndex(nextActive);
    setLocalHsv(hexToHsv(nextStops[nextActive] || DEFAULT_ACCENT));
    onChange(nextStops.join(","));
  };

  const handleEyeDropper = async () => {
    if (disabled || typeof window === "undefined" || !("EyeDropper" in window)) return;
    try {
      const eyeDropper = new (window as unknown as {
        EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper();
      const res = await eyeDropper.open();
      if (res?.sRGBHex) {
        const norm = normalizeHex(res.sRGBHex);
        if (norm) {
          handleHsvChange(hexToHsv(norm), true);
        }
      }
    } catch {
      /* user cancelled */
    }
  };

  // Pointer drag math
  const pointFrom = (e: React.PointerEvent<HTMLDivElement>): { x: number; y: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const startDrag = (which: "sv" | "hue") => (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (which === "sv") {
      const { x, y } = pointFrom(e);
      handleHsvChange({ h: localHsv.h, s: x, v: 1 - y });
    } else {
      const { x } = pointFrom(e);
      handleHsvChange({ h: x * 360, s: localHsv.s, v: localHsv.v });
    }
  };

  const onMove = (which: "sv" | "hue") => (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.buttons === 0) return;
    if (which === "sv") {
      const { x, y } = pointFrom(e);
      handleHsvChange({ h: localHsv.h, s: x, v: 1 - y });
    } else {
      const { x } = pointFrom(e);
      handleHsvChange({ h: x * 360, s: localHsv.s, v: localHsv.v });
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    handleHsvChange(localHsv, true);
  };

  const commitHexDraft = (raw: string) => {
    const parsed = normalizeHex(raw);
    if (parsed) {
      handleHsvChange(hexToHsv(parsed), true);
    } else {
      setHexDraft(hsvToHex(localHsv));
    }
  };

  const currentDisplayHex = hsvToHex(localHsv);
  const hueColor = hsvToHex({ h: localHsv.h, s: 1, v: 1 });
  const knobLeft = `${localHsv.s * 100}%`;
  const knobTop = `${(1 - localHsv.v) * 100}%`;

  const gradientCss = isGradient
    ? `linear-gradient(135deg, ${stops.join(", ")})`
    : stops[0];
  const linearTrackCss = isGradient
    ? `linear-gradient(to right, ${stops.join(", ")})`
    : stops[0];

  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  // The actual editor panel
  const editorContent = (
    <div className="space-y-4">
      {/* Mode switcher (Solid / Gradient) with smooth sliding indicator */}
      {allowGradient && (
        <div className="flex items-center justify-between gap-2">
          <div className="relative inline-flex rounded-xl bg-surface-raised p-1 border border-edge select-none">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleSetMode("solid")}
              className={cn(
                "relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                !isGradient ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {!isGradient && (
                <motion.div
                  layoutId="picker-mode-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-surface rounded-lg shadow-xs border border-edge -z-10"
                />
              )}
              {t("settings.accent.solid") || "Solid"}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleSetMode("gradient")}
              className={cn(
                "relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                isGradient ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {isGradient && (
                <motion.div
                  layoutId="picker-mode-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-surface rounded-lg shadow-xs border border-edge -z-10"
                />
              )}
              {t("settings.accent.gradient") || "Gradient"}
            </button>
          </div>

          {isGradient && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={handleReverseStops}
                title={t("settings.accent.reverseGradient") || "Reverse order"}
                className="p-1.5 rounded-lg border border-edge bg-surface-raised text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={14} />
              </button>
              <button
                type="button"
                disabled={disabled || stops.length >= maxStops}
                onClick={handleAddStop}
                title={t("settings.accent.addStop") || "Add stop"}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-edge bg-surface-raised text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-40 cursor-pointer"
              >
                <Plus size={13} />
                <span>{t("settings.accent.addStop") || "Add"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gradient / Stops Track Bar */}
      <div className="space-y-2">
        <div
          className="relative w-full h-7 rounded-xl border border-edge shadow-inner overflow-hidden select-none transition-all duration-200"
          style={{ background: linearTrackCss }}
        />

        {/* Stop Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {stops.map((stopHex, idx) => {
            const isSelected = idx === safeActiveIndex;
            return (
              <div
                key={idx}
                className={cn(
                  "inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                  isSelected
                    ? "border-main bg-main/10 text-main shadow-xs font-bold ring-1 ring-main"
                    : "border-edge bg-surface-raised text-ink-muted hover:border-edge-strong hover:text-ink",
                )}
                onClick={() => {
                  setActiveStopIndex(idx);
                  setLocalHsv(hexToHsv(stopHex));
                  setHexDraft(stopHex);
                }}
              >
                <span
                  className="w-3 h-3 rounded-full border border-edge shrink-0 shadow-xs"
                  style={{ backgroundColor: stopHex }}
                />
                <span className="font-mono text-[11px]">{stopHex}</span>
                {stops.length > 1 && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStop(idx);
                    }}
                    title={t("settings.accent.removeStop") || "Remove"}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-ink-subtle hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Stop Label */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] font-bold text-ink-subtle">
          {isGradient
            ? `${t("settings.accent.editingStop") || "Stop"} ${safeActiveIndex + 1}`
            : t("settings.accent.baseColor") || "Base color"}
        </p>
        <span className="font-mono text-xs font-bold text-ink">{currentDisplayHex}</span>
      </div>

      {/* Saturation / value square */}
      <div
        role="slider"
        aria-label={label ?? t("settings.accent.pickerLabel")}
        aria-valuetext={currentDisplayHex}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(localHsv.v * 100)}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={startDrag("sv")}
        onPointerMove={onMove("sv")}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (disabled) return;
          const step = e.shiftKey ? 0.1 : 0.02;
          if (e.key === "ArrowLeft") handleHsvChange({ ...localHsv, s: localHsv.s - step }, true);
          else if (e.key === "ArrowRight") handleHsvChange({ ...localHsv, s: localHsv.s + step }, true);
          else if (e.key === "ArrowUp") handleHsvChange({ ...localHsv, v: localHsv.v + step }, true);
          else if (e.key === "ArrowDown") handleHsvChange({ ...localHsv, v: localHsv.v - step }, true);
          else return;
          e.preventDefault();
        }}
        className={cn(
          "relative w-full h-36 rounded-xl overflow-hidden border border-edge cursor-crosshair touch-none select-none",
          disabled && "opacity-50 pointer-events-none",
        )}
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueColor}`,
        }}
      >
        <span
          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/30 transition-transform duration-75"
          style={{ left: knobLeft, top: knobTop, backgroundColor: currentDisplayHex }}
        />
      </div>

      {/* Hue slider + Swatch + Eyedropper */}
      <div className="flex items-center gap-2.5">
        <div
          role="slider"
          aria-label={hueLabel ?? label ?? t("settings.accent.pickerLabel")}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(localHsv.h)}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={startDrag("hue")}
          onPointerMove={onMove("hue")}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if (disabled) return;
            const step = e.shiftKey ? 15 : 3;
            if (e.key === "ArrowLeft") handleHsvChange({ ...localHsv, h: localHsv.h - step }, true);
            else if (e.key === "ArrowRight") handleHsvChange({ ...localHsv, h: localHsv.h + step }, true);
            else return;
            e.preventDefault();
          }}
          className={cn(
            "relative flex-1 h-5 rounded-full border border-edge cursor-pointer touch-none select-none",
            disabled && "opacity-50 pointer-events-none",
          )}
          style={{
            background:
              "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        >
          <span
            className="absolute top-1/2 -mt-2.5 w-5 h-5 -ml-2.5 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/20 transition-transform duration-75"
            style={{ left: `${(localHsv.h / 360) * 100}%`, backgroundColor: hueColor }}
          />
        </div>

        {/* Live Swatch */}
        <span
          className="w-7 h-7 shrink-0 rounded-lg border border-edge shadow-xs transition-colors duration-150"
          style={{ backgroundColor: currentDisplayHex }}
          aria-hidden
        />

        {/* Eyedropper Button */}
        {hasEyeDropper && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleEyeDropper}
            title={t("settings.accent.eyedropper") || "Pick from screen"}
            className="p-1.5 rounded-lg border border-edge bg-surface-raised text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
          >
            <Pipette size={14} />
          </button>
        )}
      </div>

      {/* Hex input */}
      {showHexInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={hexDraft}
            disabled={disabled}
            spellCheck={false}
            maxLength={7}
            aria-label={ariaLabelHex ?? t("settings.accent.hexLabel")}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={(e) => commitHexDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitHexDraft((e.target as HTMLInputElement).value);
            }}
            className="w-full h-9 rounded-xl border border-edge bg-surface-raised px-3 font-mono text-xs font-bold uppercase text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-main/40 disabled:opacity-50"
            placeholder="#36316A"
          />
        </div>
      )}

      {/* Presets */}
      <div className="space-y-1.5 pt-1 border-t border-edge">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-subtle">
          <Sparkles size={11} className="text-main" />
          <span>{t("settings.accent.presets") || "Presets"}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(isGradient ? GRADIENT_PRESETS : SOLID_PRESETS).map((p) => {
            const isMatch = value.toUpperCase() === p.value.toUpperCase();
            const bgStyle = p.value.includes(",")
              ? `linear-gradient(135deg, ${p.value.split(",").join(", ")})`
              : p.value;
            return (
              <button
                key={p.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(p.value);
                  setActiveStopIndex(0);
                  const firstHex = p.value.split(",")[0];
                  setLocalHsv(hexToHsv(firstHex));
                  setHexDraft(firstHex);
                }}
                title={p.label}
                className={cn(
                  "relative w-6 h-6 rounded-lg border border-edge shadow-xs transition-transform hover:scale-110 cursor-pointer flex items-center justify-center",
                  isMatch && "ring-2 ring-main ring-offset-1",
                )}
                style={{ background: bgStyle }}
              >
                {isMatch && <Check size={11} className="text-white drop-shadow-sm" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dropdown footer / Done button */}
      {!inline && (
        <div className="flex justify-end pt-2 border-t border-edge">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-surface-raised hover:bg-edge border border-edge text-xs font-bold text-ink transition-colors cursor-pointer"
          >
            {t("settings.accent.done") || "Done"}
          </button>
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div
        className={cn("p-4 rounded-2xl border border-edge bg-surface shadow-sm", className)}
        role="group"
        aria-label={label}
      >
        {editorContent}
      </div>
    );
  }

  // Floating Dropdown representation
  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-edge bg-surface-raised hover:bg-surface hover:border-edge-strong transition-all cursor-pointer select-none text-left shadow-2xs",
          isOpen && "ring-2 ring-main/30 border-main bg-surface",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Swatch Pill */}
          <div
            className="w-8 h-8 rounded-lg border border-edge shadow-xs shrink-0 overflow-hidden transition-all duration-200"
            style={{ background: gradientCss }}
            aria-hidden
          />

          {/* Value Summary */}
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-ink truncate">
              {isGradient ? stops.join(" → ") : stops[0]}
            </p>
            <p className="text-[10px] font-medium text-ink-subtle truncate">
              {isGradient
                ? `${t("settings.accent.gradient") || "Gradient"} • ${stops.length} ${t("settings.accent.stop") || "stops"}`
                : t("settings.accent.solid") || "Solid"}
            </p>
          </div>
        </div>

        {/* Right side controls: Reset to default icon + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            role="button"
            tabIndex={0}
            title={t("settings.accent.reset") || "Reset to default"}
            onClick={handleResetDefault}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleResetDefault(e as unknown as React.MouseEvent);
              }
            }}
            className="p-1.5 rounded-lg border border-edge bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
          </span>

          <ChevronDown
            size={16}
            className={cn(
              "text-ink-subtle transition-transform duration-200",
              isOpen && "rotate-180 text-main",
            )}
          />
        </div>
      </button>

      {/* Floating Popover Panel - floats above the box */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-edge bg-surface shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label={label ?? t("settings.accent.pickerLabel")}
        >
          {editorContent}
        </div>
      )}
    </div>
  );
}
