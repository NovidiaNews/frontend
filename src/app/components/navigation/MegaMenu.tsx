"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, X } from "lucide-react";
import { NovLink } from "@/app/components/ui";
import { categoryIcons } from "./categoryIcons";
import { MEGA_GROUPS, type MegaGroup } from "./megaMenuData";

interface MegaMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Fullscreen "Kategorie" mega-dropdown: a blurred backdrop covers the page
 * while a large panel shows every topic group as an accordion.
 */
export default function MegaMenu({ open, onClose }: MegaMenuProps) {
  // First group starts expanded so the panel never looks empty.
  const [expanded, setExpanded] = useState<string | null>(MEGA_GROUPS[0]?.id ?? null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("mega-menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("mega-menu-open");
    };
  }, [open, onClose]);

  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  const GroupPanel = ({ group }: { group: MegaGroup }) => {
    const Icon = categoryIcons[group.icon];
    const isExpanded = expanded === group.id;
    return (
      <div
        className={`rounded-2xl border transition-colors overflow-hidden ${
          isExpanded ? "border-main/30 bg-surface" : "border-edge bg-surface-raised/60"
        }`}
      >
        <button
          type="button"
          onClick={() => toggle(group.id)}
          aria-expanded={isExpanded}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer group/btn"
        >
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isExpanded ? "bg-main/15 text-main" : "bg-surface text-ink-subtle group-hover/btn:text-main"
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-ink truncate">{group.title}</span>
            <span className="block text-[11px] text-ink-subtle font-medium">
              {group.topics.length} tematów
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-ink-subtle transition-transform ${isExpanded ? "rotate-180 text-main" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 border-t border-edge">
                <NovLink
                  unstyled
                  href={`/categories?tag=${group.tag}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-2 px-2 py-2.5 mb-1 text-xs font-bold text-main hover:bg-main/10 rounded-lg transition-colors"
                >
                  <span>Wszystkie w: {group.title}</span>
                  <ArrowRight size={13} />
                </NovLink>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {group.topics.map((topic) => (
                    <NovLink
                      key={topic.slug}
                      unstyled
                      href={`/categories?tag=${group.tag}&topic=${topic.slug}`}
                      onClick={onClose}
                      className="rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-muted hover:text-main hover:bg-main/10 transition-colors truncate"
                    >
                      {topic.title}
                    </NovLink>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-app/60 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto overscroll-contain bg-surface border-b border-edge shadow-2xl"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 sm:py-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink font-fraunces tracking-tight">
                    Kategorie i tematy
                  </h2>
                  <p className="text-xs text-ink-subtle font-medium mt-0.5">
                    Wybierz dział, a następnie temat, który Cię interesuje.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Zamknij menu"
                  className="w-9 h-9 rounded-xl border border-edge bg-surface-raised flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Mobile: single accordion column. Desktop: 2-column accordion grid. */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {MEGA_GROUPS.map((group) => (
                  <GroupPanel key={group.id} group={group} />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-ink-subtle">
                <NovLink unstyled href="/topics" onClick={onClose} className="hover:text-main transition-colors">
                  Wszystkie artykuły
                </NovLink>
                <span className="w-1 h-1 rounded-full bg-edge-strong" />
                <NovLink unstyled href="/register/school" onClick={onClose} className="hover:text-main transition-colors">
                  Zarejestruj szkołę
                </NovLink>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
