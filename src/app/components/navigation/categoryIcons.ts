import { Activity, Atom, BookOpen, Cpu, Film } from "lucide-react";

export const categoryIcons = {
    sport: Activity,
    culture: BookOpen,
    science: Atom,
    technology: Cpu,
    entertainment: Film,
} as const;

export type CategoryIconKey = keyof typeof categoryIcons;
