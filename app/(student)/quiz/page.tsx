'use client';

import { useAuth } from '@/lib/hooks/AuthProvider';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { QUIZZES } from '@/lib/constants/quizzes';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type QuizCategoryKey = 'HTML' | 'CSS' | 'JavaScript';

const QUIZ_CATEGORIES: Array<{
    key: QuizCategoryKey;
    label: string;
    icon: ReactNode;
    colorHex: string;
    borderHex: string;
}> = [
        {
            key: 'HTML',
            label: 'HTML',
            icon: <i className="fa-solid fa-globe"></i>,
            colorHex: '#2196F3',
            borderHex: '#64B5F6',
        },
        {
            key: 'CSS',
            label: 'CSS',
            icon: <i className="fa-solid fa-palette"></i>,
            colorHex: '#FFD600',
            borderHex: '#FFF176',
        },
        {
            key: 'JavaScript',
            label: 'JavaScript',
            icon: <i className="fa-brands fa-js"></i>,
            colorHex: '#FF7043',
            borderHex: '#FF8A65',
        },
    ];

const QUIZ_SCORE_STORAGE_KEY = 'quiz_scores:v1';

type StoredQuizScore = {
    correct: number;
    total: number;
    updatedAt: string;
};

const getDifficultyBadgeClass = (difficulty: 'Basic' | 'Medium' | 'Hard') => {
    if (difficulty === 'Basic') return 'bg-green-500/20 text-green-300';
    if (difficulty === 'Medium') return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
};

