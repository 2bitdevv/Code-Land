'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

function readStoredSeconds(storageKey: string | undefined, fallback: number): number {
    if (typeof window === 'undefined' || !storageKey) return fallback;
    try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved !== null) {
            const val = Number(saved);
            if (Number.isFinite(val) && val >= 0) return val;
        }
    } catch {
        // localStorage may be blocked
    }
    return fallback;
}

export function useTimer(initialSeconds: number = 0, storageKey?: string) {
    const [seconds, setSeconds] = useState<number>(() =>
        readStoredSeconds(storageKey, initialSeconds),
    );
    const [isActive, setIsActive] = useState<boolean>(false);
    const storageKeyRef = useRef<string | undefined>(storageKey);

    // Keep ref in sync (only inside effect, never during render)
    useEffect(() => {
        storageKeyRef.current = storageKey;
    }, [storageKey]);

    // Persist to localStorage whenever seconds change
    useEffect(() => {
        const key = storageKeyRef.current;
        if (typeof window !== 'undefined' && key && seconds > 0) {
            window.localStorage.setItem(key, seconds.toString());
        }
    }, [seconds]);

    const toggle = useCallback(() => setIsActive(a => !a), []);

    const reset = useCallback(() => {
        setSeconds(initialSeconds);
        setIsActive(false);
        const key = storageKeyRef.current;
        if (typeof window !== 'undefined' && key) {
            window.localStorage.removeItem(key);
        }
    }, [initialSeconds]);

    const start = useCallback(() => setIsActive(true), []);
    const stop = useCallback(() => setIsActive(false), []);

    // Tick interval
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive]);

    const formattedTime = `${Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return { seconds, setSeconds, isActive, toggle, reset, start, stop, formattedTime };
}
