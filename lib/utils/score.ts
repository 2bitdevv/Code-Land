export type StageScorePayload = {
    success?: boolean;
    seconds?: number;
    correct?: number;
    total?: number;
    /** When set (e.g. room play), parent records this stage even if React state advances. */
    stageId?: number;
};

export const DEFAULT_STAGE_QUIZ_STATS: Record<number, { correct: number; total: number }> = {
    1: { correct: 3, total: 3 },
    2: { correct: 5, total: 5 },
    3: { correct: 3, total: 3 },
    4: { correct: 3, total: 3 },
    5: { correct: 1, total: 1 },
    6: { correct: 1, total: 1 },
    101: { correct: 1, total: 1 },
    102: { correct: 4, total: 4 },
};

export function resolveStageQuizStats(stageId: number, payload?: StageScorePayload) {
    const fallback = DEFAULT_STAGE_QUIZ_STATS[stageId] ?? { correct: 1, total: 1 };
    const correct = typeof payload?.correct === 'number' ? payload.correct : fallback.correct;
    const total = typeof payload?.total === 'number' ? payload.total : fallback.total;
    return {
        correct: Math.max(0, correct),
        total: Math.max(1, total),
    };
}

/** Legacy time-only score (room_scores / backward compat for old global rows). */
export function calculateStageScore(completionTimeInSeconds: number): number {
    if (!Number.isFinite(completionTimeInSeconds)) return 0;

    return Math.max(20, 120 - Math.floor(Math.max(0, completionTimeInSeconds) / 3));
}

/** Per-stage caps & difficulty multipliers (Easy 1.0 / Medium 1.1 / Hard 1.2). */
export const GLOBAL_STAGE_SCORING_PARAMS: Record<number, { allocatedSeconds: number; difficulty: number }> = {
    1: { allocatedSeconds: 180, difficulty: 1.0 },
    2: { allocatedSeconds: 180, difficulty: 1.0 },
    3: { allocatedSeconds: 200, difficulty: 1.1 },
    4: { allocatedSeconds: 200, difficulty: 1.1 },
    5: { allocatedSeconds: 300, difficulty: 1.2 },
    6: { allocatedSeconds: 900, difficulty: 1.2 },
    101: { allocatedSeconds: 400, difficulty: 1.0 },
    102: { allocatedSeconds: 240, difficulty: 1.0 },
};

/**
 * Global solo stage score (one stage).
 * Accuracy = correct/total, TimeBonus = max(0.6, 1 - time/allocated),
 * base = Accuracy * 100 * TimeBonus * Difficulty,
 * minus wrong*5, +10 if perfect, +5 if time <= 30% of allocated, rounded.
 */
export function calculateGlobalStageScore(
    stageId: number,
    timeSeconds: number,
    correct: number,
    total: number,
): number {
    const { allocatedSeconds, difficulty } = GLOBAL_STAGE_SCORING_PARAMS[stageId]
        ?? { allocatedSeconds: 300, difficulty: 1.0 };

    const t = Math.max(0, timeSeconds);
    const alloc = Math.max(1, allocatedSeconds);
    const tot = Math.max(1, Math.round(total));
    const corr = Math.min(Math.max(0, Math.round(correct)), tot);

    const accuracy = corr / tot;
    const timeBonus = Math.max(0.6, 1 - t / alloc);
    const base = accuracy * 100 * timeBonus * difficulty;
    const wrong = tot - corr;
    let score = base - wrong * 5;
    if (wrong === 0) score += 10;
    if (t <= alloc * 0.3) score += 5;
    return Math.round(Math.max(0, score));
}
