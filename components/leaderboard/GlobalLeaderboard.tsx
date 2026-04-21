'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/AuthProvider';
import { calculateStageScore } from '@/lib/utils/score';

interface AggregatedPlayer {
    userId: string;
    username: string;
    totalScore: number;
    stagesCompleted: number;
    totalTime: number;
    rankChange: number;
}

const KNOWN_STAGE_IDS = new Set([1, 2, 3, 4, 5, 6, 101, 102]);
const REQUIRED_STAGES_FOR_GLOBAL = KNOWN_STAGE_IDS.size;
const GLOBAL_SCORES_UPDATE_KEY = 'global_scores:lastUpdate';
const LEADERBOARD_CACHE_KEY = 'global_scores:leaderboardCache';

const FETCH_TIMEOUT_MS = 15000;

type GlobalScoreRow = {
    user_id: string;
    stage_id: number;
    time: number;
    score?: number;
    profiles?: { username?: string | null } | Array<{ username?: string | null }> | null;
};

type SupabaseScoreResponse = {
    data: GlobalScoreRow[] | null;
    error: { message: string } | null;
};

function withTimeout(promise: Promise<SupabaseScoreResponse>, ms: number, label: string): Promise<SupabaseScoreResponse> {
    return new Promise((resolve, reject) => {
        const t = window.setTimeout(() => reject(new Error(`${label}:timeout`)), ms);
        promise
            .then((v) => {
                window.clearTimeout(t);
                resolve(v);
            })
            .catch((e) => {
                window.clearTimeout(t);
                reject(e);
            });
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readLeaderboardCache(): AggregatedPlayer[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(LEADERBOARD_CACHE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed as AggregatedPlayer[] : [];
    } catch {
        return [];
    }
}

function writeLeaderboardCache(rankings: AggregatedPlayer[]) {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(rankings));
    } catch {
    }
}

/** PostgREST / driver บางทางส่งตัวเลขเป็น string — กรองเดิมทำให้เหลือ 0 แถวแล้วลีดเดอร์บอร์ดว่าง */
function normalizeGlobalScoreRows(raw: GlobalScoreRow[]): GlobalScoreRow[] {
    const out: GlobalScoreRow[] = [];
    for (const row of raw) {
        if (!row?.user_id) continue;
        const stageId =
            typeof row.stage_id === 'number' && Number.isFinite(row.stage_id)
                ? row.stage_id
                : typeof row.stage_id === 'string'
                  ? parseInt(row.stage_id, 10)
                  : NaN;
        if (!Number.isFinite(stageId) || !KNOWN_STAGE_IDS.has(stageId)) continue;

        const time =
            typeof row.time === 'number' && Number.isFinite(row.time)
                ? row.time
                : typeof row.time === 'string'
                  ? parseFloat(row.time)
                  : row.time == null
                    ? 0
                    : NaN;
        if (!Number.isFinite(time) || time < 0) continue;

        let score: number | undefined;
        if (typeof row.score === 'number' && Number.isFinite(row.score)) {
            score = row.score;
        } else if (typeof row.score === 'string') {
            const s = parseFloat(row.score);
            if (Number.isFinite(s)) score = s;
        }

        out.push({
            ...row,
            user_id: String(row.user_id),
            stage_id: stageId,
            time,
            score,
        });
    }
    return out;
}

function getProfileUsername(profile: GlobalScoreRow['profiles']) {
    if (Array.isArray(profile)) {
        return profile.find((entry) => typeof entry?.username === 'string' && entry.username.trim().length > 0)?.username?.trim() || null;
    }

    if (profile && typeof profile.username === 'string' && profile.username.trim().length > 0) {
        return profile.username.trim();
    }

    return null;
}

function aggregateLeaderboardRows(
    rows: GlobalScoreRow[],
    options: {
        currentUserId?: string;
        currentUsername?: string | null;
        cachedNames?: Map<string, string>;
    } = {},
) {
    const bestByStage = new Map<number, Map<string, { time: number; username: string; score: number }>>();

    for (const row of rows) {
        const userId = row.user_id;
        if (!userId) continue;

        const resolvedUsername = getProfileUsername(row.profiles)
            || options.cachedNames?.get(userId)
            || (userId === options.currentUserId ? options.currentUsername : null)
            || 'Unknown';

        if (!bestByStage.has(row.stage_id)) {
            bestByStage.set(row.stage_id, new Map());
        }

        const stageEntries = bestByStage.get(row.stage_id)!;
        const currentBest = stageEntries.get(userId);
        const resolvedScore = typeof row.score === 'number' ? row.score : calculateStageScore(row.time);
        if (
            !currentBest
            || resolvedScore > currentBest.score
            || (resolvedScore === currentBest.score && row.time < currentBest.time)
        ) {
            stageEntries.set(userId, {
                time: row.time,
                username: resolvedUsername,
                score: resolvedScore,
            });
        }
    }

    const playerMap = new Map<string, {
        username: string;
        totalScore: number;
        totalTime: number;
        stagesCompleted: number;
    }>();

    for (const [, stageEntries] of bestByStage) {
        const stageRankings = Array.from(stageEntries.entries()).sort((a, b) =>
            b[1].score !== a[1].score
                ? b[1].score - a[1].score
                : a[1].time - b[1].time,
        );

        for (const [userId, entry] of stageRankings) {
            if (!playerMap.has(userId)) {
                playerMap.set(userId, {
                    username: entry.username || 'Unknown',
                    totalScore: 0,
                    totalTime: 0,
                    stagesCompleted: 0,
                });
            }

            const player = playerMap.get(userId)!;
            if (player.username === 'Unknown' && entry.username && entry.username !== 'Unknown') {
                player.username = entry.username;
            }
            player.totalScore += entry.score;
            player.totalTime += entry.time;
            player.stagesCompleted += 1;
        }
    }

    const players = Array.from(playerMap.entries())
        .map(([userId, player]) => {
            return {
                userId,
                username: player.username,
                totalScore: player.totalScore,
                stagesCompleted: player.stagesCompleted,
                totalTime: player.totalTime,
                rankChange: 0,
            };
        })
        .sort((a, b) =>
            b.totalScore !== a.totalScore
                ? b.totalScore - a.totalScore
                : b.stagesCompleted !== a.stagesCompleted
                    ? b.stagesCompleted - a.stagesCompleted
                    : a.totalTime !== b.totalTime
                        ? a.totalTime - b.totalTime
                        : a.userId.localeCompare(b.userId),
        );

    return { players };
}

export function GlobalLeaderboard() {
    const { user, profile } = useAuth();
    /** Same on server + first client paint — never read localStorage here (fixes hydration mismatch). */
    const [rankings, setRankings] = useState<AggregatedPlayer[]>([]);
    const [partialRankings, setPartialRankings] = useState<AggregatedPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const refreshTimeoutRef = useRef<number | null>(null);
    const fetchInFlightRef = useRef(false);
    const queuedRefreshRef = useRef(false);

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchScores(source: 'initial' | 'realtime' | 'broadcast' | 'storage' = 'initial') {
            if (fetchInFlightRef.current) {
                queuedRefreshRef.current = true;
                return;
            }

            fetchInFlightRef.current = true;

            try {
                const cachedRankings = readLeaderboardCache();
                setFetchError(null);

                let data: GlobalScoreRow[] | null = null;
                let error: { message: string } | null = null;
                /** timeout / network throw — ไม่มี error จาก PostgREST แต่ต้องใช้ cache / retry */
                let recoverableFailure = false;

                for (let attempt = 0; attempt < 3; attempt++) {
                    if (attempt > 0) {
                        await sleep(350 + attempt * 450);
                    }
                    try {
                        const res = await withTimeout(
                            supabase
                                .from('global_scores')
                                .select('user_id, stage_id, time, score, profiles(username)')
                                .in('stage_id', Array.from(KNOWN_STAGE_IDS))
                                .limit(3000),
                            FETCH_TIMEOUT_MS,
                            'global_scores',
                        );
                        data = res.data as GlobalScoreRow[] | null;
                        error = res.error as { message: string } | null;
                        break;
                    } catch (e) {
                        recoverableFailure = true;
                        console.warn('[GlobalLeaderboard] fetch timed out or failed (attempt', attempt + 1, '):', e);
                        data = [];
                        error = null;
                    }
                }

                if (error && /column.*score|could not find.*score/i.test(error.message)) {
                    console.warn('[GlobalLeaderboard] score column not found, retrying without score');
                    try {
                        const fallback = await withTimeout(
                            supabase
                                .from('global_scores')
                                .select('user_id, stage_id, time, profiles(username)')
                                .in('stage_id', Array.from(KNOWN_STAGE_IDS))
                                .limit(3000),
                            FETCH_TIMEOUT_MS,
                            'global_scores_no_score',
                        );
                        data = fallback.data as typeof data;
                        error = fallback.error as typeof error;
                    } catch {
                        recoverableFailure = true;
                        data = [];
                        error = null;
                    }
                }

                if (error && /PGRST200|relationship|embedded|schema cache/i.test(error.message)) {
                    console.warn('[GlobalLeaderboard] profiles embed failed, retrying without join');
                    try {
                        const plain = await withTimeout(
                            supabase
                                .from('global_scores')
                                .select('user_id, stage_id, time, score')
                                .in('stage_id', Array.from(KNOWN_STAGE_IDS))
                                .limit(3000),
                            FETCH_TIMEOUT_MS,
                            'global_scores_plain',
                        );
                        data = plain.data as typeof data;
                        error = plain.error as typeof error;
                    } catch {
                        recoverableFailure = true;
                        data = [];
                        error = null;
                    }
                }

                if (error && /column.*score|could not find.*score/i.test(error.message)) {
                    try {
                        const fallback2 = await withTimeout(
                            supabase
                                .from('global_scores')
                                .select('user_id, stage_id, time')
                                .in('stage_id', Array.from(KNOWN_STAGE_IDS))
                                .limit(3000),
                            FETCH_TIMEOUT_MS,
                            'global_scores_min',
                        );
                        data = fallback2.data as typeof data;
                        error = fallback2.error as typeof error;
                    } catch {
                        recoverableFailure = true;
                        data = [];
                        error = null;
                    }
                }

                /** Server-only rows; coerce types so string/null จาก API ไม่ทำให้ตารางว่างทั้งก้อน */
                const rows = normalizeGlobalScoreRows((data || []) as GlobalScoreRow[]);

                if (error && rows.length === 0) {
                    console.warn('[GlobalLeaderboard] scores fetch error:', error.message);
                    if (!cancelled) {
                        if (cachedRankings.length > 0) {
                            setRankings(cachedRankings);
                            setPartialRankings([]);
                            setFetchError(null);
                        } else {
                            setFetchError(error.message);
                            setRankings([]);
                            setPartialRankings([]);
                        }
                    }
                    return;
                }

                /** timeout / network: ไม่มี PostgREST error แต่ rows ว่าง — อย่าทับ cache ด้วยตารางว่าง */
                if (recoverableFailure && rows.length === 0 && cachedRankings.length > 0) {
                    if (!cancelled) {
                        setRankings(cachedRankings);
                        setPartialRankings([]);
                        setFetchError(null);
                    }
                    return;
                }

                if (error) {
                    console.warn('[GlobalLeaderboard] scores fetch error (using local fallback):', error.message);
                }

                console.log('[GlobalLeaderboard] fetched', rows.length, 'rows from', source);

                if (rows.length === 0) {
                    if (!cancelled) {
                        if (recoverableFailure) {
                            setFetchError('Could not load leaderboard (network timeout). Please try again.');
                            setRankings([]);
                            setPartialRankings([]);
                        } else {
                            setRankings([]);
                            setPartialRankings([]);
                        }
                    }
                    return;
                }

                const cachedNames = new Map(cachedRankings.map((entry) => [entry.userId, entry.username]));
                const aggregated = aggregateLeaderboardRows(rows, {
                    currentUserId: user?.id,
                    currentUsername: profile?.username || user?.user_metadata?.username || null,
                    cachedNames,
                });

                if (!cancelled) {
                    const previousRanks = new Map(cachedRankings.map((entry, index) => [entry.userId, index + 1]));
                    const eligible = aggregated.players.filter(
                        (entry) => entry.stagesCompleted === REQUIRED_STAGES_FOR_GLOBAL,
                    );
                    const nextRankings = eligible.slice(0, 20).map((entry, index) => {
                        const previousRank = previousRanks.get(entry.userId);
                        return {
                            ...entry,
                            rankChange: previousRank ? previousRank - (index + 1) : 0,
                        };
                    });
                    setRankings(nextRankings);
                    if (nextRankings.length > 0) {
                        writeLeaderboardCache(nextRankings);
                    }

                    const partial = aggregated.players
                        .filter((e) => e.stagesCompleted < REQUIRED_STAGES_FOR_GLOBAL && e.stagesCompleted > 0)
                        .sort((a, b) =>
                            b.stagesCompleted !== a.stagesCompleted
                                ? b.stagesCompleted - a.stagesCompleted
                                : b.totalScore !== a.totalScore
                                    ? b.totalScore - a.totalScore
                                    : a.totalTime !== b.totalTime
                                        ? a.totalTime - b.totalTime
                                        : a.userId.localeCompare(b.userId),
                        )
                        .slice(0, 50);
                    setPartialRankings(partial);
                }
            } catch (err) {
                console.warn('[GlobalLeaderboard] unexpected error:', err);
                if (!cancelled) {
                    setFetchError(err instanceof Error ? err.message : String(err));
                }
            } finally {
                fetchInFlightRef.current = false;
                setLoading(false);

                if (queuedRefreshRef.current && !cancelled) {
                    queuedRefreshRef.current = false;
                    window.setTimeout(() => {
                        if (!cancelled) void fetchScores('broadcast');
                    }, 0);
                }
            }
        }

        function scheduleRefresh(source: 'realtime' | 'broadcast' | 'storage') {
            if (refreshTimeoutRef.current) {
                window.clearTimeout(refreshTimeoutRef.current);
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
                refreshTimeoutRef.current = null;
                void fetchScores(source);
            }, 150);
        }

        void fetchScores('initial');

        const channel = supabase.channel('global_leaderboard_scores').on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'global_scores' },
            () => {
                scheduleRefresh('realtime');
            },
        );
        try {
            channel.subscribe();
        } catch (e) {
            console.warn('[GlobalLeaderboard] realtime subscribe failed:', e);
        }

        const handleGlobalScoresUpdated = () => {
            scheduleRefresh('broadcast');
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== GLOBAL_SCORES_UPDATE_KEY) return;
            scheduleRefresh('storage');
        };

        window.addEventListener('global_scores_updated', handleGlobalScoresUpdated);
        window.addEventListener('storage', handleStorage);

        const onVisible = () => {
            if (document.visibilityState === 'visible') scheduleRefresh('broadcast');
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            if (refreshTimeoutRef.current) {
                window.clearTimeout(refreshTimeoutRef.current);
            }
            window.removeEventListener('global_scores_updated', handleGlobalScoresUpdated);
            window.removeEventListener('storage', handleStorage);
            document.removeEventListener('visibilitychange', onVisible);
            supabase.removeChannel(channel);
        };
    }, [profile?.username, user?.id, user?.user_metadata?.username]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-5xl animate-float-slow mb-4">🏅</div>
                <p className="text-white/50 font-[var(--font-display)]">Loading rankings...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="text-center py-12">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-red-400 font-[var(--font-display)] font-bold mb-2">Could not load leaderboard</p>
                <p className="text-white/30 text-sm font-mono max-w-md mx-auto break-all">{fetchError}</p>
                <p className="text-white/40 text-sm mt-3">Check that the <code className="bg-white/10 px-1 rounded">global_scores</code> table exists and allows reads.</p>
            </div>
        );
    }

    const top3 = rankings.slice(0, 3);

    return (
        <div className="space-y-8">
            {/* Podium */}
            {top3.length > 0 && (
                <div className="flex justify-center items-end gap-4 mb-8 pt-4">
                    {/* 2nd Place */}
                    {top3[1] && (
                        <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="text-4xl mb-2">🥈</div>
                            <div className="glass-card rounded-2xl px-6 py-4 min-w-[140px]">
                                <p className="font-[var(--font-display)] font-bold text-white text-sm">{top3[1].username}</p>
                                <p className="text-white/40 text-xs font-mono mt-1">{top3[1].totalScore} pts · {top3[1].totalTime}s</p>
                            </div>
                            <div className="podium-2 h-20 rounded-t-xl mt-2 flex items-center justify-center">
                                <span className="font-[var(--font-display)] font-bold text-white/80 text-2xl">2</span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place */}
                    {top3[0] && (
                        <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="text-5xl mb-2 animate-float-slow">🥇</div>
                            <div className="glass-card rounded-2xl px-8 py-5 min-w-[160px] border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                                <p className="font-[var(--font-display)] font-bold text-sunny text-base">{top3[0].username}</p>
                                <p className="text-white/50 text-sm font-mono mt-1">{top3[0].totalScore} pts · {top3[0].totalTime}s</p>
                            </div>
                            <div className="podium-1 h-28 rounded-t-xl mt-2 flex items-center justify-center">
                                <span className="font-[var(--font-display)] font-bold text-white text-3xl">1</span>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {top3[2] && (
                        <div className="text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="text-4xl mb-2">🥉</div>
                            <div className="glass-card rounded-2xl px-6 py-4 min-w-[140px]">
                                <p className="font-[var(--font-display)] font-bold text-white text-sm">{top3[2].username}</p>
                                <p className="text-white/40 text-xs font-mono mt-1">{top3[2].totalScore} pts · {top3[2].totalTime}s</p>
                            </div>
                            <div className="podium-3 h-14 rounded-t-xl mt-2 flex items-center justify-center">
                                <span className="font-[var(--font-display)] font-bold text-white/80 text-2xl">3</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Full-run rankings (ครบ 8 ด่าน) */}
            <Card className="border-white/10 shadow-xl shadow-sky-900/20 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white">🏅 อันดับรวม (ครบ {REQUIRED_STAGES_FOR_GLOBAL} ด่าน)</CardTitle>
                    <p className="text-sm text-white/45 font-normal mt-1">เรียงจากคะแนนรวม แล้วใช้เวลารวมเป็นตัวตัดสิน</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-14">#</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Player</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Total Score</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Total Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {rankings.map((player, index) => (
                                    <tr
                                        key={player.userId}
                                        className={`transition-colors hover:bg-white/5 ${index < 3 ? 'bg-white/[0.02]' : ''}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-[var(--font-display)] font-bold text-white/30">
                                            #{index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                                            {index < 3 && <span className="mr-2">{['🥇', '🥈', '🥉'][index]}</span>}
                                            {player.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-sunny text-right">
                                            {player.totalScore} <span className="text-white/40 text-xs ml-1 font-normal">pts</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-sky-light text-right">
                                            {player.totalTime}s
                                        </td>
                                    </tr>
                                ))}
                                {rankings.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="text-4xl mb-3 opacity-50">🏅</div>
                                            <p className="text-white/45 text-sm max-w-md mx-auto leading-relaxed">
                                                ยังไม่มีผู้เล่นที่ครบทุกด่านในลีดเดอร์บอร์ดหลัก — ถ้าเล่นไม่ครบ 8 ด่าน จะแสดงความคืบหน้าในตารางด้านล่าง
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {partialRankings.length > 0 ? (
                <Card className="border-white/10 bg-white/[0.02]">
                    <CardHeader>
                        <CardTitle className="text-white/90">📊 ความคืบหน้า (ยังไม่ครบ {REQUIRED_STAGES_FOR_GLOBAL} ด่าน)</CardTitle>
                        <p className="text-sm text-white/40 font-normal mt-1">แสดงเฉพาะผู้ที่มีคะแนนอย่างน้อย 1 ด่าน — ครบทุกด่านแล้วจะเข้าตารางด้านบน</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-14">#</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Player</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">ด่านที่เล่น</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">คะแนนรวม (ชั่วคราว)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">เวลารวม</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {partialRankings.map((player, index) => (
                                        <tr key={player.userId} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-3 font-mono text-white/35">{index + 1}</td>
                                            <td className="px-6 py-3 font-medium text-white">{player.username}</td>
                                            <td className="px-6 py-3 text-right text-white/50 tabular-nums">
                                                {player.stagesCompleted}/{REQUIRED_STAGES_FOR_GLOBAL}
                                            </td>
                                            <td className="px-6 py-3 text-right font-semibold text-sunny tabular-nums">{player.totalScore}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sky-light/90 tabular-nums">{player.totalTime}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

        </div>
    );
}
