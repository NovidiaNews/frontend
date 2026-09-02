"use client";

import React from "react";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

/** Standard card surface with optional header (title/icon/actions). */
interface NovCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title?: React.ReactNode;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    /** "card" (bordered white) or "subtle" (soft zinc). */
    tone?: "card" | "subtle";
    padding?: "md" | "lg" | "none";
}

export default function NovCard({
    title,
    icon,
    actions,
    tone = "card",
    padding = "md",
    className,
    children,
    ...rest
}: NovCardProps) {
    return (
        <div
            className={cn(
                tone === "card" ? cfg.surface.card : cfg.surface.subtle,
                "rounded-2xl",
                padding === "md" ? "p-5" : padding === "lg" ? "p-6" : "",
                className
            )}
            {...rest}
        >
            {title && (
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                        {icon}
                        {title}
                    </h3>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}