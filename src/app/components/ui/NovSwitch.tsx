"use client";

import React from "react";
import { cn } from "./cn";

/** On/off toggle switch (cookie consent, notification preferences, etc.). */
interface NovSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    /** Size: "sm" (w-9 h-5) or "md" (w-11 h-6). */
    size?: "sm" | "md";
    id?: string;
    className?: string;
}

export default function NovSwitch({ checked, onChange, disabled = false, size = "md", id, className }: NovSwitchProps) {
    const track = size === "md" ? "w-11 h-6" : "w-9 h-5";
    const knob = size === "md" ? "w-5 h-5" : "w-4 h-4";
    const offset = size === "md" ? "ltr:translate-x-5 rtl:-translate-x-5" : "ltr:translate-x-4 rtl:-translate-x-4";

    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                track,
                "relative rounded-full inline-flex items-center p-0.5 border transition-all duration-200 cursor-pointer shrink-0 select-none",
                checked
                    ? "bg-main border-main shadow-xs"
                    : "bg-zinc-300 dark:bg-zinc-700/90 border-zinc-400 dark:border-zinc-500/80 hover:bg-zinc-400/80 dark:hover:bg-zinc-600 shadow-inner",
                disabled && "opacity-40 cursor-not-allowed",
                className
            )} 
        >
            <div
                className={cn(
                    knob,
                    "rounded-full bg-white shadow-md transition-transform duration-200 pointer-events-none ring-0",
                    checked && offset
                )}
            />
        </button>
    );
}