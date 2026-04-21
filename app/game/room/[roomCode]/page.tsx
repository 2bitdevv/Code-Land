'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Room } from '@/lib/types';
import { useRoomPlayers, useRoomScores } from '@/lib/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RoomLeaderboard } from '@/components/leaderboard/RoomLeaderboard';
import { useTimer } from '@/lib/hooks/useTimer';
import { GameTimer } from '@/components/game/GameTimer';
import { CATEGORIES, StageOption } from '@/lib/constants/categories';
import { calculateGlobalStageScore, resolveStageQuizStats, type StageScorePayload } from '@/lib/utils/score';

const supabase = createClient();

export default function GameRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = (params.roomCode as string)?.toUpperCase?.() || '';
    const { user, profile, loading: authLoading } = useAuth();

    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [roomError, setRoomError] = useState('');
    const [startError, setStartError] = useState('');

    useEffect(() => {
        if (startError) console.log("[StartGame] error:", startError);
    }, [startError]);

    const [deleting, setDeleting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [joining, setJoining] = useState(false);
    const { players, refetchPlayers } = useRoomPlayers(room?.id || null);
    const { scores, refetchScores } = useRoomScores(room?.id || null);
    const timer = useTimer();
    const roomId = room?.id;

    const isOwner = profile?.role === 'teacher' && room?.teacher_id === user?.id;
    const isTeacherButNotOwner = profile?.role === 'teacher' && room?.teacher_id && room.teacher_id !== user?.id;
    const studentHasJoined = profile?.role === 'student' && !!user && players.some((p) => p.student_id === user.id);
    const isParticipant = profile?.role === 'teacher' || studentHasJoined;

    // Wait for auth to finish, then load room (re-fetch when roomCode or user id changes)
    useEffect(() => {
        if (authLoading) return;

        if (!user || !profile) {
            setLoading(false);
            setRoomError('User session not found. Please log in again.');
            return;
        }

        if (!roomCode) {
            setRoomError('No room code provided.');
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadRoom() {
            try {
                setRoomError('');
                console.log('[RoomPage] Loading room with code:', roomCode);

                const { data, error } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('room_code', roomCode)
                    .single();

                if (cancelled) return;

                if (error || !data) {
                    console.error('[RoomPage] Room fetch failed:', error);
                    setRoomError('Room not found. Please check the room code.');
                    setLoading(false);
                    return;
                }

                console.log('[RoomPage] Room loaded:', data.id, 'status:', data.status);
                setRoom(data as Room);
            } catch (err) {
                if (!cancelled) {
                    console.error('[RoomPage] Room load error:', err);
                    setRoomError('Something went wrong. Please try again.');
                }
            }
            if (!cancelled) setLoading(false);
        }

        void loadRoom();
        return () => {
            cancelled = true;
        };
    }, [roomCode, user?.id, profile?.id, authLoading]);

    // Real-time room status subscription (so students see when teacher starts the game)
    useEffect(() => {
        if (!room || !roomId) return;

        const channel = supabase
            .channel(`room_status_${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
                (payload: { new: Record<string, unknown> }) => {
                    // Guard: ignore updates if the room was deleted locally (e.g., teacher navigated away after delete)
                    setRoom((prev) => {
                        if (!prev) return null;
                        // If payload indicates deletion (e.g., status becomes null or id mismatch), clear it
                        if (!payload.new || payload.new.id !== prev.id) return null;
                        return { ...prev, ...(payload.new as unknown as Room) };
                    });
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED' && room) {
                    void supabase
                        .from('rooms')
                        .select('*')
                        .eq('id', room.id)
                        .single()
                        .then(({ data }: { data: Room | null }) => {
                            if (data) setRoom(data);
                        });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [room, roomId]);

    const handleStartGame = async () => {
        // FIX 1: Explicit owner guard
        if (!room || !isOwner || room.status !== 'waiting') return;

        // FIX 2: Debug logging
        console.log('[StartGame] Attempting start:', {
            roomId: room.id,
            roomCode: room.room_code,
            userId: user?.id,
            isOwner,
            currentStatus: room.status,
        });

        setStarting(true);

        try {
            const doUpdate = async () => {
                return await supabase
                    .from('rooms')
                    .update({ status: 'playing' })
                    .eq('id', room.id)
                    .select()
                    .single();
            };

            let { data, error } = await doUpdate();
            console.log('[StartGame] Update response:', { data, error });

            // Retry once on auth lock race condition
            if (error && (error.message?.includes('AbortError') || error.message?.includes('Lock broken'))) {
                console.warn('[StartGame] Auth lock race, retrying in 500ms...');
                await new Promise(r => setTimeout(r, 500));
                ({ data, error } = await doUpdate());
                console.log('[StartGame] Retry response:', { data, error });
            }

            // FIX 4: Clear error handling
            if (error) {
                console.error('[StartGame] Update error:', error);
                setStartError(`Failed to start game: ${error.message}`);
                return;
            }

            // FIX 3: Verify the status from DB response
            if (data && data.status === 'playing') {
                console.log('[StartGame] Status confirmed as playing');
                setRoom(prev => prev ? { ...prev, status: 'playing' } : null);
                setStartError('');
            } else {
                // Response didn't confirm — re-fetch from DB to double-check
                console.warn('[StartGame] Response did not confirm status, re-fetching...');
                const { data: refetched } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('id', room.id)
                    .single();

                if (refetched?.status === 'playing') {
                    console.log('[StartGame] Re-fetch confirmed playing');
                    setRoom(refetched as Room);
                    setStartError('');
                } else {
                    console.error('[StartGame] Status still not playing after re-fetch:', refetched?.status);
                    setStartError('Could not start game. The room status was not updated. Please check RLS UPDATE policies.');
                }
            }
        } catch (err) {
            console.error('[StartGame] Exception:', err);
            setStartError(`Failed to start game: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setStarting(false);
        }
    };

    const [currentStageIndex, setCurrentStageIndex] = useState(0);

    const handleJoinRoom = async () => {
        if (!user || !room) return;
        setJoining(true);
        const { error } = await supabase.from('room_players').insert({
            room_id: room.id,
            student_id: user.id
        });
        if (error) {
            console.error('[RoomPage] Join error:', error);
            if (error.message.includes('duplicate')) {
                // Already in room — still refresh list so UI matches DB
                await refetchPlayers();
            }
        } else {
            await refetchPlayers();
        }
        setJoining(false);
    };

    // Filter stages based on the room's selected categories
    const stages: StageOption[] = room?.categories
        ? CATEGORIES.filter(c => room.categories.includes(c.key))
                    .flatMap(c => c.stages)
        : [];

    const roomStageIds = new Set(stages.map((stage) => stage.id));
    const roomStageIdList = stages.map((stage) => stage.id);
    const playerProgress = players.map((player) => {
        const completedSet = new Set(
            scores
                .filter((score) => score.student_id === player.student_id && typeof score.stage_id === 'number' && roomStageIds.has(score.stage_id))
                .map((score) => score.stage_id as number),
        );
        const completedCount = completedSet.size;
        const nextStageIndex = stages.findIndex((stage) => !completedSet.has(stage.id));
        const isFinished = nextStageIndex === -1 && stages.length > 0;

        return {
            playerId: player.id,
            studentId: player.student_id,
            username: player.profiles?.username || 'Unknown',
            completedCount,
            totalStages: stages.length,
            isFinished,
            nextStageTitle: isFinished ? 'Finished all stages' : (stages[nextStageIndex]?.title || 'Waiting to start'),
            currentStageText: isFinished ? '✅ Done' : `Stage ${Math.max(1, nextStageIndex + 1)}/${Math.max(1, stages.length)}`,
        };
    });

    const leaderboardJoinProgress = playerProgress.map((p) => ({
        studentId: p.studentId,
        username: p.username,
        completedCount: p.completedCount,
        totalStages: p.totalStages,
        isFinished: p.isFinished,
    }));

    const CurrentStageComponent = stages[currentStageIndex]?.component;

    const [hasFinishedAll, setHasFinishedAll] = useState(false);

    useEffect(() => {
        if (!room || !user || profile?.role !== 'student' || room.status !== 'playing' || stages.length === 0) return;

        const stageIdsInRoom = new Set(stages.map((s) => s.id));
        const completedSet = new Set(
            scores
                .filter((score) => score.student_id === user.id && typeof score.stage_id === 'number' && stageIdsInRoom.has(score.stage_id))
                .map((score) => score.stage_id as number),
        );
        const nextStageIndex = stages.findIndex((stage) => !completedSet.has(stage.id));

        if (nextStageIndex === -1) {
            setHasFinishedAll(true);
            return;
        }

        setHasFinishedAll(false);
        setCurrentStageIndex(nextStageIndex);
    }, [room, scores, stages, user, profile?.role]);

    /** ขยายเต็มจอเฉพาะ Boxing Quiz (stage 4) — เกมอื่นใช้เลย์เอาต์เดิม max-w-6xl + grid 3 คอลัมน์ */
    const activeRoomStageId =
        profile?.role === 'student' &&
        room?.status === 'playing' &&
        studentHasJoined &&
        !hasFinishedAll &&
        stages.length > 0
            ? stages[currentStageIndex]?.id
            : undefined;
    const isBoxingWideRoomLayout = activeRoomStageId === 4;
    const roomShellMaxClass = isBoxingWideRoomLayout ? 'max-w-screen-2xl' : 'max-w-6xl';
    const roomMainGridClass = isBoxingWideRoomLayout
        ? 'grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_1fr] gap-6 lg:gap-8'
        : 'grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8';
    const roomPlayersColClass = isBoxingWideRoomLayout ? 'space-y-6' : 'space-y-6 lg:col-span-1';
    const roomGameColClass = isBoxingWideRoomLayout ? 'min-w-0 space-y-8' : 'min-w-0 space-y-8 lg:col-span-2';

    // Per-stage play timer for students (stages that call onComplete() without seconds rely on this).
    useEffect(() => {
        if (!studentHasJoined || profile?.role !== 'student' || room?.status !== 'playing' || hasFinishedAll || stages.length === 0) {
            timer.stop();
            return;
        }
        timer.reset();
        timer.start();
        return () => {
            timer.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- useTimer returns fresh function refs each render
    }, [currentStageIndex, room?.status, hasFinishedAll, stages.length, studentHasJoined, profile?.role]);

    const saveRoomScoreRow = async (row: {
        room_id: string;
        student_id: string;
        stage_id: number;
        score: number;
        time: number;
    }) => {
        const { error } = await supabase.from('room_scores').insert(row);
        if (!error) return true;
        const code = 'code' in error ? String((error as { code?: string }).code) : '';
        const msg = error.message || '';
        const isDup = code === '23505' || /duplicate key|unique constraint/i.test(msg);
        if (isDup) {
            const { error: upErr } = await supabase
                .from('room_scores')
                .update({ score: row.score, time: row.time })
                .eq('room_id', row.room_id)
                .eq('student_id', row.student_id)
                .eq('stage_id', row.stage_id);
            if (upErr) {
                console.error('[room_scores] update after duplicate failed:', upErr);
                return false;
            }
            return true;
        }
        console.error('[room_scores] insert failed:', error);
        return false;
    };

    const handleComplete = async (result?: StageScorePayload) => {
        if (!room || !user || profile?.role !== 'student') return;
        const rawSeconds = typeof result?.seconds === 'number' ? result.seconds : timer.seconds;
        timer.stop();

        const targetId = typeof result?.stageId === 'number' ? result.stageId : stages[currentStageIndex]?.id;
        const currentStage = stages.find((s) => s.id === targetId) ?? stages[currentStageIndex];
        if (!currentStage) {
            console.error('[handleComplete] No stage for id', targetId, 'index', currentStageIndex);
            return;
        }

        const timeForDb = Number.isFinite(rawSeconds) && rawSeconds >= 0 ? rawSeconds : 0;
        const quiz = resolveStageQuizStats(currentStage.id, result);
        const finalScore = calculateGlobalStageScore(currentStage.id, timeForDb, quiz.correct, quiz.total);

        console.log('[Room] saving room score', currentStage.id, { timeForDb, finalScore, quiz });

        const ok = await saveRoomScoreRow({
            room_id: room.id,
            student_id: user.id,
            stage_id: currentStage.id,
            score: finalScore,
            time: timeForDb,
        });
        if (!ok) return;

        await refetchScores();
        console.log('Stage complete', currentStageIndex, { timeForDb, finalScore });
    };

    const handleSkipStageForRoom = async () => {
        if (!room || !user || profile?.role !== 'student') return;
        const currentStage = stages[currentStageIndex];
        if (!currentStage) {
            console.warn('[handleSkipStageForRoom] no stage at index', currentStageIndex);
            return;
        }
        timer.stop();
        const timeForDb = Math.max(0, timer.seconds);
        const def = resolveStageQuizStats(currentStage.id);
        const quiz = { correct: 0, total: def.total };
        const finalScore = calculateGlobalStageScore(currentStage.id, timeForDb, quiz.correct, quiz.total);
        const ok = await saveRoomScoreRow({
            room_id: room.id,
            student_id: user.id,
            stage_id: currentStage.id,
            score: finalScore,
            time: timeForDb,
        });
        if (!ok) {
            console.error('[handleSkipStageForRoom] save failed');
            return;
        }
        await refetchScores();
    };

    const handleDeleteRoom = async () => {
        if (!room || !isOwner) return;
        const confirmed = window.confirm('Are you sure you want to delete this room? All scores and player data will be lost.');
        if (!confirmed) return;

        setDeleting(true);
        try {
            // Delete child rows first (order matters for FK constraints)
            const { error: e1 } = await supabase.from('room_scores').delete().eq('room_id', room.id);
            if (e1) {
                console.error('Delete room_scores error:', e1);
                throw e1;
            }
            const { error: e2 } = await supabase.from('room_players').delete().eq('room_id', room.id);
            if (e2) {
                console.error('Delete room_players error:', e2);
                throw e2;
            }
            const { error: e3 } = await supabase.from('rooms').delete().eq('id', room.id);
            if (e3) {
                console.error('Delete rooms error:', e3);
                throw e3;
            }

            // Verify the room was actually deleted (RLS can silently block deletes)
            const { data: checkRoom } = await supabase.from('rooms').select('id').eq('id', room.id).maybeSingle();
            if (checkRoom) {
                console.error('[DeleteRoom] Room still exists after delete — likely blocked by RLS policy');
                alert('Could not delete room. Please check Supabase RLS policies for the rooms table.');
                return;
            }
            console.log('[Room] room delete', room.room_code);

            router.push('/teacher');
        } catch (err: unknown) {
            console.error('Delete room error:', err);
            alert(`Failed to delete room: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-float-slow mb-4">🏟️</div>
                    <p className="text-white/50 font-[var(--font-display)] text-xl">Loading Room...</p>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-red-400 font-[var(--font-display)] text-xl mb-2">
                        {roomError || 'Room not found.'}
                    </p>
                    <p className="text-white/40 text-sm mb-6">
                        Make sure you entered the correct 6-character room code.
                    </p>
                    <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
                        🏠 Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1628]">
            {/* Header */}
            <div className="hero-gradient py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <span className="absolute top-[20%] right-[5%] text-4xl animate-float opacity-30">🏟️</span>
                </div>
                <div className={`${roomShellMaxClass} mx-auto relative z-10 flex justify-between items-center`}>
                    <div>
                        <h1 className="text-3xl font-[var(--font-display)] font-bold text-white mb-1">
                            Room:{' '}
                            <span className="font-mono bg-white/10 px-4 py-1.5 rounded-xl text-sunny tracking-[0.3em] text-4xl border border-white/20">
                                {roomCode}
                            </span>
                        </h1>
                        <p className="text-white/50 mt-2 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${room.status === 'waiting' ? 'bg-yellow-400 animate-pulse' :
                                room.status === 'playing' ? 'bg-green-400 animate-pulse' :
                                    'bg-gray-400'
                                }`}></span>
                            Status: <span className="text-white font-semibold capitalize">{room.status}</span>
                        </p>
                    </div>
                    {room.status === 'playing' && profile?.role === 'student' && !hasFinishedAll && <GameTimer timer={timer} />}
                </div>
            </div>

            <div className={`${roomShellMaxClass} mx-auto py-8 px-3 sm:px-6 lg:px-8`}>
                <div className={roomMainGridClass}>
                    {/* Players List */}
                    <div className={roomPlayersColClass}>
                        <Card>
                            <CardHeader>
                                <CardTitle>👥 Players ({players.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {playerProgress.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="text-3xl mb-2 opacity-50">👤</div>
                                        <p className="text-white/30 text-sm italic">Waiting for players to join...</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {playerProgress.map((player) => (
                                            <li key={player.playerId} className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                                                    <span className="text-white font-medium">{player.username}</span>
                                                </div>
                                                <div className="mt-1.5 pl-5 text-xs text-white/70 flex items-center justify-between gap-3">
                                                    <span>{player.currentStageText}</span>
                                                    <span className={player.isFinished ? 'text-emerald-300 font-semibold' : 'text-sky-300'}>
                                                        {player.nextStageTitle}
                                                    </span>
                                                </div>
                                                <div className="mt-1 pl-5">
                                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400"
                                                            style={{ width: `${player.totalStages > 0 ? (player.completedCount / player.totalStages) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {isOwner && room.status === 'waiting' && (
                            <>
                                <Button onClick={handleStartGame} disabled={starting || players.length === 0} fullWidth size="lg" className="text-xl py-5">
                                    {starting ? '⏳ Starting...' : '🚀 Start Game!'}
                                </Button>
                                {players.length === 0 && (
                                    <p className="text-white/30 text-sm mt-2 text-center">
                                        Waiting for at least one player to join before starting.
                                    </p>
                                )}
                                {startError && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl mt-4">
                                        ⚠️ {startError}
                                    </div>
                                )}
                            </>
                        )}

                        {isOwner && (
                            <button
                                onClick={handleDeleteRoom}
                                disabled={deleting}
                                className="w-full mt-3 py-3 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 cursor-pointer disabled:opacity-50"
                            >
                                {deleting ? '⏳ Deleting...' : '🗑️ Delete Room'}
                            </button>
                        )}

                        {isTeacherButNotOwner && (
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
                                ⚠️ You are not the owner of this room. Only the creator can manage it.
                            </div>
                        )}
                    </div>

                    {/* Main Area — Boxing: กว้างเต็มที่; เกมอื่น: 2/3 ของ max-w-6xl */}
                    <div className={roomGameColClass}>
                        {!isParticipant ? (
                            <Card>
                                <CardContent className="py-20 text-center">
                                    <div className="text-6xl mb-6">👋</div>
                                    <h2 className="text-3xl font-[var(--font-display)] font-bold text-white mb-4">
                                        Ready to join?
                                    </h2>
                                    <p className="text-white/50 mb-8">
                                        You are joining as <span className="text-sunny font-bold">{profile?.username}</span>
                                    </p>
                                    <Button onClick={handleJoinRoom} disabled={joining} size="lg" className="text-xl py-4 px-12">
                                        {joining ? '⏳ Joining...' : '🚀 Join Game'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : room.status === 'waiting' && isOwner && profile?.role === 'teacher' ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <div className="text-6xl mb-6">👨‍🏫</div>
                                    <h2 className="text-3xl font-[var(--font-display)] font-bold text-white mb-3">
                                        You are the host
                                    </h2>
                                    <p className="text-white/50 max-w-md mx-auto mb-2">
                                        When students have joined, press <span className="text-sunny font-semibold">Start Game!</span> in the left panel.
                                    </p>
                                    <p className="text-white/35 text-sm">
                                        {players.length} player{players.length === 1 ? '' : 's'} in this room
                                    </p>
                                </CardContent>
                            </Card>
                        ) : room.status === 'waiting' && profile?.role === 'student' && studentHasJoined ? (
                            <Card>
                                <CardContent className="py-20 text-center">
                                    <div className="text-6xl mb-6 animate-float-slow">⏳</div>
                                    <h2 className="text-3xl font-[var(--font-display)] font-bold text-white/50">
                                        Waiting for teacher to start...
                                    </h2>
                                    <p className="text-white/30 mt-3">Get ready! The game will begin shortly.</p>
                                </CardContent>
                            </Card>
                        ) : room.status === 'waiting' ? (
                            <Card>
                                <CardContent className="py-16 text-center text-white/50">
                                    <p>Waiting for the host to start this room.</p>
                                </CardContent>
                            </Card>
                        ) : room.status === 'playing' && stages.length === 0 ? (
                            <Card>
                                <CardContent className="py-20 text-center">
                                    <div className="text-6xl mb-6">⚠️</div>
                                    <h2 className="text-2xl font-[var(--font-display)] font-bold text-white/50">
                                        No stages available
                                    </h2>
                                    <p className="text-white/30 mt-3">This room has no playable stages for the selected categories.</p>
                                </CardContent>
                            </Card>
                        ) : room.status === 'playing' ? (
                            profile?.role === 'student' ? (
                                hasFinishedAll ? (
                                    <Card>
                                        <CardContent className="py-20 text-center">
                                            <div className="text-6xl mb-6 animate-float-slow">🏆</div>
                                            <h2 className="text-3xl font-[var(--font-display)] font-bold text-sunny">
                                                All Stages Completed!
                                            </h2>
                                            <p className="text-white/60 mt-3 mb-6">You&apos;ve finished the teacher&apos;s challenges. See how you rank below!</p>
                                            <RoomLeaderboard
                                                scores={scores}
                                                roomStageIds={roomStageIdList}
                                                joinProgress={leaderboardJoinProgress}
                                            />
                                            <div className="mt-8 flex justify-center">
                                                <Button size="lg" onClick={() => router.push('/dashboard')}>
                                                    กลับ Dashboard
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="!overflow-visible">
                                        <CardHeader>
                                            <CardTitle>{stages[currentStageIndex]?.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent
                                            className={
                                                isBoxingWideRoomLayout
                                                    ? 'min-w-0 max-w-full overflow-x-hidden px-2 sm:px-6 py-4 sm:py-6'
                                                    : 'min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6'
                                            }
                                        >
                                            {CurrentStageComponent ? (
                                                <>
                                                    <CurrentStageComponent
                                                        key={`${room.id}-${stages[currentStageIndex]?.id ?? currentStageIndex}`}
                                                        onComplete={(payload) => {
                                                            const sid = stages[currentStageIndex]?.id;
                                                            if (sid == null) return;
                                                            void handleComplete({ ...payload, stageId: sid });
                                                        }}
                                                        isActive={true}
                                                        onRoomSkip={() => {
                                                            void handleSkipStageForRoom();
                                                        }}
                                                        onBackToDashboard={() => router.push('/dashboard')}
                                                    />
                                                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                                                        <Button
                                                            variant="secondary"
                                                            type="button"
                                                            onClick={() => {
                                                                void handleSkipStageForRoom();
                                                            }}
                                                        >
                                                            ข้ามด่านนี้ (ไปด่านถัดไป — คิดคะแนนตามผลที่ทำได้)
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-20">
                                                    <div className="text-6xl mb-4">🚧</div>
                                                    <h3 className="text-2xl text-white/50 font-bold mb-4">Content coming soon</h3>
                                                    <Button onClick={() => { void handleSkipStageForRoom(); }}>ข้ามด่านนี้</Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <RoomLeaderboard
                                    scores={scores}
                                    roomStageIds={roomStageIdList}
                                    joinProgress={leaderboardJoinProgress}
                                />
                            )
                        ) : (
                            <RoomLeaderboard
                                scores={scores}
                                roomStageIds={roomStageIdList}
                                joinProgress={leaderboardJoinProgress}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
