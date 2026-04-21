'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/AuthProvider';
import { useTimer } from '@/lib/hooks/useTimer';
import { createClient } from '@/lib/supabase/client';
import { GameTimer } from '@/components/game/GameTimer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { HTMLStructure_1_1 } from '@/components/game/stages/stage1/1_HTMLStructure';
import HTMLInput_1_2 from '@/components/game/stages/stage1/2_HTMLInput';
import CSSStyling_2_1 from '@/components/game/stages/stage2/1_CSSStyling';
import BoxingQuizBattle_2_2 from '@/components/game/stages/stage2/2_BoxingQuizBattle';
import { JSFunction_3_1 } from '@/components/game/stages/stage3/1_JSFunction';
import { JSLogic_3_2 } from '@/components/game/stages/stage3/2_JSLogic';
import VariablesGame_4_1 from '@/components/game/stages/stage4/1_VariablesGame';
import Weightlifting_4_2 from '@/components/game/stages/stage4/2_Weightlifting';
import { calculateGlobalStageScore, calculateStageScore, resolveStageQuizStats, type StageScorePayload } from '@/lib/utils/score';

const STAGES = [
    { id: 1, title: 'HTML Structure', sport: '🏊', sportName: 'Swimming', category: 'html', component: HTMLStructure_1_1, displayStage: '1-1' },
    { id: 2, title: 'HTML Input', sport: '⚽', sportName: 'Football', category: 'html', component: HTMLInput_1_2, displayStage: '1-2' },
    { id: 3, title: 'CSS Styling', sport: '🏃‍♂️', sportName: 'Hurdles', category: 'css', component: CSSStyling_2_1, displayStage: '2-1' },
    { id: 4, title: 'Boxing Quiz Battle', sport: '🥊', sportName: 'Boxing', category: 'css', component: BoxingQuizBattle_2_2, displayStage: '2-2' },
    { id: 5, title: 'JS Function', sport: '🔫', sportName: 'Shooting Duel', category: 'js', component: JSFunction_3_1, displayStage: '3-1' },
    { id: 6, title: 'JS Logic', sport: '🤖', sportName: 'Logic Quest', category: 'js', component: JSLogic_3_2, displayStage: '3-2' },
    { id: 101, title: 'Variables Game', sport: '🏐', sportName: 'Volleyball', category: 'python', component: VariablesGame_4_1, displayStage: '4-1' },
    { id: 102, title: 'Weightlifting', sport: '🏋️‍♀️', sportName: 'Weightlifting', category: 'python',  component: Weightlifting_4_2, displayStage: '4-2' },
];

const GLOBAL_SCORES_UPDATE_KEY = 'global_scores:lastUpdate';
const GLOBAL_SCORES_LOCAL_CACHE_KEY = 'global_scores:localCache';
const GLOBAL_COMPLETED_STAGE_IDS_KEY = 'global_scores:completedStageIds';

type LocalCachedStageResult = {
    stage_id: number;
    time: number;
    score: number;
    updatedAt: number;
};

type StageResult = {
    success: boolean;
    seconds: number;
};

function readGlobalScoresLocalCache(): Record<string, LocalCachedStageResult[]> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem(GLOBAL_SCORES_LOCAL_CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed as Record<string, LocalCachedStageResult[]> : {};
    } catch {
        return {};
    }
}

function writeGlobalScoresLocalCache(cache: Record<string, LocalCachedStageResult[]>) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GLOBAL_SCORES_LOCAL_CACHE_KEY, JSON.stringify(cache));
}

function completedStageIdsKeyForUser(userId: string) {
    return `${GLOBAL_COMPLETED_STAGE_IDS_KEY}:${userId}`;
}

function persistCompletedStageId(userId: string, stageId: number) {
    if (typeof window === 'undefined' || !userId) return;

    try {
        const key = completedStageIdsKeyForUser(userId);
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === 'number') : [];
        const nextIds = Array.from(new Set([...ids, stageId]));
        window.localStorage.setItem(key, JSON.stringify(nextIds));
    } catch {
        window.localStorage.setItem(completedStageIdsKeyForUser(userId), JSON.stringify([stageId]));
    }
}

function persistLocalCachedStageResult(userId: string, result: Omit<LocalCachedStageResult, 'updatedAt'>) {
    const cache = readGlobalScoresLocalCache();
    const existingEntries = Array.isArray(cache[userId]) ? cache[userId] : [];
    const existingStageEntry = existingEntries.find((entry) => entry.stage_id === result.stage_id);

    const shouldKeepExisting = existingStageEntry
        && (existingStageEntry.score > result.score
            || (existingStageEntry.score === result.score && existingStageEntry.time <= result.time));

    const nextStageEntry = shouldKeepExisting
        ? existingStageEntry
        : { ...result, updatedAt: Date.now() };

    cache[userId] = [
        ...existingEntries.filter((entry) => entry.stage_id !== result.stage_id),
        nextStageEntry,
    ];

    writeGlobalScoresLocalCache(cache);
}

