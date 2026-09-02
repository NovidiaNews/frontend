"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Trophy, X } from "lucide-react";
import { NovButton, NovIconButton } from "@/app/components/ui";

const GRID = 20;
const CELL = 18;
const BOARD_SIZE = GRID * CELL;

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type Status = "ready" | "playing" | "paused" | "gameover";

const DIR_VECTORS: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
};

const KEY_TO_DIRECTION: Record<string, Direction> = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
};

const INITIAL_SNAKE: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
];

const HIGH_SCORE_KEY = "novidia_snake_highscore";

function randomFood(snake: Point[]): Point {
    const free: Point[] = [];
    for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
            if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
        }
    }
    return free[Math.floor(Math.random() * free.length)];
}

export default function SnakeGame({ open, onClose }: { open: boolean; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const snakeRef = useRef<Point[]>([...INITIAL_SNAKE]);
    const foodRef = useRef<Point>({ x: 15, y: 10 });
    const directionRef = useRef<Direction>("right");
    const nextDirectionRef = useRef<Direction>("right");
    const statusRef = useRef<Status>("ready");
    const scoreRef = useRef(0);
    const highScoreRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [status, setStatus] = useState<Status>("ready");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const speedFor = (s: number) => Math.max(60, 140 - s * 2);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== BOARD_SIZE * dpr || canvas.height !== BOARD_SIZE * dpr) {
            canvas.width = BOARD_SIZE * dpr;
            canvas.height = BOARD_SIZE * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Board background
        ctx.fillStyle = "#F2F0FE";
        ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        ctx.fillStyle = "#E9E6FC";
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            }
        }

        // Food - golden gem with glow
        const f = foodRef.current;
        const fx = f.x * CELL + CELL / 2;
        const fy = f.y * CELL + CELL / 2;
        ctx.save();
        ctx.shadowColor = "rgba(255,215,0,0.85)";
        ctx.shadowBlur = 9;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.moveTo(fx, fy - 7);
        ctx.lineTo(fx + 7, fy);
        ctx.lineTo(fx, fy + 7);
        ctx.lineTo(fx - 7, fy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FFF6C0";
        ctx.beginPath();
        ctx.moveTo(fx, fy - 3);
        ctx.lineTo(fx + 3, fy);
        ctx.lineTo(fx, fy + 3);
        ctx.lineTo(fx - 3, fy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Snake - gradient from light (head) to main (tail)
        const snake = snakeRef.current;
        snake.forEach((seg, i) => {
            const t = snake.length > 1 ? i / (snake.length - 1) : 0;
            const r = Math.round(167 + (54 - 167) * t);
            const g = Math.round(155 + (49 - 155) * t);
            const b = Math.round(251 + (106 - 251) * t);
            const pad = 1.5;
            const size = CELL - pad * 2;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, size, size, CELL / 3);
            ctx.fill();

            // Head details
            if (i === 0) {
                const dir = directionRef.current;
                const hx = seg.x * CELL + CELL / 2;
                const hy = seg.y * CELL + CELL / 2;
                let e1: Point = { x: hx, y: hy };
                let e2: Point = { x: hx, y: hy };
                let p1: Point = { x: hx, y: hy };
                let p2: Point = { x: hx, y: hy };
                if (dir === "right" || dir === "left") {
                    const s = dir === "right" ? 1 : -1;
                    e1 = { x: hx + s * 4, y: hy - 3.5 };
                    e2 = { x: hx + s * 4, y: hy + 3.5 };
                    p1 = { x: e1.x + s * 1.5, y: e1.y };
                    p2 = { x: e2.x + s * 1.5, y: e2.y };
                } else {
                    const s = dir === "down" ? 1 : -1;
                    e1 = { x: hx - 3.5, y: hy + s * 4 };
                    e2 = { x: hx + 3.5, y: hy + s * 4 };
                    p1 = { x: e1.x, y: e1.y + s * 1.5 };
                    p2 = { x: e2.x, y: e2.y + s * 1.5 };
                }
                ctx.fillStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.arc(e1.x, e1.y, 2.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(e2.x, e2.y, 2.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#36316A";
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p2.x, p2.y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }, []);

    const stopTimer = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const setStatusAndDraw = useCallback((next: Status) => {
        statusRef.current = next;
        setStatus(next);
    }, []);

    const gameOver = useCallback(() => {
        stopTimer();
        setStatusAndDraw("gameover");
        draw();
    }, [stopTimer, setStatusAndDraw, draw]);

    const tick = useCallback(() => {
        const dir = nextDirectionRef.current;
        const head = snakeRef.current[0];
        const vec = DIR_VECTORS[dir];
        const newHead = { x: head.x + vec.x, y: head.y + vec.y };

        if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
            gameOver();
            return;
        }
        if (snakeRef.current.some((s) => s.x === newHead.x && s.y === newHead.y)) {
            gameOver();
            return;
        }

        snakeRef.current.unshift(newHead);

        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
            scoreRef.current += 1;
            setScore(scoreRef.current);
            if (scoreRef.current > highScoreRef.current) {
                highScoreRef.current = scoreRef.current;
                setHighScore(highScoreRef.current);
                localStorage.setItem(HIGH_SCORE_KEY, String(highScoreRef.current));
            }
            foodRef.current = randomFood(snakeRef.current);
        } else {
            snakeRef.current.pop();
        }

        directionRef.current = dir;
        draw();
    }, [gameOver, draw]);

    const startTimer = useCallback(() => {
        stopTimer();
        intervalRef.current = setInterval(tick, speedFor(scoreRef.current));
    }, [stopTimer, tick]);

    const resetGame = useCallback(() => {
        stopTimer();
        snakeRef.current = INITIAL_SNAKE.map((s) => ({ ...s }));
        foodRef.current = randomFood(snakeRef.current);
        directionRef.current = "right";
        nextDirectionRef.current = "right";
        scoreRef.current = 0;
        setScore(0);
        setStatusAndDraw("ready");
        draw();
    }, [stopTimer, draw, setStatusAndDraw]);

    const startGame = useCallback(() => {
        resetGame();
        setStatusAndDraw("playing");
        startTimer();
    }, [resetGame, startTimer, setStatusAndDraw]);

    const togglePause = useCallback(() => {
        if (statusRef.current === "playing") {
            stopTimer();
            setStatusAndDraw("paused");
        } else if (statusRef.current === "paused") {
            setStatusAndDraw("playing");
            startTimer();
        }
    }, [stopTimer, startTimer, setStatusAndDraw]);

    useEffect(() => {
        if (!open) return;
        const stored = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
        highScoreRef.current = stored;
        const raf = requestAnimationFrame(() => {
            setHighScore(stored);
            resetGame();
        });
        return () => {
            cancelAnimationFrame(raf);
            stopTimer();
        };
    }, [open, resetGame, stopTimer]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                if (statusRef.current === "playing" || statusRef.current === "paused") {
                    togglePause();
                }
                return;
            }
            const nd = KEY_TO_DIRECTION[e.code];
            if (nd) {
                e.preventDefault();
                if (statusRef.current === "playing" && nd !== OPPOSITE[directionRef.current]) {
                    nextDirectionRef.current = nd;
                }
            }
            if (e.key === "Enter" && (statusRef.current === "ready" || statusRef.current === "gameover")) {
                startGame();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose, startGame, togglePause]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[170] bg-app/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 18 }}
                        transition={{ type: "spring", stiffness: 340, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-edge p-5 sm:p-6 font-montserrat select-none"
                    >
                        <style>{`
                            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                        `}</style>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-main via-medium to-light flex items-center justify-center shadow-md shadow-main/20 shrink-0">
                                    <span className="logo-novidia text-white text-base font-bold">N.</span>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-fraunces font-extrabold text-main text-lg leading-tight truncate">Wąż Novidia</h2>
                                    <p className="text-[10px] font-semibold text-ink-muted">Ukryta gra</p>
                                </div>
                            </div>
                            <NovIconButton
                                type="neutral"
                                label="Zamknij grę"
                                onClick={onClose}
                            >
                                <X size={16} />
                            </NovIconButton>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex-1 bg-surface-raised border border-edge rounded-xl px-3.5 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-ink-subtle">Wynik</p>
                                <p className="text-base text-main" style={{ fontFamily: "'Press Start 2P', monospace" }}>{score}</p>
                            </div>
                            <div className="flex-1 bg-surface-raised border border-edge rounded-xl px-3.5 py-2 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-ink-subtle flex items-center gap-1">
                                        <Trophy size={10} className="text-amber-500" />
                                        Rekord
                                    </p>
                                    <p className="text-base text-main" style={{ fontFamily: "'Press Start 2P', monospace" }}>{highScore}</p>
                                </div>
                                <NovIconButton
                                    type="soft"
                                    size="sm"
                                    onClick={togglePause}
                                    disabled={status !== "playing" && status !== "paused"}
                                    label={status === "paused" ? "Wznów grę" : "Zatrzymaj grę"}
                                >
                                    {status === "paused" ? <Play size={13} /> : <Pause size={13} />}
                                </NovIconButton>
                            </div>
                        </div>

                        {/* Board */}
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                width={360}
                                height={360}
                                className="w-full max-w-[360px] aspect-square rounded-xl border border-edge shadow-inner mx-auto"
                            />

                            {(status === "ready" || status === "paused" || status === "gameover") && (
                                <div className="absolute inset-0 rounded-xl bg-[#36316A]/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 text-center p-4">
                                    {status === "ready" && (
                                        <>
                                            <p className="text-white font-fraunces font-extrabold text-2xl">Gotowy?</p>
                                            <p className="text-white/70 text-xs font-semibold">Zbierz złote klejnoty i nie uderz w ściany</p>
                                            <NovButton type="button" variant="main" round onClick={startGame}>
                                                <Play size={15} />
                                                Graj
                                            </NovButton>
                                        </>
                                    )}
                                    {status === "paused" && (
                                        <>
                                            <p className="text-white font-fraunces font-extrabold text-2xl">Pauza</p>
                                            <NovButton type="button" variant="main" round onClick={togglePause}>
                                                <Play size={15} />
                                                Wznów
                                            </NovButton>
                                        </>
                                    )}
                                    {status === "gameover" && (
                                        <>
                                            <p className="text-white font-fraunces font-extrabold text-2xl">Koniec gry!</p>
                                            <p className="text-white/80 text-sm font-semibold">
                                                Wynik: <span className="text-amber-300 font-bold" style={{ fontFamily: "'Press Start 2P', monospace" }}>{score}</span>
                                            </p>
                                            <NovButton type="button" variant="main" round onClick={startGame}>
                                                <RotateCcw size={15} />
                                                Zagraj ponownie
                                            </NovButton>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Controls hint */}
                        <div className="mt-3 flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-ink-subtle">
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface-raised border border-edge text-ink-muted">Strzałki</kbd>
                                /
                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface-raised border border-edge text-ink-muted">WASD</kbd>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface-raised border border-edge text-ink-muted">Spacja</kbd>
                                pauza
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface-raised border border-edge text-ink-muted">Esc</kbd>
                                zamknij
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
