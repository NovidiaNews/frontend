"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle, X } from "lucide-react";
import { novidiaConfig as cfg } from "./config";
import { cn } from "./cn";

/**
 * Toast notification. Two flavours:
 *  - pill:   simple success/error pill (top-right notifications etc.)
 *  - stack:  iOS-style card with progress bars + optional count badge + close.
 *
 * Use the paired exports below (NovToastProgress / NovToastCount /
 * NovToastClose) to assemble the "stack" header row the way the login /
 * register pages do.
 */
interface NovToastProps {
    type: "success" | "error";
    message: React.ReactNode;
    /** Stack flavour: renders the card + stacked shadow cards behind it. */
    stack?: boolean;
    /** Number of stacked duplicate cards to shadow behind the card. */
    stackCount?: number;
    className?: string;
}

const ICONS = {
    success: <Check size={16} className="shrink-0" />,
    error: <AlertTriangle size={16} className="shrink-0" />,
};

export default function NovToast({ type, message, stack = false, stackCount = 1, className }: NovToastProps) {
    const err = type === "error";
    const tone = err ? cfg.toast.error : cfg.toast.success;

    if (!stack) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={cn(
                    "px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2",
                    tone,
                    className
                )}
            >
                {ICONS[type]}
                <span>{message}</span>
            </motion.div>
        );
    }

    const bg = err ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200";
    return (
        <div className="relative">
            {stackCount > 2 && (
                <div className={cn("absolute inset-0 rounded-xl border shadow-sm scale-[0.92] translate-y-4 opacity-40 -z-20 transition-all duration-300", bg)} />
            )}
            {stackCount > 1 && (
                <div className={cn("absolute inset-0 rounded-xl border shadow-md scale-[0.96] translate-y-2 opacity-70 -z-10 transition-all duration-300", bg)} />
            )}
            <div className={cn("p-4 rounded-xl shadow-md border text-sm font-semibold text-left leading-snug w-full transition-all", tone)}>
                {message}
            </div>
        </div>
    );
}

/** The two animated countdown bars shown above a stack toast. */
export function NovToastProgress({ type, progressKey }: { type: "success" | "error"; progressKey: string | number }) {
    const bar = type === "error" ? cfg.toast.barError : cfg.toast.barSuccess;
    return (
        <div className="grow flex items-center h-1 gap-2">
            <motion.div
                key={`${progressKey}-left`}
                initial={{ flexGrow: 0, flexBasis: 0 }}
                animate={{ flexGrow: 100 }}
                transition={{ duration: 4, ease: "linear" }}
                className={cn("h-1 rounded-full", bar)}
            />
            <motion.div
                key={`${progressKey}-right`}
                initial={{ flexGrow: 100, opacity: 1 }}
                animate={{ flexGrow: 0, opacity: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-1 rounded-full bg-edge-strong"
                style={{ flexBasis: 0 }}
            />
        </div>
    );
}

/** Count badge shown next to a stack toast. */
export function NovToastCount({ type, count }: { type: "success" | "error"; count: number }) {
    return (
        <span
            className={cn(
                "text-[10px] px-2 py-0.5 rounded-full shrink-0 select-none font-bold shadow-sm border",
                type === "error" ? "bg-red-100 border-red-200 text-red-800" : "bg-green-100 border-green-200 text-green-800"
            )}
        >
            {count}
        </span>
    );
}

/** Round close chip used by stack toasts. */
export function NovToastClose({ onDismiss, type }: { onDismiss: () => void; type: "success" | "error" }) {
    return (
        <button
            onClick={onDismiss}
            type="button"
            className={cn(
                "w-6 h-6 rounded-full border cursor-pointer transition-colors shrink-0 flex items-center justify-center shadow-sm bg-surface hover:bg-surface-raised",
                type === "error" ? "border-red-200 text-red-800" : "border-green-200 text-green-800"
            )}
        >
            <X size={12} className="stroke-[2.5px]" />
        </button>
    );
}