




'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StageScorePayload } from '@/lib/utils/score';

type Question = {
  q: string;
  c: string[];
  a: number;
};

// คลังคำถามทั้งหมด (Question Pool)
const QUESTION_POOL: Question[] = [
  { q: "print() ใน Python ใช้ทำอะไร?", c: ["วนลูป", "รับค่า", "แสดงผล", "สร้างไฟล์"], a: 2 },
  { q: "ชนิดข้อมูล List เก็บค่าอย่างไร?", c: ["ค่าเดียว", "หลายค่าเรียงกัน", "คู่กุญแจ-ค่า", "ค่าความจริง"], a: 1 },
  { q: "def ใช้สำหรับอะไร?", c: ["สร้างคลาส", "สร้างฟังก์ชัน", "สร้างลูป", "นำเข้าโมดูล"], a: 1 },
  { q: "len([1,2,3]) ได้ผลลัพธ์คือ?", c: ["1", "2", "3", "0"], a: 2 },
  { q: "นามสกุลไฟล์ของ Python คืออะไร?", c: [".py", ".pt", ".python", ".exe"], a: 0 },
  { q: "คำสั่งใดใช้รับข้อมูลจาก User?", c: ["get()", "input()", "read()", "scanf()"], a: 1 },
  { q: "ข้อใดคือการเขียน Comment ใน Python?", c: ["//", "/* */", "#", "--"], a: 2 },
  { q: "เครื่องหมายใดใช้เปรียบเทียบว่า 'เท่ากับ'?", c: ["=", "==", "===", "is"], a: 1 },
  { q: "if...else ใช้สำหรับทำอะไร?", c: ["วนลูป", "คำนวณเลข", "สร้างเงื่อนไข", "แสดงผล"], a: 2 }
];

type WeightliftingProps = {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive?: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
};

