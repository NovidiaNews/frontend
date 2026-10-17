"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";
import { applyAccent, isAccentSpec, isAccentPending, installAccent } from "@/lib/accent";
import { applyTheme, getStoredTheme, ThemePreference } from "@/lib/useTheme";

type CachedProfile = { theme?: unknown; accentColor?: unknown };

function readProfile(raw: string | null): CachedProfile {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as CachedProfile | null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Syncs the signed-in user's cloud preferences (accentColor, theme)
 * into the client state after login/OAuth and across tabs.
 */
export default function AccentSync() {
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem("novidia_user");
        if (!raw) {
          installAccent();
          return;
        }
        const user = JSON.parse(raw) as { accentColor?: unknown; theme?: unknown };

        // Sync accent color from cloud (unless an unsaved preview is pending)
        if (!isAccentPending() && user?.accentColor !== undefined) {
          const color = isAccentSpec(user.accentColor) ? (user.accentColor as string) : null;
          applyAccent(color);
        } else {
          // Either an unsaved local preview or a profile without an accent —
          // nothing to pull from the cloud, but the cached palette/gradient
          // still has to be re-asserted on the document.
          installAccent();
        }

        // Sync theme from cloud
        if (user?.theme && (user.theme === "light" || user.theme === "dark" || user.theme === "system")) {
          const currentStored = getStoredTheme();
          if (currentStored !== user.theme) {
            localStorage.setItem("novidia-theme", user.theme);
            applyTheme(user.theme as ThemePreference, false);
          }
        }
      } catch {
        // corrupted profile — keep whatever is active
      }
    };

    // The cached profile can lag behind the account (older builds dropped
    // accentColor from the PATCH response, so a stale gradient survived in
    // localStorage and was pushed back onto every brand button). Refresh it
    // once per load, then re-sync from the authoritative copy.
    const refresh = async () => {
      try {
        const profileAtStart = localStorage.getItem("novidia_user");
        if (!profileAtStart) return;
        // Anything written while this request is in flight (a local edit, or a
        // PATCH that just landed) is newer than the reply about to arrive.
        // Overwriting it made the freshly applied theme/accent snap back for a
        // beat before the next sync put it in place again.
        const themeAtStart = localStorage.getItem("novidia-theme");
        const accentAtStart = localStorage.getItem("novidia-accent");
        const palettesAtStart = localStorage.getItem("novidia-accent-palettes");
        const cachedAtStart = readProfile(profileAtStart);

        const res = await fetch(`${API_URL}/users/me`, { credentials: "include" });
        if (!res.ok) return;
        const fresh = (await res.json()) as { id?: string | number } & Record<string, unknown>;
        if (!fresh || fresh.id == null) return;

        const cachedNow = readProfile(localStorage.getItem("novidia_user"));
        const themeNow = localStorage.getItem("novidia-theme");
        if (
          themeNow &&
          (themeAtStart !== themeNow || cachedNow.theme !== cachedAtStart.theme)
        ) {
          fresh.theme = themeNow;
        }

        const accentNow = localStorage.getItem("novidia-accent");
        if (
          accentAtStart !== accentNow ||
          palettesAtStart !== localStorage.getItem("novidia-accent-palettes") ||
          cachedNow.accentColor !== cachedAtStart.accentColor
        ) {
          // An unsaved preview belongs to the account only once it is PATCHed,
          // so leave the server value in place while it is still pending.
          if (!isAccentPending()) fresh.accentColor = accentNow;
        }

        localStorage.setItem("novidia_user", JSON.stringify(fresh));
        sync();
      } catch {
        // offline / unauthenticated — the cached copy stays in charge
      }
    };

    sync();
    void refresh();
    window.addEventListener("novidia_auth_change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("novidia_auth_change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return null;
}
