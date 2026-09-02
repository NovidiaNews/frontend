"use client";

import React from "react";
import { cn } from "./cn";

/** Labeled form field wrapper: label (with optional icon) + children + hint/error. */
interface NovFieldProps {
    label?: React.ReactNode;
    icon?: React.ReactNode;
    error?: string;
    hint?: React.ReactNode;
    id?: string;
    className?: string;
    labelClassName?: string;
    children: React.ReactNode;
}

export default function NovField({ label, icon, error, hint, id, className, labelClassName, children }: NovFieldProps) {
    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={id}
                    className={cn("block text-xs font-semibold text-ink-subtle mb-1 flex items-center gap-1", labelClassName)}
                >
                    {icon}
                    {label}
                </label>
            )}
            {children}
            {error && <p className="mt-1 text-[10px] font-semibold text-red-500">{error}</p>}
            {!error && hint && <div className="mt-1 text-[10px] text-ink-subtle font-medium">{hint}</div>}
        </div>
    );
}