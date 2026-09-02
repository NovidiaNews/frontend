"use client";

import React from "react";
import NextLink from "next/link";
import { novidiaConfig as cfg, NovLinkVariant } from "./config";
import { cn } from "./cn";

interface NovLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Destination. External targets (http(s), mailto, tel, anchors) render a plain <a>. */
    href: string;
    variant?: NovLinkVariant;
    /** Pill shape for the main/secondary variants (rounded-full instead of rounded-xl). */
    round?: boolean;
    fullWidth?: boolean;
    /** Skip all built-in styles and render with only your className. */
    unstyled?: boolean;
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:|#|\/\/)/.test(href);

export default function NovLink({
    href,
    variant = "text",
    round = false,
    fullWidth = false,
    unstyled = false,
    className,
    children,
    target,
    ...rest
}: NovLinkProps) {
    const classes = unstyled
        ? className
        : cn(
              "inline-flex items-center cursor-pointer font-montserrat",
              variant === "plain" ? "" : "gap-2 transition-all",
              cfg.link.variants[variant],
              variant === "main" && `text-sm px-6 py-2.5 shadow-md shadow-main/10 ${round ? "rounded-full" : "rounded-xl"}`,
              variant === "secondary" && `text-sm px-6 py-2.5 ${round ? "rounded-full" : "rounded-xl"}`,
              fullWidth && "w-full",
              className
          );

    if (isExternal(href) || (target && target !== "_self")) {
        return (
            <a href={href} className={classes} target={target || "_blank"} rel={target ? "noopener noreferrer" : undefined} {...rest}>
                {children}
            </a>
        );
    }

    return (
        <NextLink href={href} className={classes} {...rest}>
            {children}
        </NextLink>
    );
}