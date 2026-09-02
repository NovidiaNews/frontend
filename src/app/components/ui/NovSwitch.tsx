"use client";

import React from "react";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

/** On/off toggle switch (cookie consent, notification preferences, etc.). */
interface NovSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    /** Size: "sm" (h-4) or "md" (h-5). */
    size?: "sm" | "md";
    id?: string;
    className?: string;
}

export default function NovSwitch({ checked, onChange, disabled = false, size = "md", id, className }: NovSwitchProps) {
    const track = size === "md" ? "w-9 h-5" : "w-8 h-4";
    const knob = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
    const offset = size === "md" ? "translate-x-4" : "translate-x-3.5";

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
                "rounded-full flex items-center p-0.5 transition-colors cursor-pointer shrink-0",
                checked ? cfg.switch.on : cfg.switch.off,
                disabled && "opacity-40 cursor-not-allowed",
                className
            )}
        >
            <div className={cn(knob, "rounded-full bg-white shadow transition-transform duration-200", checked && offset)} />
        </button>
    );
}