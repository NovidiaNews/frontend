"use client";

import React from "react";
import { cn } from "./cn";

/**
 * Square/circular icon-only button (close buttons, camera upload, etc.).
 *
 * Presets:
 *  - "neutral"  white with border (default close button look)
 *  - "subtle"   transparent with hover tint
 *  - "main"     solid brand fill
 *  - "danger"   soft red
 *
 * The `type` prop as a variant alias:
 *   <NovIconButton type="close" onClick={...} />  -> neutral + X default
 */
interface NovIconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    type?: "button" | "submit" | "reset" | "close" | "neutral" | "subtle" | "main" | "soft" | "danger";
    round?: boolean;
    label?: string;
    /** "sm" (w-8) | "md" (w-9, default) | "lg" (w-10). */
    size?: "sm" | "md" | "lg";
    /** Skip all built-in styles and render with only your className. */
    unstyled?: boolean;
}

const TONES: Record<string, string> = {
    neutral: "border border-edge bg-surface hover:bg-surface-raised text-ink-subtle hover:text-ink shadow-sm",
    subtle: "text-ink-subtle hover:text-ink hover:bg-surface-raised",
    main: "bg-main hover:brightness-110 text-white",
    soft: "bg-main/10 text-main hover:bg-main/20",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700",
};

const SIZES: Record<"sm" | "md" | "lg", string> = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-10 h-10",
};

export default function NovIconButton({
    type = "button",
    tone,
    round = true,
    label,
    size = "md",
    unstyled = false,
    className,
    children,
    ...rest
}: NovIconButtonProps & { tone?: keyof typeof TONES }) {
    const isNative = type === "submit" || type === "reset" || type === "button";
    const nativeType = isNative ? type : "button";
    const toneKey = !isNative ? type : tone ?? "neutral";

    return (
        <button
            type={nativeType}
            aria-label={label}
            className={unstyled ? className : cn(
                "flex items-center justify-center transition-all cursor-pointer shrink-0 select-none font-montserrat disabled:opacity-40 disabled:cursor-not-allowed",
                SIZES[size],
                round ? "rounded-full" : "rounded-xl",
                TONES[toneKey],
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
}