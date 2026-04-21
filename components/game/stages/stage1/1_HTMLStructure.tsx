"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

interface Bubble {
  id: number;
  tag: string;
  y: number;
  x: number;
  speed: number;
}

interface ShuffledOption {
  text: string;
  isCorrect: boolean;
}

// 1. คลังคำถาม - (คงเดิม ห้ามแก้)
const ALL_QUESTIONS = [
  {
    tag: "<h1>",
    q: "แท็ก <h1> ใช้ทำอะไรในหน้าเว็บ?",
    ans: "หัวข้อหลัก (Main Heading)",
    decovs: ["ย่อหน้าทั่วไป (Paragraph)", "ตัวหนา (Bold Text)", "รายการ (List Item)"],
  },
  {
    tag: "<p>",
    q: "แท็ก <p> มีหน้าที่หลักคืออะไร?",
    ans: "ข้อความย่อหน้า (Paragraph Content)",
    decovs: ["หัวข้อใหญ่ (Main Heading)", "ลิงก์เชื่อมโยง (Hyperlink)", "รูปภาพประกอบ (Image Content)"],
  },
  {
    tag: "<a>",
    q: "แท็ก <a> ถูกใช้เพื่อจุดประสงค์ใด?",
    ans: "ลิงก์เชื่อมโยง (Hyperlink Link)",
    decovs: ["ขึ้นบรรทัดใหม่ (Line Breaker)", "ตัวอักษรเอียง (Italic Style)", "จัดกลุ่มข้อมูล (Division Box)"],
  },
  {
    tag: "<img>",
    q: "แท็ก <img> จำเป็นต้องมี Attribute ใด?",
    ans: "แหล่งที่มารูป (Source Path)",
    decovs: ["ลิงก์ปลายทาง (Link Path)", "ชื่อหัวข้อ (Title Name)", "ลำดับรายการ (List Index)"],
  },
  {
    tag: "<ul>",
    q: "แท็ก <ul> ทำงานร่วมกับแท็กใดเสมอ?",
    ans: "รายการข้อมูล (List Item)",
    decovs: ["เส้นคั่นบรรทัด (Horizontal Line)", "จัดกลุ่มเนื้อหา (Content Group)", "ส่วนหัวตาราง (Table Header)"],
  },
];

const DUMMY_TAGS = ["<p>", "<div>", "<span>", "<a>", "<img>", "<ul>", "<li>", "<br>", "<hr>"];

