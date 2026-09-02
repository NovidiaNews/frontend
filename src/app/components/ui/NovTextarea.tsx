"use client";

import React from "react";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

interface NovTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: boolean | string;
    hint?: React.ReactNode;
    /** Skip all built-in styles and render with only your className. */
    unstyled?: boolean;
}

export default function NovTextarea({ label, error, hint, className, id, rows = 3, unstyled = false, ...rest }: NovTextareaProps) {
    const errorText = typeof error === "string" ? error : undefined;
    if (unstyled) {
        return <textarea id={id} rows={rows} className={className} {...rest} />;
    }
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className={cn(cfg.input.label, "mb-1.5 block")}>
                    {label}
                </label>
            )}
            <textarea
                id={id}
                rows={rows}
                className={cn(
                    cfg.input.base,
                    "resize-none",
                    error ? cfg.input.error : cfg.input.normal,
                    className
                )}
                {...rest}
            />
            {errorText && <p className="mt-1 text-[10px] font-semibold text-red-500">{errorText}</p>}
            {!errorText && hint && <div className="mt-1">{hint}</div>}
        </div>
    );
}