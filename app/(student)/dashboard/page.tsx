'use client';

import { useAuth } from '@/lib/hooks/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { PlayerHandbook } from '@/components/dashboard/PlayerHandbook';

/* ──────────────────────────────────────────────
   Category → Stages mapping
   ────────────────────────────────────────────── */
interface Stage {
    id: number;
    title: string;
    sport: string;
    sportName: string;
    difficulty: 'Basic' | 'Easy' | 'Medium' | 'Hard';
    displayStage?: string;
}

interface Category {
    key: string;
    label: string;
    icon: React.ReactNode;
    color: string;        // tailwind token name
    colorHex: string;     // hex for inline styles
    borderHex: string;    // lighter hex for border glow
    stages: Stage[];
}

const CATEGORIES: Category[] = [
    {
        key: 'html',
        label: 'HTML',
        icon: <i className="fa-solid fa-globe"></i>,
        color: 'sky',
        colorHex: '#2196F3',
        borderHex: '#64B5F6',
        stages: [
            { id: 1, title: 'HTML Structure', sport: '🏊', sportName: 'Swimming', difficulty: 'Basic', displayStage: '1-1' },
            { id: 2, title: 'HTML Input', sport: '⚽', sportName: 'Football', difficulty: 'Basic', displayStage: '1-2' },
        ],
    },
    {
        key: 'css',
        label: 'CSS',
        icon: <i className="fa-solid fa-palette"></i>,
        color: 'sunny',
        colorHex: '#FFD600',
        borderHex: '#FFF176',
        stages: [
            { id: 3, title: 'CSS Styling', sport: '🏃‍♂️', sportName: 'Hurdles', difficulty: 'Medium', displayStage: '2-1' },
            { id: 4, title: 'Css FlexBox', sport: '🥊', sportName: 'Boxing', difficulty: 'Medium', displayStage: '2-2' },
        ],
    },
    {
        key: 'js',
        label: 'JavaScript',
        icon: <i className="fa-brands fa-js"></i>,
        color: 'coral',
        colorHex: '#FF7043',
        borderHex: '#FF8A65',
        stages: [
            { id: 5, title: 'JS Tutorial', sport: '🔫', sportName: 'Shooting Duel', difficulty: 'Hard', displayStage: '3-1' },
            { id: 6, title: 'LOGIC QUEST', sport: '🤖', sportName: 'LOGIC challenge', difficulty: 'Hard', displayStage: '3-2' },
        ],
    },
    // --- Python Category ---
    {
        key: 'python',
        label: 'Python',
        icon: <i className="fa-brands fa-python"></i>,
        color: 'sky',
        colorHex: '#42A5F5',
        borderHex: '#90CAF9',
        stages: [
            { id: 101, title: 'Python Variables', sport: '🏐', sportName: 'Volleyball', difficulty: 'Easy', displayStage: '4-1' },
            { id: 102, title: 'Python Functions ', sport: '🏋️‍♀️', sportName: 'Weightlifting', difficulty: 'Easy', displayStage: '4-2' },

        ],
    },
];

/* flat list for progress bar */
const ALL_STAGES = CATEGORIES.flatMap(c => c.stages);
const KNOWN_STAGE_IDS = new Set(ALL_STAGES.map((stage) => stage.id));
const GLOBAL_SCORES_UPDATE_KEY = 'global_scores:lastUpdate';
const GLOBAL_SCORES_LOCAL_CACHE_KEY = 'global_scores:localCache';
const GLOBAL_COMPLETED_STAGE_IDS_KEY = 'global_scores:completedStageIds';

type LocalCachedStageResult = {
    stage_id: number;
};

function getLocallyCompletedStageIds(userId: string): number[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(GLOBAL_SCORES_LOCAL_CACHE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw) as Record<string, LocalCachedStageResult[]>;
        const userEntries = Array.isArray(parsed?.[userId]) ? parsed[userId] : [];

        return userEntries
            .map((entry) => entry?.stage_id)
            .filter((stageId): stageId is number => typeof stageId === 'number' && KNOWN_STAGE_IDS.has(stageId));
    } catch {
        return [];
    }
}

