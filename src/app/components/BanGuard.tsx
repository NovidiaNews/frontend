"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BanScreen from "./BanScreen";

import { API_URL } from "@/lib/api";

interface BanData {
  unbanDate: string | null;
  banReason: string | null;
}

async function checkBanStatus(): Promise<BanData | null> {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      credentials: "include",
    });
    if (response.status === 403) {
      const data = await response.json();
      if (data.message === "ACCOUNT_BANNED" || data.isBanned) {
        return {
          unbanDate: data.unbanDate ?? null,
          banReason: data.banReason ?? null,
        };
      }
    }
  } catch (error) {
    console.error("Failed to check ban status", error);
  }
  return null;
}

// Full-screen ban takeover: as soon as a ban is detected (SSE push, poll,
// login response, or the /users/me check), EVERYTHING under this guard is
// unmounted and replaced by the ban screen — it stays until the user logs
// out from it.
export default function BanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isBanned, setIsBanned] = useState(false);
  const [banData, setBanData] = useState<BanData>({ unbanDate: null, banReason: null });

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;

    const applyBan = (data?: BanData) => {
      localStorage.clear();
      sessionStorage.clear();
      if (!cancelled) {
        setBanData(data ?? { unbanDate: null, banReason: null });
        setIsBanned(true);
      }
    };

    // Banning from any screen — e.g. a 403 from the login endpoint
    const onBanEvent = () => applyBan();

    const runCheck = async () => {
      if (cancelled) return;
      const banResult = await checkBanStatus();
      if (banResult) applyBan(banResult);
    };

    runCheck();
    const interval = setInterval(runCheck, 15000);

    // Real-time: SSE connection — the backend pushes a `banned` event the
    // moment an admin bans this account, no polling involved.
    const connected = () => {
      if (cancelled) return;
      const token = localStorage.getItem("novidia_token");
      if (!token) return;
      eventSource?.close();
      const source = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);
      source.addEventListener("banned", () => applyBan());
      source.onerror = () => {
        // transient network issues are fine — the interval poll is the fallback
      };
      eventSource = source;
    };
    connected();

    const onReconnect = () => {
      if (localStorage.getItem("novidia_token")) connected();
    };
    window.addEventListener("storage", onReconnect);
    window.addEventListener("novidia_auth_change", onReconnect);
    window.addEventListener("novidia_banned", onBanEvent);

    return () => {
      cancelled = true;
      clearInterval(interval);
      eventSource?.close();
      window.removeEventListener("storage", onReconnect);
      window.removeEventListener("novidia_auth_change", onReconnect);
      window.removeEventListener("novidia_banned", onBanEvent);
    };
  }, []);

  // Auto-unban: when an unbanDate is set, schedule a check at that exact time
  useEffect(() => {
    if (!isBanned || !banData.unbanDate) return;

    const unbanTime = new Date(banData.unbanDate).getTime();
    const now = Date.now();
    const msUntilUnban = unbanTime - now;

    // Already past unban time
    if (msUntilUnban <= 0) {
      checkBanStatus().then((result) => {
        if (!result) {
          setIsBanned(false);
          window.dispatchEvent(new Event("novidia_auth_change"));
        }
      });
      return;
    }

    const timer = setTimeout(async () => {
      const result = await checkBanStatus();
      if (!result) {
        setIsBanned(false);
        window.dispatchEvent(new Event("novidia_auth_change"));
      }
    }, msUntilUnban);

    return () => clearTimeout(timer);
  }, [isBanned, banData.unbanDate]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.dispatchEvent(new Event("novidia_auth_change"));
    setIsBanned(false);
    router.push("/");
  };

  if (isBanned) return <BanScreen onLoggedOut={handleLogout} unbanDate={banData.unbanDate} banReason={banData.banReason} />;
  return <>{children}</>;
}