"use client";

import React from "react";
import { cn } from "./cn";

/** Animated loading placeholder. Pass shape via className (h-14 rounded-xl, etc.). */
export default function NovSkeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse bg-surface-raised rounded-xl", className)} />;
}