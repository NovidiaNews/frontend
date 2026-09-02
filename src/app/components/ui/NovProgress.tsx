"use client";

import React from "react";
import { cn } from "./cn";

/** Thin progress bar with threshold-based coloring (70%+ red, 40%+ amber, else emerald). */
export default function NovProgress({
    value,
    tone = "auto",
    className,
    barClassName,
}: {
    /** 0-100. */
    value: number;
    tone?: "auto" | "emerald" | "amber" | "red" | "brand";
    className?: string;
    barClassName?: string;
}) {
    const resolved =
        tone !== "auto"
            ? tone
            : value >= 70
            ? "red"
            : value >= 40
            ? "amber"
            : "emerald";
    const color = {
        red: "bg-red-500",
        amber: "bg-amber-500",
        emerald: "bg-emerald-500",
        brand: "bg-main",
    }[resolved];

    return (
        <div className={cn("h-2.5 w-full rounded-full bg-surface-raised overflow-hidden", className)}>
            <div
                className={cn("h-full rounded-full transition-all", color, barClassName)}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    );
}