export default function WeightliftingGame({ onComplete, onRoomSkip, onBackToDashboard }: WeightliftingProps) {
  const router = useRouter();
  /** Join room ส่ง onRoomSkip / onBackToDashboard — ห้าม router.push พาไปนอกห้อง */
  const isRoomEmbed = Boolean(onRoomSkip || onBackToDashboard);
  const [player, setPlayer] = useState(0);
  const [bot, setBot] = useState(0);
  const [game, setGame] = useState(false);
  const [asking, setAsking] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [stage, setStage] = useState(0);
  const [combo, setCombo] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [hit, setHit] = useState(false);
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showRematch, setShowRematch] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showQ, setShowQ] = useState(false);
  
  // State ใหม่สำหรับเก็บชุดคำถามที่สุ่มได้ในรอบนั้นๆ
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  
  const [btnText, setBtnText] = useState('ยก! 💪');
  const [btnColor, setBtnColor] = useState('gold');
  const qCorrectRef = useRef(0);
  const qWrongRef = useRef(0);

  const botInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const comboTimer = useRef<number>(0);
  const gameRef = useRef(false);

  const playPopSound = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      setTimeout(() => { ctx.close(); }, 150);
    } catch (e) {}
  };

  const startBot = () => {
    if (botInterval.current) clearInterval(botInterval.current);
    botInterval.current = setInterval(() => {
      if (!gameRef.current || asking || freeze) return;
      setBot(prev => {
        const next = prev + 0.9; 
        if (next >= 100) {
          endGame("BOT WINS!");
          return 100;
        }
        return next;
      });
    }, 250);
  };

  const stopBot = () => {
    if (botInterval.current) clearInterval(botInterval.current);
    botInterval.current = null;
  };

  const startGame = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    
    // สุ่มคำถามใหม่ทุกลูกที่เริ่มเกม (Shuffle & Pick 4)
    const shuffled = [...QUESTION_POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    
    setCurrentQuestions(shuffled);
    setPlayer(0);
    setBot(0);
    setStage(0);
    setGame(true);
    gameRef.current = true;
    setFreeze(false);
    setCombo(false);
    setSpeedMultiplier(1);
    setResult(null);
    setShowRematch(false);
    setShowQ(false);
    setAsking(false);
    setBtnText('ยก! 💪');
    setBtnColor('gold');
    qCorrectRef.current = 0;
    qWrongRef.current = 0;
    startBot();
  };

  const endGame = (winner: string) => {
    setGame(false);
    gameRef.current = false;
    stopBot();
    const c = qCorrectRef.current;
    const w = qWrongRef.current;
    const total = Math.max(1, c + w);
    if (winner.includes('YOU WIN')) {
      onComplete?.({ success: true, correct: c, total });
    } else {
      // แพ้บอท — ยังต้องส่งผลให้ห้อง join ไปด่านถัดไป / คิดคะแนน
      onComplete?.({ success: false, correct: c, total });
    }
    setResult(winner);
    setShowRematch(false);

    const delay = isRoomEmbed ? 1200 : 5000;
    setTimeout(() => {
      setShowRematch(true);
      if (isRoomEmbed) {
        setCountdown(0);
        return;
      }
      setCountdown(10);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, delay);
  };

  const clickPower = () => {
    if (!game || asking || freeze) return;
    playPopSound();
    setHit(true);
    setShake(true);
    setTimeout(() => setHit(false), 150); 
    setTimeout(() => setShake(false), 90);

    const basePower = combo ? 1.4 : 0.9;
    const power = basePower * speedMultiplier;
    
    setPlayer(prev => {
      const next = prev + power;
      const milestone = (stage + 1) * 20;
      
      // ตรวจสอบกับชุดคำถามที่สุ่มมา
      if (stage < currentQuestions.length && prev < milestone && next >= milestone) {
        setCurrentQ(currentQuestions[stage]);
        setShowQ(true);
        setAsking(true);
        setCombo(false);
        setSpeedMultiplier(1);
        comboTimer.current = Date.now();
        return milestone;
      }
      if (next >= 100) {
        endGame("YOU WIN! 🏆");
        return 100;
      }
      return next;
    });
  };

  const answer = (i: number) => {
    if (!currentQ) return;
    const timeUsed = (Date.now() - comboTimer.current) / 1000;
    setShowQ(false);
    setAsking(false);
    
    if (i === currentQ.a) {
      qCorrectRef.current += 1;
      if (timeUsed <= 3) {
        setCombo(true);
        setSpeedMultiplier(1.7);
        setBtnText("⚡ POWER MODE");
        setBtnColor("#00f2ff");
      } else {
        setBtnText('ยก! 💪');
        setBtnColor('gold');
      }
      setPlayer(p => Math.min(p + 5, 100));
    } else {
      qWrongRef.current += 1;
      setFreeze(true);
      setBtnText("❌ STUNNED");
      setBtnColor("red");
      setTimeout(() => {
        if (gameRef.current) {
          setFreeze(false);
          setBtnText('ยก! 💪');
          setBtnColor('gold');
        }
      }, 2000);
    }
    setStage(s => s + 1);
  };

  useEffect(() => {
    return () => {
      stopBot();
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  return (
    <div
      className={
        isRoomEmbed
          ? 'w-full max-w-5xl mx-auto font-sans py-1'
          : 'min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans overflow-hidden bg-gym-pattern'
      }
    >
      <div
        className={`w-full ${isRoomEmbed ? 'max-w-5xl' : 'max-w-lg'} p-3 rounded-[2rem] bg-zinc-900 border-[12px] border-zinc-700 shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-75 ${shake ? 'scale-95' : 'scale-100'}`}
      >
        
        <div className="relative bg-zinc-900 rounded-3xl p-6 border-4 border-black/50 h-[650px] flex flex-col overflow-hidden bg-concrete-pattern shadow-inner">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-cyan-500 rounded-full blur-md opacity-30"></div>
          
          <div className="h-40 relative z-40 border-b-2 border-zinc-700 mb-2 flex flex-col justify-center">
            {showQ && currentQ ? (
              <div className="bg-zinc-900/95 p-4 rounded-2xl flex flex-col justify-center animate-pop-in border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <p className="text-white font-bold text-center mb-3 text-base">คำถาม: {currentQ.q}</p>
                <div className="grid grid-cols-2 gap-2">
                  {currentQ.c.map((c, i) => (
                    <button key={i} onClick={() => answer(i)} className="bg-zinc-800 hover:bg-blue-600 py-2.5 rounded-xl text-white text-sm font-medium transition-all active:scale-95 border border-zinc-700">
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-around items-center px-4">
                <div className="text-center">
                  <div className={`text-3xl font-black italic tracking-tighter ${player >= 100 ? 'text-yellow-400' : 'text-blue-400'}`}>{Math.floor(player)}%</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">PLAYER</div>
                </div>
                <div className="text-zinc-700 font-black text-2xl italic px-4">VS</div>
                <div className="text-center">
                  <div className={`text-3xl font-black italic tracking-tighter ${bot >= 100 ? 'text-red-600' : 'text-red-500'}`}>{Math.floor(bot)}%</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">BOT</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end flex-1 pb-16 relative px-8 z-10">
            <div className="absolute inset-x-0 top-10 h-32 flex justify-center gap-1 opacity-10">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-6 h-full flex flex-col gap-1 items-center">
                  <div className="w-10 h-2 bg-zinc-600 rounded"></div>
                  <div className="w-2 flex-1 bg-zinc-600 rounded"></div>
                </div>
              ))}
            </div>

            <div className="absolute inset-x-4 bottom-10 h-10 bg-[#5c4033] rounded-t-lg border-x-8 border-t-8 border-zinc-800 shadow-xl opacity-90 z-0 bg-wood-pattern"></div>

            {result && (
              <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl animate-pop-in">
                <div className="bg-zinc-900 p-8 rounded-[2rem] border-4 border-zinc-700 shadow-2xl text-center scale-110">
                  <h2 className={`text-4xl font-black mb-1 italic tracking-tighter ${result.includes('YOU') ? 'text-yellow-400' : 'text-red-600'}`}>
                    {result}
                  </h2>
                  <p className="text-zinc-500 text-[10px] mb-6 uppercase tracking-widest font-black">Competition Ended</p>
                  {showRematch ? (
                    <div className="animate-pop-in flex flex-col items-center gap-4">
                      {isRoomEmbed ? (
                        <>
                          <p className="text-white/75 text-sm text-center max-w-sm leading-relaxed">
                            บันทึกผลด่านแล้ว — ระบบจะอัปเดตความคืบหน้าในห้อง (ด่านถัดไปหรือสรุปอันดับ) อัตโนมัติ
                          </p>
                          <div className="flex flex-wrap gap-3 justify-center">
                            {onRoomSkip ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (countdownInterval.current) clearInterval(countdownInterval.current);
                                  onRoomSkip();
                                }}
                                className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-sky-500 border border-sky-400/40"
                              >
                                ข้ามด่านนี้
                              </button>
                            ) : null}
                            {onBackToDashboard ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (countdownInterval.current) clearInterval(countdownInterval.current);
                                  onBackToDashboard();
                                }}
                                className="bg-white/15 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/25 border border-white/20"
                              >
                                กลับ Dashboard
                              </button>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-2">
                            <p className="text-white/40 text-[10px] mb-1">Returning to home in</p>
                            <span className="text-white text-3xl font-black tabular-nums">{countdown}s</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (countdownInterval.current) clearInterval(countdownInterval.current);
                                router.push('/leaderboard');
                              }}
                              className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-400 transition-all shadow-[0_5px_0_#1e3a8a] active:translate-y-1 active:shadow-none uppercase"
                            >
                              ดูอันดับ
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push('/')}
                              className="bg-gray-100 text-black px-8 py-4 rounded-2xl font-black text-lg hover:bg-yellow-200 transition-all shadow-[0_5px_0_#ccc] active:translate-y-1 active:shadow-none uppercase"
                            >
                              กลับหน้าแรก
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-white/20 text-xs italic animate-pulse">Calculating score...</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 items-end h-full relative z-10">
              <div className="w-3.5 bg-zinc-950 rounded-full h-full relative overflow-hidden border border-zinc-700">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-700 to-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.6)]" style={{ height: `${player}%` }} />
                {[20, 40, 60, 80].map(m => (
                  <div key={m} className="absolute w-full border-t border-zinc-700/50 z-10" style={{ bottom: `${m}%` }} />
                ))}
              </div>
              <div className={`lifter-box ${hit ? 'animate-lift-physic' : ''} ${combo ? 'glow' : ''}`}>
                <div className="barbell">
                  <div className="plate plate-l" /><div className="bar" /><div className="plate plate-r" />
                </div>
                <div className="human">
                  <div className="head" />
                  <div className="torso">
                    <div className="arm arm-l" />
                    <div className="arm arm-r" />
                  </div>
                  <div className="legs">
                    <div className="leg leg-l" />
                    <div className="leg leg-r" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-end h-full relative z-10">
              <div className={`lifter-box bot-color ${game && !asking && !freeze ? 'animate-bot-bob' : ''}`}>
                <div className="barbell">
                  <div className="plate plate-l" /><div className="bar" /><div className="plate plate-r" />
                </div>
                <div className="human">
                  <div className="head" />
                  <div className="torso">
                    <div className="arm arm-l" />
                    <div className="arm arm-r" />
                  </div>
                  <div className="legs">
                    <div className="leg leg-l" />
                    <div className="leg leg-r" />
                  </div>
                </div>
              </div>
              <div className="w-3.5 bg-zinc-950 rounded-full h-full relative overflow-hidden border border-zinc-700">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-red-800 to-red-500 transition-all duration-300" style={{ height: `${bot}%` }} />
              </div>
            </div>
          </div>

          <div className="h-28 flex items-center relative z-40 border-t-2 border-zinc-700 bg-zinc-900/50 rounded-b-xl px-2">
            {!game && !result ? (
              <button 
                onClick={startGame} 
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-2xl uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all shadow-[0_6px_0_#1e3a8a] active:shadow-none active:translate-y-1"
              >
                START MISSION
              </button>
            ) : (
              <button 
                onClick={clickPower} 
                disabled={asking || freeze || !!result} 
                className="w-full py-6 rounded-2xl font-black text-3xl uppercase transition-all select-none disabled:opacity-40 border-b-8 border-black/30" 
                style={{ 
                  backgroundColor: btnColor, 
                  color: 'black', 
                  boxShadow: (freeze || result) ? 'none' : `0 8px 0 ${btnColor === 'gold' ? '#b8860b' : '#00bfa5'}`,
                  transform: hit ? 'translateY(6px)' : 'none'
                }}>
                {btnText}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-gym-pattern {
          background-color: #09090b;
          background-image: radial-gradient(#1c1c1f 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .bg-concrete-pattern {
          background-color: #18181b;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%2327272a' fill-opacity='0.4' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
        }
        .bg-wood-pattern {
          background-image: repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px);
        }
        .lifter-box { position: relative; width: 60px; display: flex; flex-direction: column; align-items: center; }
        .human { position: relative; width: 18px; height: 45px; }
        .head { width: 12px; height: 12px; background: #ffe0bd; border-radius: 50%; margin: 0 auto; position: relative; z-index: 2; border: 1px solid #c6a683; }
        .torso { width: 14px; height: 22px; background: #3b82f6; border-radius: 4px; margin-top: -2px; position: relative; border: 1px solid #1d4ed8; }
        .bot-color .torso { background: #ef4444; border: 1px solid #b91c1c; }
        .arm { width: 3px; height: 20px; background: #ffe0bd; position: absolute; top: 1px; transform-origin: top; transition: transform 0.1s ease-out; border: 1px solid #c6a683; }
        .arm-l { left: -4px; transform: rotate(20deg); }
        .arm-r { right: -4px; transform: rotate(-20deg); }
        .animate-lift-physic .arm-l { transform: rotate(160deg); }
        .animate-lift-physic .arm-r { transform: rotate(-160deg); }
        .animate-lift-physic .barbell { transform: translateY(-22px); }
        .legs { display: flex; justify-content: space-between; width: 16px; margin-top: -2px; }
        .leg { width: 6px; height: 16px; background: #1e3a8a; border-radius: 2px; }
        .bot-color .leg { background: #7f1d1d; }
        .barbell { position: relative; width: 80px; height: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: -5px; z-index: 10; transition: transform 0.1s ease-out; }
        .bar { width: 100%; height: 4px; background: #94a3b8; border-radius: 2px; border: 1px solid #64748b; }
        .plate { width: 10px; height: 30px; background: #111; border-radius: 3px; position: absolute; border: 2px solid #333; }
        .plate-l { left: 0; } .plate-r { right: 0; }
        .animate-lift-physic { animation: lifter-move 0.15s ease-out; }
        @keyframes lifter-move { 0% { transform: translateY(0); } 30% { transform: translateY(8px); } 60% { transform: translateY(-25px); } 100% { transform: translateY(0); } }
        .animate-bot-bob { animation: bot-bob 0.8s infinite ease-in-out; }
        @keyframes bot-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bot-bob .arm-l { animation: bot-arm-l 0.8s infinite ease-in-out; }
        .animate-bot-bob .arm-r { animation: bot-arm-r 0.8s infinite ease-in-out; }
        .animate-bot-bob .barbell { animation: bot-barbell 0.8s infinite ease-in-out; }
        @keyframes bot-arm-l { 0%, 100% { transform: rotate(20deg); } 50% { transform: rotate(150deg); } }
        @keyframes bot-arm-r { 0%, 100% { transform: rotate(-20deg); } 50% { transform: rotate(-150deg); } }
        @keyframes bot-barbell { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .glow { filter: drop-shadow(0 0 15px #00f2ff); }
        .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes pop-in { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}