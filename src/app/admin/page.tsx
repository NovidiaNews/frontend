"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, FileText, Terminal, LogOut, Shield, Save, X, RefreshCw,
  Search, Check, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, ChevronRight, Trash2, Edit3, Filter,
  AlertCircle, Info, AlertOctagon, Bug, List, Ban,
  ShieldOff, Plus, Clock, LayoutDashboard, Database, Activity,
  Cpu, MemoryStick, Server, HardDrive, Eye, Globe, MapPin, Power,
} from "lucide-react";
import VisitsMap from "../components/VisitsMap";
import { NovButton, NovCheckbox, NovIconButton, NovInput, NovSelect, NovTextarea, NovToast } from "@/app/components/ui";

import { API_URL } from "@/lib/api";

type Tab = "overview" | "users" | "articles" | "logs" | "visits" | "ipbans";
type SortDir = "asc" | "desc";
type Level = "error" | "warn" | "info" | "debug" | "fatal";

interface StoredUser {
  id: string;
  username: string;
  email: string;
  role: number;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: number;
  firstName: string | null;
  lastName: string | null;
  isBanned: boolean;
  isVerified: boolean;
  isOnboarded: boolean;
  strikes: number;
  profilePicture: string | null;
  bio: string | null;
  theme: string;
  notificationsEnabled: boolean;
  consentToTOS: boolean | null;
  createdAt: string;
  lastIp: string | null;
  [key: string]: unknown;
}

interface ArticleRecord {
  id: string;
  title: string;
  content: string;
  status: string;
  authorId: string;
  author: { id: string; username: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface LogEntry {
  level: string;
  time: number;
  msg: string;
  pid?: number;
  url?: string;
  [key: string]: unknown;
}

interface SystemStats {
  cpu: { percent: number; cores: number; model: string };
  memory: { totalMB: number; usedMB: number; freeMB: number; percent: number; processMB: number };
  system: { platform: string; arch: string; release: string; hostname: string; uptimeSec: number; nodeVersion: string; loadAvg: number[] };
  largestFiles: {
    articles: { id: string; title: string; author: string; status: string; sizeMB: number; sizeBytes: number; createdAt: string }[];
    avatars: { id: string; username: string; email: string; sizeMB: number; sizeBytes: number }[];
    bios: { id: string; username: string; email: string; sizeMB: number; sizeBytes: number }[];
  };
  counts: { users: number; articles: number; visits: number; ipBans: number };
}

interface VisitRecord {
  id: string;
  path: string;
  ipHash: string;
  ipTruncated: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  lat: number | null;
  lon: number | null;
  userAgent: string | null;
  userId: string | null;
  createdAt: string;
}

interface VisitStats {
  total: number;
  uniqueVisitors: number;
  perDay: { date: string; count: number }[];
  countries: { code: string | null; country: string | null; count: number }[];
  recent: VisitRecord[];
}

interface IpBanRecord {
  id: string;
  ip: string;
  reason: string | null;
  source: string;
  bannedById: string | null;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const roleLabel = (role: number) => {
  if (role >= 100) return { label: "Właściciel", cls: "bg-purple-100 text-purple-700" };
  if (role >= 90) return { label: "Administrator", cls: "bg-blue-100 text-blue-700" };
  if (role >= 30) return { label: "Redaktor", cls: "bg-amber-100 text-amber-700" };
  if (role >= 20) return { label: "Autor", cls: "bg-cyan-100 text-cyan-700" };
  if (role >= 10) return { label: "Komentator", cls: "bg-emerald-100 text-emerald-700" };
  return { label: "Użytkownik", cls: "bg-surface-raised text-ink-muted" };
};

const flagEmoji = (code?: string | null) =>
  code && /^[A-Z]{2}$/i.test(code)
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : "🌍";

const fmtUp = (sec: number) => {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const percentCls = (p: number) => (p >= 70 ? "bg-red-500" : p >= 40 ? "bg-amber-500" : "bg-emerald-500");

const levelIcon = (level: string) => {
  switch (level) {
    case "error": return <AlertCircle size={12} className="text-red-500" />;
    case "warn": return <AlertOctagon size={12} className="text-amber-500" />;
    case "fatal": return <AlertTriangle size={12} className="text-red-600" />;
    case "debug": return <Bug size={12} className="text-blue-500" />;
    default: return <Info size={12} className="text-ink-subtle" />;
  }
};

const levelColor = (level: string) => {
  switch (level) {
    case "error": return "text-red-700 bg-red-50 border-red-200";
    case "warn": return "text-amber-700 bg-amber-50 border-amber-200";
    case "fatal": return "text-red-800 bg-red-100 border-red-300";
    case "debug": return "text-blue-700 bg-blue-50 border-blue-200";
    default: return "text-ink-muted bg-surface-raised border-edge";
  }
};

function Notification({ n }: { n: { type: "success" | "error"; message: string } | null }) {
  if (!n) return null;
  return <NovToast type={n.type} message={n.message} className="fixed top-4 right-4 z-50" />;
}

function SortHeader({ label, field, currentField, direction, onSort }: {
  label: string; field: string; currentField: string; direction: SortDir; onSort: (f: string) => void;
}) {
  const active = currentField === field;
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className="text-left px-4 py-3 font-semibold text-ink-muted cursor-pointer select-none hover:text-ink transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <Icon size={13} className={active ? "text-main" : "text-ink-subtle"} />
      </div>
    </th>
  );
}

function apikey(api: string, init?: RequestInit) { return fetch(`${API_URL}${api}`, init); }

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    const storedUser = localStorage.getItem("novidia_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role < 90) { router.push("/"); return; }
        setAuthUser(parsed);
      } catch { router.push("/login"); }
    } else { router.push("/login"); }
    setLoading(false);
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-main border-t-transparent rounded-full" />
    </div>
  );
  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-main flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-fraunces text-ink">Panel administracyjny</h1>
              <p className="text-xs text-ink-muted -mt-1">
                Zalogowany jako <span className="font-semibold text-ink">{authUser.username}</span> · <span className={roleLabel(authUser.role).cls + " px-1.5 py-0.5 rounded-full"}>{roleLabel(authUser.role).label}</span>
              </p>
            </div>
          </div>
          <NovButton unstyled onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Wróć
          </NovButton>
        </div>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "overview" && <OverviewPanel />}
        {activeTab === "users" && <UsersPanel currentUserId={authUser.id} myRole={authUser.role} />}
        {activeTab === "articles" && <ArticlesPanel />}
        {activeTab === "logs" && <LogsPanel />}
        {activeTab === "visits" && <VisitsPanel />}
        {activeTab === "ipbans" && <IpBansPanel />}
      </div>
    </div>
  );
}

