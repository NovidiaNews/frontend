"use client";

import React from "react";
import { novidiaConfig as cfg, NovButtonVariant, NovButtonSize } from "./config";
import { cn } from "./cn";

/**
 * Everything button-related in Novidia. One place; configure in `config.ts`.
 *
 * Usage:
 *   <NovButton type="main" size="xl" className="w-full">Zaloguj się</NovButton>
 *   <NovButton type="submit" variant="main">Zapisz</NovButton>
 *   <NovButton type="ghost" size="sm"><X size={12} /></NovButton>
 *
 * The `type` prop doubles as a variant alias: `type="main"` means
 * variant "main" with the native HTML type falling back to "button".
 */
type NativeButtonType = "button" | "submit" | "reset";

interface NovButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    /** Visual style; aliases from `type` are also accepted (e.g. type="main"). */
    variant?: NovButtonVariant;
    /** Native HTML type, or a variant name when used as an alias. */
    type?: NativeButtonType | NovButtonVariant;
    /** Density preset from `config.button.sizes`. */
    size?: NovButtonSize;
    /** Takes the full width of its container. */
    fullWidth?: boolean;
    /** Pill shape (rounded-full instead of rounded-xl) for main/secondary variants. */
    round?: boolean;
    /** Forces the font-montserrat family (already the default). */
    font?: "body" | "display";
    /** Skip all built-in styles and render with only your className. */
    unstyled?: boolean;
}

export default function NovButton({
    variant,
    type = "button",
    size = "md",
    fullWidth = false,
    round = false,
    font = "body",
    unstyled = false,
    className,
    children,
    ...rest
}: NovButtonProps) {
    const variantNames = Object.keys(cfg.button.variants) as NovButtonVariant[];
    const resolvedVariant: NovButtonVariant = variant ?? (variantNames.includes(type as NovButtonVariant) ? (type as NovButtonVariant) : "main");
    const nativeType: NativeButtonType = variantNames.includes(type as NovButtonVariant) ? "button" : (type as NativeButtonType);

    if (unstyled) {
        return (
            <button type={nativeType} className={className} {...rest}>
                {children}
            </button>
        );
    }

    return (
        <button
            type={nativeType}
            className={cn(
                "inline-flex items-center justify-center cursor-pointer select-none font-montserrat disabled:opacity-40 disabled:cursor-not-allowed",
                variant === "plain" ? "" : "gap-2 transition-all",
                cfg.button.variants[resolvedVariant],
                cfg.button.sizes[size],
                round && (resolvedVariant === "main" || resolvedVariant === "secondary") && "rounded-full!",
                font === "display" && "font-fraunces",
                fullWidth && "w-full",
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
}