export default function QuizPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [expandedCategory, setExpandedCategory] = useState<QuizCategoryKey | null>('HTML');
    const [scoreMap, setScoreMap] = useState<Record<string, StoredQuizScore>>({});

    const orderedQuizzes = useMemo(() => [...QUIZZES].sort((a, b) => a.id - b.id), []);

    const quizzesByCategory = useMemo(() => {
        const grouped: Record<QuizCategoryKey, typeof QUIZZES> = {
            HTML: [],
            CSS: [],
            JavaScript: [],
        };
        for (const quiz of orderedQuizzes) {
            grouped[quiz.category].push(quiz);
        }
        return grouped;
    }, [orderedQuizzes]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const loadScores = () => {
            const userKey = user?.id || 'guest';
            try {
                const raw = window.localStorage.getItem(QUIZ_SCORE_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) as Record<string, Record<string, StoredQuizScore>> : {};
                setScoreMap(parsed[userKey] || {});
            } catch {
                setScoreMap({});
            }
        };

        loadScores();
        window.addEventListener('quiz_scores_updated', loadScores);
        window.addEventListener('storage', loadScores);
        return () => {
            window.removeEventListener('quiz_scores_updated', loadScores);
            window.removeEventListener('storage', loadScores);
        };
    }, [user?.id]);

    const totalCorrect = useMemo(
        () => Object.values(scoreMap).reduce((sum, item) => sum + (item.correct || 0), 0),
        [scoreMap],
    );
    const totalQuestions = useMemo(
        () => Object.values(scoreMap).reduce((sum, item) => sum + (item.total || 0), 0),
        [scoreMap],
    );
    const completedQuizCount = Object.keys(scoreMap).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white/60">Loading quizzes...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1628]">
            <div className="hero-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl font-[var(--font-display)] font-bold text-white mb-2">
                        Quiz Zone 🧠
                    </h1>
                    <p className="text-white/60 text-lg">
                        Fill-in-the-blank coding quizzes for {profile?.username || 'player'}.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-[var(--font-display)] font-bold text-white mb-6">
                    <i className="fa-solid fa-bullseye mr-2"></i> Select a Category
                </h2>

                <div className="flex flex-col gap-4">
                    {QUIZ_CATEGORIES.map((category) => {
                        const isOpen = expandedCategory === category.key;
                        const categoryQuizzes = quizzesByCategory[category.key];

                        return (
                            <div key={category.key}>
                                <button
                                    type="button"
                                    onClick={() => setExpandedCategory((prev) => (prev === category.key ? null : category.key))}
                                    className="w-full flex items-center justify-between rounded-2xl px-6 py-5 sm:py-6 text-left transition-all duration-300 cursor-pointer group"
                                    style={{
                                        background: isOpen
                                            ? `linear-gradient(135deg, ${category.colorHex}22 0%, ${category.colorHex}11 100%)`
                                            : 'rgba(255,255,255,0.06)',
                                        border: `2px solid ${isOpen ? category.borderHex + '55' : 'rgba(255,255,255,0.08)'}`,
                                        boxShadow: isOpen ? `0 0 24px ${category.colorHex}18` : 'none',
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110">
                                            {category.icon}
                                        </span>
                                        <span className="text-2xl sm:text-3xl font-[var(--font-display)] font-bold text-white tracking-wide">
                                            {category.label}
                                        </span>
                                        <span
                                            className="ml-2 text-xs font-bold px-3 py-1 rounded-full"
                                            style={{ backgroundColor: category.colorHex + '25', color: category.borderHex }}
                                        >
                                            {categoryQuizzes.length} Quizzes
                                        </span>
                                    </div>
                                    <svg
                                        className={`w-6 h-6 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div
                                    className="overflow-hidden transition-all duration-400 ease-in-out"
                                    style={{ maxHeight: isOpen ? '800px' : '0px', opacity: isOpen ? 1 : 0 }}
                                >
                                    {categoryQuizzes.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-2 px-1">
                                            {categoryQuizzes.map((quiz, idx) => (
                                                <button
                                                    key={quiz.id}
                                                    type="button"
                                                    onClick={() => router.push(`/quiz/${quiz.id}`)}
                                                    className="block w-full text-left"
                                                >
                                                    <div style={{ animationDelay: `${idx * 0.08}s` }}>
                                                        <Card className="game-card glass-card rounded-2xl p-6 cursor-pointer group relative overflow-hidden w-full">
                                                            <CardContent className="p-0">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <span className="text-5xl group-hover:animate-wave">{quiz.icon}</span>
                                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDifficultyBadgeClass(quiz.difficulty)}`}>
                                                                        {quiz.difficulty}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-white/10 text-sky-300">
                                                                        Q{quiz.id}
                                                                    </div>
                                                                    <h3 className="text-lg font-[var(--font-display)] font-bold text-white">{quiz.title}</h3>
                                                                </div>
                                                                <p className="text-white/40 text-sm mb-3">{quiz.description}</p>
                                                                {scoreMap[String(quiz.id)] ? (
                                                                    <p className="text-xs text-emerald-300 mb-2">
                                                                        Score: {scoreMap[String(quiz.id)].correct}/{scoreMap[String(quiz.id)].total}
                                                                    </p>
                                                                ) : null}
                                                                <div className="absolute inset-0 group-hover:opacity-100 animate-shimmer rounded-2xl pointer-events-none"></div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="pt-4 pb-2 px-1">
                                            <div className="glass-card rounded-2xl p-8 text-center">
                                                <span className="text-5xl mb-3 block">
                                                    <i className="fa-solid fa-lock text-white/20"></i>
                                                </span>
                                                <p className="text-white/40 font-[var(--font-display)] font-bold text-lg">Coming Soon</p>
                                                <p className="text-white/25 text-sm mt-1">New quiz challenges are on the way!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-xl font-[var(--font-display)] font-bold text-white mb-3">
                        <i className="fa-solid fa-chart-line mr-2"></i> Quiz Score Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                            Completed Quizzes: <span className="font-bold text-cyan-200">{completedQuizCount}/{orderedQuizzes.length}</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                            Total Correct: <span className="font-bold text-emerald-300">{totalCorrect}</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                            Total Score: <span className="font-bold text-yellow-300">{totalCorrect}/{totalQuestions}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
