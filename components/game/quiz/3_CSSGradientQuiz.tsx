"use client";

import { useMemo, useState, useEffect } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

type CSSGradientQuestion = {
  id: number;
  prompt: string;
  cssCode: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const QUESTIONS: CSSGradientQuestion[] = [
  {
    id: 1,
    prompt: "เลือกผลลัพธ์ที่ตรงกับโค้ดนี้",
    cssCode: "background: linear-gradient(blue, transparent), red;",
    options: [
      "#ff0000",
      "linear-gradient(to bottom, blue, transparent), red",
      "linear-gradient(to bottom, blue, #ffffff)",
      "linear-gradient(to right, blue, transparent), red",
    ],
    correctIndex: 1,
    explanation: "Gradient ชั้นบนไล่จากน้ำเงินไปโปร่งใส และเผยพื้นหลังสีแดงด้านล่าง",
  },
  {
    id: 2,
    prompt: "ผลลัพธ์ไหนคือ radial gradient ที่ถูกต้อง",
    cssCode: "background: radial-gradient(circle, blue 30%, red 70%);",
    options: [
      "radial-gradient(circle, blue 30%, red 70%)",
      "linear-gradient(to right, blue 30%, red 70%)",
      "radial-gradient(circle, red 30%, blue 70%)",
      "conic-gradient(blue 30%, red 70%)",
    ],
    correctIndex: 0,
    explanation: "radial-gradient แบบวงกลมจะเริ่มจากศูนย์กลาง (น้ำเงิน) แล้วค่อยเป็นแดง",
  },
  {
    id: 3,
    prompt: "ข้อไหนแสดงผล 3 สี ไล่แนวนอนซ้ายไปขวา",
    cssCode: "background: linear-gradient(90deg, #ff4d4d, #ffd54f, #4dd0e1);",
    options: [
      "linear-gradient(180deg, #ff4d4d, #ffd54f, #4dd0e1)",
      "linear-gradient(90deg, #ff4d4d, #ffd54f, #4dd0e1)",
      "radial-gradient(circle, #ff4d4d, #ffd54f, #4dd0e1)",
      "linear-gradient(45deg, #ff4d4d, #ffd54f, #4dd0e1)",
    ],
    correctIndex: 1,
    explanation: "90deg คือแนวนอนซ้ายไปขวา",
  },
  {
    id: 4,
    prompt: "เลือกโค้ดที่สร้างเส้นแบ่งสีคม ๆ ครึ่งบนครึ่งล่าง",
    cssCode: "background: linear-gradient(to bottom, #00bcd4 50%, #263238 50%);",
    options: [
      "linear-gradient(to bottom, #00bcd4 40%, #263238 60%)",
      "linear-gradient(to bottom, #00bcd4 50%, #263238 50%)",
      "radial-gradient(circle, #00bcd4 50%, #263238 50%)",
      "linear-gradient(to right, #00bcd4 50%, #263238 50%)",
    ],
    correctIndex: 1,
    explanation: "กำหนดจุดตัดเท่ากันที่ 50% จะเกิดเส้นแบ่งคมชัด",
  },
];

function getOptionStyle(option: string): string {
  // Option value is already a valid CSS background string in this quiz design.
  return option;
}

export default function CSSGradientQuiz_2_3({ onComplete, isActive = true }: StageProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [done, setDone] = useState(false);

  const question = QUESTIONS[questionIndex];
  const progressText = useMemo(() => `${questionIndex + 1}/${QUESTIONS.length}`, [questionIndex]);
  const shuffledOptions = useMemo(
    () => shuffleArray(question.options.map((option, originalIndex) => ({ option, originalIndex }))),
    [questionIndex],
  );

  useEffect(() => {
    if (!isActive || locked || done) return;
    const t = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(t);
          setLocked(true);
          setStatus("wrong");
          setWrong((v) => v + 1);
          window.setTimeout(() => {
            const isLast = questionIndex === QUESTIONS.length - 1;
            if (isLast) {
              setDone(true);
              onComplete?.({ correct: score, total: QUESTIONS.length });
              return;
            }
            setQuestionIndex((v) => v + 1);
            setSelectedIndex(null);
            setStatus("idle");
            setLocked(false);
            setTimeLeft(25);
          }, 900);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(t);
  }, [isActive, locked, done, questionIndex, onComplete, score]);

  const handleSelect = (idx: number) => {
    if (locked || !isActive || done) return;
    setSelectedIndex(idx);
    setLocked(true);

    const isCorrect = idx === question.correctIndex;
    if (isCorrect) {
      setStatus("correct");
      setScore((v) => v + 1);
    } else {
      setStatus("wrong");
      setWrong((v) => v + 1);
    }

    window.setTimeout(() => {
      const isLast = questionIndex === QUESTIONS.length - 1;
      if (isLast) {
        const finalCorrect = isCorrect ? score + 1 : score;
        setDone(true);
        onComplete?.({ correct: finalCorrect, total: QUESTIONS.length });
        return;
      }
      setQuestionIndex((v) => v + 1);
      setSelectedIndex(null);
      setStatus("idle");
      setLocked(false);
      setTimeLeft(25);
    }, 950);
  };

  const timerPct = (timeLeft / 25) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/20 bg-slate-900/80 p-5 text-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Quiz 3: CSS Gradient Match (Stage 1)</h2>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{progressText}</span>
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
           Correct: <span className="font-bold text-emerald-300">{score}</span> / {QUESTIONS.length}
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
           Wrong: <span className="font-bold text-rose-300">{wrong}</span>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
          ⏱ Time: <span className="font-bold text-cyan-200">{timeLeft}s</span>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-linear-to-r from-cyan-400 to-blue-500 transition-all duration-500" style={{ width: `${timerPct}%` }} />
      </div>

      <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="text-sm text-cyan-200 mb-2">{question.prompt}</p>
        <div className="rounded-lg border border-cyan-400/20 bg-black/45 p-3 font-mono text-sm text-cyan-100">
          {question.cssCode}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {shuffledOptions.map(({ option: opt, originalIndex }) => {
          const isSelected = selectedIndex === originalIndex;
          const isCorrect = originalIndex === question.correctIndex;
          const showResult = status !== "idle";

          const resultClass = showResult
            ? isCorrect
              ? "border-emerald-400 ring-2 ring-emerald-400/30"
              : isSelected
                ? "border-rose-400 ring-2 ring-rose-400/30"
                : "border-white/15 opacity-60"
            : "border-white/20 hover:border-cyan-300/50";

          return (
            <button
              key={`${question.id}-${originalIndex}`}
              type="button"
              onClick={() => handleSelect(originalIndex)}
              className={`rounded-xl border bg-white/5 p-3 text-left transition-all duration-200 cursor-pointer pointer-events-auto ${resultClass} ${locked || !isActive ? "opacity-70 cursor-not-allowed" : ""}`}
              aria-disabled={locked || !isActive}
            >
              <div
                className="h-32 w-full rounded-md border border-white/10 mb-2"
                style={{ background: getOptionStyle(opt) }}
              />
            </button>
          );
        })}
      </div>

      {status === "correct" ? (
        <p className="mt-4 text-sm font-semibold text-emerald-300">
          Correct! {question.explanation}
        </p>
      ) : null}
      {status === "wrong" ? (
        <p className="mt-4 text-sm font-semibold text-rose-300">
          ยังไม่ถูก: {question.explanation}
        </p>
      ) : null}
    </div>
  );
}

