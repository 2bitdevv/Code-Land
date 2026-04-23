"use client";

import { useMemo, useState } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

type GridOption = {
  id: string;
  justifyContent: "start" | "center" | "end" | "space-between" | "space-around";
  alignContent: "start" | "center" | "end" | "space-between" | "space-around";
};

type GridQuestion = {
  id: number;
  prompt: string;
  cssCode: string;
  options: GridOption[];
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

const GRID_QUESTIONS: GridQuestion[] = [
  {
    id: 1,
    prompt: "เลือกรูปแบบที่ตรงกับโค้ด Grid นี้",
    cssCode: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-content: center;
  align-content: start;
}`,
    options: [
      { id: "A", justifyContent: "start", alignContent: "start" },
      { id: "B", justifyContent: "center", alignContent: "start" },
      { id: "C", justifyContent: "center", alignContent: "center" },
      { id: "D", justifyContent: "space-between", alignContent: "start" },
    ],
    correctIndex: 1,
    explanation: "justify-content:center จะดันกริดไปกลางแนวนอน และ align-content:start จะชิดด้านบน",
  },
  {
    id: 2,
    prompt: "ข้อไหนตรงกับค่าจัดวางในโค้ดนี้",
    cssCode: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-content: end;
  align-content: center;
}`,
    options: [
      { id: "A", justifyContent: "end", alignContent: "center" },
      { id: "B", justifyContent: "center", alignContent: "end" },
      { id: "C", justifyContent: "end", alignContent: "end" },
      { id: "D", justifyContent: "space-around", alignContent: "center" },
    ],
    correctIndex: 0,
    explanation: "end คือชิดขวา และ align-content:center คือวางบล็อกกริดตรงกลางแนวตั้ง",
  },
  {
    id: 3,
    prompt: "ดูโค้ดแล้วเลือกเลย์เอาต์ที่ใช่",
    cssCode: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-content: space-between;
  align-content: end;
}`,
    options: [
      { id: "A", justifyContent: "space-between", alignContent: "start" },
      { id: "B", justifyContent: "center", alignContent: "end" },
      { id: "C", justifyContent: "space-between", alignContent: "end" },
      { id: "D", justifyContent: "space-around", alignContent: "end" },
    ],
    correctIndex: 2,
    explanation: "space-between จะกระจายแนวนอนพร้อมชิดขอบ และ align-content:end จะลงด้านล่าง",
  },
  {
    id: 4,
    prompt: "ข้อใดตรงกับการจัดวางนี้",
    cssCode: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-content: space-around;
  align-content: center;
}`,
    options: [
      { id: "A", justifyContent: "space-around", alignContent: "center" },
      { id: "B", justifyContent: "space-between", alignContent: "center" },
      { id: "C", justifyContent: "space-around", alignContent: "end" },
      { id: "D", justifyContent: "center", alignContent: "center" },
    ],
    correctIndex: 0,
    explanation: "space-around จะมีระยะรอบคอลัมน์ และ align-content:center จะวางกริดตรงกลางแนวตั้ง",
  },
];

const BOX_SIZE = 120;

function GridPreview({ option }: { option: GridOption }) {
  const cells = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div
      className="rounded-lg border border-white/20 bg-[#0e1628] p-2"
      style={{ width: BOX_SIZE, height: BOX_SIZE }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(3, 18px)",
          gridAutoRows: "18px",
          gap: "6px",
          justifyContent: option.justifyContent,
          alignContent: option.alignContent,
        }}
      >
        {cells.map((cell) => (
          <div key={cell} className="rounded-[4px] bg-amber-400" />
        ))}
      </div>
    </div>
  );
}

export default function CSSGridLayoutQuiz_2_4({ onComplete, isActive = true }: StageProps) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [finished, setFinished] = useState(false);

  const current = GRID_QUESTIONS[index];
  const progressText = useMemo(() => `${index + 1}/${GRID_QUESTIONS.length}`, [index]);
  const shuffledOptions = useMemo(
    () => shuffleArray(current.options.map((option, originalIndex) => ({ option, originalIndex }))),
    [index],
  );

  const handleAnswer = (choiceIndex: number) => {
    if (!isActive || locked || finished) return;
    setSelected(choiceIndex);
    setLocked(true);

    const isRight = choiceIndex === current.correctIndex;
    if (isRight) {
      setCorrect((v) => v + 1);
      setFeedback("correct");
    } else {
      setWrong((v) => v + 1);
      setFeedback("wrong");
    }

    window.setTimeout(() => {
      const isLast = index === GRID_QUESTIONS.length - 1;
      if (isLast) {
        const finalCorrect = isRight ? correct + 1 : correct;
        setFinished(true);
        onComplete?.({ correct: finalCorrect, total: GRID_QUESTIONS.length });
        return;
      }
      setIndex((v) => v + 1);
      setSelected(null);
      setLocked(false);
      setFeedback("idle");
    }, 1000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/20 bg-slate-900/80 p-5 text-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Quiz 4: CSS Grid Layout Match</h2>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{progressText}</span>
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
           Correct: <span className="font-bold text-emerald-300">{correct}</span> / {GRID_QUESTIONS.length}
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
           Wrong: <span className="font-bold text-rose-300">{wrong}</span>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="text-sm text-cyan-200 mb-2">{current.prompt}</p>
        <pre className="rounded-lg border border-cyan-400/20 bg-black/45 p-3 text-xs sm:text-sm text-cyan-100 overflow-x-auto">
          <code>{current.cssCode}</code>
        </pre>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {shuffledOptions.map(({ option, originalIndex }) => {
          const isRight = originalIndex === current.correctIndex;
          const isChosen = selected === originalIndex;
          const show = feedback !== "idle";

          const stateClass = show
            ? isRight
              ? "border-emerald-400 bg-emerald-500/10"
              : isChosen
                ? "border-rose-400 bg-rose-500/10"
                : "border-white/15 opacity-65"
            : "border-white/20 hover:border-cyan-300/50 hover:bg-white/10";

          return (
            <button
              key={`${current.id}-${option.id}-${originalIndex}`}
              type="button"
              onClick={() => handleAnswer(originalIndex)}
              aria-disabled={!isActive || locked || finished}
              className={`rounded-xl border p-3 transition-all duration-200 ${stateClass} ${!isActive || locked || finished ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70">Option {option.id}</span>
              </div>
              <div className="flex justify-center">
                <GridPreview option={option} />
              </div>
            </button>
          );
        })}
      </div>

      {feedback === "correct" && (
        <p className="mt-4 text-sm font-semibold text-emerald-300">Correct! {current.explanation}</p>
      )}
      {feedback === "wrong" && (
        <p className="mt-4 text-sm font-semibold text-rose-300">ยังไม่ถูก: {current.explanation}</p>
      )}
    </div>
  );
}

