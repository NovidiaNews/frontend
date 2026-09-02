"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NovIconButton from "./NovIconButton";
import { cn } from "./cn";

/**
 * Dialogs & popups. Flexible shell with overlay, optional title/icon header,
 * optional footer, and a close button. Configurable width.
 *
 *   <NovModal open={open} onClose={...} title="Dostosuj awatar"
 *             footer={<NovButton>Zatwierdź</NovButton>}>
 *     ...
 *   </NovModal>
 */
interface NovModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    icon?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    /** Bootstrap-style width presets. Default "md". */
    size?: "sm" | "md" | "lg";
    /** Disable the backdrop click-to-close. */
    disableBackdropClose?: boolean;
    closeOnEscape?: boolean;
    scrollLock?: boolean;
    overlayClassName?: string;
    cardClassName?: string;
    labelledBy?: string;
}

export default function NovModal({
    open,
    onClose,
    title,
    icon,
    footer,
    children,
    size = "md",
    disableBackdropClose = false,
    closeOnEscape = true,
    scrollLock = true,
    overlayClassName,
    cardClassName,
    labelledBy,
}: NovModalProps) {
    useEffect(() => {
        if (!open) return;
        if (closeOnEscape) {
            const onKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
        }
    }, [open, closeOnEscape, onClose]);

    useEffect(() => {
        if (!open || !scrollLock) return;
        document.body.classList.add("nov-modal-open");
        return () => document.body.classList.remove("nov-modal-open");
    }, [open, scrollLock]);

    const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                        "fixed inset-0 z-[200] bg-app/70 backdrop-blur-md flex items-center justify-center p-4",
                        overlayClassName
                    )}
                    onClick={() => !disableBackdropClose && onClose()}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy}
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "w-full bg-surface rounded-2xl shadow-2xl border border-edge flex flex-col max-h-[85vh]",
                            maxW,
                            cardClassName
                        )}
                    >
                        {(title || icon) && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-edge shrink-0">
                                <h3 className="text-lg font-bold text-ink font-fraunces flex items-center gap-2">
                                    {icon}
                                    {title}
                                </h3>
                                <NovIconButton type="close" onClick={onClose} label="Zamknij" />
                            </div>
                        )}
                        {!title && !icon && (
                            <div className="absolute top-3 right-3 z-10">
                                <NovIconButton type="close" onClick={onClose} label="Zamknij" />
                            </div>
                        )}
                        <div className="flex-1 overflow-auto p-6">{children}</div>
                        {footer && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-edge bg-surface-raised rounded-b-2xl shrink-0">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}