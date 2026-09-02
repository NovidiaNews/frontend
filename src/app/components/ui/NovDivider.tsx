"use client";

import React from "react";
import { cn } from "./cn";

/** Thin horizontal divider used between menu items and stacked content. */
export default function NovDivider({ className }: { className?: string }) {
    return <div className={cn("h-px bg-edge my-1 mx-2", className)} />;
}