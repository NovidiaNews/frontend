/**
 * Novidia UI configuration.
 *
 * This is the single source of truth for the look & feel of every UI
 * element rendered through the `Nov*` components. Tweak anything here and
 * the whole application re-themes accordingly.
 */
export const novidiaConfig = {
    brand: {
        name: "Novidia",
        logo: "N.",
        tagline: "Twoja szkolna redakcja",
    },
    colors: {
        main: "#36316A",
        lighter: "#6058B3",
        medium: "#7F77D7",
        light: "#A79FFB",
        lightest: "#DFDCFF",
        superwhite: "#F2F0FE",
    },
    fonts: {
        body: "var(--font-montserrat), sans-serif",
        display: "var(--font-fraunces), serif",
    },
    radius: {
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
        full: "rounded-full",
    },

    /** Shared surface used by cards, dialogs and dropdowns. */
    surface: {
        card: "bg-surface border border-edge shadow-sm",
        modal: "bg-surface border border-edge shadow-2xl",
        input: "bg-surface border border-edge",
        subtle: "bg-surface-raised border border-edge",
    },

    button: {
        variants: {
            main: "bg-main hover:brightness-110 text-white shadow-md shadow-main/10",
            secondary: "bg-surface-raised text-ink hover:bg-surface",
            outline: "border border-edge bg-surface text-ink-muted hover:bg-surface-raised",
            ghost: "text-ink-subtle hover:text-ink hover:bg-surface-raised",
            text: "bg-transparent border-none text-main font-semibold hover:underline",
            danger: "bg-rose-700 hover:bg-rose-800 text-white",
            plain: "",
        },
        sizes: {
            sm: "px-3 py-1.5 rounded-lg text-xs",
            md: "px-4 py-2.5 rounded-xl text-sm",
            lg: "px-6 py-2.5 rounded-xl text-sm",
            xl: "px-6 h-14 rounded-xl text-sm font-semibold",
            none: "",
        },
    },

    link: {
        variants: {
            text: "text-main font-semibold hover:underline",
            subtle: "text-ink-subtle hover:text-ink transition-colors",
            main: "bg-main hover:brightness-110 text-white shadow-md shadow-main/10",
            secondary: "bg-surface-raised text-ink hover:bg-surface",
            outline: "border border-edge bg-surface text-ink-muted hover:bg-surface-raised",
            plain: "",
        },
    },

    input: {
        base: "w-full rounded-xl px-4 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 ring-brand focus:border-transparent",
        error: "border-2 border-red-500 ring-2 ring-red-500/20",
        normal: "border border-edge",
        label: "block text-[10px] font-bold text-ink-subtle",
    },

    badge: {
        tones: {
            emerald: "bg-emerald-500/10 text-emerald-600",
            red: "bg-red-500/10 text-red-600",
            amber: "bg-amber-500/10 text-amber-600",
            blue: "bg-blue-500/10 text-blue-600",
            purple: "bg-purple-500/10 text-purple-600",
            cyan: "bg-cyan-500/10 text-cyan-600",
            zinc: "bg-surface-raised text-ink-subtle",
            rose: "bg-rose-500/10 text-rose-600",
        },
    },

    toast: {
        success: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600",
        error: "bg-red-500/10 border border-red-500/30 text-red-600",
        barSuccess: "bg-green-500",
        barError: "bg-red-500",
    },

    switch: {
        on: "bg-main",
        off: "bg-edge-strong",
        knob: "w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform",
    },

    checkbox: {
        checked: "bg-main border-main text-white shadow-md",
        unchecked: "border-edge hover:border-ink-subtle bg-surface",
        error: "border-red-500 bg-red-500/10",
    },

    focusRing: "focus:outline-none focus:ring-2 ring-brand",
} as const;

export type NovButtonVariant = keyof typeof novidiaConfig.button.variants;
export type NovButtonSize = keyof typeof novidiaConfig.button.sizes;
export type NovLinkVariant = keyof typeof novidiaConfig.link.variants;
export type NovBadgeTone = keyof typeof novidiaConfig.badge.tones;