function shuffleQuestions() {
  return [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
}

function shuffleOptions(question: (typeof ALL_QUESTIONS)[0]): ShuffledOption[] {
  return [question.ans, ...question.decovs]
    .map((text) => ({ text, isCorrect: text === question.ans }))
    .sort(() => Math.random() - 0.5);
}

export function HTMLStructure_1_1({ onComplete, isActive }: StageProps) {
  const [yPos, setYPos] = useState(50);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [isQuizMode, setIsQuizMode] = useState(false);
  // ===== ระบบเสียงพื้นหลัง =====
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio("/sound/Html -1.mp3"); // เปลี่ยนชื่อไฟล์เสียงได้
    a.loop = true;
    a.preload = "auto";
    audioRef.current = a;
    // เล่นทันทีเมื่อเข้าเกม
    const playPromise = a.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {});
    }
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);
  const [isStunned, setIsStunned] = useState(false);
  const [stunTimer, setStunTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const quizWrongRef = useRef(0);
  /** Stops bubbles/quiz after 3 correct so progress cannot exceed 3/3 or double onComplete. */
  const gameCompleteRef = useRef(false);
  // ควบคุมเสียงพื้นหลัง: หยุดเมื่อ freeze หรือ quiz, เล่นต่อเมื่อกลับมาหน้าว่ายน้ำ
  useEffect(() => {
    if (!audioRef.current) return;
    if (isQuizMode || isStunned) {
      audioRef.current.pause();
    } else {
      // เงื่อนไขกลับมาหน้าว่ายน้ำ
      const playPromise = audioRef.current.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {});
      }
    }
  }, [isQuizMode, isStunned]);

  // เล่นเสียง freeze ทันทีที่แสดง overlay freeze
  const freezeAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevIsStunnedRef = useRef(false);
  useEffect(() => {
    // ถ้าเพิ่งเปลี่ยนจาก false -> true ให้เล่นเสียง freeze ทันที
    if (!prevIsStunnedRef.current && isStunned) {
      if (freezeAudioRef.current) {
        freezeAudioRef.current.pause();
        freezeAudioRef.current.currentTime = 0;
      }
      const freezeAudio = new Audio("/sound/Freeze Sound Effect.mp3");
      freezeAudioRef.current = freezeAudio;
      freezeAudio.play().catch(() => {});
    }
    // ถ้าหลุด freeze ให้หยุดเสียง freeze
    if (prevIsStunnedRef.current && !isStunned) {
      if (freezeAudioRef.current) {
        freezeAudioRef.current.pause();
        freezeAudioRef.current.currentTime = 0;
        freezeAudioRef.current = null;
      }
    }
    prevIsStunnedRef.current = isStunned;
  }, [isStunned]);

  const [questionQueue, setQuestionQueue] = useState<typeof ALL_QUESTIONS>([]);
  const [currentQ, setCurrentQ] = useState<(typeof ALL_QUESTIONS)[0] | null>(null);
  const yPosRef = useRef(yPos);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const shuffled = shuffleQuestions();
      setQuestionQueue(shuffled);
      setCurrentQ(shuffled[0] ?? null);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const triggerPenalty = useCallback(() => {
    setIsStunned(true);
    setStunTimer(3);


    const timer = setInterval(() => {
      setStunTimer((p) => {
        if (p <= 1) {
          clearInterval(timer);
          setIsStunned(false);
          // หยุดเสียง freeze เมื่อหลุด freeze
          if (freezeAudioRef.current) {
            freezeAudioRef.current.pause();
            freezeAudioRef.current.currentTime = 0;
            freezeAudioRef.current = null;
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isQuizMode || isStunned) return;

      const key = e.key.toLowerCase();

      if (key === "arrowup" || key === "w") {
        e.preventDefault();
        setYPos((prev) => Math.max(10, prev - 20));
      }

      if (key === "arrowdown" || key === "s") {
        e.preventDefault();
        setYPos((prev) => Math.min(90, prev + 20));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isQuizMode, isStunned]);

  useEffect(() => {
    yPosRef.current = yPos;
  }, [yPos]);

  useEffect(() => {
    if (!isActive || isQuizMode || isStunned || score >= 3 || gameCompleteRef.current) return;

    const interval = setInterval(() => {
      if (document.hidden) return;

      const lanes = [10, 30, 50, 70, 90];
      const randomY = lanes[Math.floor(Math.random() * lanes.length)];
      
      const randomTag = ALL_QUESTIONS[Math.floor(Math.random() * ALL_QUESTIONS.length)].tag;

      const newBubble: Bubble = {
        id: Date.now() + Math.random(),
        tag: randomTag,
        y: randomY,
        x: 100,
        speed: 0.7,
      };

      setBubbles((prev) => [...prev, newBubble]);
    }, 1400);

    const moveInterval = setInterval(() => {
      setBubbles((prev) => {
        let hitBubble: Bubble | null = null;

        const remaining = prev
          .map((b) => ({ ...b, x: b.x - b.speed }))
          .filter((b) => {
            if (b.x <= -20) return false;

            const isAtPlayerX = b.x >= 10 && b.x <= 20;
            const isAtPlayerY = Math.abs(b.y - yPosRef.current) <= 10;

            if (!hitBubble && isAtPlayerX && isAtPlayerY) {
              hitBubble = b;
              return false;
            }

            return true;
          });

        const collided = hitBubble as Bubble | null;
        if (collided !== null) {
          if (score >= 3 || gameCompleteRef.current) {
            return remaining;
          }
          const nextQuestion = questionQueue[score];
          if (nextQuestion) {
            setCurrentQ(nextQuestion);
            setShuffledOptions(shuffleOptions(nextQuestion));
            setIsQuizMode(true);
          }
        }

        return remaining;
      });
    }, 20);

    return () => {
      clearInterval(interval);
      clearInterval(moveInterval);
    };
  }, [isActive, isQuizMode, isStunned, questionQueue, score, triggerPenalty]);

  const handleCorrect = () => {
    if (gameCompleteRef.current) return;
    const newScore = score + 1;
    setScore(newScore);
    setIsQuizMode(false);
    setShuffledOptions([]);

    if (newScore >= 3) {
      gameCompleteRef.current = true;
      onComplete?.({ correct: 3, total: 3 + quizWrongRef.current });
      // เล่นเสียงเชียร์เด็ก
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const cheerAudio = new Audio("/sound/Kids Cheering - Sound Effect (HD).mp3");
      cheerAudio.play().catch(() => {});
    }
  };

  return (
    <div className="relative space-y-6 overflow-hidden select-none">
      {/* PROGRESS BAR - (คงเดิม ห้ามแก้) */}
      <div className="bg-white/10 p-4 rounded-2xl border-2 border-white/20 flex justify-between items-center gap-3 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms]" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div>
            <h3 className="font-black text-white italic tracking-tighter text-xl leading-none">
              SWIMMING STAGE
            </h3>
            <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-wider mt-1">
              Progress: {Math.min(score, 3)}/3
            </p>
          </div>
          <div className="h-12 w-[1.5px] bg-white/20 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest leading-none mb-1">เป้าหมาย:</span>
            <span className="text-yellow-400 font-black text-3xl animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] leading-none">จงไล่เก็บฟองสบู่</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative z-10 shrink-0">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-700 ${i < Math.min(score, 3) ? "bg-yellow-400 shadow-[0_0_15px_#f2d913] scale-110" : "bg-white/10 border-2 border-white/20"}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
            className="rounded-full bg-white/90 p-1.5 sm:p-2 text-base sm:text-lg leading-none shadow-md ring-1 ring-black/5 hover:bg-blue-100 transition touch-manipulation shrink-0"
          >
            {isMuted ? "🔕" : "🔔"}
          </button>
        </div>
      </div>

      {/* NEW SWIMMING POOL DESIGN - เน้นความสมจริงและ Depth */}
      <div className="relative w-full h-[520px] bg-[#004e7c] rounded-3xl overflow-hidden border-[12px] border-slate-900 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        
        {/* Layer 1: Deep Water & Floor Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#003b5c] via-[#006097] to-[#0092ca]" />

        {/* Layer 2: Pool Floor T-Lines (เส้นลู่ก้นสระแบบมิติเฉียง) */}
        <div className="absolute inset-0 opacity-40 z-0" style={{ perspective: '1000px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} 
                 className="absolute w-[80%] h-5 bg-slate-900"
                 style={{ 
                   top: `${[10, 30, 50, 70, 90][i]}%`, 
                   left: '10%',
                   transform: 'rotateX(45deg) skewX(-10deg)',
                   boxShadow: '0 0 15px rgba(0,0,0,0.3)'
                 }}>
              <div className="absolute right-0 w-16 h-full bg-white opacity-60"></div> {/* ขีดเส้นชัยปลาย T */}
            </div>
          ))}
        </div>

        {/* Layer 3: Realistic Water Ripples & Caustics (เงาน้ำเคลื่อนไหว) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen animate-pulse" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 10px)',
               backgroundSize: '100px 100px',
               animation: 'waterFlow 10s infinite linear'
             }} />

        {/* Layer 4: Lane Rope Markers (ทุ่นกั้นเลนแบบลอยตัว) */}
        <div className="absolute inset-0 flex flex-col justify-between py-[10%] z-20">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="relative w-full h-5 flex items-center">
              {/* สายสลิงลู่ */}
              <div className="absolute w-full h-[3px] bg-slate-800/40 top-1/2 -translate-y-1/2 shadow-xl"></div>
              {/* เม็ดทุ่นสีสดใส */}
              <div className="flex w-full justify-between px-1 relative z-10">
                {[...Array(30)].map((_, idx) => (
                  <div key={idx} 
                       className={`w-3.5 h-3.5 rounded-full shadow-lg border-[0.5px] border-black/10
                                  ${idx % 6 === 0 ? 'bg-red-600' : idx % 3 === 0 ? 'bg-white' : 'bg-blue-600'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Layer 5: Shadows & Edge Light (เงาขอบสระ) */}
        <div className="absolute inset-0 shadow-[inset_0_40px_60px_rgba(0,0,0,0.4),inset_0_-40px_60px_rgba(0,0,0,0.2)] pointer-events-none z-30" />

        <style jsx global>{`
          @keyframes waterFlow {
            0% { background-position: 0 0; opacity: 0.1; }
            50% { opacity: 0.25; }
            100% { background-position: 200px 100px; opacity: 0.1; }
          }
        `}</style>

        {/* Player Component - ปรับน้ำกระเพื่อมให้ชัดขึ้น */}
<div
  className="absolute transition-all duration-300 ease-out z-50 animate-bobbing"
  style={{
    left: `15%`,
    top: `${yPos}%`,
    transform: "translate(-50%, -50%)",
  }}
>
  <div className="relative group">
    
    {/* 1. เอฟเฟกต์น้ำกระเพื่อมข้างใต้ตัวละคร (ปรับปรุงใหม่ให้ชัดกว่าเดิม) */}
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-10 pointer-events-none z-[-1]">
      {/* วงน้ำชั้นนอก: เน้นเส้นขอบขาวชัดๆ และการเรืองแสง */}
      <div className="absolute inset-0 border-2 border-white/60 rounded-full animate-ripple-under shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
      {/* วงน้ำชั้นใน: ใช้สีฟ้าสว่างตัดกับน้ำในสระ */}
      <div className="absolute inset-2 border-2 border-sky-300/50 rounded-full animate-ripple-under-delayed" />
    </div>

    {/* 2. ตัวละคร Emoji 🏊 (ขนาด text-7xl และหันไปทางซ้ายคงเดิม) */}
    <div 
      className={`text-7xl select-none transition-transform duration-300 ${isStunned ? 'animate-pulse opacity-50' : ''}`}
      style={{ display: 'inline-block', transform: 'scaleX(-1)' }}
    >
      🏊
    </div>

    {/* ป้าย YOU */}
    {!isStunned && (
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-sky-900 text-xs font-black px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap">
        YOU
      </div>
    )}
  </div>
</div>

{/* CSS สำหรับ Animation (ปรับปรุงค่า Opacity และ Scale ให้ชัดขึ้น) */}
<style jsx global>{`
  @keyframes bobbing {
    0%, 100% { transform: translate(-50%, calc(-50% + 0px)); }
    50% { transform: translate(-50%, calc(-50% + 6px)); }
  }
  .animate-bobbing {
    animation: bobbing 2s ease-in-out infinite;
  }

  /* ปรับ Animation น้ำกระเพื่อมให้ขยายกว้างขึ้นและชัดเจนขึ้น */
  @keyframes ripple-under {
    0% { transform: scale(0.8); opacity: 0; }
    50% { opacity: 0.8; } /* ชัดขึ้นกว่าเดิม */
    100% { transform: scale(1.4); opacity: 0; }
  }
  .animate-ripple-under {
    animation: ripple-under 2.5s ease-out infinite;
  }
  
  @keyframes ripple-under-delayed {
    0% { transform: scale(0.6); opacity: 0; }
    50% { opacity: 0.6; }
    100% { transform: scale(1.2); opacity: 0; }
  }
  .animate-ripple-under-delayed {
    animation: ripple-under-delayed 2.5s ease-out infinite 1.25s;
  }
`}</style>

        {/* Bubbles - แก้ไขส่วนการแสดงผลข้อความให้ชัดเจนขึ้น */}
{bubbles.map((b) => (
  <div 
    key={b.id} 
    className="absolute w-16 h-16 rounded-full z-40 transition-transform duration-300" 
    style={{ 
      left: `${b.x}%`, 
      top: `${b.y}%`, 
      transform: "translate(-50%, -50%)",
      // เพิ่ม Effect ฟองสบู่ให้มีมิติและสะท้อนแสง
      background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 70%)",
      border: "2px solid rgba(255, 255, 255, 0.6)",
      boxShadow: "inset -5px -5px 12px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(2px)"
    }}
    >
    {/* แสงสะท้อนบนฟองสบู่ */}
    <div className="absolute top-[15%] left-[20%] w-4 h-2 bg-white/70 rounded-[50%] -rotate-[35deg]" />
    
  </div>
))}

        {/* Quiz Overlay - (คงเดิม ห้ามแก้) */}
        {isQuizMode && (
          <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 backdrop-blur-sm">
            <div className="w-full max-w-3xl bg-white rounded-[40px] p-8 text-center shadow-3xl border-4 border-white/10 relative overflow-visible flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-50" />
              <h2 className="text-blue-600 font-black text-lg mb-2 relative z-10 tracking-[0.2em] uppercase">CHALLENGE!</h2>
              <h1 className="text-3xl font-black text-slate-800 mb-8 italic relative z-10 leading-tight max-w-[95%]">{currentQ?.q}</h1>
              <div className="grid grid-cols-2 gap-3 w-full relative z-10">
                {shuffledOptions.map((opt, index) => (
                  <button key={index} onClick={() => opt.isCorrect ? handleCorrect() : (quizWrongRef.current += 1, setIsQuizMode(false), triggerPenalty())} className={`${["bg-rose-500", "bg-blue-600", "bg-emerald-500", "bg-amber-400"][index % 4]} hover:brightness-110 active:scale-95 text-white py-4 px-3 rounded-2xl font-bold text-lg shadow-[0_5px_0_rgba(0,0,0,0.15)] transition-all duration-200 flex items-center justify-center min-h-[90px] w-full`}><span className="drop-shadow-sm leading-tight break-words">{opt.text}</span></button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Frozen Overlay - (คงเดิม ห้ามแก้) */}
        {isStunned && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyan-600/50 backdrop-blur-xl z-[140] animate-in fade-in zoom-in duration-300">
            <div className="text-center relative flex flex-col items-center p-12">
              <i className="fa-solid fa-snowflake text-[9rem] animate-pulse mb-6 text-cyan-200"></i>
              <div className="text-[13rem] font-black text-white drop-shadow-2xl leading-none mt-[-25px]">{stunTimer}</div>
              <div className="text-4xl font-black text-cyan-50 italic tracking-widest uppercase mt-5">FREEZING...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}