"use client";

import { Activity, Atom, BookOpen, ChevronDown, ChevronRight, ChevronLeft, Cpu, Film, Home, Menu, Search, X, Loader2, LogOut, User as UserIcon, Settings, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import SnakeGame from "./SnakeGame";
import { NovButton, NovLink, NovIconButton, NovInput, NovDivider } from "@/app/components/ui";
import { useTheme } from "@/lib/useTheme";
import { useI18n } from "@/lib/i18n";
import { sanitizeSvg } from "@/lib/sanitize";
import UserBadge from "@/app/components/UserBadge";

const categoryIcons = {
    sport: Activity,
    culture: BookOpen,
    science: Atom,
    technology: Cpu,
    entertainment: Film,
} as const;

const impactColors = [
    { color: "#FFD700", stroke: "#FF4500", shadow: "#8B0000", glow: "rgba(255,215,0,0.6)" },
    { color: "#00FF41", stroke: "#006400", shadow: "#004400", glow: "rgba(0,255,65,0.5)" },
    { color: "#FF00FF", stroke: "#8B008B", shadow: "#4B0082", glow: "rgba(255,0,255,0.5)" },
    { color: "#00FFFF", stroke: "#0000CD", shadow: "#00008B", glow: "rgba(0,255,255,0.5)" },
    { color: "#FF4444", stroke: "#8B0000", shadow: "#4A0000", glow: "rgba(255,68,68,0.6)" },
    { color: "#FFA500", stroke: "#8B4513", shadow: "#5C2E00", glow: "rgba(255,165,0,0.5)" },
    { color: "#FF69B4", stroke: "#C71585", shadow: "#8B0060", glow: "rgba(255,105,180,0.5)" },
    { color: "#7FFF00", stroke: "#228B22", shadow: "#006400", glow: "rgba(127,255,0,0.5)" },
];

type CategoryIconKey = keyof typeof categoryIcons;

interface NavigationItem {
    id: string;
    title: string;
    url: string;
    icon?: CategoryIconKey;
}

interface Navigation {
    id: string;
    title: string;
    url: string;
    children?: NavigationItem[];
}

interface NavbarProps {
    navigation: Navigation[];
}

interface ImpactPopup {
    id: number;
    message: string;
    colorIndex: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
}

export default function Navbar({ navigation }: NavbarProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const router = useRouter();
    const { setTheme, resolvedTheme } = useTheme();
    const { t } = useI18n();

    const cycleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : resolvedTheme === "light" ? "system" : "dark");
    };
    
    // Auth State
    const [user, setUser] = useState<{ 
        username: string; 
        email: string; 
        profilePicture?: string;
        firstName?: string;
        lastName?: string;
        role?: number;
        isVerified?: boolean;
    } | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);

    const authDropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("novidia_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                setUser(null);
            }
        }
        setIsHydrated(true);
    }, []);

    // Close auth dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (authDropdownRef.current && !authDropdownRef.current.contains(event.target as Node)) {
                setIsAuthDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        // Listen to storage changes to keep Navbar in sync
        const handleStorageChange = () => {
            const stored = localStorage.getItem("novidia_user");
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("novidia_auth_change", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("novidia_auth_change", handleStorageChange);
        };
    }, []);

    const [popups, setPopups] = useState<ImpactPopup[]>([]);
    const [isBouncing, setIsBouncing] = useState(false);
    const [isSnakeGameOpen, setIsSnakeGameOpen] = useState(false);
    const lastClickRef = useRef(0);
    const comboCountRef = useRef(0);
    const popupIdRef = useRef(0);
    const cooldownUntilRef = useRef(0);

    const handleProfileClick = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cursorX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);

        const now = Date.now();
        let combo = 1;
        if (now < cooldownUntilRef.current) {
            comboCountRef.current = 1;
            lastClickRef.current = now;
        } else {
            if (now - lastClickRef.current < 10000) {
                combo = comboCountRef.current + 1;
                if (combo > 10) {
                    combo = 1;
                } else if (combo === 10) {
                    cooldownUntilRef.current = now + 10000;
                    setIsSnakeGameOpen(true);
                }
            }
            lastClickRef.current = now;
            comboCountRef.current = combo;
        }

        const messages = ["POW!", "BAM!", "WHAM!", "BAZINGA!", "BOOM!", "SMACK!", "OUCH!", "OOF!", "CRUNCH!", "ZAP!", "BONK!", "KABOOM!", "BLAM!"];
        const message = combo > 1 ? `${combo}x!` : messages[Math.floor(Math.random() * messages.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 60;

        const popup: ImpactPopup = {
            id: popupIdRef.current++,
            message,
            colorIndex: combo >= 3 ? 0 : Math.floor(Math.random() * impactColors.length),
            rotation: cursorX * 35 + (Math.random() - 0.5) * 20,
            offsetX: Math.cos(angle) * distance,
            offsetY: Math.sin(angle) * distance,
        };
        setPopups(prev => [...prev, popup]);
        setIsBouncing(true);
        setTimeout(() => {
            setPopups(prev => prev.filter(p => p.id !== popup.id));
        }, 1500);
        setTimeout(() => setIsBouncing(false), 600);
    };

    const handleLogout = () => {
        localStorage.removeItem("novidia_user");
        setUser(null);
        setIsAuthDropdownOpen(false);
        window.dispatchEvent(new Event("novidia_auth_change"));
        router.push("/");
    };
    
    // Search state
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    
    // Derived state for search results
    const [searchResults, setSearchResults] = useState<{title: string; url: string}[]>([]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setTimeout(() => setSearchResults([]), 0);
            return;
        }

        const timeoutId = setTimeout(() => {
            setTimeout(() => setIsSearching(true), 0);
            // Mock fetching from /search endpoint
            const results = [
                { title: `Szukaj "${searchQuery}" w postach`, url: `/search?q=${searchQuery}` },
                { title: "Sztuczna inteligencja w edukacji", url: "/categories?tag=technology" },
                { title: "Nowe zasady oceniania z matematyki", url: "/categories?tag=science" },
                { title: "Szkolne koło teatralne ogłasza casting", url: "/categories?tag=culture" },
                { title: "Wyniki zawodów sportowych", url: "/categories?tag=sport" }
            ].filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.url.includes('search'));
            setTimeout(() => {
                setSearchResults(results);
                setIsSearching(false);
            }, 0);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    function toggleDropdown(id: string) {
        setOpenDropdown((current) => (current === id ? null : id));
    }

    function toggleMobileMenu() {
        if (isSearchActive) {
            setIsSearchActive(false);
            setSearchQuery("");
        }
        setIsMobileMenuOpen(!isMobileMenuOpen);
        if (isMobileMenuOpen) {
            setActiveSubmenu(null);
        }
    }

    function toggleSearch() {
        setIsSearchActive(!isSearchActive);
        if (!isSearchActive) {
            setIsMobileMenuOpen(false);
            setActiveSubmenu(null);
        } else {
            setSearchQuery("");
        }
    }

    // Spotify-like background loading logic
    function handleMobileNav(e: React.MouseEvent<HTMLAnchorElement>, url: string) {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        
        // Prefetch the route immediately in the background
        router.prefetch(url);
        
        // Wait for the mobile menu closing animation (500ms) to finish before actually pushing
        setTimeout(() => {
            router.push(url);
        }, 500);
    }

    function handleSearchNav(e: React.MouseEvent<HTMLAnchorElement>, url: string) {
        e.preventDefault();
        setIsSearchActive(false);
        
        router.prefetch(url);
        setTimeout(() => {
            router.push(url);
        }, 300); // 300ms matches the search dropdown transition duration
    }

    const activeNavObj = navigation.find((n) => n.id === activeSubmenu);
    
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

                @keyframes avatarBounce {
                    0% { transform: scale(1) rotate(0deg); }
                    15% { transform: scale(1.3) rotate(-8deg); }
                    35% { transform: scale(0.85) rotate(5deg); }
                    55% { transform: scale(1.15) rotate(-3deg); }
                    75% { transform: scale(0.95) rotate(2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                .animate-bounce-avatar {
                    animation: avatarBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
            `}</style>
        <nav className="bg-app border-b border-edge px-4 md:px-8 py-6 z-100 relative w-full shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between gap-4 md:gap-6 relative w-full h-10">
                
                {/* LEFT: LOGO */}
                <div className="flex flex-row gap-10 items-center">
                    <div className="shrink-0 z-20">
                        <NovLink href="/" variant="plain">
                            <p className="text-xl logo-novidia text-main text-main font-bold">Novidia.</p>
                        </NovLink>
                    </div>
 
                    {/* CENTER: DESKTOP LINKS */}
                    <div className="xl:flex hidden items-center justify-center flex-1 transition-all duration-500">
                        <ul className="flex items-center gap-6 font-montserrat w-max">
                            {navigation.map((item) => (
                                <li key={item.id} className="relative">
                                    {item.children?.length ? (
                                        <>
                                            <NovButton
                                                type="button"
                                                variant="plain"
                                                onClick={() => toggleDropdown(item.id)}
                                                className="gap-2 text-sm font-medium text-ink-subtle hover:text-ink transition-colors bg-transparent border-none"
                                            >
                                                {item.title}
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${openDropdown === item.id ? "rotate-180" : ""}`}
                                                />
                                            </NovButton>
                                            {openDropdown === item.id && (
                                                <ul className="absolute right-0 z-20 gap-1 flex flex-col mt-2 w-64 overflow-hidden rounded-2xl border border-edge bg-surface p-2 shadow-lg">
                                                    {item.children.map((child) => {
                                                        const Icon = child.icon ? categoryIcons[child.icon] : null;
                                                        return (
                                                            <li key={child.id}>
                                                                <NovLink
                                                                    unstyled
                                                                    href={child.url}
                                                                    className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-ink-muted transition-colors outline-1 outline-[#7F77D7]/0 hover:bg-[#7F77D7]/15 hover:outline-1 hover:outline-[#7F77D7]/50 font-montserrat"
                                                                >
                                                                    {Icon ? <Icon className="h-4 w-4 text-ink-subtle group-hover:text-[#36316A]" /> : null}
                                                                    <span className="font-medium text-ink-subtle group-hover:text-[#36316A] transition-colors">{child.title}</span>
                                                                </NovLink>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <NovLink
                                            href={item.url}
                                            variant="subtle"
                                            className="text-sm font-medium"
                                        >
                                            {item.title}
                                        </NovLink>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* RIGHT: SEARCH, AUTH, MOBILE TOGGLE */}
                <div className={`flex items-center content-center justify-end h-full gap-4 transition-all duration-500 z-20 ${
                    isSearchActive ? "flex-1" : "flex-none"
                }`}>
                    
                    {/* EXPANDABLE SEARCH */}
                    <div className={`flex items-center justify-end transition-all duration-500 ${isSearchActive ? 'w-48 sm:w-64 xl:w-80' : 'w-10'}`}>
                        <div className={`flex items-center bg-surface rounded-full overflow-hidden transition-all duration-500 border ${
                            isSearchActive 
                                ? 'w-full px-2 md:px-4 h-10 border-edge' 
                                : 'w-10 h-10 px-0 border-transparent bg-transparent shadow-none hover:bg-surface-raised'
                        }`}>
                            {/* Icon Button */}
                            <NovIconButton
                                type="subtle"
                                size="lg"
                                label={t("nav.search")}
                                onClick={toggleSearch}
                                className="relative shrink-0"
                            >
                                <Search className={`absolute h-6 w-6 xl:h-5 xl:w-5 transition-all duration-300 ${isSearchActive ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                                <X className={`absolute h-5 w-5 transition-all duration-300 ${isSearchActive ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                            </NovIconButton>
                            {/* Input */}
                            <NovInput
                                unstyled
                                ref={searchInputRef}
                                type="text" 
                                placeholder={t("nav.searchPlaceholder")} 
                                className={`w-full h-full bg-transparent outline-none text-sm text-ink transition-all duration-500 ${
                                    isSearchActive ? 'opacity-100 ml-2 w-full' : 'opacity-0 w-0'
                                }`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* DESKTOP AUTH */}
                    <div className="xl:flex hidden items-center gap-4 transition-all duration-300">
                        <div className="w-0.5 h-4 bg-surface-raised shrink-0"></div>
                        {user ? (
                            <div className="relative flex items-center" ref={authDropdownRef}>
                                <NovButton
                                    type="button"
                                    variant="plain"
                                    size="none"
                                    onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)}
                                    className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                                >
                                    {user.profilePicture ? (
                                        user.profilePicture.startsWith("<svg") ? (
                                            <div 
                                                className="w-10 h-10 rounded-full overflow-hidden border border-edge bg-surface"
                                                dangerouslySetInnerHTML={{ __html: sanitizeSvg(user.profilePicture) }}
                                            />
                                        ) : user.profilePicture.startsWith("linear-gradient") ? (
                                            <div 
                                                className="w-10 h-10 rounded-full border border-edge"
                                                style={{ backgroundImage: user.profilePicture, backgroundSize: "cover" }}
                                            />
                                        ) : (
                                            <img
                                                src={user.profilePicture}
                                                referrerPolicy="no-referrer"
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full object-cover border border-edge"
                                            />
                                        )
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-ink-subtle">
                                            <UserIcon size={18} />
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold text-ink-muted font-montserrat">
                                        {user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName.trim().charAt(0).toUpperCase()}.` : ""}` : user.username}
                                    </span>
                                    <UserBadge role={user.role} isVerified={user.isVerified} size={14} />
                                    <ChevronDown size={16} className={`text-ink-subtle transition-transform ${isAuthDropdownOpen ? "rotate-180" : ""}`} />
                                </NovButton>
                                {isAuthDropdownOpen && (
                                    <div className="absolute right-0 top-10 mt-3 w-80 rounded-[24px] border border-edge bg-surface shadow-2xl z-50 overflow-hidden flex flex-col pointer-events-auto transition-colors duration-300">
                                        {/* Inline slow rotate animation */}
                                        <style>{`
                                            @keyframes spinSlow {
                                                from { transform: rotate(0deg); }
                                                to { transform: rotate(360deg); }
                                            }
                                            .animate-spin-slow {
                                                animation: spinSlow 40s linear infinite;
                                            }
                                        `}</style>

                                        {/* TOP BOX: Whitespace, profile image, name, username, blurred backdrop accent */}
                                        <div className="px-6 py-10 flex flex-col items-center justify-center text-center relative overflow-hidden bg-surface-raised/80 border-b border-edge">
                                            {/* Rotating blurred background accent */}
                                            <div className="absolute inset-0 z-0 overflow-hidden opacity-20 saturate-150 brightness-150 blur-2xl pointer-events-none scale-150">
                                                {user.profilePicture && !user.profilePicture.startsWith("<svg") ? (
                                                    user.profilePicture.startsWith("linear-gradient") ? (
                                                        <div 
                                                            className="w-full h-full animate-spin-slow rounded-full"
                                                            style={{ backgroundImage: user.profilePicture, backgroundSize: "cover" }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={user.profilePicture}
                                                            referrerPolicy="no-referrer"
                                                            alt=""
                                                            className="w-full h-full object-cover animate-spin-slow"
                                                        />
                                                    )
                                                ) : (
                                                    <div className="w-full h-full bg-linear-to-tr from-main via-medium to-light animate-spin-slow rounded-full" />
                                                )}
                                            </div>

                                            {/* Large Profile Avatar */}
                                            <div className="relative z-10 flex flex-col items-center">
                                                <NovButton
                                                    unstyled
                                                    type="button"
                                                    variant="plain"
                                                    onClick={handleProfileClick}
                                                    className={`w-20 h-20 rounded-full border-2 border-edge shadow-md bg-surface flex items-center justify-center overflow-hidden mb-3 cursor-pointer ${isBouncing ? "animate-bounce-avatar" : ""}`}
                                                >
                                                    {user.profilePicture ? (
                                                        user.profilePicture.startsWith("<svg") ? (
                                                            <div 
                                                                className="w-full h-full"
                                                                dangerouslySetInnerHTML={{ __html: sanitizeSvg(user.profilePicture) }}
                                                            />
                                                        ) : user.profilePicture.startsWith("linear-gradient") ? (
                                                            <div 
                                                                className="w-full h-full"
                                                                style={{ backgroundImage: user.profilePicture, backgroundSize: "cover" }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={user.profilePicture}
                                                                referrerPolicy="no-referrer"
                                                                alt={user.username}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )
                                                    ) : (
                                                        <div className="w-full h-full bg-surface-raised flex items-center justify-center text-ink-subtle">
                                                            <UserIcon size={24} />
                                                        </div>
                                                    )}
                                                </NovButton>
                                                <AnimatePresence>
                                                    {popups.map(popup => (
                                                        <motion.div
                                                            key={popup.id}
                                                            initial={{ scale: 0.5, opacity: 0, x: popup.offsetX, y: popup.offsetY, rotate: popup.rotation * 1.5 }}
                                                            animate={{ 
                                                                scale: [0.5, 1.2, 1, 0.3], 
                                                                opacity: [0, 1, 1, 0], 
                                                                x: popup.offsetX, 
                                                                y: popup.offsetY + 25, 
                                                                rotate: popup.rotation 
                                                            }}
                                                            exit={{ scale: 0.3, opacity: 0, y: popup.offsetY + 45 }}
                                                            transition={{ 
                                                                duration: 1.5, 
                                                                times: [0, 0.12, 0.35, 1],
                                                                ease: [0.25, 0.1, 0.25, 1]
                                                            }}
                                                            className="absolute inset-0 flex items-center justify-center text-lg font-black pointer-events-none z-50 select-none whitespace-nowrap"
                                                            style={{
                                                                fontFamily: "'Press Start 2P', monospace",
                                                                color: impactColors[popup.colorIndex].color,
                                                                WebkitTextStroke: `1.5px ${impactColors[popup.colorIndex].stroke}`,
                                                                textShadow: `3px 3px 0 ${impactColors[popup.colorIndex].shadow}, -1px -1px 0 ${impactColors[popup.colorIndex].stroke}, 0 0 8px ${impactColors[popup.colorIndex].glow}`,
                                                            }}
                                                        >
                                                            {popup.message}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>

                                            {/* Name & Email */}
                                            <h4 className="font-extrabold text-2xl text-ink tracking-tight font-fraunces relative z-0 flex items-center gap-1.5">
                                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.username}
                                                <UserBadge role={user.role} isVerified={user.isVerified} size={18} />
                                            </h4>
                                            <p className="text-xs font-semibold text-ink-subtle font-montserrat mt-0.5 relative z-0">
                                                {user.email}
                                            </p>
                                        </div>

                                        {/* DROPDOWN MENU ITEMS */}
                                        <div className="p-2.5 flex flex-col gap-0.5 bg-surface">
                                            {/* Profile */}
                                            <NovLink
                                                unstyled
                                                href="profile"
                                                onClick={() => setIsAuthDropdownOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors text-left font-montserrat"
                                            >
                                                <UserIcon size={18} className="text-ink-subtle" />
                                                <span>{t("nav.yourProfile")}</span>
                                            </NovLink>

                                            {/* Settings */}
                                            <NovLink
                                                unstyled
                                                href="?settings=true"
                                                onClick={() => setIsAuthDropdownOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors text-left font-montserrat"
                                            >
                                                <Settings size={18} className="text-ink-subtle" />
                                                <span>{t("nav.settings")}</span>
                                            </NovLink>

                                            {/* Dashboard */}
                                            <NovLink
                                                unstyled
                                                href="https://dashboard.novidia.eu/"
                                                onClick={() => setIsAuthDropdownOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors text-left font-montserrat"
                                            >
                                                <LayoutDashboard size={18} className="text-ink-subtle" />
                                                <span>{t("nav.adminPanel")}</span>
                                            </NovLink>



                                            {/* Divider */}
                                            <NovDivider className="my-1 mx-2" />

                                            {/* Logout */}
                                            <NovButton
                                                unstyled
                                                type="button"
                                                variant="plain"
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors text-left font-montserrat"
                                            >
                                                <LogOut size={18} className="" />
                                                <span>{t("nav.logout")}</span>
                                            </NovButton>

                                            {/* Divider */}
                                            <NovDivider className="my-1 mx-2" />

                                            {/* Privacy Policy & Terms of Service side by side */}
                                            <div className="flex items-center justify-center gap-3 py-1.5 px-4 text-[10px] font-semibold text-ink-subtle font-montserrat">
                                                <NovLink
                                                    unstyled
                                                    href="/privacy-policy"
                                                    onClick={() => setIsAuthDropdownOpen(false)}
                                                    className="hover:text-ink-muted transition-colors text-nowrap"
                                                >
                                                    {t("nav.privacy")}
                                                </NovLink>
                                                <span className="w-1 h-1 rounded-full bg-surface-raised" />
                                                <NovLink
                                                    unstyled
                                                    href="/tos"
                                                    onClick={() => setIsAuthDropdownOpen(false)}
                                                    className="hover:text-ink-muted transition-colors text-nowrap"
                                                >
                                                    {t("nav.tos")}
                                                </NovLink>
                                                <span className="w-1 h-1 rounded-full bg-surface-raised" />
                                                <NovIconButton
                                                    type="subtle"
                                                    size="sm"
                                                    label={resolvedTheme === "dark" ? t("nav.themeLight") : t("nav.themeDark")}
                                                    onClick={cycleTheme}
                                                    className="shrink-0"
                                                >
                                                    {resolvedTheme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                                                </NovIconButton>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <NovLink href="/register" variant="main" round className="shrink-0">
                                    <span className="text-nowrap font-montserrat font-medium">{t("nav.register")}</span>
                                </NovLink>
                                <NovLink href="/login" variant="secondary" round className="shrink-0">
                                    <span className="text-nowrap font-montserrat font-medium">{t("nav.login")}</span>
                                </NovLink>
                            </>
                        )}
                    </div>

                    {/* MOBILE BURGER */}
                    <div className="xl:hidden flex transition-all duration-500">
                        <NovIconButton
                            type="subtle"
                            size="lg"
                            label="Menu"
                            onClick={toggleMobileMenu}
                            className="relative"
                        >
                            <Menu className={`absolute h-7 w-7 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                            <X className={`absolute h-7 w-7 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                        </NovIconButton>
                    </div>
                </div>
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            <div className={`absolute top-22 left-0 w-full px-4 md:px-8 z-50 flex justify-end transition-all duration-300 origin-top ${
                isSearchActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}>
                <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl border border-edge p-2 md:p-4 overflow-hidden">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-8 text-ink-subtle">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-sm">{t("nav.searchSearching")}</span>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <ul className="space-y-1 md:space-y-2">
                            {searchResults.map((result, idx) => (
                                <li key={idx}>
                                    <NovLink unstyled onClick={(e) => handleSearchNav(e, result.url)} href={result.url} className="block px-4 py-3 rounded-xl hover:bg-superwhite transition-colors text-sm text-ink font-montserrat">
                                        {t("nav.searchResults", { query: searchQuery })}
                                    </NovLink>
                                </li>
                            ))}
                        </ul>
                    ) : searchQuery.length > 0 ? (
                        <div className="py-8 text-center text-sm text-ink-subtle">
                            {t("nav.searchNoResults")} &quot;{searchQuery}&quot;
                        </div>
                    ) : (
                        <div className="py-6 text-center text-sm text-ink-subtle">
                            {t("nav.searchHint")}
                        </div>
                    )}
                </div>
            </div>

        </nav>

        {/* MOBILE MENU FULLSCREEN OVERLAY */}
        <div
            className={`xl:hidden fixed top-22 left-0 w-full z-40 transition-all duration-500 ease-in-out border-edge overflow-hidden ${
                isMobileMenuOpen ? "h-[80vh] opacity-100 shadow-2xl border-t bg-app/90 backdrop-blur-xl" : "h-0 opacity-0 border-t-0 bg-transparent backdrop-blur-none"
            }`}
        >
            <div className="relative w-full h-full overflow-hidden p-6 md:px-8">
                    
                    {/* MAIN MENU VIEW */}
                    <div 
                        className={`absolute inset-0 w-full h-full p-6 md:px-8 flex flex-col gap-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            activeSubmenu ? "-translate-x-full" : "translate-x-0"
                        }`}
                    >
                        {navigation.map((item, index) => (
                            <div 
                                key={item.id} 
                                className={`transition-all duration-500 transform ${
                                    isMobileMenuOpen && !activeSubmenu 
                                        ? "translate-y-0 opacity-100" 
                                        : "translate-y-8 opacity-0"
                                }`}
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                {item.children?.length ? (
                                    <NovButton
                                        unstyled
                                        type="button"
                                        variant="plain"
                                        onClick={() => setActiveSubmenu(item.id)}
                                        className="flex items-center justify-between w-full text-left text-xl font-montserrat font-semibold text-ink-muted hover:text-main transition-colors group"
                                    >
                                        <span>{item.title}</span>
                                        <ChevronRight className="h-6 w-6 text-ink-subtle group-hover:text-main transition-colors" />
                                    </NovButton>
                                ) : (
                                    <NovLink
                                        unstyled
                                        href={item.url}
                                        onClick={(e) => handleMobileNav(e, item.url)}
                                        className="block w-full text-xl font-montserrat font-semibold text-ink-muted hover:text-main transition-colors"
                                    >
                                        {item.title}
                                    </NovLink>
                                )}
                            </div>
                        ))}
                        
                        {/* Mobile Auth Buttons */}
                        <div className={`mt-auto pt-8 flex flex-col gap-4 border-t border-edge transition-all duration-500 transform ${
                             isMobileMenuOpen && !activeSubmenu ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`} style={{ transitionDelay: `${navigation.length * 50}ms` }}>
                            {user ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 p-3 bg-surface-raised rounded-2xl border border-edge transition-colors">
                                        {user.profilePicture ? (
                                            user.profilePicture.startsWith("<svg") ? (
                                                <div 
                                                    className="w-12 h-12 rounded-full overflow-hidden border border-edge bg-surface"
                                                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(user.profilePicture) }}
                                                />
                                            ) : user.profilePicture.startsWith("linear-gradient") ? (
                                                <div 
                                                    className="w-12 h-12 rounded-full border border-edge"
                                                    style={{ backgroundImage: user.profilePicture, backgroundSize: "cover" }}
                                                />
                                            ) : (
                                                <img
                                                    src={user.profilePicture}
                                                    referrerPolicy="no-referrer"
                                                    alt={user.username}
                                                    className="w-12 h-12 rounded-full object-cover border border-edge"
                                                />
                                            )
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-ink-subtle">
                                                <UserIcon size={22} />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-ink font-montserrat flex items-center gap-1.5">
                                                {user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName.trim().charAt(0).toUpperCase()}.` : ""}` : user.username}
                                                <UserBadge role={user.role} isVerified={user.isVerified} size={14} />
                                            </span>
                                            <span className="text-xs text-ink-subtle font-montserrat">{user.email}</span>
                                        </div>
                                    </div>
                                    <NovLink
                                        unstyled
                                        href="profile"
                                        onClick={(e) => handleMobileNav(e, "profile")}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-edge hover:bg-surface-raised transition-colors"
                                    >
                                        <UserIcon size={18} className="text-ink-subtle" />
                                        <span className="text-sm font-semibold text-ink font-montserrat">{t("nav.yourProfile")}</span>
                                    </NovLink>
                                    <NovLink
                                        unstyled
                                        href="?settings=true"
                                        onClick={(e) => { setIsMobileMenuOpen(false); setActiveSubmenu(null); }}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-edge hover:bg-surface-raised transition-colors"
                                    >
                                        <Settings size={18} className="text-ink-subtle" />
                                        <span className="text-sm font-semibold text-ink font-montserrat">{t("nav.settings")}</span>
                                    </NovLink>
                                </div>
                            ) : (
                                <>
                                    <NovLink
                                        unstyled
                                        href="/register"
                                        onClick={(e) => handleMobileNav(e, "/register")}
                                        className="w-full text-center rounded-full bg-main py-4 text-lg text-white font-montserrat font-medium transition-all hover:brightness-110"
                                    >
                                        {t("nav.register")}
                                    </NovLink>
                                    <NovLink
                                        unstyled
                                        href="/login"
                                        onClick={(e) => handleMobileNav(e, "/login")}
                                        className="w-full text-center rounded-full bg-surface-raised py-4 text-lg text-ink font-montserrat font-medium hover:bg-superwhite transition-colors"
                                    >
                                        {t("nav.login")}
                                    </NovLink>
                                </>
                            )}
                        </div>
                    </div>

                    {/* SUBMENU VIEW */}
                    <div 
                        className={`absolute inset-0 w-full h-full p-6 md:px-8 flex flex-col transition-transform duration-500 overflow-scroll ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            activeSubmenu ? "translate-x-0" : "translate-x-full"
                        }`}
                    >
                        {activeSubmenu && (
                            <>
                                <NovButton
                                    unstyled
                                    type="button"
                                    variant="plain"
                                    onClick={() => setActiveSubmenu(null)}
                                    className="flex items-center gap-2 text-ink-subtle hover:text-ink transition-colors mb-8 group"
                                >
                                    <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-montserrat font-medium">{t("nav.back")}</span>
                                </NovButton>
                                <h3 className="text-3xl font-montserrat font-bold text-ink mb-6">
                                    {activeNavObj?.title}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {activeNavObj?.children?.map((child, index) => {
                                        const Icon = child.icon ? categoryIcons[child.icon] : null;
                                        return (
                                            <NovLink
                                                unstyled
                                                key={child.id}
                                                href={child.url}
                                                onClick={(e) => handleMobileNav(e, child.url)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl bg-surface border border-edge shadow-sm hover:shadow-md hover:border-edge transition-all duration-300 transform font-montserrat ${
                                                    activeSubmenu 
                                                        ? "translate-y-0 opacity-100" 
                                                        : "translate-y-8 opacity-0"
                                                }`}
                                                style={{ transitionDelay: `${index * 50 + 200}ms` }}
                                            >
                                                {Icon && (
                                                    <div className="bg-surface p-3 rounded-xl">
                                                        <Icon className="h-6 w-6 text-main" />
                                                    </div>
                                                )}
                                                <span className="text-xl font-montserrat font-medium text-ink">
                                                    {child.title}
                                                </span>
                                            </NovLink>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

        <SnakeGame open={isSnakeGameOpen} onClose={() => setIsSnakeGameOpen(false)} />
        </>
    );
}