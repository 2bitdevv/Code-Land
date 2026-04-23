"use client";

import { useEffect, useMemo, useState } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

type LoaderType = "spinner" | "dots" | "bar" | "pulse";

type JSQuestion = {
  id: number;
  title: string;
  prompt: string;
  loader?: LoaderType;
  template: string;
  answers: string[];
  explanation: string;
};

const QUESTIONS: JSQuestion[] = [
  {
    id: 1,
    title: "Spinner Loader",
    prompt: "เติมโค้ดให้แสดง loader ตอนเริ่มโหลด แล้วซ่อนเมื่อโหลดเสร็จ",
    loader: "spinner",
    template: `let isLoading = ___;

function startLoading() {
  isLoading = true;
}

function finishLoading() {
  isLoading = ___;
}`,
    answers: ["false", "false"],
    explanation: "เริ่มต้นยังไม่โหลด (false) และเมื่อเสร็จต้องกลับเป็น false",
  },
  {
    id: 2,
    title: "Timer Counter",
    prompt: "โจทย์นับเวลา: ถ้าตอบถูกให้เวลาหยุดเดินทันที",
    template: `let sec = 0;
const timer = setInterval(() => {
  sec++;
}, 1000);

function onAnswer(isCorrect) {
  if (isCorrect) {
    ___(timer);
  }
}`,
    answers: ["clearInterval"],
    explanation: "เมื่อคำตอบถูก ให้ clearInterval(timer) เพื่อหยุดตัวนับเวลา",
  },
  {
    id: 3,
    title: "Correct Answer Color",
    prompt: "ถ้าตอบถูกให้ข้อความเปลี่ยนเป็นสีเขียว",
    template: `const msg = document.querySelector("#result");

function markCorrect(isCorrect) {
  if (isCorrect) {
    msg.style.color = "___";
  }
}`,
    answers: ["green"],
    explanation: `กำหนด msg.style.color = "green" เพื่อเปลี่ยนสีข้อความเมื่อถูก`,
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function LoaderPreview({ type }: { type: LoaderType }) {
  if (type === "spinner") {
    return <div className="h-10 w-10 rounded-full border-4 border-cyan-300/30 border-t-cyan-300 animate-spin" />;
  }
  if (type === "dots") {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 animate-bounce [animation-delay:-0.2s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 animate-bounce [animation-delay:-0.1s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 animate-bounce" />
      </div>
    );
  }
  if (type === "bar") {
    return (
      <div className="w-44 rounded-full bg-white/10 p-1">
        <div className="h-3 w-1/2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-44 space-y-2">
      <div className="h-3 rounded bg-white/15 animate-pulse" />
      <div className="h-3 w-5/6 rounded bg-white/10 animate-pulse" />
      <div className="h-3 w-4/6 rounded bg-white/10 animate-pulse" />
    </div>
  );
}

export default function JSLoadingFillQuiz_3_1({ onComplete, isActive = true }: StageProps) {
  const [index, setIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array.from({ length: QUESTIONS[0].answers.length }, () => ""));
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [isQuestionTimerRunning, setIsQuestionTimerRunning] = useState(true);

  const current = QUESTIONS[index];
  const progressText = useMemo(() => `${index + 1}/${QUESTIONS.length}`, [index]);
  /** จับเวลาเฉพาะข้อ 2 (Timer Counter) — ข้ออื่นไม่แสดงและไม่นับ */
  const isTimerQuestion = current.id === 2;

  useEffect(() => {
    if (!isActive || finished || !isTimerQuestion || !isQuestionTimerRunning) return;
    const timer = window.setInterval(() => {
      setQuestionSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isActive, finished, isTimerQuestion, isQuestionTimerRunning, index]);

  useEffect(() => {
    setQuestionSeconds(0);
    setIsQuestionTimerRunning(QUESTIONS[index].id === 2);
  }, [index]);

  const checkAnswer = () => {
    if (!isActive || locked || finished) return;
    if (inputs.some((v) => !v.trim())) return;

    setLocked(true);
    const ok = current.answers.every((ans, i) => normalize(inputs[i] || "") === normalize(ans));
    if (ok) {
      if (current.id === 2) {
        setIsQuestionTimerRunning(false);
      }
      setCorrect((v) => v + 1);
      setFeedback("correct");
    } else {
      setWrong((v) => v + 1);
      setFeedback("wrong");
    }

    window.setTimeout(() => {
      const isLast = index === QUESTIONS.length - 1;
      if (isLast) {
        const finalCorrect = ok ? correct + 1 : correct;
        setFinished(true);
        onComplete?.({ correct: finalCorrect, total: QUESTIONS.length });
        return;
      }
      const next = index + 1;
      setIndex(next);
      setInputs(Array.from({ length: QUESTIONS[next].answers.length }, () => ""));
      setFeedback("idle");
      setLocked(false);
    }, 900);
  };

  const parts = current.template.split("___");

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/20 bg-slate-900/80 p-5 text-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Quiz 5: JS Loading Logic Fill</h2>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{progressText}</span>
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
           Correct: <span className="font-bold text-emerald-300">{correct}</span> / {QUESTIONS.length}
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
           Wrong: <span className="font-bold text-rose-300">{wrong}</span>
        </div>
        {isTimerQuestion ? (
          <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm sm:col-span-2">
            ⏱️ Time: <span className="font-bold text-cyan-200">{questionSeconds}s</span>
            {!isQuestionTimerRunning ? <span className="ml-2 text-emerald-300 font-semibold">(Stopped)</span> : null}
          </div>
        ) : null}
      </div>

      <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-cyan-200">{current.title}</p>
            <p className="text-sm text-white/70 mt-1">{current.prompt}</p>
          </div>
          {current.loader ? <LoaderPreview type={current.loader} /> : null}
        </div>
      </div>

      <div className="rounded-xl border border-cyan-400/20 bg-black/45 p-4 font-mono text-sm text-cyan-100 overflow-x-auto">
        {parts.map((part, i) => (
          <span key={`part-${i}`}>
            {part}
            {i < parts.length - 1 ? (
              <input
                type="text"
                value={inputs[i] || ""}
                disabled={locked || !isActive || finished}
                onChange={(e) => {
                  const next = [...inputs];
                  next[i] = e.target.value;
                  setInputs(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") checkAnswer();
                }}
                placeholder="___"
                className="mx-1 my-1 w-24 rounded-md border border-cyan-300/40 bg-slate-900 px-2 py-1 text-cyan-100 outline-none focus:border-cyan-300"
              />
            ) : null}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={checkAnswer}
          disabled={locked || !isActive || finished || inputs.some((v) => !v.trim())}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          ตรวจคำตอบ
        </button>
      </div>

      {feedback === "correct" ? (
        <p className="mt-3 text-sm font-semibold text-emerald-300">Correct! {current.explanation}</p>
      ) : null}
      {feedback === "wrong" ? (
        <p className="mt-3 text-sm font-semibold text-rose-300">ยังไม่ถูก: {current.explanation}</p>
      ) : null}
    </div>
  );
}

