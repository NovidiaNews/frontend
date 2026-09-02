"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

/**
 * Styled select with a consistent chevron. Plain native options inside.
 *   <NovSelect value={...} onChange={...}><option .../></NovSelect>
 */
interface NovSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    error?: boolean | string;
    /** Renders a static chevron on the right (hides the native arrow). */
    chevron?: boolean;
    /** Skip all built-in styles and render with only your className. */
    unstyled?: boolean;
}

export default function NovSelect({ error, chevron = true, unstyled = false, className, children, ...rest }: NovSelectProps) {
    if (unstyled) {
        return <select className={className} {...rest}>{children}</select>;
    }

    return (
        <div className="relative w-full">
            <select
                className={cn(
                    "w-full appearance-none rounded-xl px-4 text-sm text-ink focus:outline-none focus:ring-2 ring-brand focus:border-transparent cursor-pointer",
                    "h-14 text-center",
                    error ? cfg.input.error : cfg.input.normal,
                    chevron && "pr-10",
                    className
                )}
                {...rest}
            >
                {children}
            </select>
            {chevron && (
                <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
                />
            )}
        </div>
    );
}