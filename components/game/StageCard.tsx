import { Medal } from '@/lib/types';
import { MedalBadge } from './MedalBadge';

interface StageCardProps {
    id: number;
    title: string;
    description: string;
    bestTime?: number;
    bestMedal?: Medal | null;
    isActive?: boolean;
    onClick: () => void;
}

const SPORT_MAP: Record<number, { emoji: string; color: string; }> = {
    1: { emoji: '🏊', color: 'sky' },
    2: { emoji: '⚽', color: 'sky' },
    3: { emoji: '🏃‍♂️', color: 'sunny' },
    4: { emoji: '🥊', color: 'sunny' },
    5: { emoji: '🔫', color: 'coral' },
    6: { emoji: '🏀', color: 'coral' },
};

export function StageCard({
    id,
    title,
    description,
    bestTime,
    bestMedal,
    isActive = false,
    onClick
}: StageCardProps) {
    const sport = SPORT_MAP[id] || { emoji: '🎯', color: 'sky' };

    return (
        <div
            onClick={onClick}
            className={`
                game-card relative rounded-2xl border-2 p-6 cursor-pointer overflow-hidden
                ${isActive
                    ? `border-${sport.color}/50 bg-${sport.color}/10 shadow-lg shadow-${sport.color}/20`
                    : 'border-white/10 bg-white/[0.05] hover:border-white/20'
                }
            `}
        >
            <div className="absolute top-4 right-4">
                {bestMedal && <MedalBadge medal={bestMedal} />}
            </div>

            <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">{sport.emoji}</div>
                <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-[var(--font-display)] font-bold text-sm
                    ${isActive ? `bg-${sport.color}/30 text-white` : 'bg-white/10 text-white/50'}
                `}>
                    {id}
                </div>
                <h3 className="text-xl font-[var(--font-display)] font-bold text-white">{title}</h3>
            </div>

            <p className="text-sm text-white/50 mb-4">{description}</p>

            {bestTime !== undefined && (
                <div className="text-sm font-mono font-bold text-sky-light flex items-center gap-2">
                    <span>⏱️</span> Best: {bestTime}s
                </div>
            )}

            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 animate-shimmer rounded-2xl pointer-events-none"></div>
        </div>
    );
}