function TabNav({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Przegląd", icon: LayoutDashboard },
    { id: "users", label: "Użytkownicy", icon: Users },
    { id: "articles", label: "Artykuły", icon: FileText },
    { id: "logs", label: "Logi", icon: Terminal },
    { id: "visits", label: "Odwiedziny", icon: Eye },
    { id: "ipbans", label: "IP Bany", icon: Shield },
  ];
  return (
    <div className="flex gap-2.5 mb-6 bg-surface-raised rounded-full p-1 w-fit overflow-x-auto max-w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <NovButton unstyled key={tab.id} onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap z-0 ${
              isActive
                ? "text-white dark:text-main"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabNavPill"
                className="absolute inset-0 rounded-full bg-main dark:bg-main/10 shadow-sm -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={16} /> {tab.label}
          </NovButton>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, sub }: { icon: typeof Cpu; label: string; value: string; sub?: string }) {
  const Icon = icon;
  return (
    <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
      <div className="flex items-center gap-2 text-ink-subtle mb-3">
        <Icon size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold font-fraunces text-ink">{value}</div>
      {sub && <div className="text-xs text-ink-muted mt-1">{sub}</div>}
    </div>
  );
}

function MetricBar({ label, percent, detail }: { label: string; percent: number; detail: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-ink-muted">{label}</span>
        <span className="font-mono font-semibold text-ink">{percent}% · {detail}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-surface-raised overflow-hidden">
        <div className={`h-full rounded-full transition-all ${percentCls(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function OverviewPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await apikey("/admin/stats/system", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error("Nie udało się pobrać statystyk systemu");
      setStats(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd sieci");
      if (silent) console.error(`[Admin] Auto-refresh failed: ${err instanceof Error ? err.message : err}`);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchStats(true), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !stats) return <SkeletonCards />;
  if (!stats) return <ErrorBox message={error} onRetry={() => fetchStats()} />;

  const { cpu, memory, system, largestFiles, counts } = stats;
  const maxFileSize = Math.max(
    ...largestFiles.articles.map((a) => a.sizeBytes),
    ...largestFiles.avatars.map((a) => a.sizeBytes),
    ...largestFiles.bios.map((a) => a.sizeBytes),
    1
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Cpu} label="CPU" value={`${cpu.percent}%`} sub={`${cpu.cores} rdzeni · ${cpu.model}`} />
        <StatCard icon={MemoryStick} label="Pamięć RAM" value={`${memory.percent}%`} sub={`${memory.usedMB} / ${memory.totalMB} MB użyte`} />
        <StatCard icon={Server} label="Proces" value={`${memory.processMB} MB`} sub={`${system.nodeVersion} · ${system.platform}/${system.arch}`} />
        <StatCard icon={Clock} label="Czas działania" value={fmtUp(system.uptimeSec)} sub={system.hostname} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2"><Cpu size={15} className="text-main" /> Obciążenie</h3>
          <div className="space-y-4">
            <MetricBar label="CPU" percent={cpu.percent} detail={`load ${system.loadAvg.join(" / ")}`} />
            <MetricBar label="RAM" percent={memory.percent} detail={`wolne ${memory.freeMB} MB`} />
            <MetricBar label="Proces (RSS)" percent={Math.min(Math.round((memory.processMB / Math.max(memory.totalMB, 1)) * 1000), 100)} detail={`${memory.processMB} MB`} />
          </div>
        </div>
        <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2"><Database size={15} className="text-main" /> Zasoby</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniCount icon={Users} label="Użytkownicy" value={counts.users} />
            <MiniCount icon={FileText} label="Artykuły" value={counts.articles} />
            <MiniCount icon={Eye} label="Odwiedziny (90 dni)" value={counts.visits} />
            <MiniCount icon={Shield} label="Aktywne bany IP" value={counts.ipBans} />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2"><HardDrive size={15} className="text-main" /> Największe pliki użytkowników</h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-muted cursor-pointer select-none">
              <NovCheckbox unstyled checked={autoRefresh} onChange={setAutoRefresh}
                className="rounded border-edge-strong text-main focus:ring-main/30"
              />
              <RefreshCw size={12} className={autoRefresh ? "text-emerald-600" : ""} /> Auto (5 s)
            </label>
            <NovButton unstyled onClick={() => fetchStats()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-edge text-xs font-semibold text-ink-muted hover:bg-surface-raised transition-colors cursor-pointer"
            ><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Odśwież</NovButton>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LargestList title="Artykuły" icon={FileText}
            rows={largestFiles.articles.map((a) => ({
              name: a.title, sub: `${a.author} · ${a.status.toLowerCase()}`, size: a.sizeBytes,
            }))}
            maxSize={maxFileSize} />
          <LargestList title="Awatary" icon={Users}
            rows={largestFiles.avatars.map((a) => ({ name: a.username, sub: a.email, size: a.sizeBytes }))}
            maxSize={maxFileSize} />
          <LargestList title="Biogramy" icon={Edit3}
            rows={largestFiles.bios.map((a) => ({ name: a.username, sub: a.email, size: a.sizeBytes }))}
            maxSize={maxFileSize} />
        </div>
      </div>
    </div>
  );
}

function MiniCount({ icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-edge bg-surface-raised p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted mb-1">
        <Icon size={13} /> {label}
      </div>
      <div className="text-xl font-bold font-fraunces text-ink">{value.toLocaleString("pl-PL")}</div>
    </div>
  );
}

function LargestList({ title, icon, rows, maxSize }: {
  title: string; icon: typeof FileText; rows: { name: string; sub: string; size: number }[]; maxSize: number;
}) {
  const Icon = icon;
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-subtle mb-2">
        <Icon size={13} /> {title}
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-ink-subtle">Brak danych</p>}
        {rows.map((r, i) => (
          <div key={i} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink truncate">{r.name}</span>
              <span className="font-mono text-ink-muted shrink-0">{(r.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-subtle truncate">{r.sub}</span>
              <span className="font-mono text-ink-subtle shrink-0">{r.size.toLocaleString("pl-PL")} B</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-raised mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-main/70" style={{ width: `${Math.max((r.size / Math.max(maxSize, 1)) * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-surface-raised rounded-2xl animate-pulse" />)}
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-surface rounded-2xl border border-red-200 p-6 text-center">
      <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
      <p className="text-sm text-red-600 font-semibold">{message || "Wystąpił błąd"}</p>
      {onRetry && (
        <NovButton variant="main" size="none" onClick={onRetry}
          className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold"
        >Spróbuj ponownie</NovButton>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
function UsersPanel({ currentUserId, myRole }: { currentUserId: string; myRole: number }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [banningUser, setBanningUser] = useState<UserRecord | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState("");

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
    if (type === "error") console.error(`[Admin Error] ${message}`);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apikey("/admin/users", { credentials: "include" });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Nie udało się pobrać użytkowników");
      setUsers(await res.json());
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const sortedUsers = useMemo(() => {
    const filtered = users.filter(
      (u) => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField as keyof UserRecord];
      const bVal = b[sortField as keyof UserRecord];
      let av: unknown = aVal, bv: unknown = bVal;
      if (sortField === "createdAt") { av = new Date(aVal as string).getTime(); bv = new Date(bVal as string).getTime(); }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      const an = typeof av === "number" ? av : String(av);
      const bn = typeof bv === "number" ? bv : String(bv);
      if (an < bn) return sortDir === "asc" ? -1 : 1;
      if (an > bn) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, search, sortField, sortDir]);

  const deleteUser = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tego użytkownika? Jego konta, artykuły i dane zostaną trwale usunięte (RODO).")) return;
    try {
      const res = await apikey(`/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się usunąć użytkownika");
      showNotification("success", "Użytkownik usunięty"); fetchUsers();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  const unbanUser = async (id: string) => {
    try {
      const res = await apikey(`/admin/users/${id}/unban`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się odbanować użytkownika");
      showNotification("success", "Użytkownik odbanowany"); fetchUsers();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  const toggleVerify = async (id: string) => {
    try {
      const res = await apikey(`/admin/users/${id}/verify`, { method: "PATCH", credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się zmienić statusu weryfikacji");
      const data = await res.json();
      showNotification("success", data.isVerified ? "Odebrano weryfikację" : "Nadano weryfikację");
      fetchUsers();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  const changeRole = async (id: string, role: number) => {
    try {
      const res = await apikey(`/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Nie udało się zmienić roli"); }
      showNotification("success", "Rola zmieniona"); fetchUsers();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  // Enable / disable an account (more granular than a full ban).
  const toggleDisable = async (id: string, disabled: boolean) => {
    const question = disabled
      ? "Czy na pewno chcesz WYŁĄCZYĆ to konto? Użytkownik przestanie mieć dostęp."
      : "Czy na pewno chcesz ponownie WŁĄczyć to konto?";
    if (!confirm(question)) return;
    try {
      const res = await apikey(`/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDisabled: disabled }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({}) as { message?: string }); throw new Error(err.message || "Nie udało się zmienić stanu konta"); }
      showNotification("success", disabled ? "Konto wyłączone" : "Konto włączone");
      fetchUsers();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  return (
    <div>
      {notification && <Notification n={notification} />}

      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <NovInput unstyled type="text" placeholder="Szukaj użytkowników..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-main/30"
          />
        </div>
        <NovButton variant="outline" onClick={fetchUsers}
          className="font-semibold"
        >
          <RefreshCw size={14} /> Odśwież
        </NovButton>
      </div>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface rounded-2xl border border-edge overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-surface-raised">
                  <SortHeader label="Nazwa" field="username" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <SortHeader label="Email" field="email" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <SortHeader label="Ranga" field="role" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="text-left px-4 py-3 font-semibold text-ink-muted">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-muted">Ostatnie IP</th>
                  <SortHeader label="Utworzono" field="createdAt" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="text-right px-4 py-3 font-semibold text-ink-muted">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const rank = Number(user.role || 0);
                  const outranksMe = !isSelf && rank > myRole;
                  const blocked = isSelf || outranksMe;
                  const blockReason = isSelf ? "Nie możesz wykonywać tej akcji na własnym koncie" : outranksMe ? "Ranga tego użytkownika jest wyższa od Twojej" : undefined;
                  const role = roleLabel(user.role);
                  return (
                    <tr key={user.id} className={`border-b border-edge transition-colors ${user.isBanned ? "bg-red-50/60" : isSelf ? "bg-surface-raised" : "hover:bg-surface-raised"}`}>
                      <td className="px-4 py-3 font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-main/10 flex items-center justify-center shrink-0">
                            {user.profilePicture ? (
                              <img src={user.profilePicture} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <Users size={13} className="text-main" />
                            )}
                          </div>
                          {user.username}
                          {isSelf && <span className="text-xs text-ink-subtle font-normal">(ty)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{user.email}</td>
                      <td className="px-4 py-3">
                        {editingRoleId === user.id ? (
                          <div className="flex items-center gap-1">
                            <NovInput
                              unstyled
                              type="number"
                              className="w-20 px-2 py-1 rounded-lg border border-main text-xs font-bold bg-surface"
                              value={roleInput}
                              onChange={(e) => setRoleInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  changeRole(user.id, Number(roleInput));
                                  setEditingRoleId(null);
                                }
                                if (e.key === "Escape") setEditingRoleId(null);
                              }}
                              autoFocus
                            />
                            <NovButton unstyled onClick={() => { changeRole(user.id, Number(roleInput)); setEditingRoleId(null); }}
                              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"><Check size={12} /></NovButton>
                            <NovButton unstyled onClick={() => setEditingRoleId(null)}
                              className="p-1 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"><X size={12} /></NovButton>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingRoleId(user.id); setRoleInput(String(user.role)); }}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${role.cls} cursor-pointer hover:opacity-70 transition-opacity`}
                            title="Kliknij aby zmienić rolę (dowolna wartość)"
                          >
                            {role.label} ({user.role})
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.isBanned
                            ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={11} />Zablokowany{(user as Record<string, unknown>).unbanDate ? ` → ${new Date((user as Record<string, unknown>).unbanDate as string).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                            : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={11} />Aktywny</span>}
                          {user.strikes > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">♂ {user.strikes}♂</span>}
                          {user.isDisabled === true && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Power size={11} />Wyłączone</span>}
                          {user.isRestricted === true && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Ograniczone</span>}
                          {!user.isVerified && <span className="text-xs font-bold text-ink-muted bg-surface-raised px-2 py-0.5 rounded-full">Niezweryfikowany</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.lastIp ? (
                          <span className="font-mono text-xs text-ink-muted">{user.lastIp}</span>
                        ) : (
                          <span className="text-xs text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs">{new Date(user.createdAt).toLocaleDateString("pl-PL")}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {user.isBanned ? (
                            <NovButton unstyled onClick={() => !blocked && unbanUser(user.id)}
                              disabled={blocked}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1"
                            ><Check size={12} /> Odbanuj</NovButton>
                          ) : (
                            <NovButton unstyled onClick={() => !blocked && setBanningUser(user)}
                              disabled={blocked}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                isSelf ? "text-ink-subtle cursor-not-allowed" : "text-red-600 hover:bg-red-50 cursor-pointer"
                              }`}
                              title={blockReason || "Zbanuj użytkownika"}
                            ><Ban size={12} /> Zbanuj</NovButton>
                          )}
                          <NovButton unstyled onClick={() => !blocked && toggleVerify(user.id)}
                            disabled={blocked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${blocked ? "text-ink-subtle cursor-not-allowed" : "text-ink-muted hover:bg-surface-raised"}`}
                            title={blockReason || (user.isVerified ? "Odbierz weryfikację" : "Nadaj weryfikację")}
                          ><Shield size={12} /> {user.isVerified ? "Odbierz" : "Weryfikuj"}</NovButton>
                          <NovButton unstyled onClick={() => !blocked && toggleDisable(user.id, !user.isDisabled)}
                            disabled={blocked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${blocked ? "text-ink-subtle cursor-not-allowed" : "text-indigo-600 hover:bg-indigo-50"}`}
                            title={blockReason || (user.isDisabled ? "Włącz konto" : "Wyłącz konto")}
                          ><Power size={12} /> {user.isDisabled ? "Włącz" : "Wyłącz"}</NovButton>
                          <NovButton unstyled onClick={() => !blocked && setEditingUser(user)}
                            disabled={blocked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              isSelf ? "text-ink-subtle cursor-not-allowed" : "text-main hover:bg-main/10 cursor-pointer"
                            }`}
                            title={blockReason || "Edytuj użytkownika"}
                          ><Edit3 size={12} /> Edytuj</NovButton>
                          <NovButton unstyled onClick={() => !blocked && deleteUser(user.id)}
                            disabled={blocked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              isSelf ? "text-ink-subtle cursor-not-allowed" : "text-red-600 hover:bg-red-50 cursor-pointer"
                            }`}
                            title={blockReason || "Usuń użytkownika"}
                          ><Trash2 size={12} /> Usuń</NovButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sortedUsers.length === 0 && <div className="text-center py-12 text-ink-muted text-sm">Nie znaleziono użytkowników</div>}
        </div>
      )}

      {banningUser && (
        <BanUserModal user={banningUser} onClose={() => setBanningUser(null)} onDone={() => { showNotification("success", "Użytkownik zablokowany"); setBanningUser(null); fetchUsers(); }} />
      )}
      {editingUser && (
        <EditUserModal user={editingUser} currentUserId={currentUserId}
          onClose={() => setEditingUser(null)}
          onDone={() => { showNotification("success", "Użytkownik zapisany"); setEditingUser(null); fetchUsers(); }} />
      )}
    </div>
  );
}

function ModalShell({ title, icon, onClose, children, footer }: {
  title: string; icon: typeof Shield; onClose: () => void;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h3 className="text-lg font-bold text-ink font-fraunces flex items-center gap-2">
            <Icon size={18} className="text-main" /> {title}
          </h3>
          <NovIconButton tone="subtle" size="sm" onClick={onClose}><X size={20} /></NovIconButton>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-edge bg-surface-raised rounded-b-2xl">{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: typeof Users; children: React.ReactNode }) {
  const Icon = icon;
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1 flex items-center gap-1"><Icon size={12} /> {label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-edge text-sm focus:outline-none focus:ring-2 focus:ring-main/30 disabled:bg-surface-raised disabled:text-ink-subtle";

function EditUserModal({ user, currentUserId, onClose, onDone }: {
  user: UserRecord; currentUserId: string; onClose: () => void; onDone: () => void;
}) {
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    role: String(user.role),
    strikes: String(user.strikes),
    isVerified: user.isVerified,
    isOnboarded: user.isOnboarded,
    notificationsEnabled: user.notificationsEnabled,
    bio: user.bio || "",
    theme: user.theme || "light",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canEdit = user.id !== currentUserId;

  const save = async () => {
    setSaving(true); setError("");
    try {
      const body: Record<string, unknown> = {
        username: form.username, email: form.email,
        firstName: form.firstName || null, lastName: form.lastName || null,
        role: Number(form.role), strikes: Number(form.strikes) || 0,
        isVerified: form.isVerified, isOnboarded: form.isOnboarded,
        notificationsEnabled: form.notificationsEnabled, bio: form.bio || null,
        theme: form.theme,
      };
      if (form.password) body.password = form.password;
      const res = await apikey(`/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Nie udało się zapisać użytkownika"); }
      onDone();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Błąd sieci"); }
    setSaving(false);
  };

  return (
    <ModalShell title={`Edytuj: ${user.username}`} icon={Edit3} onClose={onClose}
      footer={
        <>
          <NovButton variant="outline" size="none" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold">Anuluj</NovButton>
          <NovButton variant="main" size="none" onClick={save} disabled={saving || !canEdit}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          >{saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Zapisz</NovButton>
        </>
      }
    >
      {!canEdit && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Edytujesz swoje własne konto. Edycja jest zablokowana.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nazwa użytkownika" icon={Users}><NovInput unstyled disabled={!canEdit} className={inputCls} value={form.username} onChange={(e) => set("username", e.target.value)} /></Field>
        <Field label="Email" icon={FileText}><NovInput unstyled disabled={!canEdit} className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Imię" icon={Users}><NovInput unstyled disabled={!canEdit} className={inputCls} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
        <Field label="Nazwisko" icon={Users}><NovInput unstyled disabled={!canEdit} className={inputCls} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
        <Field label="Ranga (dowolna wartość)" icon={Shield}>
          <div className="space-y-2">
            <NovInput unstyled disabled={!canEdit} type="number" min={0} max={999} className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "1", label: "Użytkownik" },
                { value: "10", label: "Komentator" },
                { value: "20", label: "Autor" },
                { value: "30", label: "Redaktor" },
                { value: "90", label: "Admin" },
                { value: "100", label: "Właściciel" },
              ].map((preset) => (
                <button key={preset.value} type="button" disabled={!canEdit}
                  onClick={() => set("role", preset.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    form.role === preset.value
                      ? "bg-main text-white border-main"
                      : "bg-surface-raised border-edge text-ink-muted hover:border-main/30 hover:text-main"
                  }`}
                >{preset.label}</button>
              ))}
            </div>
          </div>
        </Field>
        <Field label="Ostrzeżenia (strikes)" icon={AlertTriangle}><NovInput unstyled disabled={!canEdit} type="number" className={inputCls} value={form.strikes} onChange={(e) => set("strikes", e.target.value)} /></Field>
        <Field label="Motyw" icon={Eye}><NovSelect unstyled disabled={!canEdit} className={inputCls + " bg-surface"} value={form.theme} onChange={(e) => set("theme", e.target.value)}><option value="light">Jasny</option><option value="dark">Ciemny</option><option value="system">Systemowy</option></NovSelect></Field>
        <Field label="Nowe hasło (opcjonalnie)" icon={Shield}><NovInput unstyled disabled={!canEdit} type="password" placeholder="••••••••" className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} /></Field>
      </div>
      <div className="mt-4">
        <Field label="Biogram" icon={Edit3}><NovTextarea unstyled disabled={!canEdit} className={inputCls + " resize-none h-24"} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          ["isVerified", "Zweryfikowany", user.isVerified],
          ["isOnboarded", "Po onboardingu", user.isOnboarded],
          ["notificationsEnabled", "Powiadomienia", user.notificationsEnabled],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm font-medium text-ink-muted cursor-pointer select-none rounded-xl border border-edge px-3 py-2.5">
            <NovCheckbox unstyled disabled={!canEdit} className="rounded border-edge-strong text-main focus:ring-main/30" checked={form[key]} onChange={(v) => set(key, v)} />
            {label}
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600 font-semibold">{error}</p>}
    </ModalShell>
  );
}

const BAN_REASON_PRESETS = [
  "Spam",
  "Treści obraźliwe",
  "Nękanie",
  "Fałszywe informacje",
  "Naruszenie praw autorskich",
  "Reklama bez zgody",
  "Falowe konta",
  "Łamanie regulaminu",
  "Nieodpowiednie treści",
  "Atak na inne osoby",
  "Publikacja danych osobowych",
  "Naruszenie prywatności",
];

function BanUserModal({ user, onClose, onDone }: {
  user: UserRecord; onClose: () => void; onDone: () => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [banIp, setBanIp] = useState(!!user.lastIp);
  const [unbanDate, setUnbanDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredPresets = BAN_REASON_PRESETS.filter(
    (p) => p.toLowerCase().includes(input.toLowerCase()) && !tags.includes(p)
  );

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        setTags((prev) => [...prev, input.trim()]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const reason = tags.join("\n");

  const submit = async () => {
    setSaving(true); setError("");
    try {
      const body: Record<string, unknown> = { reason: reason || undefined, banIp };
      if (unbanDate) body.unbanDate = new Date(unbanDate).toISOString();
      const res = await apikey(`/admin/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Nie udało się zbanować użytkownika"); }
      onDone();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Błąd sieci"); }
    setSaving(false);
  };

  return (
    <ModalShell title={`Zbanuj: ${user.username}`} icon={Ban} onClose={onClose}
      footer={
        <>
          <NovButton variant="outline" size="none" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold">Anuluj</NovButton>
          <NovButton variant="danger" size="none" onClick={submit} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110"
          >{saving ? <RefreshCw size={14} className="animate-spin" /> : <Ban size={14} />} Zbanuj</NovButton>
        </>
      }
    >
      <p className="text-sm text-ink-muted mb-4">
        Użytkownik <span className="font-bold text-ink">{user.username}</span> zostanie natychmiast zablokowany —
        sesja wygaśnie przy najbliższym żądaniu (403 ACCOUNT_BANNED).
      </p>
      <Field label="Powód (widoczny tylko dla administratorów)" icon={AlertTriangle}>
        <div className="space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-main/10 text-main border border-main/20 rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative" ref={suggestionsRef}>
            <NovInput
              unstyled
              ref={inputRef}
              className={inputCls}
              placeholder="Wpisz powód lub wybierz z listy..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => input && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
            />
            {showSuggestions && input && filteredPresets.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addTag(preset)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-main/40 shrink-0" />
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
          {tags.length === 0 && !input && (
            <div className="flex flex-wrap gap-1.5">
              {BAN_REASON_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addTag(preset)}
                  className="inline-flex items-center gap-1 bg-surface-raised border border-edge text-ink-muted rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-surface hover:border-main/30 hover:text-main transition-all cursor-pointer"
                >
                  <Plus size={10} />
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>
      <Field label="Automatyczne odblokowanie (opcjonalne)" icon={Clock}>
        <input
          type="datetime-local"
          className={inputCls + " bg-surface"}
          value={unbanDate}
          onChange={(e) => setUnbanDate(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-ink-subtle">Jeśli ustawione, konto zostanie automatycznie odblokowane o tej godzinie.</p>
      </Field>
      {user.lastIp && (
        <label className="mt-4 flex items-start gap-2 text-sm font-medium text-ink-muted cursor-pointer select-none rounded-xl border border-edge px-3 py-2.5">
          <NovCheckbox unstyled className="mt-0.5 rounded border-edge-strong text-main focus:ring-main/30" checked={banIp} onChange={setBanIp} />
          <span>Zbanuj również adres IP (<span className="font-mono">{user.lastIp}</span>) — zablokuje to urządzenie użytkownika</span>
        </label>
      )}
      {error && <p className="mt-3 text-sm text-red-600 font-semibold">{error}</p>}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED: { label: "Opublikowany", cls: "bg-emerald-100 text-emerald-700" },
    DRAFT: { label: "Szkic", cls: "bg-surface-raised text-ink-muted" },
    ARCHIVED: { label: "Zarchiwizowany", cls: "bg-blue-100 text-blue-700" },
  };
  const s = map[status] || { label: status, cls: "bg-surface-raised text-ink-muted" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

function ArticlesPanel() {
  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingArticle, setEditingArticle] = useState<ArticleRecord | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
    if (type === "error") console.error(`[Admin Error] ${message}`);
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await apikey("/admin/articles", { credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się pobrać artykułów");
      setArticles(await res.json());
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const sortedArticles = useMemo(() => {
    const filtered = articles.filter(
      (a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.author?.username.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortField === "createdAt" || sortField === "updatedAt") {
        return (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()) * (sortDir === "asc" ? 1 : -1);
      }
      if (sortField === "author") {
        const av = (a.author?.username || "").toLowerCase(), bv = (b.author?.username || "").toLowerCase();
        return (av < bv ? -1 : av > bv ? 1 : 0) * (sortDir === "asc" ? 1 : -1);
      }
      const av = String(a[sortField as keyof ArticleRecord] || "").toLowerCase();
      const bv = String(b[sortField as keyof ArticleRecord] || "").toLowerCase();
      return (av < bv ? -1 : av > bv ? 1 : 0) * (sortDir === "asc" ? 1 : -1);
    });
  }, [articles, search, sortField, sortDir]);

  const deleteArticle = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten artykuł?")) return;
    try {
      const res = await apikey(`/admin/articles/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się usunąć artykułu");
      showNotification("success", "Artykuł usunięty"); fetchArticles();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  return (
    <div>
      {notification && <Notification n={notification} />}

      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <NovInput unstyled type="text" placeholder="Szukaj artykułów..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-main/30"
          />
        </div>
        <NovButton variant="outline" onClick={fetchArticles}
          className="font-semibold"
        ><RefreshCw size={14} /> Odśwież</NovButton>
      </div>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface rounded-2xl border border-edge overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-surface-raised">
                  <SortHeader label="Tytuł" field="title" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <SortHeader label="Autor" field="author" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <SortHeader label="Status" field="status" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <SortHeader label="Utworzono" field="createdAt" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <SortHeader label="Zaktualizowano" field="updatedAt" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="text-right px-4 py-3 font-semibold text-ink-muted">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {sortedArticles.map((article) => (
                  <tr key={article.id} className="border-b border-edge hover:bg-surface-raised transition-colors">
                    <td className="px-4 py-3 font-medium text-ink max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-ink-subtle shrink-0" />
                        {article.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{article.author?.username}</td>
                    <td className="px-4 py-3">{statusBadge(article.status)}</td>
                    <td className="px-4 py-3 text-ink-muted text-xs">{new Date(article.createdAt).toLocaleDateString("pl-PL")}</td>
                    <td className="px-4 py-3 text-ink-muted text-xs">{new Date(article.updatedAt).toLocaleDateString("pl-PL")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <NovButton unstyled onClick={() => setEditingArticle(article)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-main hover:bg-main/10 transition-colors cursor-pointer flex items-center gap-1"
                        ><Edit3 size={12} /> Edytuj</NovButton>
                        <NovButton unstyled onClick={() => deleteArticle(article.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                        ><Trash2 size={12} /> Usuń</NovButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedArticles.length === 0 && <div className="text-center py-12 text-ink-muted text-sm">Nie znaleziono artykułów</div>}
        </div>
      )}

      {editingArticle && <EditArticleModal article={editingArticle} onClose={() => setEditingArticle(null)} onDone={() => { showNotification("success", "Artykuł zapisany"); setEditingArticle(null); fetchArticles(); }} />}
    </div>
  );
}

function EditArticleModal({ article, onClose, onDone }: {
  article: ArticleRecord; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [status, setStatus] = useState(article.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      const res = await apikey(`/admin/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ title, content, status }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Nie udało się zapisać artykułu"); }
      onDone();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Błąd sieci"); }
    setSaving(false);
  };

  return (
    <ModalShell title={`Edytuj artykuł: ${article.title}`} icon={Edit3} onClose={onClose}
      footer={
        <>
          <NovButton variant="outline" size="none" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold">Anuluj</NovButton>
          <NovButton variant="main" size="none" onClick={save} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          >{saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Zapisz</NovButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tytuł" icon={FileText}><NovInput unstyled className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Status" icon={Filter}>
          <NovSelect unstyled className={inputCls + " bg-surface"} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">Szkic</option>
            <option value="PUBLISHED">Opublikowany</option>
            <option value="ARCHIVED">Zarchiwizowany</option>
          </NovSelect>
        </Field>
        <Field label="Treść" icon={Terminal}>
          <NovTextarea unstyled className={inputCls + " resize-none h-64 font-mono leading-relaxed"} value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false} />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 font-semibold">{error}</p>}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [includeAdmin, setIncludeAdmin] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (includeAdmin) params.set("includeAdmin", "true");
      const since = logs.length > 0 ? logs[0].time : 0;
      if (since) params.set("since", String(since));
      const res = await apikey(`/admin/logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się pobrać logów");
      const data = await res.json();
      setLogs((prev) => {
        const existing = new Set(prev.map((l) => l.time + l.msg));
        const newEntries = data.filter((l: LogEntry) => !existing.has(l.time + l.msg));
        return [...newEntries, ...prev].slice(0, 500);
      });
    } catch (err: unknown) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [includeAdmin]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 6500);
    return () => clearInterval(interval);
  }, [autoRefresh, logs.length, includeAdmin]);

  const filteredLogs = useMemo(() => {
    let result = logs;
    result = result.filter((l) => !l.url?.startsWith("/admin/logs"));
    if (!includeAdmin) result = result.filter((l) => !l.url?.startsWith("/admin"));
    if (levelFilter) result = result.filter((l) => l.level === levelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.msg.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q));
    }
    return result;
  }, [logs, includeAdmin, levelFilter, search]);

  const levels: Level[] = ["error", "warn", "info", "debug", "fatal"];
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of levels) counts[l] = logs.filter((log) => log.level === l).length;
    return counts;
  }, [logs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-muted cursor-pointer select-none">
            <NovCheckbox unstyled checked={autoRefresh} onChange={setAutoRefresh}
              className="rounded border-edge-strong text-main focus:ring-main/30"
            />
            <RefreshCw size={13} /> Auto
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-muted cursor-pointer select-none">
            <NovCheckbox unstyled checked={includeAdmin} onChange={setIncludeAdmin}
              className="rounded border-edge-strong text-main focus:ring-main/30"
            />
            <Shield size={13} /> Admin
          </label>
          <div className="w-px h-5 bg-surface-raised mx-1" />
          <span className="flex items-center gap-1 text-xs font-medium text-ink-muted"><Filter size={13} /> Poziom:</span>
          {levels.map((l) => (
            <NovButton unstyled key={l} onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                levelFilter === l ? "ring-2 ring-main/40 " : ""
              }${levelColor(l)}`}
            >
              {levelIcon(l)}
              {l}
              <span className="opacity-60">({levelCounts[l] || 0})</span>
            </NovButton>
          ))}
          {levelFilter && (
            <NovIconButton tone="subtle" size="sm" onClick={() => setLevelFilter(null)}><X size={14} /></NovIconButton>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <NovInput unstyled type="text" placeholder="Szukaj w logach..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-edge bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-main/30"
            />
          </div>
          <NovButton variant="outline" onClick={fetchLogs}
            className="font-semibold"
          ><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Odśwież</NovButton>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-edge overflow-hidden shadow-sm">
        <div className="h-[65vh] overflow-y-auto">
          {loading && filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-ink-muted">
              <RefreshCw size={16} className="animate-spin mr-2" /> Ładowanie logów...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-ink-muted">
              <Terminal size={16} className="mr-2" /> Brak logów
              {search && <span className="italic"> dla zapytania "{search}"</span>}
            </div>
          ) : (
            filteredLogs.map((log, i) => {
              const expanded = expandedIdx === i;
              const entryUrl = log.url;
              return (
                <div key={i} className="border-b border-edge last:border-b-0">
                  <NovButton unstyled onClick={() => setExpandedIdx(expanded ? null : i)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors text-left cursor-pointer"
                  >
                    <span className="shrink-0 font-mono text-xs text-ink-subtle w-20 pt-0.5">
                      {new Date(log.time).toLocaleTimeString()}
                    </span>
                    <span className={`shrink-0 w-16 text-center rounded text-[10px] font-bold uppercase leading-5 flex items-center justify-center gap-1 border ${levelColor(log.level)}`}>
                      {levelIcon(log.level)}
                      {log.level}
                    </span>
                    <span className="flex-1 text-xs text-ink truncate min-w-0">{log.msg}</span>
                    <span className="shrink-0 text-ink-subtle pt-0.5">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                  </NovButton>
                  {expanded && (
                    <div className="px-4 pb-3 ml-[7.5rem] font-mono text-xs space-y-1.5">
                      {entryUrl && (
                        <div className="flex items-start gap-2 text-ink-muted">
                          <span className="font-semibold shrink-0">URL:</span>
                          <span className="break-all text-ink-muted">{entryUrl}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-ink-muted">
                        <span className="font-semibold shrink-0">Czas:</span>
                        <span className="text-ink-muted">{new Date(log.time).toLocaleString("pl-PL")}</span>
                      </div>
                      {log.pid && (
                        <div className="flex items-center gap-2 text-ink-muted">
                          <span className="font-semibold shrink-0">PID:</span>
                          <span className="text-ink-muted">{log.pid}</span>
                        </div>
                      )}
                      <div className="pt-1 border-t border-edge">
                        <div className="flex items-start gap-2 text-ink-muted">
                          <span className="font-semibold shrink-0">Treść:</span>
                          <span className="text-ink break-all whitespace-pre-wrap">{log.msg}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-edge px-4 py-2 text-xs text-ink-muted flex justify-between items-center bg-surface-raised">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><List size={12} /> Linie: {filteredLogs.length} / {logs.length}</span>
            {levelFilter && <span className="text-main font-semibold flex items-center gap-1"><Filter size={12} /> Filtrowane</span>}
            {search && <span className="text-main font-semibold flex items-center gap-1"><Search size={12} /> "{search}"</span>}
          </div>
          {autoRefresh && <span className="text-emerald-600 flex items-center gap-1"><RefreshCw size={12} /> Live</span>}
        </div>
      </div>
    </div>
  );
}

function ActivityGauge() {
  return <Activity size={15} className="text-main" />;
}

// ---------------------------------------------------------------------------
// Visits
// ---------------------------------------------------------------------------

function VisitsPanel() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
    if (type === "error") console.error(`[Admin Error] ${message}`);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apikey("/admin/stats/visits", { credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się pobrać statystyk odwiedzin");
      setStats(await res.json());
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const clearAll = async () => {
    if (!confirm("Czy na pewno chcesz usunąć WSZYSTKIE dane o odwiedzinach? Ta akcja jest nieodwracalna (RODO).")) return;
    try {
      const res = await apikey("/admin/visits", { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się wyczyścić danych");
      const data = await res.json();
      showNotification("success", `Usunięto ${data.deleted} odwiedzin`); fetchStats();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  if (loading && !stats) return <SkeletonCards />;
  if (!stats) {
    return (
      <div>
        {notification && <Notification n={notification} />}
        <ErrorBox message="Nie udało się pobrać statystyk odwiedzin" onRetry={fetchStats} />
      </div>
    );
  }

  const maxDay = Math.max(...stats.perDay.map((d) => d.count), 1);
  const maxCountry = Math.max(...stats.countries.map((c) => c.count), 1);
  const filteredRecent = stats.recent.filter(
    (v) => !search.trim() || v.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {notification && <Notification n={notification} />}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-ink-muted">
            Adresy IP są skracane o ostatni oktet i przechowywane wyłącznie jako hasz (SHA-256). Dane usuwane automatycznie po 90 dniach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NovButton variant="outline" onClick={fetchStats}
            className="font-semibold"
          ><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Odśwież</NovButton>
          <NovButton unstyled onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
          ><Trash2 size={14} /> Wyczyść wszystko</NovButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Odwiedziny" value={stats.total.toLocaleString("pl-PL")} sub="ostatnie 90 dni" />
        <StatCard icon={Users} label="Unikalni goście" value={stats.uniqueVisitors.toLocaleString("pl-PL")} sub="według hasha IP" />
        <StatCard icon={Globe} label="Kraje" value={stats.countries.length.toLocaleString("pl-PL")} sub="rozpoznane geolokalizacją" />
      </div>

      <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
        <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2"><ActivityGauge /> Odwiedziny na dzień (14 dni)</h3>
        <div className="flex items-end gap-1.5 h-36">
          {stats.perDay.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ${d.count}`}>
              <span className="text-[10px] font-bold text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-main/40 to-main transition-all group-hover:from-main/60 group-hover:to-main"
                style={{ height: `${Math.max((d.count / maxDay) * 100, 2)}%` }} />
              <span className="text-[9px] text-ink-subtle">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <VisitsMap countries={stats.countries} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2"><Globe size={15} className="text-main" /> Kraje</h3>
          <div className="space-y-2.5">
            {stats.countries.length === 0 && <p className="text-sm text-ink-subtle">Brak danych geolokalizacyjnych</p>}
            {stats.countries.map((c) => (
              <div key={c.code || "unknown"} className="flex items-center gap-3 text-sm">
                <span className="text-lg shrink-0">{flagEmoji(c.code)}</span>
                <span className="font-medium text-ink w-32 truncate shrink-0">{c.country || "Nieznany"}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
                  <div className="h-full rounded-full bg-main/70" style={{ width: `${(c.count / maxCountry) * 100}%` }} />
                </div>
                <span className="font-mono text-xs text-ink-muted shrink-0">{c.count.toLocaleString("pl-PL")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2"><MapPin size={15} className="text-main" /> Ostatnie odwiedziny</h3>
            <div className="relative w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <NovInput unstyled type="text" placeholder="Filtruj po ścieżce..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-edge text-xs focus:outline-none focus:ring-2 focus:ring-main/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-raised">
                <tr className="border-b border-edge">
                  <th className="text-left px-3 py-2 font-semibold text-ink-muted">Kiedy</th>
                  <th className="text-left px-3 py-2 font-semibold text-ink-muted">Lokalizacja</th>
                  <th className="text-left px-3 py-2 font-semibold text-ink-muted">Ścieżka</th>
                  <th className="text-right px-3 py-2 font-semibold text-ink-muted">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecent.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-ink-subtle">Brak danych</td></tr>
                )}
                {filteredRecent.map((v) => (
                  <tr key={v.id} className="border-b border-edge hover:bg-surface-raised transition-colors">
                    <td className="px-3 py-2 text-ink-muted whitespace-nowrap font-mono">{new Date(v.createdAt).toLocaleTimeString("pl-PL")}</td>
                    <td className="px-3 py-2 text-ink-muted whitespace-nowrap">
                      {flagEmoji(v.countryCode)} {v.country || "?"} {v.city ? `· ${v.city}` : ""}
                    </td>
                    <td className="px-3 py-2 text-ink truncate max-w-40">{v.path}</td>
                    <td className="px-3 py-2 text-right font-mono text-ink-subtle">{v.ipTruncated || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IP bans
// ---------------------------------------------------------------------------

function IpBansPanel() {
  const [bans, setBans] = useState<IpBanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [expiry, setExpiry] = useState("1440");
  const [saving, setSaving] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
    if (type === "error") console.error(`[Admin Error] ${message}`);
  };

  const fetchBans = async () => {
    setLoading(true);
    try {
      const res = await apikey("/admin/ipbans", { credentials: "include" });
      if (!res.ok) throw new Error("Nie udało się pobrać banów IP");
      setBans(await res.json());
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
    setLoading(false);
  };

  useEffect(() => { fetchBans(); }, []);

  const addBan = async () => {
    if (!ip.trim()) { showNotification("error", "Podaj adres IP"); return; }
    setSaving(true);
    try {
      const res = await apikey("/admin/ipbans", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          ip: ip.trim(),
          reason: reason.trim() || undefined,
          expiresMinutes: expiry === "0" ? undefined : Number(expiry),
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Nie udało się dodać banu"); }
      setIp(""); setReason("");
      showNotification("success", "Adres IP zablokowany"); fetchBans();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
    setSaving(false);
  };

  const removeBan = async (bannedIp: string) => {
    try {
      const res = await apikey(`/admin/ipbans/${encodeURIComponent(bannedIp)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Nie udało się usunąć banu");
      showNotification("success", `Ban IP ${bannedIp} usunięty`); fetchBans();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  const clearExpired = async () => {
    try {
      const res = await apikey("/admin/ipbans/expired", {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Nie udało się usunąć wygasłych banów");
      const data = await res.json();
      showNotification("success", `Usunięto ${data.deleted} wygasłych banów`); fetchBans();
    } catch (err: unknown) { showNotification("error", err instanceof Error ? err.message : "Błąd sieci"); }
  };

  return (
    <div className="space-y-6">
      {notification && <Notification n={notification} />}

      <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
        <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2"><Plus size={15} className="text-main" /> Dodaj ban IP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Adres IP</label>
            <NovInput unstyled className={inputCls} placeholder="np. 192.168.1.5" value={ip} onChange={(e) => setIp(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Powód</label>
            <NovInput unstyled className={inputCls} placeholder="np. próba ataku" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Czas trwania</label>
            <NovSelect unstyled className={inputCls + " bg-surface"} value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              <option value="15">15 minut</option>
              <option value="60">1 godzina</option>
              <option value="360">6 godzin</option>
              <option value="1440">24 godziny</option>
              <option value="10080">7 dni</option>
              <option value="43200">30 dni</option>
              <option value="0">Bezterminowo</option>
            </NovSelect>
          </div>
          <div className="flex items-end">
            <NovButton variant="main" fullWidth onClick={addBan} disabled={saving}
              className="font-semibold"
            >{saving ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />} Zablokuj IP</NovButton>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Shield size={15} className="text-main" /> Aktywne bany ({bans.filter((b) => b.active).length})</h3>
        <div className="flex items-center gap-2">
          <NovButton variant="outline" onClick={clearExpired}
            className="font-semibold"
          ><Trash2 size={14} /> Usuń wygasłe</NovButton>
          <NovButton variant="outline" onClick={fetchBans}
            className="font-semibold"
          ><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Odśwież</NovButton>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-raised rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface rounded-2xl border border-edge overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-surface-raised">
                  <th className="text-left px-4 py-3 font-semibold text-ink-muted">IP</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-muted">Powód</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-muted">Źródło</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-muted">Wygasa</th>
                  <th className="text-right px-4 py-3 font-semibold text-ink-muted">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {bans.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-subtle text-sm">Brak banów IP</td></tr>
                )}
                {bans.map((b) => (
                  <tr key={b.id} className={`border-b border-edge transition-colors ${b.active ? "hover:bg-surface-raised" : "bg-surface-raised/70"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${b.active ? "bg-red-500" : "bg-edge-strong"}`} title={b.active ? "Aktywny" : "Wygasły"} />
                        {b.ip}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted text-xs max-w-xs truncate">{b.reason || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        b.source === "manual" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {b.source === "manual" ? "Ręczny" : "Limit żądań"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {b.expiresAt ? (
                        <span className={`font-mono ${b.active ? "text-ink-muted" : "text-ink-subtle"}`}>
                          {new Date(b.expiresAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ) : (
                        <span className="text-ink-subtle font-semibold">Bezterminowo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <NovButton unstyled onClick={() => removeBan(b.ip)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      ><ShieldOff size={12} /> Odbanuj</NovButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}