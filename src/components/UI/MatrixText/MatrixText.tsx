import { useEffect, useRef, useState } from "react";
import styles from "./MatrixText.module.scss";

/** ASCII-only pool — CJK / block glyphs change metrics and cause layout shake. */
const MATRIX_CHARS = "0123456789ABCDEF#@$%&*+=?!";

function prefersReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPlaceholder(text: string) {
    return !text || text === "..." || text === "—";
}

function isStaticChar(ch: string) {
    return (
        ch === " " ||
        ch === "," ||
        ch === "." ||
        ch === "/" ||
        ch === ":" ||
        ch === "%" ||
        ch === "…" ||
        ch === "·" ||
        ch === "-"
    );
}

function scrambleText(text: string) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const ch = text.charAt(i);
        out += isStaticChar(ch) ? ch : MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
    }
    return out || "—";
}

function MatrixText({
    value,
    className,
    duration,
    staggerMs = 0,
    revealOnView = false,
    as: Tag = "span",
}: {
    value: string;
    className?: string;
    duration?: number;
    staggerMs?: number;
    /** Animate when first entering the viewport (once); StatsPanel stays mount-based. */
    revealOnView?: boolean;
    as?: "span" | "p" | "strong" | "b" | "h4";
}) {
    const text = value == null ? "" : String(value);
    const [display, setDisplay] = useState(() => (isPlaceholder(text) ? text || "—" : text));
    const [decoding, setDecoding] = useState(false);
    const [inView, setInView] = useState(!revealOnView);
    const elRef = useRef<HTMLElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const runIdRef = useRef(0);
    const lastAnimatedRef = useRef<string | null>(null);
    const viewedRef = useRef(!revealOnView);

    useEffect(() => {
        if (!revealOnView) {
            setInView(true);
            viewedRef.current = true;
            return;
        }

        const el = elRef.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true);
            viewedRef.current = true;
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting) return;
                viewedRef.current = true;
                setInView(true);
                observer.unobserve(el);
                observer.disconnect();
            },
            { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [revealOnView]);

    useEffect(() => {
        const stopTimers = () => {
            if (timerRef.current != null) clearTimeout(timerRef.current);
            if (tickTimerRef.current != null) clearTimeout(tickTimerRef.current);
            timerRef.current = null;
            tickTimerRef.current = null;
        };

        if (revealOnView && !inView) {
            setDisplay(isPlaceholder(text) ? text || "—" : text);
            setDecoding(false);
            return;
        }

        // Skip re-animates of the same visual string (websocket / scroll bounce).
        if (lastAnimatedRef.current === text && !isPlaceholder(text)) {
            setDisplay(text);
            setDecoding(false);
            return;
        }

        runIdRef.current += 1;
        const runId = runIdRef.current;
        stopTimers();

        if (isPlaceholder(text)) {
            setDisplay(text || "—");
            setDecoding(false);
            lastAnimatedRef.current = text || "—";
            return;
        }

        if (prefersReducedMotion()) {
            setDisplay(text);
            setDecoding(false);
            lastAnimatedRef.current = text;
            return;
        }

        const TICK_MS = 42;
        const total = duration ?? 1100 + Math.floor(Math.random() * 400);
        const len = text.length;

        const start = () => {
            if (runId !== runIdRef.current) return;
            const started = performance.now();
            setDecoding(true);
            setDisplay(scrambleText(text));

            const tick = () => {
                if (runId !== runIdRef.current) return;
                const now = performance.now();
                const t = Math.min(1, (now - started) / total);
                const eased = 1 - Math.pow(1 - t, 2.2);
                const reveal = Math.floor(eased * len);
                let out = "";
                for (let i = 0; i < len; i++) {
                    const ch = text.charAt(i);
                    if (isStaticChar(ch) || i < reveal) out += ch;
                    else out += MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
                }
                setDisplay(out);
                if (t < 1) {
                    tickTimerRef.current = setTimeout(tick, TICK_MS);
                } else {
                    setDisplay(text);
                    setDecoding(false);
                    lastAnimatedRef.current = text;
                    tickTimerRef.current = null;
                }
            };

            tickTimerRef.current = setTimeout(tick, TICK_MS);
        };

        setDisplay(scrambleText(text));
        setDecoding(true);
        timerRef.current = setTimeout(start, Math.max(0, staggerMs));

        return () => {
            runIdRef.current += 1;
            stopTimers();
        };
    }, [text, duration, staggerMs, revealOnView, inView]);

    const widthCh = Math.max(isPlaceholder(text) ? 1 : text.length, 1);

    return (
        <Tag
            ref={elRef as never}
            className={`${styles.matrix}${decoding ? ` ${styles.decoding}` : ""}${className ? ` ${className}` : ""}`}
            aria-label={text || undefined}
            style={{ minWidth: `${widthCh}ch` }}
        >
            {display}
        </Tag>
    );
}

export default MatrixText;
