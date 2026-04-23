'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QUIZZES } from '@/lib/constants/quizzes';
import type { StageScorePayload } from '@/lib/utils/score';
import { useAuth } from '@/lib/hooks/AuthProvider';

const QUIZ_SCORE_STORAGE_KEY = 'quiz_scores:v1';

export default function QuizDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const quizId = Number(params?.quizId);
    const [completed, setCompleted] = useState(false);
    const [result, setResult] = useState<StageScorePayload | undefined>(undefined);

    const orderedQuizzes = useMemo(() => [...QUIZZES].sort((a, b) => a.id - b.id), []);
    const quizIndex = orderedQuizzes.findIndex((q) => q.id === quizId);
    const quiz = quizIndex >= 0 ? orderedQuizzes[quizIndex] : null;
    const nextQuiz = quizIndex >= 0 && quizIndex + 1 < orderedQuizzes.length ? orderedQuizzes[quizIndex + 1] : null;

    const scoreText = useMemo(() => {
        if (!result) return '';
        if (typeof result.correct === 'number' && typeof result.total === 'number') {
            return `${result.correct}/${result.total}`;
        }
        return '';
    }, [result]);

    const persistQuizScore = (payload?: StageScorePayload) => {
        if (typeof window === 'undefined' || !quiz) return;
        const correct = typeof payload?.correct === 'number' ? payload.correct : 0;
        const total = typeof payload?.total === 'number' ? payload.total : 0;
        const userKey = user?.id || 'guest';

        try {
            const raw = window.localStorage.getItem(QUIZ_SCORE_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) as Record<string, Record<string, { correct: number; total: number; updatedAt: string }>> : {};
            const userScores = parsed[userKey] || {};
            userScores[String(quiz.id)] = {
                correct,
                total,
                updatedAt: new Date().toISOString(),
            };
            parsed[userKey] = userScores;
            window.localStorage.setItem(QUIZ_SCORE_STORAGE_KEY, JSON.stringify(parsed));
            window.dispatchEvent(new CustomEvent('quiz_scores_updated'));
        } catch (error) {
            console.warn('[QuizDetail] Failed to persist quiz score:', error);
        }
    };

    if (!quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-red-300">Quiz not found.</p>
                </div>
            </div>
        );
    }

    const QuizComponent = quiz.component;

    return (
        <div className="min-h-screen bg-[#0a1628] relative">
            <div className="bg-ocean/80 backdrop-blur-xl border-b border-white/10 py-3 px-4 sm:px-6 lg:px-8 sticky top-[72px] z-40">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">{quiz.icon}</span>
                        <div>
                            <h1 className="text-xl font-[var(--font-display)] font-bold text-white">{quiz.title}</h1>
                            <p className="text-white/40 text-sm">Quiz {quiz.id}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!completed ? (
                    <Card className="relative bg-[#112240] border-white/10 shadow-2xl">
                        <CardContent className="pt-6">
                            <QuizComponent
                                isActive={true}
                                onComplete={(payload) => {
                                    persistQuizScore(payload);
                                    setResult(payload);
                                    setCompleted(true);
                                }}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="relative bg-[#112240] border-white/10 shadow-2xl">
                        <CardContent className="pt-10 pb-10 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-3xl font-[var(--font-display)] font-bold text-white mb-2">Quiz Complete!</h2>
                            {scoreText ? <p className="text-cyan-200 mb-6">Score: {scoreText}</p> : null}
                            <p className="text-white/50 mb-5">Stage {Math.max(1, quizIndex + 1)} of {orderedQuizzes.length}</p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {nextQuiz ? (
                                    <Button onClick={() => router.push(`/quiz/${nextQuiz.id}`)}>
                                        {nextQuiz.icon} Next Quiz
                                    </Button>
                                ) : (
                                    <Button onClick={() => router.push('/quiz')}>Back to Quiz List</Button>
                                )}
                                <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                                    Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
