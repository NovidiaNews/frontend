"use client";

import React from "react";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

interface NovInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    labelClassName?: string;
    /** Error flag or message. */
    error?: boolean | string;
    /** Icon rendered inside the field on the left. */
    icon?: React.ReactNode;
    /** Icon rendered inside the field on the right. */
    iconRight?: React.ReactNode;
    /** Optional helper text shown under the field. */
    hint?: React.ReactNode;
    /** No border (transparent inputs inside custom containers). */
    bare?: boolean;
    /** Skip all built-in styles and render with only your className. */
    unstyled?: boolean;
    ref?: React.Ref<HTMLInputElement>;
}

export default function NovInput({
    label,
    labelClassName,
    error,
    icon,
    iconRight,
    hint,
    bare = false,
    unstyled = false,
    ref,
    className,
    id,
    ...rest
}: NovInputProps) {
    const errorText = typeof error === "string" ? error : undefined;

    if (unstyled) {
        return (
            <div className="w-full">
                <input ref={ref} id={id} className={className} {...rest} />
                {errorText && <p className="mt-1 text-[10px] font-semibold text-red-500">{errorText}</p>}
            </div>
        );
    }

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className={cn(cfg.input.label, "mb-1.5 block", "text-nowrap", labelClassName)}>
                    {label}
                </label>
            )}
            <div className="relative w-full">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">{icon}</span>}
                <input
                    ref={ref}
                    id={id}
                    className={cn(
                        cfg.input.base,
                        "bg-transparent",
                        !bare && (error ? cfg.input.error : cfg.input.normal),
                        icon ? "pl-10" : undefined,
                        iconRight ? "pr-10" : undefined,
                        className
                    )}
                    {...rest}
                />
                {iconRight && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">{iconRight}</span>}
            </div>
            {errorText && <p className="mt-1 text-[10px] font-semibold text-red-500">{errorText}</p>}
            {!errorText && hint && <div className="mt-1">{hint}</div>}
        </div>
    );
}