/** ด่านที่บันทึกในเครื่อง — แยกตาม userId กันคนละบัญชีสมัครใหม่ไม่ไปดึงรายการของคนเก่า */
function getUserCompletedStageIdsFromLocal(userId: string): number[] {
    if (typeof window === 'undefined' || !userId) return [];

    try {
        const raw = window.localStorage.getItem(`${GLOBAL_COMPLETED_STAGE_IDS_KEY}:${userId}`);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((stageId): stageId is number => typeof stageId === 'number' && KNOWN_STAGE_IDS.has(stageId))
            : [];
    } catch {
        return [];
    }
}

export default function DashboardPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [completedStageIds, setCompletedStageIds] = useState<Set<number>>(() => new Set());
    const [progressError, setProgressError] = useState<string | null>(null);
    const visibleCompletedStageIds = user ? completedStageIds : new Set<number>();

    useEffect(() => {
        if (!loading && profile && profile.role === 'teacher') {
            router.replace('/teacher');
        }
    }, [loading, profile, router]);

    useEffect(() => {
        if (!user || (profile && profile.role === 'teacher')) return;

        const userId = user.id;
        const supabase = createClient();
        async function fetchProgress(source: 'initial' | 'realtime' | 'broadcast' | 'storage' = 'initial') {
            const localStageIds = getLocallyCompletedStageIds(userId);
            const { data, error } = await supabase
                .from('global_scores')
                .select('stage_id')
                .eq('user_id', userId)
                .limit(1000);

            const databaseStageIds = (data || [])
                .map((r: { stage_id: number }) => r.stage_id)
                .filter((stageId: number) => KNOWN_STAGE_IDS.has(stageId));
            const fallbackStageIds = getUserCompletedStageIdsFromLocal(userId);
            const uniqueStageIds = new Set<number>([...databaseStageIds, ...localStageIds, ...fallbackStageIds]);

            if (error && uniqueStageIds.size === 0) {
                console.warn('[Dashboard] progress fetch error:', error);
                setProgressError(error.message);
                setCompletedStageIds(new Set<number>());
                return;
            }

            if (error) {
                console.warn('[Dashboard] progress fetch error (using local fallback):', error);
                setProgressError(error.message);
            } else {
                setProgressError(null);
            }

            console.log('[Dashboard] progress updated from', source, 'with', uniqueStageIds.size, 'distinct stages');
            setCompletedStageIds(uniqueStageIds);
        }

        void fetchProgress('initial');

        const channel = supabase
            .channel(`dashboard_progress_${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'global_scores', filter: `user_id=eq.${userId}` },
                async () => {
                    await fetchProgress('realtime');
                }
            )
            .subscribe();

        const handleGlobalScoresUpdated = () => {
            void fetchProgress('broadcast');
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== GLOBAL_SCORES_UPDATE_KEY) return;
            void fetchProgress('storage');
        };

        window.addEventListener('global_scores_updated', handleGlobalScoresUpdated);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('global_scores_updated', handleGlobalScoresUpdated);
            window.removeEventListener('storage', handleStorage);
            supabase.removeChannel(channel);
        };
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-float-slow mb-4">🏊</div>
                    <p className="text-white/50 font-[var(--font-display)] text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    const toggleCat = (key: string) => {
        setExpandedCat(prev => (prev === key ? null : key));
    };

    return (
        <div className="min-h-screen bg-[#0a1628]">
            {/* ── Header ── */}
            <div className="hero-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <span className="absolute top-[20%] right-[5%] text-4xl animate-float opacity-30"><i className="fa-solid fa-medal text-orange-400"></i></span>
                    <span className="absolute bottom-[10%] left-[8%] text-3xl animate-float-delay-1 opacity-20"><i className="fa-solid fa-star text-yellow-400"></i></span>
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl font-[var(--font-display)] font-bold text-white mb-2">
                        Welcome back, <span className="gradient-text">{profile?.username}</span>! 👋
                    </h1>
                    <p className="text-white/60 text-lg">Choose your challenge and start racing!</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* ── Progress Bar ── */}
                <div className="mb-10">
                    {progressError && (
                        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                            <p className="text-red-300 font-semibold text-sm">Could not load your stage progress.</p>
                            <p className="text-white/50 text-xs font-mono mt-1 break-all">{progressError}</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-white/60 font-semibold text-sm">Stage Progress</span>
                        <span className="text-sunny font-bold text-sm">{visibleCompletedStageIds.size} / {ALL_STAGES.length} completed</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-sky via-sunny to-coral rounded-full transition-all duration-500" style={{ width: `${ALL_STAGES.length > 0 ? (visibleCompletedStageIds.size / ALL_STAGES.length) * 100 : 0}%` }}></div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
                        {ALL_STAGES.map(s => (
                            <div key={s.id} className="min-w-0 flex flex-col items-center gap-0.5">
                                <span className={`text-lg sm:text-xl transition-all duration-300 ${visibleCompletedStageIds.has(s.id) ? 'opacity-100 scale-110' : 'opacity-35 grayscale'}`}>{s.sport}</span>
                                {visibleCompletedStageIds.has(s.id) && (
                                    <div className="text-[9px] sm:text-[10px] leading-tight text-green-400 font-bold">DONE</div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* สมุดคู่มือ — จัดใต้คอลัมน์สุดท้าย (🏋️‍♀️) */}
                    <div className="mt-5 sm:mt-6 grid grid-cols-4 sm:grid-cols-8 gap-2">
                        <div className="col-span-3 sm:col-span-7" aria-hidden />
                        <div className="col-span-1 flex justify-center">
                            <PlayerHandbook />
                        </div>
                    </div>
                </div>

                {/* ── Category Selection ── */}
                <h2 className="text-2xl font-[var(--font-display)] font-bold text-white mb-6"><i className="fa-solid fa-bullseye mr-2"></i> Select a Category</h2>

                <div className="flex flex-col gap-4 mb-12">
                    {CATEGORIES.map((cat) => {
                        const isOpen = expandedCat === cat.key;

                        return (
                            <div key={cat.key} className="animate-slide-up" style={{ animationDelay: '0s' }}>
                                {/* ── Category Bar ── */}
                                <button
                                    onClick={() => toggleCat(cat.key)}
                                    className="category-bar w-full flex items-center justify-between rounded-2xl px-6 py-5 sm:py-6 text-left transition-all duration-300 cursor-pointer group"
                                    style={{
                                        background: isOpen
                                            ? `linear-gradient(135deg, ${cat.colorHex}22 0%, ${cat.colorHex}11 100%)`
                                            : 'rgba(255,255,255,0.06)',
                                        border: `2px solid ${isOpen ? cat.borderHex + '55' : 'rgba(255,255,255,0.08)'}`,
                                        boxShadow: isOpen ? `0 0 24px ${cat.colorHex}18` : 'none',
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                                        <span className="text-2xl sm:text-3xl font-[var(--font-display)] font-bold text-white tracking-wide">
                                            {cat.label}
                                        </span>
                                        {cat.stages.length === 0 && (
                                            <span className="ml-2 text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white/40">
                                                Coming Soon
                                            </span>
                                        )}
                                        {cat.stages.length > 0 && (
                                            <span className="ml-2 text-xs font-bold px-3 py-1 rounded-full"
                                                style={{ backgroundColor: cat.colorHex + '25', color: cat.borderHex }}>
                                                {cat.stages.length} Stages
                                            </span>
                                        )}
                                    </div>

                                    {/* Chevron */}
                                    <svg
                                        className={`w-6 h-6 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* ── Expanded Stage Cards ── */}
                                <div
                                    className="overflow-hidden transition-all duration-400 ease-in-out"
                                    style={{
                                        maxHeight: isOpen ? '600px' : '0px',
                                        opacity: isOpen ? 1 : 0,
                                    }}
                                >
                                    {cat.stages.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 pt-4 pb-2 px-1">
                                            {cat.stages.map((stage, idx) => (
                                                <button
                                                    key={stage.id}
                                                    type="button"
                                                    onClick={() => { window.location.assign(`/game/${cat.key}/${stage.id}`); }}
                                                    className="block w-full text-left"
                                                >
                                                    <div
                                                        className="game-card glass-card rounded-2xl p-6 cursor-pointer group relative overflow-hidden w-full"
                                                        style={{ animationDelay: `${idx * 0.08}s` }}
                                                    >
                                                        {/* Sport icon + difficulty */}
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className="text-5xl group-hover:animate-wave">{stage.sport}</span>
                                                            <div className="flex items-center gap-2">
                                                                {visibleCompletedStageIds.has(stage.id) && (
                                                                    <span className="text-green-400 text-lg" title="Completed">
                                                                        <i className="fa-solid fa-circle-check" aria-hidden />
                                                                    </span>
                                                                )}
                                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${stage.difficulty === 'Easy' || stage.difficulty === 'Basic' ? 'bg-green-500/20 text-green-300' :
                                                                    stage.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                        'bg-red-500/20 text-red-300'
                                                                    }`}>
                                                                    {stage.difficulty}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div
                                                                className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                                                                style={{ backgroundColor: cat.colorHex + '30', color: cat.borderHex }}
                                                            >
                                                                {(stage.displayStage || (idx + 1))}
                                                            </div>
                                                            <h3 className="text-lg font-[var(--font-display)] font-bold text-white">{stage.title}</h3>
                                                        </div>

                                                        <p className="text-white/40 text-sm mb-3">{stage.id === 6 ? 'LOGIC QUEST' : `${stage.sportName} challenge`}</p>

                                                        {/* Shimmer */}
                                                        <div className="absolute inset-0 group-hover:opacity-100 animate-shimmer rounded-2xl pointer-events-none"></div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="pt-4 pb-2 px-1">
                                            <div className="glass-card rounded-2xl p-8 text-center">
                                                <span className="text-5xl mb-3 block"><i className="fa-solid fa-lock text-white/20"></i></span>
                                                <p className="text-white/40 font-[var(--font-display)] font-bold text-lg">Coming Soon</p>
                                                <p className="text-white/25 text-sm mt-1">New challenges are on the way!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Room Section (preserved) ── */}
                    <div className="mt-7 ">
                    <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
                    <Card>
                        <CardHeader>
                            <CardTitle><i className="fa-solid fa-gamepad mr-2"></i> Join a Room</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-white/50 mb-6">
                                Got a room code from your teacher? Enter it below to join their live session!
                            </p>
                            <form
                                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const code = formData.get('roomCode') as string;
                                    if (code) {
                                        window.location.href = `/game/room/${code.toUpperCase()}`;
                                    }
                                }}
                                className="flex gap-3"
                            >
                                <input
                                    name="roomCode"
                                    placeholder="Enter 6-digit code"
                                    className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3 uppercase font-mono tracking-widest text-center text-lg"
                                    required
                                    maxLength={6}
                                />
                                <Button type="submit"><i className="fa-solid fa-rocket mr-2"></i> Join</Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* <Card>
                        <CardHeader>
                            <CardTitle><i className="fa-solid fa-trophy mr-2"></i> Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => { window.location.assign('/game/html/1'); }}
                                    className="block w-full text-center rounded-xl font-[var(--font-display)] font-bold transition-all duration-300 bg-gradient-to-r from-sky to-aqua text-white shadow-lg shadow-sky/30 hover:shadow-sky/50 hover:scale-105 active:scale-95 px-6 py-3 cursor-pointer"
                                >
                                    <i className="fa-solid fa-person-swimming mr-2"></i> Start Stage 1
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { window.location.assign('/leaderboard'); }}
                                    className="block w-full text-center rounded-xl font-[var(--font-display)] font-bold transition-all duration-300 bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-lg hover:scale-105 active:scale-95 px-6 py-3 cursor-pointer"
                                >
                                    <i className="fa-solid fa-medal mr-2"></i> Global Leaderboard
                                </button>
                            </div>
                        </CardContent>
                    </Card> */}
                </div>
            </div>
            </div>
        </div>
    );
}
