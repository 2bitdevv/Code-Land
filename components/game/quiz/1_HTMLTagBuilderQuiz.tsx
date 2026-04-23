"use client";

import { useMemo, useState } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

type FillQuestion = {
  id: number;
  level: "beginner" | "intermediate";
  title: string;
  prompt: string;
  codePrefix: string;
  codeMiddle: string;
  codeSuffix: string;
  answers: [string, string];
  tokens: string[];
};

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const QUESTIONS: FillQuestion[] = [
  {
    id: 1,
    level: "beginner",
    title: "ข้อที่ 1",
    prompt: "เติมแท็กที่หายไปในโครงหน้าเว็บ",
    codePrefix: "<html>\n  ",
    codeMiddle: "\n    <h1>My Page</h1>\n    <p>Hello World</p>\n  ",
    codeSuffix: "\n</html>",
    answers: ["<body>", "</body>"],
    tokens: ["<body>", "</body>", "<main>", "</main>", "<section>", "</section>"],
  },
  {
    id: 2,
    level: "beginner",
    title: "ข้อที่ 2",
    prompt: "เติมแท็กนำทางและแท็กปิดส่วนหลัก",
    codePrefix: "<main>\n  ",
    codeMiddle: '\n    <a href="/">Home</a>\n    <a href="/about">About</a>\n  </nav>\n  ',
    codeSuffix: "\n",
    answers: ["<nav>", "</main>"],
    tokens: ["<nav>", "</main>", "</nav>", "<aside>", "<header>", "</header>"],
  },
  {
    id: 3,
    level: "intermediate",
    title: "ข้อที่ 3",
    prompt: "เติมแท็กเปิดกับปิดที่ไม่ใช่คู่เดียวกัน",
    codePrefix: "<html>\n  <body>\n  ",
    codeMiddle: "\n    <h2>Dashboard</h2>\n    <p>Welcome back!</p>\n  </main>\n  ",
    codeSuffix: "\n</html>",
    answers: ["<main>", "</body>"],
    tokens: ["<main>", "</body>", "<body>", "</main>", "<footer>", "</footer>"],
  },
];

export function HTMLCommentSyntax_1_3({ onComplete, isActive }: StageProps) {
  const [index, setIndex] = useState(0);
  const [activeBlank, setActiveBlank] = useState<0 | 1>(0);
  const [blanks, setBlanks] = useState<[string, string]>(["", ""]);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [wrongCount, setWrongCount] = useState(0);

  const current = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;
  const canSubmit = blanks[0].length > 0 && blanks[1].length > 0 && !busy && isActive;

  const progressText = useMemo(() => `${index + 1}/${QUESTIONS.length}`, [index]);
  const shuffledTokens = useMemo(() => shuffleArray(current.tokens), [index]);

  const resetForNext = () => {
    setBlanks(["", ""]);
    setActiveBlank(0);
    setFeedback("idle");
    setBusy(false);
  };

  const fillWithToken = (token: string) => {
    if (busy || !isActive) return;
    setBlanks((prev) => {
      const next: [string, string] = [...prev] as [string, string];
      next[activeBlank] = token;
      return next;
    });
    setActiveBlank((prev) => (prev === 0 ? 1 : 0));
  };

  const clearAnswers = () => {
    if (busy) return;
    setBlanks(["", ""]);
    setActiveBlank(0);
    setFeedback("idle");
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const isCorrect = blanks[0] === current.answers[0] && blanks[1] === current.answers[1];
    setBusy(true);
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(nextScore);
      setFeedback("correct");
    } else {
      setWrongCount((v) => v + 1);
      setFeedback("wrong");
    }

    setTimeout(() => {
      if (isLast) {
        onComplete?.({ correct: nextScore, total: QUESTIONS.length });
        return;
      }
      setIndex((v) => v + 1);
      resetForNext();
    }, 950);
  };

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-slate-900/80 p-5 text-white max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Quiz 1: HTML Tag Builder</h2>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{progressText}</span>
      </div>

      <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-semibold">{current.title}</p>
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] text-green-200">{current.level}</span>
        </div>
        <p className="text-sm text-cyan-200">{current.prompt}</p>
      </div>

      <div className="mb-4 rounded-xl bg-black/40 p-4 font-mono text-sm leading-8 whitespace-pre-wrap">
        <span>{current.codePrefix}</span>
        <button type="button" onClick={() => setActiveBlank(0)} className={`mx-1 rounded-md border-2 px-2 py-1 ${activeBlank === 0 ? "border-cyan-300 bg-cyan-500/20" : "border-white/30 bg-white/10"}`}>
          {blanks[0] || "_____"}
        </button>
        <span>{current.codeMiddle}</span>
        <button type="button" onClick={() => setActiveBlank(1)} className={`mx-1 rounded-md border-2 px-2 py-1 ${activeBlank === 1 ? "border-cyan-300 bg-cyan-500/20" : "border-white/30 bg-white/10"}`}>
          {blanks[1] || "_____"}
        </button>
        <span>{current.codeSuffix}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {shuffledTokens.map((token) => (
          <button key={token} type="button" disabled={busy || !isActive} onClick={() => fillWithToken(token)} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-50">
            {token}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-300">
          Correct: <span className="font-bold text-emerald-300">{score}</span> / {QUESTIONS.length} | Wrong: <span className="font-bold text-rose-300">{wrongCount}</span>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            ตรวจคำตอบ
          </button>
          <button type="button" onClick={clearAnswers} disabled={busy} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            ล้างคำตอบ
          </button>
        </div>
      </div>

      {feedback === "correct" ? <p className="mt-3 text-sm font-semibold text-emerald-300">Correct! โครงสร้าง HTML ข้อนี้ถูกต้องแล้ว</p> : null}
      {feedback === "wrong" ? <p className="mt-3 text-sm font-semibold text-rose-300">ยังไม่ถูก ลองเช็กแท็กเปิด/ปิดอีกครั้ง</p> : null}
    </div>
  );
}

export default HTMLCommentSyntax_1_3;
