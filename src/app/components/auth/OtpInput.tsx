"use client";

import { useRef } from "react";
import { cn } from "@/app/components/ui/cn";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Six separate boxes for a one-time code. Entry is sequential (left to right)
 * so the compact `value` string always maps cleanly onto the boxes.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  className,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusAt = (index: number) =>
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  /** Replace the value starting at `index` with the typed digits. */
  const commit = (index: number, digits: string) => {
    const next = (value.slice(0, index) + digits).slice(0, length);
    onChange(next);
    focusAt(next.length);
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      // Cleared this box (and everything after it).
      onChange(value.slice(0, index));
      return;
    }
    commit(index, digits.slice(0, length - index));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value.length === 0) return;
      const cut = Math.max(0, Math.min(index, value.length - 1));
      onChange(value.slice(0, cut));
      focusAt(cut);
    } else if (e.key === "ArrowLeft") {
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    e.preventDefault();
    commit(index, digits.slice(0, length - index));
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={1}
          value={ch}
          disabled={disabled}
          aria-label={`Cyfra ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => {
            if (i > value.length) {
              focusAt(value.length);
              return;
            }
            e.target.select();
          }}
          className={cn(
            "h-14 w-11 sm:w-12 rounded-xl border border-edge bg-surface text-center text-xl font-bold text-ink",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
