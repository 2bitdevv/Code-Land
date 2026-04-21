"use client";

import { useTimer } from '@/lib/hooks/useTimer';

interface GameTimerProps {
    timer: ReturnType<typeof useTimer>;
    className?: string;
}

export function GameTimer({ timer, className = '' }: GameTimerProps) {

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Timer */}
            <div className="font-mono font-bold text-2xl tracking-wider text-white bg-ocean-light/80 backdrop-blur-sm px-5 py-2.5 rounded-xl border-2 border-sky/30 shadow-lg shadow-sky/10 animate-pulse-glow flex items-center">
                <span className="text-sky-light mr-2">⏱️</span>
                {timer.formattedTime}
            </div>

            {/* Handbook button removed */}
        </div>
    );
}