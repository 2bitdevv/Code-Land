'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScoreWithProfile } from '@/lib/types';

interface RoomLeaderboardProps {
    scores: ScoreWithProfile[];
    /** Stage ids included in this room (teacher selection); all must have a best score to rank. */
    roomStageIds: number[];
    /** When set, "กำลังเล่น" uses join + progress (realtime); otherwise derived from scores only. */
    joinProgress?: Array<{
        studentId: string;
        username: string;
        completedCount: number;
        totalStages: number;
        isFinished: boolean;
    }>;
}

interface AggregatedRoomPlayer {
    studentId: string;
    username: string;
    totalScore: number;
    totalTime: number;
    stagesCompleted: number;
}

function aggregateByPlayer(scores: ScoreWithProfile[], roomStageIds: Set<number>) {
    const bestByStage = new Map<number, Map<string, { time: number; username: string; score: number }>>();

    for (const row of scores) {
        const studentId = row.student_id;
        if (!studentId) continue;
        const stageId =
            typeof row.stage_id === 'number' && Number.isFinite(row.stage_id)
                ? row.stage_id
                : typeof row.stage_id === 'string'
                  ? parseInt(row.stage_id, 10)
                  : NaN;
        if (!Number.isFinite(stageId) || !roomStageIds.has(stageId)) continue;
        const rowTime =
            typeof row.time === 'number' && Number.isFinite(row.time)
                ? row.time
                : typeof row.time === 'string'
                  ? parseFloat(row.time)
                  : row.time == null
                    ? 0
                    : NaN;
        if (!Number.isFinite(rowTime) || rowTime < 0) continue;

        if (!bestByStage.has(stageId)) {
            bestByStage.set(stageId, new Map());
        }

        const stageEntries = bestByStage.get(stageId)!;
        const currentBest = stageEntries.get(studentId);
        const resolvedScore =
            typeof row.score === 'number' && Number.isFinite(row.score)
                ? row.score
                : typeof row.score === 'string'
                  ? parseFloat(row.score) || 0
                  : 0;
        if (
            !currentBest
            || resolvedScore > currentBest.score
            || (resolvedScore === currentBest.score && rowTime < currentBest.time)
        ) {
            stageEntries.set(studentId, {
                time: rowTime,
                score: resolvedScore,
                username:
                    (typeof row.profiles === 'object' && row.profiles && 'username' in row.profiles
                        ? (row.profiles as { username?: string }).username
                        : undefined)
                    || currentBest?.username
                    || 'Unknown',
            });
        }
    }

    const playerMap = new Map<string, AggregatedRoomPlayer>();

    for (const [, stageEntries] of bestByStage) {
        for (const [studentId, entry] of stageEntries) {
            if (!playerMap.has(studentId)) {
                playerMap.set(studentId, {
                    studentId,
                    username: entry.username || 'Unknown',
                    totalScore: 0,
                    totalTime: 0,
                    stagesCompleted: 0,
                });
            }
            const player = playerMap.get(studentId)!;
            if (player.username === 'Unknown' && entry.username) player.username = entry.username;
            player.totalScore += entry.score;
            player.totalTime += entry.time;
            player.stagesCompleted += 1;
        }
    }

    const required = roomStageIds.size;
    const all = Array.from(playerMap.values()).map((p) => ({
        ...p,
        isEligible: required > 0 && p.stagesCompleted >= required,
    }));

    const ranked = all
        .filter((p) => p.isEligible)
        .sort((a, b) =>
            b.totalScore !== a.totalScore
                ? b.totalScore - a.totalScore
                : b.stagesCompleted !== a.stagesCompleted
                    ? b.stagesCompleted - a.stagesCompleted
                    : a.totalTime - b.totalTime,
        );

    const stillPlaying = all.filter((p) => !p.isEligible).sort((a, b) => b.stagesCompleted - a.stagesCompleted);

    return { ranked, stillPlaying, requiredStages: required };
}

const FORMULA_BLURB = `คะแนนต่อด่าน = ปัดเป็นจำนวนเต็มของ (Accuracy×100×TimeBonus×Difficulty) − (ข้อผิด×5) + โบนัส
• Accuracy = ถูก ÷ ข้อทั้งหมด
• TimeBonus = max(0.6, 1 − เวลาที่ใช้ ÷ เวลาที่กำหนดต่อด่าน)
• Difficulty = ตัวคูณต่อด่าน (ประมาณ 1.0–1.2 ตามด่าน)
• ถูกหมด +10 | ใช้เวลาไม่เกิน 30% ของเวลาที่กำหนด +5
คะแนนรวม = ผลรวมคะแนนดีที่สุดต่อด่านในรอบนี้ | เวลารวม = ผลรวมเวลาดีที่สุดต่อด่าน`;

