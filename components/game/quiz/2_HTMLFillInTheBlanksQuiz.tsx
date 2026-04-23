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
  prompt: string;
  template: string;
  answers: string[];
  explain: string;
};

const QUESTION_BANK: FillQuestion[] = [
  {
    id: 1,
    prompt: "Fill the opening and closing list tag.",
    template: `<___>
  <li>First</li>
  <li>Second</li>
</___>`,
    answers: ["ul", "ul"],
    explain: "Correct! List items are wrapped by <ul> ... </ul>.",
  },
  {
    id: 2,
    prompt: "Fill the missing input type.",
    template: '<input type="___" placeholder="Enter password">',
    answers: ["password"],
    explain: 'Correct! Password fields use type="password".',
  },
  {
    id: 3,
    prompt: "Fill the missing form attribute.",
    template: '<form ___="/submit">',
    answers: ["action"],
    explain: "Correct! Forms submit to the URL in the action attribute.",
  },
  {
    id: 4,
    prompt: "Fill the opening and closing table tag.",
    template: `<___>
  <tr>
    <td>Data</td>
  </tr>
</___>`,
    answers: ["table", "table"],
    explain: "Correct! Table rows and cells belong inside <table> ... </table>.",
  },
];

export function HTMLTagAndAttribute_1_4({ onComplete, isActive }: StageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array.from({ length: QUESTION_BANK[0].answers.length }, () => ""));
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  const q = QUESTION_BANK[currentIndex];
  const finalQuestion = currentIndex === QUESTION_BANK.length - 1;
  const progress = useMemo(() => `${currentIndex + 1}/${QUESTION_BANK.length}`, [currentIndex]);
  const progressPct = useMemo(() => ((currentIndex + 1) / QUESTION_BANK.length) * 100, [currentIndex]);

  const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

  const submit = () => {
    if (locked || !isActive) return;
    if (inputs.some((v) => !v.trim())) return;
    setLocked(true);

    const isCorrect = q.answers.every((ans, idx) => normalizeToken(inputs[idx] ?? "") === normalizeToken(ans));
    const nextCorrect = isCorrect ? correct + 1 : correct;

    if (isCorrect) {
      setCorrect(nextCorrect);
      setStatus("ok");
    } else {
      setWrong((v) => v + 1);
      setStatus("fail");
    }

    setTimeout(() => {
      if (finalQuestion) {
        setLocked(false);
        onComplete?.({ correct: nextCorrect, total: QUESTION_BANK.length });
        return;
      }
      const nextIndex = currentIndex + 1;
      const nextQuestion = QUESTION_BANK[nextIndex];
      setCurrentIndex(nextIndex);
      setInputs(Array.from({ length: nextQuestion.answers.length }, () => ""));
      setLocked(false);
      setStatus("idle");
    }, 950);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl border-2 border-white/10 bg-[#0f1f36] p-5 sm:p-7 text-white">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-3 flex-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#58cc02] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs font-bold text-white/80">Question {progress}</span>
      </div>

      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold">HTML Fill in the Blanks</h2>
        <p className="mt-2 text-cyan-200 text-sm">{q.prompt}</p>
      </div>

      <div className="mb-4 rounded-2xl bg-[#0a1527] border border-white/10 p-4 font-mono text-sm leading-8 text-sky-100 whitespace-pre-wrap wrap-break-word">
        {q.template.split("___").map((part, idx, arr) => (
          <span key={`part-${idx}`}>
            {part}
            {idx < arr.length - 1 ? (
              <input
                type="text"
                value={inputs[idx] ?? ""}
                disabled={locked || !isActive}
                onChange={(e) => {
                  setInputs((prev) => {
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="___"
                className="mx-1 my-1 w-32 rounded-xl border-2 border-[#1cb0f6] bg-[#132238] px-2 py-1 text-white outline-none focus:border-[#58cc02]"
              />
            ) : null}
          </span>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs text-white/60">Type only in the `___` blanks.</p>
      </div>

      {status === "ok" ? (
        <div className="mb-4 rounded-xl border-2 border-[#58cc02] bg-[#58cc0220] px-4 py-3 text-sm font-bold text-[#b7ff7a]">
          {q.explain}
        </div>
      ) : null}
      {status === "fail" ? <div className="mb-4 rounded-xl border-2 border-[#ff4b4b] bg-[#ff4b4b20] px-4 py-3 text-sm font-bold text-[#ff9b9b]">ยังไม่ถูก ลองเติมใหม่อีกครั้ง</div> : null}

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="text-sm text-white/80">✅ {correct}/{QUESTION_BANK.length} | ❌ {wrong}</div>
        <button type="button" onClick={submit} disabled={locked || !isActive || inputs.some((v) => !v.trim())} className="rounded-2xl bg-[#58cc02] px-6 py-3 text-sm font-extrabold text-[#0f1f36] shadow-[0_4px_0_#3f8f00] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
          CHECK
        </button>
      </div>
    </div>
  );
}

export default HTMLTagAndAttribute_1_4;