export default function GameStagePage() {
    const params = useParams();
    const stageId = params?.stageId as string;
    const { user } = useAuth();
    const currentStageId = parseInt(stageId as string);
    const currentStageIndex = STAGES.findIndex(s => s.id === currentStageId);
    const stage = STAGES[currentStageIndex];
    // Timer that pauses when failed, and resumes across page reloads using isolated localstorage keys
    const timer = useTimer(0, user && stage ? `stage_time_${user.id}_${stage.id}` : undefined);
    const supabase = createClient();

    const [isFinished, setIsFinished] = useState(false);
    const [isSavingResult, setIsSavingResult] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    /** เมื่อบันทึก DB ล้มเหลว — remount เกมให้เล่นรอบใหม่ได้ */
    const [stageRemountKey, setStageRemountKey] = useState(0);
    const [stageResult, setStageResult] = useState<StageResult | null>(null);
    const [showCoach, setShowCoach] = useState(false);
    const [lastActivity] = useState(() => Date.now());
    const nextStage = currentStageIndex !== -1 && currentStageIndex + 1 < STAGES.length
        ? STAGES[currentStageIndex + 1]
        : null;
    const hasCompletedStage = stageResult !== null;
    const isWideStageLayout = (currentStageId === 4 || currentStageId === 6) && !hasCompletedStage;
    const headerSport = currentStageId === 6 ? '🤖' : stage.sport;
    const headerTitle = currentStageId === 6 ? 'LOGIC QUEST' : stage.title;
    const headerSubTitle = currentStageId === 6
        ? `LOGIC QUEST • Stage ${stage.displayStage}`
        : `${stage.sportName} • Stage ${stage.displayStage}`;

    const broadcastGlobalScoresUpdate = useCallback(() => {
        if (typeof window === 'undefined' || !user || !stage) return;
        const payload = JSON.stringify({
            userId: user.id,
            stageId: stage.id,
            updatedAt: Date.now(),
        });
        window.localStorage.setItem(GLOBAL_SCORES_UPDATE_KEY, payload);
        window.dispatchEvent(new Event('global_scores_updated'));
    }, [user, stage]);

    useEffect(() => {
        if (stage && !hasCompletedStage) {
            timer.start();
        } else {
            timer.stop();
        }
    }, [stage, hasCompletedStage, timer]);

    // Coach bubble after 15s inactivity
    useEffect(() => {
        if (isFinished) return;
        const interval = setInterval(() => {
            if (Date.now() - lastActivity > 15000) {
                setShowCoach(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastActivity, isFinished]);

    const persistCompletion = useCallback(async (finalSeconds: number, stats: { correct: number; total: number }) => {
        if (!user || !stage) return false;

        const calculatedScore = calculateGlobalStageScore(stage.id, finalSeconds, stats.correct, stats.total);
        const basePayload = {
            user_id: user.id,
            stage_id: stage.id,
            time: finalSeconds,
            medal: 'bronze' as const
        };

        const isScoreColumnUnavailable = (message?: string) =>
            /column .*score|score column|schema cache.*score|could not find.*score/i.test(message || '');

        const isUniqueConstraintError = (message?: string) =>
            /duplicate key|unique constraint|23505/i.test(message || '');
        const isMissingUserForeignKeyError = (message?: string) =>
            /foreign key constraint|global_scores.*user_id.*fkey/i.test(message || '');

        const getResolvedScore = (rowTime: number, rowScore?: number | null) =>
            typeof rowScore === 'number' ? rowScore : calculateStageScore(rowTime);

        try {
            let supportsScoreColumn = true;
            let existingRows: Array<{ time: number; score?: number | null }> = [];

            const existingWithScore = await supabase
                .from('global_scores')
                .select('time, score')
                .eq('user_id', user.id)
                .eq('stage_id', stage.id)
                .limit(50);

            if (existingWithScore.error) {
                if (isScoreColumnUnavailable(existingWithScore.error.message)) {
                    supportsScoreColumn = false;
                    const existingWithoutScore = await supabase
                        .from('global_scores')
                        .select('time')
                        .eq('user_id', user.id)
                        .eq('stage_id', stage.id)
                        .limit(50);

                    if (existingWithoutScore.error) {
                        console.warn('[Stage] Could not read existing stage results:', existingWithoutScore.error);
                    } else {
                        existingRows = ((existingWithoutScore.data || []) as Array<{ time: number }>).map((row) => ({
                            ...row,
                            score: undefined,
                        }));
                    }
                } else {
                    console.warn('[Stage] Could not read existing stage results:', existingWithScore.error);
                }
            } else {
                existingRows = (existingWithScore.data || []) as Array<{ time: number; score?: number | null }>;
            }

            const bestExistingRow = existingRows.reduce<{ time: number; score: number } | null>((best, row) => {
                const rowScore = getResolvedScore(row.time, row.score);
                if (!best || rowScore > best.score || (rowScore === best.score && row.time < best.time)) {
                    return { time: row.time, score: rowScore };
                }
                return best;
            }, null);

            const bestPersistedResult = !bestExistingRow || calculatedScore > bestExistingRow.score || (calculatedScore === bestExistingRow.score && finalSeconds < bestExistingRow.time)
                ? { time: finalSeconds, score: calculatedScore }
                : bestExistingRow;

            const updatePayload = {
                time: bestPersistedResult.time,
                medal: 'bronze' as const,
            };

            const writeResult = async (includeScore: boolean) => {
                if (existingRows.length > 0) {
                    const payload = includeScore
                        ? { ...updatePayload, score: bestPersistedResult.score }
                        : updatePayload;
                    return await supabase
                        .from('global_scores')
                        .update(payload)
                        .eq('user_id', user.id)
                        .eq('stage_id', stage.id);
                }

                const payload = includeScore
                    ? { ...basePayload, score: calculatedScore }
                    : basePayload;
                const insertResult = await supabase.from('global_scores').insert(payload);

                if (insertResult.error && isUniqueConstraintError(insertResult.error.message)) {
                    const fallbackUpdatePayload = includeScore
                        ? { ...updatePayload, score: bestPersistedResult.score }
                        : updatePayload;
                    return await supabase
                        .from('global_scores')
                        .update(fallbackUpdatePayload)
                        .eq('user_id', user.id)
                        .eq('stage_id', stage.id);
                }

                return insertResult;
            };

            let { error: writeError } = await writeResult(supportsScoreColumn);

            if (writeError && supportsScoreColumn && isScoreColumnUnavailable(writeError.message)) {
                console.warn('[Stage] global_scores.score column unavailable, retrying without score');
                supportsScoreColumn = false;
                const retryResult = await writeResult(false);
                writeError = retryResult.error;
            }

            if (writeError) {
                if (isMissingUserForeignKeyError(writeError.message)) {
                    console.warn('[Stage] Skipping cloud save because user profile is not linked yet. Keeping local result only.');
                    return true;
                }
                console.error('[Stage] Error saving score:', {
                    message: writeError.message,
                    code: 'code' in writeError ? (writeError as { code?: string }).code : undefined,
                    details: 'details' in writeError ? (writeError as { details?: string }).details : undefined,
                    hint: 'hint' in writeError ? (writeError as { hint?: string }).hint : undefined,
                });
                return false;
            } else {
                console.log('[Stage] Score saved to global_scores:', {
                    stage_id: stage.id,
                    time: bestPersistedResult.time,
                    score: bestPersistedResult.score,
                });
                persistLocalCachedStageResult(user.id, {
                    stage_id: stage.id,
                    time: bestPersistedResult.time,
                    score: bestPersistedResult.score,
                });
                broadcastGlobalScoresUpdate();
                return true;
            }
        } catch (error) {
            console.error('Error saving score:', error);
            return false;
        }
    }, [user, stage, supabase, broadcastGlobalScoresUpdate]);

    const handleComplete = useCallback(async (result?: StageScorePayload) => {
        if (!stage || isSavingResult) return;

        const success = result?.success !== false;
        const finalSeconds = typeof result?.seconds === 'number' ? result.seconds : timer.seconds;
        const quizStats = resolveStageQuizStats(stage.id, result);

        timer.stop();
        setSaveError(null);

        if (!success) {
            setStageResult({ success, seconds: finalSeconds });
            return;
        }

        if (!user) {
            setStageResult({ success, seconds: finalSeconds });
            setIsFinished(true);
            return;
        }

        setIsSavingResult(true);
        const persisted = await persistCompletion(finalSeconds, quizStats);

        if (persisted) {
            persistCompletedStageId(user.id, stage.id);
            const calculatedScore = calculateGlobalStageScore(stage.id, finalSeconds, quizStats.correct, quizStats.total);
            persistLocalCachedStageResult(user.id, {
                stage_id: stage.id,
                time: finalSeconds,
                score: calculatedScore,
            });
            broadcastGlobalScoresUpdate();
            setStageResult({ success, seconds: finalSeconds });
            setIsFinished(true);
        } else {
            setSaveError('บันทึกคะแนนไม่สำเร็จ ลองเล่นอีกครั้ง (เช็กเน็ตหรือสิทธิ์ Supabase ของตาราง global_scores)');
            setStageRemountKey((k) => k + 1);
            timer.start();
        }

        setIsSavingResult(false);
    }, [user, stage, isSavingResult, timer, persistCompletion, broadcastGlobalScoresUpdate]);

    if (!stage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-red-400 font-[var(--font-display)] text-xl">Stage not found.</p>
                </div>
            </div>
        );
    }

    const StageComponent = stage.component;

    return (
        <div className="min-h-screen bg-[#0a1628] relative">
            {/* Top Bar */}
            <div className="bg-ocean/80 backdrop-blur-xl border-b border-white/10 py-3 px-4 sm:px-6 lg:px-8 sticky top-[72px] z-40">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">{headerSport}</span>
                        <div>
                            <h1 className="text-xl font-[var(--font-display)] font-bold text-white">
                                {headerTitle}
                            </h1>
                            <p className="text-white/40 text-sm">{headerSubTitle}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        {user && (
                            <span key={user.id} className="text-xs text-white/50">
                                {user.email}
                            </span>
                        )}
                        <GameTimer timer={timer} />
                    </div>
                </div>
            </div>

            <div className={`mx-auto px-4 sm:px-6 lg:px-8 relative ${isWideStageLayout ? 'max-w-7xl py-2 lg:py-4' : 'max-w-4xl py-8'}`}>
                {saveError ? (
                    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm text-center">
                        {saveError}
                    </div>
                ) : null}
                {isWideStageLayout ? (
                    <StageComponent key={stageRemountKey} onComplete={handleComplete} isActive={true} />
                ) : (
                    <Card className="relative bg-[#112240] border-white/10 shadow-2xl">
                        <CardContent className="pt-6">
                            {!hasCompletedStage ? (
                                <StageComponent key={stageRemountKey} onComplete={handleComplete} isActive={true} />
                            ) : stageResult?.success ? (
                                <div className="text-center py-16 animate-bounce-in">
                                    <div className="text-7xl mb-6 flex justify-center">
                                        <i className="fa-solid fa-check text-green-400"></i>
                                    </div>
                                    <h2 className="text-5xl font-[var(--font-display)] font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 pb-2 leading-relaxed">
                                        Stage Complete!
                                    </h2>
                                    <p className="text-xl text-white/60 mb-2">
                                        You completed <span className="text-white font-bold">{stage.title}</span>
                                    </p>
                                    <p className="text-3xl font-mono font-bold text-sunny mb-8">
                                        <i className="fa-solid fa-clock mr-2"></i> {stageResult ? `${Math.floor(stageResult.seconds / 60).toString().padStart(2, '0')}:${(stageResult.seconds % 60).toString().padStart(2, '0')}` : (timer.formattedTime || `${timer.seconds}s`)}
                                    </p>

                                    <div className="flex justify-center gap-4">
                                        {nextStage ? (
                                            <Button
                                                onClick={() => { window.location.assign(`/game/${nextStage.category}/${nextStage.id}`); }}
                                                size="lg"
                                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                            >
                                                {nextStage.sport} Next Stage →
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => { window.location.assign('/leaderboard'); }}
                                                size="lg"
                                                className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                            >
                                                <i className="fa-solid fa-trophy mr-2"></i> View Leaderboard
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            onClick={() => { window.location.href = '/dashboard'; }}
                                            size="lg"
                                            className="bg-slate-700 hover:bg-slate-600 text-white border-none"
                                        >
                                            <i className="fa-solid fa-house mr-2"></i> Dashboard
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-16 animate-bounce-in">
                                    <div className="text-7xl mb-6 flex justify-center">
                                        <i className="fa-solid fa-xmark text-red-500"></i>
                                    </div>
                                    <h2 className="text-5xl font-[var(--font-display)] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 mb-4 pb-2 leading-relaxed">
                                        Stage Failed
                                    </h2>
                                    <p className="text-xl text-white/60 mb-2">
                                        You did not complete <span className="text-white font-bold">{stage.title}</span>
                                    </p>
                                    <p className="text-3xl font-mono font-bold text-red-300 mb-8">
                                        <i className="fa-solid fa-clock mr-2"></i> {stageResult ? `${Math.floor(stageResult.seconds / 60).toString().padStart(2, '0')}:${(stageResult.seconds % 60).toString().padStart(2, '0')}` : (timer.formattedTime || `${timer.seconds}s`)}
                                    </p>

                                    <div className="flex justify-center gap-4">
                                        <Button
                                            onClick={() => {
                                                setStageResult(null);
                                                setIsFinished(false);
                                            }}
                                            size="lg"
                                            className="bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
                                        >
                                            Try Again
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => { window.location.href = '/dashboard'; }}
                                            size="lg"
                                            className="bg-slate-700 hover:bg-slate-600 text-white border-none"
                                        >
                                            <i className="fa-solid fa-house mr-2"></i> Dashboard
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Coach Bubble Removed */}
            </div>
        </div>
    );
}