export function RoomLeaderboard({ scores, roomStageIds, joinProgress }: RoomLeaderboardProps) {
    const idSet = useMemo(() => new Set(roomStageIds), [roomStageIds]);
    const { ranked, stillPlaying, requiredStages } = useMemo(
        () => aggregateByPlayer(scores, idSet),
        [scores, idSet],
    );

    /** Prefer live join list from the room page so names/progress update without score rows yet. */
    const waitingRows = useMemo(() => {
        if (joinProgress !== undefined) {
            return joinProgress
                .filter((p) => !p.isFinished && p.totalStages > 0)
                .map((p) => ({
                    studentId: p.studentId,
                    username: p.username,
                    completed: p.completedCount,
                    total: p.totalStages,
                }));
        }
        return stillPlaying.map((p) => ({
            studentId: p.studentId,
            username: p.username,
            completed: p.stagesCompleted,
            total: requiredStages || 0,
        }));
    }, [joinProgress, stillPlaying, requiredStages]);

    return (
        <div className="space-y-6">
            <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-950/35 to-slate-950/50 shadow-lg shadow-violet-900/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>📐 วิธีคำนวณคะแนน (ห้องเรียน)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-white/55 text-sm leading-relaxed whitespace-pre-line">{FORMULA_BLURB}</p>
                    <p className="text-white/40 text-xs mt-3">
                        อันดับด้านล่างแสดงเฉพาะผู้ที่เล่นครบทุกด่านที่ครูเลือก ({requiredStages} ด่าน) — คนอื่นจะขึ้นในรายการ &quot;กำลังเล่น&quot; จนกว่าจะครบ
                    </p>
                </CardContent>
            </Card>

            <Card className="border border-white/10 bg-white/[0.03] shadow-xl shadow-black/20">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>👨‍🏫 Leaderboard ห้องนี้</CardTitle>
                    <span className="text-xs bg-green-500/20 text-green-300 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-green-500/30">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        LIVE
                    </span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-14">#</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Player</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Total score</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Total time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ranked.map((player, index) => (
                                    <tr key={player.studentId} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-[var(--font-display)] font-bold text-white/30">
                                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">{player.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-sunny">{player.totalScore}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-sky-light">{player.totalTime}s</td>
                                    </tr>
                                ))}
                                {ranked.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <p className="text-white/40 italic font-[var(--font-display)]">
                                                ยังไม่มีใครเล่นครบทุกด่านในห้องนี้ — อันดับจะค่อยๆ เติมเมื่อนักเรียนจบครบ
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {stillPlaying.length > 0 ? (
                        <div className="border-t border-white/10 px-6 py-4 bg-white/[0.02]">
                            <p className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-2">
                                คะแนนในห้อง (ยังไม่ครบทุกด่าน — จากข้อมูลที่บันทึกแล้ว)
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-white/40 border-b border-white/10">
                                            <th className="py-2 pr-4 font-semibold">ผู้เล่น</th>
                                            <th className="py-2 pr-4 font-semibold text-right">ด่านที่ทำ</th>
                                            <th className="py-2 pr-4 font-semibold text-right">คะแนนรวม</th>
                                            <th className="py-2 font-semibold text-right">เวลารวม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-white/80">
                                        {stillPlaying.map((p) => (
                                            <tr key={p.studentId}>
                                                <td className="py-2 pr-4 font-medium text-white">{p.username}</td>
                                                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                                                    {p.stagesCompleted}/{requiredStages || '—'}
                                                </td>
                                                <td className="py-2 pr-4 text-right font-mono tabular-nums text-sunny">{p.totalScore}</td>
                                                <td className="py-2 text-right font-mono tabular-nums text-sky-light">{p.totalTime}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {waitingRows.length > 0 ? (
                        <div className="border-t border-white/10 px-6 py-4 bg-white/[0.02]">
                            <p className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-2">กำลังเล่น (ความคืบหน้าแบบเรียลไทม์)</p>
                            <ul className="space-y-1.5 text-sm text-white/70">
                                {waitingRows.map((p) => (
                                    <li key={p.studentId} className="flex justify-between gap-4">
                                        <span>{p.username}</span>
                                        <span className="text-white/45 font-mono">
                                            {p.completed}/{p.total || '—'} ด่าน
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
