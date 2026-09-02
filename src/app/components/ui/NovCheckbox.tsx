"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

/**
 * Checkbox with an animated checkmark (framer-motion), styled by config.
 * Renders a clickable box + optional label text.
 */
interface NovCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    error?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
    labelClassName?: string;
    /** Render a raw native <input type="checkbox"> (className passthrough). */
    unstyled?: boolean;
}

export default function NovCheckbox({
    checked,
    onChange,
    label,
    error,
    disabled = false,
    id,
    className,
    labelClassName,
    unstyled = false,
}: NovCheckboxProps) {
    if (unstyled) {
        const native = (
            <input
                id={id}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className={className}
            />
        );
        if (!label) return native;
        return (
            <label className={cn("flex items-center gap-2 cursor-pointer select-none", labelClassName)}>
                {native}
                <span>{label}</span>
            </label>
        );
    }

    const box = (
        <button
            id={id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 select-none",
                checked ? cfg.checkbox.checked : error ? cfg.checkbox.error : cfg.checkbox.unchecked,
                disabled && "opacity-40 cursor-not-allowed",
                className
            )}
        >
            <AnimatePresence>
                {checked && (
                    <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="w-4 h-4 stroke-current"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <motion.polyline
                            points="20 6 9 17 4 12"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.svg>
                )}
            </AnimatePresence>
        </button>
    );

    if (!label) return box;

    return (
        <label className={cn("flex items-center gap-2 text-sm font-medium text-ink-muted cursor-pointer select-none", labelClassName)}>
            {box}
            <span>{label}</span>
        </label>
    );
}