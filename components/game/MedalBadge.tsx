import { Medal } from '@/lib/types';

interface MedalBadgeProps {
    medal: Medal;
    size?: 'sm' | 'md' | 'lg';
}

export function MedalBadge({ medal, size = 'md' }: MedalBadgeProps) {
    const emojis = {
        gold: '🥇',
        silver: '🥈',
        bronze: '🥉'
    };

    const colors = {
        gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-yellow-500/20',
        silver: 'bg-gray-400/20 text-gray-200 border-gray-400/40 shadow-gray-400/20',
        bronze: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-orange-500/20'
    };

    const sizes = {
        sm: 'text-xs px-2.5 py-1 gap-1',
        md: 'text-sm px-3.5 py-1.5 gap-1.5',
        lg: 'text-base px-5 py-2.5 gap-2 font-bold'
    };

    return (
        <span className={`inline-flex items-center rounded-full border uppercase tracking-wider font-[var(--font-display)] font-bold shadow-lg ${colors[medal]} ${sizes[size]}`}>
            <span>{emojis[medal]}</span>
            {medal}
        </span>
    );
}
