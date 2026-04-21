import React, { useEffect, useRef, useState } from 'react';
import type { StageScorePayload } from '@/lib/utils/score';

interface StageProps {
  onComplete?: (result?: StageScorePayload) => void;
  isActive?: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

const questions = [
  { code: 'ball = ___', options: ['10', '"volleyball"', 'False'], answer: '"volleyball"', explanation: 'ball เก็บค่า string "volleyball".' },
  { code: 'score = ___', options: ['True', '25', '"25"'], answer: '25', explanation: 'score เก็บค่า integer 25.' },
  { code: 'win = ___', options: ['"True"', '1', 'True'], answer: 'True', explanation: 'win เก็บค่า boolean True.' },
  { code: 'players = ___', options: ['6', '"six"', 'False'], answer: '6', explanation: 'players เก็บค่า integer 6.' },
  { code: 'set_point = ___', options: ['"twenty-five"', 'True', '25'], answer: '25', explanation: 'set_point เก็บค่า integer 25.' },
  { code: 'name = ___', options: ['"Alice"', 'Alice', 'True'], answer: '"Alice"', explanation: 'name เก็บค่า string "Alice".' },
  { code: 'price = ___', options: ['"99.99"', '99.99', '99'], answer: '99.99', explanation: 'price เก็บค่า float 99.99.' },
  { code: 'is_open = ___', options: ['"False"', 'False', '0'], answer: 'False', explanation: 'is_open เก็บค่า boolean False.' },
  { code: 'level = ___', options: ['"beginner"', '1', 'True'], answer: '1', explanation: 'level เก็บค่า integer 1.' },
  { code: 'height = ___', options: ['180', '"180"', 'False'], answer: '180', explanation: 'height เก็บค่า integer 180.' },
  { code: 'color = ___', options: ['"blue"', 'blue', 'False'], answer: '"blue"', explanation: 'color เก็บค่า string "blue".' },
  { code: 'speed = ___', options: ['"fast"', '10', 'True'], answer: '10', explanation: 'speed เก็บค่า integer 10.' },
  { code: 'active = ___', options: ['True', '"True"', '0'], answer: 'True', explanation: 'active เก็บค่า boolean True.' },
  { code: 'username = ___', options: ['"user1"', 'user1', 'False'], answer: '"user1"', explanation: 'username เก็บค่า string "user1".' },
  { code: 'ttl = ___', options: ['30', '"30"', 'False'], answer: '30', explanation: 'ttl เก็บค่า integer 30.' },
  { code: 'rating = ___', options: ['4.5', '"4.5"', '5'], answer: '4.5', explanation: 'rating เก็บค่า float 4.5.' },
  { code: 'is_admin = ___', options: ['False', '"False"', '0'], answer: 'False', explanation: 'is_admin เก็บค่า boolean False.' },
  { code: 'greeting = ___', options: ['"Hello"', 'Hello', 'True'], answer: '"Hello"', explanation: 'greeting เก็บค่า string "Hello".' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function VolleyballGame({ onComplete, isActive = true, onRoomSkip, onBackToDashboard }: StageProps) {
  const [muted, setMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [teamSets, setTeamSets] = useState(0);
  const [opponentSets, setOpponentSets] = useState(0);
  const setsToWin = 3;
  const setsNeeded = 2;
  const [matchWinner, setMatchWinner] = useState<'team' | 'opponent' | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [completed, setCompleted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState(questions);
  const [isMounted, setIsMounted] = useState(false);
  const [netShake, setNetShake] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setShuffledQuestions(shuffleArray(questions));
  }, []);
  const [scoreScale, setScoreScale] = useState<'team' | 'opponent' | null>(null);
  const [courtFlash, setCourtFlash] = useState(false);
  const [ballSpike, setBallSpike] = useState<'correct' | 'wrong' | null>(null);
  const [ballBounce, setBallBounce] = useState(false);
  const [ballFlight, setBallFlight] = useState<'toOpponent' | 'toTeam' | null>(null);
  const [victoryFlash, setVictoryFlash] = useState(false);
  const [crowdWave, setCrowdWave] = useState(false);
  const [matchPulse, setMatchPulse] = useState(false);
  const [courtGlow, setCourtGlow] = useState<'team' | 'opponent' | null>(null);
  const backgroundAudio = useRef<HTMLAudioElement | null>(null);
  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const wrongAudio = useRef<HTMLAudioElement | null>(null);
  const winSetAudio = useRef<HTMLAudioElement | null>(null);
  const loseSetAudio = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const volleyCorrectRef = useRef(0);
  const volleyWrongRef = useRef(0);

  const formatTime = (t: number) =>
    `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    backgroundAudio.current = new Audio('/sound/stage4.mp3');
    backgroundAudio.current.volume = 0.25;
    backgroundAudio.current.loop = true;
    correctAudio.current = new Audio('/sound/level%20pass.mp3');
    correctAudio.current.volume = 0.45;
    wrongAudio.current = new Audio('/sound/fail.mp3');
    wrongAudio.current.volume = 0.45;
    winSetAudio.current = new Audio('/sound/Kids%20Cheering%20-%20Sound%20Effect%20(HD).mp3');
    winSetAudio.current.volume = 0.45;
    loseSetAudio.current = new Audio('/sound/fail.mp3');
    loseSetAudio.current.volume = 0.5;
    return () => {
      backgroundAudio.current?.pause();
      correctAudio.current?.pause();
      wrongAudio.current?.pause();
      winSetAudio.current?.pause();
      loseSetAudio.current?.pause();
    };
  }, []);

  /** ปิดเสียง = pause จริง (muted อย่างเดียวบางเบราว์เซอร์ยังได้ยิย / loop ยังไหล) */
  useEffect(() => {
    const bg = backgroundAudio.current;
    const sfx = [correctAudio.current, wrongAudio.current, winSetAudio.current, loseSetAudio.current].filter(
      (a): a is HTMLAudioElement => a != null,
    );
    for (const a of sfx) {
      a.muted = muted;
      if (muted) {
        a.pause();
        a.currentTime = 0;
      }
    }
    if (bg) {
      bg.muted = muted;
      if (muted || !hasStarted || completed) {
        bg.pause();
      } else {
        void bg.play().catch(() => {});
      }
    }
  }, [muted, hasStarted, completed]);

  useEffect(() => {
    if (ballBounce) {
      const t = setTimeout(() => setBallBounce(false), 600);
      return () => clearTimeout(t);
    }
  }, [ballBounce]);

  useEffect(() => {
    if (netShake) {
      const t = setTimeout(() => setNetShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [netShake]);

  useEffect(() => {
    if (scoreScale) {
      const t = setTimeout(() => setScoreScale(null), 400);
      return () => clearTimeout(t);
    }
  }, [scoreScale]);

  useEffect(() => {
    if (courtFlash) {
      const t = setTimeout(() => setCourtFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [courtFlash]);

  useEffect(() => {
    if (ballSpike) {
      const t = setTimeout(() => setBallSpike(null), 800);
      return () => clearTimeout(t);
    }
  }, [ballSpike]);

  useEffect(() => {
    if (victoryFlash) {
      const t = setTimeout(() => setVictoryFlash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [victoryFlash]);

  useEffect(() => {
    if (crowdWave) {
      const t = setTimeout(() => setCrowdWave(false), 1200);
      return () => clearTimeout(t);
    }
  }, [crowdWave]);

  useEffect(() => {
    if (matchPulse) {
      const t = setTimeout(() => setMatchPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [matchPulse]);

  useEffect(() => {
    if (ballFlight) {
      const t = setTimeout(() => setBallFlight(null), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [ballFlight]);

  useEffect(() => {
    if (courtGlow) {
      const t = setTimeout(() => setCourtGlow(null), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [courtGlow]);

  const playAudio = (audio: HTMLAudioElement | null) => {
    if (!audio || muted) return;
    audio.muted = false;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!hasStarted) return;
    setCrowdWave(true);
  }, [hasStarted]);

  useEffect(() => {
    if (completed && backgroundAudio.current) {
      backgroundAudio.current.pause();
      backgroundAudio.current.currentTime = 0;
    }
  }, [completed]);

  useEffect(() => {
    if (!hasStarted || completed) return;
    const interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [completed, hasStarted]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    if (!completed || !matchWinner) return;
    const c = volleyCorrectRef.current;
    const w = volleyWrongRef.current;
    onComplete?.({
      success: matchWinner === 'team',
      seconds: timeRef.current,
      correct: c,
      total: Math.max(1, c + w),
    });
  }, [completed, matchWinner, onComplete]);

  const startNextSet = () => {
    setCurrentSet((prev) => prev + 1);
    setTeamScore(0);
    setOpponentScore(0);
    setCurrent(0);
    setShuffledQuestions(shuffleArray(questions));
    setSelected(null);
    setFeedback(null);
    setStatus('idle');
    setBallSpike(null);
    setCourtFlash(false);
    setBallBounce(false);
    setVictoryFlash(false);
    setCourtGlow(null);
    setCrowdWave(false);
  };

  const nextQuestion = () => {
    setCurrent((prev) => (prev + 1) % shuffledQuestions.length);
    setSelected(null);
    setFeedback(null);
    setStatus('idle');
  };

  const handleSelect = (option: string) => {
    if (!isActive || selected || completed) return;
    setSelected(option);
    setMatchPulse(true);
    setNetShake(true);
    const isCorrect = option === shuffledQuestions[current].answer;

    if (isCorrect) {
      volleyCorrectRef.current += 1;
      setStatus('success');
      playAudio(correctAudio.current);
      setBallSpike('correct');
      setBallFlight('toOpponent');
      setCrowdWave(true);

      const newTeamScore = teamScore + 5;
      if (newTeamScore >= 25) {
        const nextTeamSets = teamSets + 1;
        setTeamScore(newTeamScore);
        setScoreScale('team');
        setFeedback(`🏆 ทีมเรา ชนะเซ็ต ${currentSet}!`);
        setBallBounce(true);
        setCourtFlash(true);
        if (nextTeamSets >= setsNeeded) {
          setTeamSets(nextTeamSets);
          setMatchWinner('team');
          setCompleted(true);
          setVictoryFlash(true);
          setCourtGlow('team');
          playAudio(winSetAudio.current);
        } else {
          setTeamSets(nextTeamSets);
          setCourtGlow('team');
          playAudio(winSetAudio.current);
          setTimeout(() => startNextSet(), 1500);
        }
      } else {
        setTeamScore(newTeamScore);
        setScoreScale('team');
        setFeedback('🏐 ตอบถูก! ทีมเราได้ 5 คะแนน');
        setBallBounce(true);
        setCourtFlash(true);
        setTimeout(() => nextQuestion(), 1000);
      }
    } else {
      volleyWrongRef.current += 1;
      setStatus('error');
      setBallSpike('wrong');
      const newOppScore = opponentScore + 5;
      if (newOppScore >= 25) {
        const nextOppSets = opponentSets + 1;
        setOpponentScore(newOppScore);
        setScoreScale('opponent');
        setFeedback(`🏆 ทีมคู่แข่ง ชนะเซ็ต ${currentSet}!`);
        setBallBounce(true);
        setCourtFlash(true);
        if (nextOppSets >= setsNeeded) {
          setOpponentSets(nextOppSets);
          setMatchWinner('opponent');
          setCompleted(true);
          setCourtGlow('opponent');
          playAudio(loseSetAudio.current);
        } else {
          setOpponentSets(nextOppSets);
          setCourtGlow('opponent');
          playAudio(loseSetAudio.current);
          setTimeout(() => startNextSet(), 1500);
        }
      } else {
        setOpponentScore(newOppScore);
        setScoreScale('opponent');
        setFeedback('❌ ตอบผิด! ทีมคู่แข่งได้ 5 คะแนน');
        setBallFlight('toTeam');
        playAudio(wrongAudio.current);
        setTimeout(() => nextQuestion(), 1000);
      }
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setTeamScore(0);
    setOpponentScore(0);
    setCurrentSet(1);
    setTeamSets(0);
    setOpponentSets(0);
    setMatchWinner(null);
    setSelected(null);
    setFeedback(null);
    setStatus('idle');
    setCompleted(false);
    volleyCorrectRef.current = 0;
    volleyWrongRef.current = 0;
    setTime(0);
    setShuffledQuestions(shuffleArray(questions));
    setHasStarted(false);
  };

  const currentQuestion = shuffledQuestions[current];
  const teamProgress = (teamScore / 25) * 100;
  const opponentProgress = (opponentScore / 25) * 100;

  if (!isMounted) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-12 text-white/60 text-sm">
        กำลังโหลดเกม…
      </div>
    );
  }

  if (completed && matchWinner) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4 rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-center text-white shadow-xl">
        <div className="text-4xl">{matchWinner === 'team' ? '🎉' : '🏐'}</div>
        <p className="text-lg font-bold">{matchWinner === 'team' ? 'ชนะแมตช์!' : 'จบแมตช์ — บันทึกผลแล้ว'}</p>
        <p className="text-sm text-white/60">กำลังไปด่านถัดไปอัตโนมัติ หรือใช้ปุ่มด้านล่าง</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {onRoomSkip ? (
            <button
              type="button"
              onClick={onRoomSkip}
              className="rounded-xl border border-sky-400/40 bg-sky-600/30 px-4 py-3 text-sm font-bold text-sky-100 hover:bg-sky-600/50"
            >
              ข้ามด่านนี้
            </button>
          ) : null}
          {onBackToDashboard ? (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"
            >
              กลับ Dashboard
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 overflow-x-hidden overflow-y-visible bg-slate-950 px-2 sm:px-3 py-2 rounded-2xl border border-white/5">
      {!hasStarted ? (
        <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-4xl border border-white/10 bg-linear-to-r from-sky-600/90 via-cyan-500/90 to-emerald-500/90 p-8 shadow-2xl backdrop-blur-sm">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
              <svg viewBox="0 0 1000 420" className="h-full w-full">
                <defs>
                  <linearGradient id="courtGlow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="rgba(255,255,255,0.14)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
                  </linearGradient>
                </defs>
                <rect x="70" y="85" width="860" height="250" rx="28" fill="rgba(0,0,0,0.25)" stroke="url(#courtGlow)" strokeWidth="3" />
                <line x1="500" y1="85" x2="500" y2="335" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
                <line x1="285" y1="85" x2="285" y2="335" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
                <line x1="715" y1="85" x2="715" y2="335" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
                <line x1="70" y1="210" x2="930" y2="210" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                <rect x="95" y="110" width="810" height="200" rx="20" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" strokeDasharray="10 14" />
              </svg>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="mt-2 text-4xl font-extrabold text-white">🏐 Volleyball Python Game</h1>
                <p className="mt-3 max-w-xl text-white/85 text-sm leading-relaxed">
                  พร้อมลงสนามแล้วหรือยัง? กดเริ่มเกมแล้วไปทำแต้มกันเลย
                </p>
              </div>
              <div className="hidden md:block text-7xl">🏐</div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-white/60">วิธีเล่น</div>
                <div className="mt-2 text-sm text-white/85">อ่านโค้ด แล้วเลือกค่าที่ถูกต้อง</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-white/60">การให้คะแนน</div>
                <div className="mt-2 text-sm text-white/85">ตอบถูกได้ 5 คะแนน • ครบ 25 ชนะเซ็ต</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-white/60">พร้อมลุย</div>
                <div className="mt-2 text-sm text-white/85">กดเริ่มเกมเพื่อเข้าสู่สนาม</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setTime(0);
                  setHasStarted(true);
                }}
                className="w-full md:w-auto rounded-2xl bg-white px-8 py-4 text-slate-900 font-extrabold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition"
              >
                เริ่มเกม
              </button>
              <div className="text-xs text-white/70">เริ่มแล้วจะเริ่มจับเวลาและเปิดสนาม</div>
            </div>
          </div>
        </div>
      ) : (
      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-col gap-3 sm:max-w-3xl">
        <section className="w-full shrink-0">
          <div className="w-full">
            <div className="flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-sky-600/90 via-cyan-500/90 to-emerald-500/90 p-3 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col gap-1.5">
                <div className="shrink-0">
                  <h3 className="flex items-center gap-2 text-base font-bold text-white md:text-lg">
                    🏐 Volleyball Python Game
                  </h3>
                  <p className="mt-0.5 text-[11px] text-white/80 leading-snug md:text-xs">
                    ตอบคำถามให้ถูกเพื่อทำคะแนนในแมตช์วอลเลย์บอล!
                  </p>
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="mt-1 rounded-md border border-white/20 bg-slate-800 px-2 py-0.5 text-[10px] text-white hover:bg-slate-700 transition"
                  >
                    {muted ? '🔇 ปิดเสียง' : '🔊 เปิดเสียง'}
                  </button>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-1.5 text-[10px] text-white/90 md:grid-cols-[1fr_auto] md:gap-2 md:text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>⏱</span>
                    เวลา: {formatTime(time)}
                  </div>
                  <div className="rounded-lg bg-slate-950/25 px-2 py-1 leading-tight">
                    เซ็ต {currentSet}/{setsToWin} • ชนะ 2 เซ็ต
                  </div>
                </div>
                <div className={`relative mt-1 shrink-0 rounded-2xl border border-white/10 bg-slate-950/50 p-2 shadow-inner ${courtGlow === 'team' ? 'ring-2 ring-yellow-400/30' : courtGlow === 'opponent' ? 'ring-2 ring-pink-400/30' : ''}`}>
                  <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/5 to-transparent" />
                  <div className="relative mx-auto h-40 max-w-md">
                    <div className="absolute left-2 top-2 z-10 rounded-lg border border-yellow-400/30 bg-slate-950/80 px-2 py-1 shadow-md backdrop-blur">
                      <div className="text-[8px] uppercase tracking-wider text-yellow-200/80">ทีมเรา</div>
                      <div className="flex items-end gap-1">
                        <div className="text-lg font-extrabold text-yellow-300 tabular-nums">{teamScore}</div>
                        <div className="pb-0.5 text-[10px] text-white/70 tabular-nums">/25</div>
                      </div>
                      <div className="text-[9px] text-white/70">
                        เซ็ตชนะ: <span className="font-bold text-yellow-200 tabular-nums">{teamSets}</span>
                      </div>
                    </div>
                    <div className="absolute right-2 top-2 z-10 rounded-lg border border-pink-400/30 bg-slate-950/80 px-2 py-1 shadow-md backdrop-blur">
                      <div className="text-right text-[8px] uppercase tracking-wider text-pink-200/80">คู่แข่ง</div>
                      <div className="flex items-end justify-end gap-1">
                        <div className="text-lg font-extrabold text-pink-300 tabular-nums">{opponentScore}</div>
                        <div className="pb-0.5 text-[10px] text-white/70 tabular-nums">/25</div>
                      </div>
                      <div className="text-right text-[9px] text-white/70">
                        เซ็ตชนะ: <span className="font-bold text-pink-200 tabular-nums">{opponentSets}</span>
                      </div>
                    </div>
                    <div className="absolute inset-x-8 top-11 h-24 rounded-2xl bg-slate-900/95 border border-white/10 shadow-inner" />
                    <div className="absolute left-1/2 top-11 h-24 w-px bg-white/10" />
                    <div className="absolute left-8 top-14 flex items-center gap-1.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-base">👦</div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-base">🧑‍🦱</div>
                    </div>
                    <div className="absolute right-8 top-14 flex items-center gap-1.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/20 text-base">👦</div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/20 text-base">🧑‍🦱</div>
                    </div>
                    <div className="absolute left-8 top-9 text-[9px] uppercase tracking-wide text-cyan-200">ทีมเรา</div>
                    <div className="absolute right-8 top-9 text-[9px] uppercase tracking-wide text-pink-200">คู่แข่ง</div>
                    <div
                      className={`absolute top-[3.25rem] h-12 w-12 rounded-full bg-yellow-300/95 border border-white/40 shadow-lg flex items-center justify-center text-xl transition-all duration-700 ${ballBounce ? 'scale-[1.05]' : ''}`}
                      style={{
                        left: ballFlight === 'toOpponent' ? '65%' : ballFlight === 'toTeam' ? '35%' : '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      🏐
                    </div>
                    {ballSpike === 'correct' && (
                      <div className="absolute top-1 left-1/2 z-10 -translate-x-1/2 text-xs font-bold text-green-300 animate-pulse">
                        🎉 ตอบถูก!
                      </div>
                    )}
                    {ballSpike === 'wrong' && (
                      <div className="absolute top-1 left-1/2 z-10 -translate-x-1/2 text-xs font-bold text-red-300 animate-pulse">
                        ❌ ตอบผิด!
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg border border-yellow-400/30 bg-slate-900/50 px-2 py-1">
                      <div className="mb-0.5 text-[9px] font-bold text-yellow-300">เรา {teamScore}/25</div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-linear-to-r from-yellow-400 to-green-500 transition-all duration-300" style={{ width: `${teamProgress}%` }} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-red-400/30 bg-slate-900/50 px-2 py-1">
                      <div className="mb-0.5 text-[9px] font-bold text-red-300">คู่แข่ง {opponentScore}/25</div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-linear-to-r from-red-400 to-pink-500 transition-all duration-300" style={{ width: `${opponentProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-1.5 text-[10px]">
                  <div className="rounded-lg bg-slate-950/30 px-2 py-1">
                    <div className="text-[8px] uppercase tracking-wide text-white/60">เซ็ตเรา</div>
                    <div className="text-sm font-bold text-yellow-300">{teamSets}</div>
                  </div>
                  <div className="rounded-lg bg-slate-950/30 px-2 py-1">
                    <div className="text-[8px] uppercase tracking-wide text-white/60">เซ็ตคู่แข่ง</div>
                    <div className="text-sm font-bold text-red-400">{opponentSets}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full min-w-0 shrink-0">
          <div className="rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-xl">
            <div className="mb-2 flex justify-center">
              <span className="text-4xl animate-bounce">🏐</span>
            </div>
            <div className="mb-1 text-center text-xs uppercase tracking-wide text-white/70">
              Question {current + 1} of {questions.length}
            </div>
            <p className="mb-2 text-center text-sm leading-snug text-white/90">{currentQuestion.explanation}</p>
            <div className="mb-3 flex justify-center">
              <div className="inline-block rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-lg font-bold text-green-300 shadow-inner sm:text-xl">
                {currentQuestion.code}
              </div>
            </div>
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected || !isActive}
                  className={`rounded-lg border px-3 py-3 font-mono text-sm font-bold transition
                    ${selected === opt
                      ? status === 'success'
                        ? 'border-green-400 bg-green-600 text-white'
                        : 'border-red-400 bg-red-600 text-white'
                      : 'border-white/15 bg-white/10 text-white/85 hover:border-sky-300 hover:bg-sky-600 hover:text-white'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/80 p-3 text-center text-sm text-white/80">
              <p className="font-semibold">{feedback || 'เลือกคำตอบที่ถูกต้อง'}</p>
            </div>
          </div>
        </section>
      </div>
      )}
    </div>
  );
}