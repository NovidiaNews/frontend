"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/components/ui/cn";

interface DateOfBirthPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  className?: string;
}

/** Simple, dependable date-of-birth entry: [dd] [mm] [yyyy]. */
export default function DateOfBirthPicker({ value, onChange, className }: DateOfBirthPickerProps) {
  const now = new Date();
  const maxYear = now.getFullYear();
  const minYear = maxYear - 120;

  const [day, setDay] = useState(value ? String(value.getDate()).padStart(2, "0") : "");
  const [month, setMonth] = useState(value ? String(value.getMonth() + 1).padStart(2, "0") : "");
  const [year, setYear] = useState(value ? String(value.getFullYear()) : "");

  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Emit a Date once all three fields form a valid calendar date.
  useEffect(() => {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return;
    if (m < 1 || m > 12 || y < minYear || y > maxYear) return;
    const maxDay = new Date(y, m, 0).getDate();
    if (d < 1 || d > maxDay) return;
    onChange(new Date(Date.UTC(y, m - 1, d)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month, year]);

  const onlyDigits = (raw: string, max: number) => raw.replace(/\D/g, "").slice(0, max);

  const fieldCls =
    "h-14 w-full rounded-xl border border-edge bg-surface text-center text-lg font-bold tabular-nums text-ink " +
    "placeholder:font-medium placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="dd"
          maxLength={2}
          value={day}
          aria-label="Dzień"
          className={fieldCls}
          onChange={(e) => {
            const v = onlyDigits(e.target.value, 2);
            setDay(v);
            if (v.length === 2) monthRef.current?.focus();
          }}
        />
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          placeholder="mm"
          maxLength={2}
          value={month}
          aria-label="Miesiąc"
          className={fieldCls}
          onChange={(e) => {
            const v = onlyDigits(e.target.value, 2);
            setMonth(v);
            if (v.length === 2) yearRef.current?.focus();
          }}
        />
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          placeholder="yyyy"
          maxLength={4}
          value={year}
          aria-label="Rok"
          className={fieldCls}
          onChange={(e) => setYear(onlyDigits(e.target.value, 4))}
        />
      </div>
      <p className="text-[10px] text-ink-subtle text-center font-medium">
        Data urodzenia jest prywatna. Publicznie może być widoczny wyłącznie przedział wiekowy.
      </p>
    </div>
  );
}
