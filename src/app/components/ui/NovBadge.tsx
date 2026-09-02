"use client";

import React from "react";
import { novidiaConfig as cfg, NovBadgeTone } from "./config";
import { cn } from "./cn";

/** Small pill/badge used for roles, statuses and inline tags. */
interface NovBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: NovBadgeTone;
    icon?: React.ReactNode;
    /** Rounded-full pill (default) or rounded-md chip. */
    shape?: "pill" | "chip";
}

export default function NovBadge({ tone = "zinc", icon, shape = "pill", className, children, ...rest }: NovBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap",
                shape === "pill" ? "rounded-full px-2.5 py-0.5" : "rounded-md px-2 py-1",
                cfg.badge.tones[tone],
                className
            )}
            {...rest}
        >
            {icon}
            {children}
        </span>
    );
}