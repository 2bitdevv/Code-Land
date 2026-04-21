'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { StageScorePayload } from '@/lib/utils/score'

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void
  isActive: boolean
  onRoomSkip?: () => void
  onBackToDashboard?: () => void
}

interface Question {
  q: string
  a: string[]
  c: number
}

type FeedbackType = 'correct' | 'wrong' | 'hit' | 'win' | 'gameover' | null

const QUESTIONS: Question[] = [
  { q: '<code>p { ? : red; }</code>', a: ['font-color', 'text-style', 'color', 'font-style'], c: 2 },
  { q: '<code>body { ? : blue; }</code>', a: ['background-color', 'bgcolor', 'bg-style', 'color-bg'], c: 0 },
  { q: '<code>h1 { ? : center; }</code>', a: ['align', 'text-align', 'font-align', 'center-text'], c: 1 },
  { q: '<code>div { ? : 20px; }</code>', a: ['gap', 'margin', 'spacing', 'padding'], c: 3 },
  { q: '<code>div { ? : 2px solid black; }</code>', a: ['border', 'outline', 'line', 'stroke'], c: 0 },
]

const shuffle = (arr: Question[]) => [...arr].sort(() => Math.random() - 0.5)

export default function CSSStyling_2_1({ onComplete, isActive }: StageProps) {
  // --- States ---
  const [gameRunning, setGameRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [isGameOver, setIsGameOver] = useState(false)
  const [playerBottom, setPlayerBottom] = useState(40)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [obstacleLeft, setObstacleLeft] = useState(-10)
  const [obstacleHeight, setObstacleHeight] = useState(50)
  const [obstacleVisible, setObstacleVisible] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [showQuestion, setShowQuestion] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackType>(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [questionPool, setQuestionPool] = useState<Question[]>([])
  const wrongAnswersRef = useRef(0)
  const runCompleteRef = useRef(false)
  const correctAnswersRef = useRef(0)
  /** ป้องกัน setTimeout จบรอบเก่ายังไหลมาหลังกดเล่นใหม่ / remount */
  const sessionIdRef = useRef(0)
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCompletionTimeout = () => {
    if (completionTimeoutRef.current != null) {
      clearTimeout(completionTimeoutRef.current)
      completionTimeoutRef.current = null
    }
  }

  const scheduleReportRunComplete = (won: boolean, correctCount: number, delayMs: number) => {
    clearCompletionTimeout()
    const sid = sessionIdRef.current
    completionTimeoutRef.current = setTimeout(() => {
      completionTimeoutRef.current = null
      if (sid !== sessionIdRef.current) return
      reportRunComplete(won, correctCount)
    }, delayMs)
  }

  // --- Refs (For Logic Sync) ---
  const gameRunningRef = useRef(false)
  const pausedRef = useRef(false)
  const obstacleLeftRef = useRef(-10)
  const obstacleHeightRef = useRef(50)
  const playerBottomRef = useRef(40)
  const isJumpingRef = useRef(false)
  const jumpAudioRef = useRef<HTMLAudioElement | null>(null)
  const livesRef = useRef(3)
  const scoreRef = useRef(0)
  const obstaclePassedRef = useRef(false)

  const showFeedback = (type: FeedbackType, msg: string) => {
    setFeedback(type)
    setFeedbackMsg(msg)
    setTimeout(() => {
      setFeedback(null)
      setFeedbackMsg('')
    }, 1200)
  }

  const spawnObstacle = useCallback(() => {
    obstacleLeftRef.current = -10
    setObstacleLeft(-10)
    // สุ่มความสูงไม้กั้นให้หลากหลายแต่ไม่สูงเกินไป
    obstacleHeightRef.current = 35 + Math.random() * 20 
    setObstacleHeight(obstacleHeightRef.current)
    obstaclePassedRef.current = false
    setObstacleVisible(true)
  }, [])

  const resetGame = () => {
    sessionIdRef.current += 1
    clearCompletionTimeout()
    runCompleteRef.current = false
    scoreRef.current = 0
    livesRef.current = 3
    playerBottomRef.current = 40
    pausedRef.current = false
    gameRunningRef.current = true
    
    setScore(0)
    setLives(3)
    setCorrectAnswers(0)
    correctAnswersRef.current = 0
    wrongAnswersRef.current = 0
    setIsGameOver(false)
    setPlayerBottom(40)
    setGameRunning(true)
    setQuestionPool(shuffle(QUESTIONS))
    spawnObstacle()
  }

  const reportRunComplete = useCallback(
    (won: boolean, correctCount: number) => {
      if (runCompleteRef.current) return
      clearCompletionTimeout()
      runCompleteRef.current = true
      gameRunningRef.current = false
      setGameRunning(false)
      setShowQuestion(false)
      pausedRef.current = false
      onComplete?.({
        correct: won ? 3 : Math.min(3, Math.max(0, correctCount)),
        total: 3 + wrongAnswersRef.current,
      })
    },
    [onComplete],
  )

  const jump = useCallback(() => {
    if (isJumpingRef.current || !gameRunningRef.current || pausedRef.current) return
    isJumpingRef.current = true

    // Play jump sound (reset to start so repeated jumps sound correctly)
    try {
      if (jumpAudioRef.current) {
        jumpAudioRef.current.currentTime = 0
        void jumpAudioRef.current.play()
      }
    } catch (e) {
      // ignore play errors (autoplay/muted restrictions)
    }

    const jumpHeight = 180 // ปรับความสูงให้พอเหมาะ
    const duration = 700   // ระยะเวลาลอยตัว (ms)
    const start = performance.now()

    const animate = (now: number) => {
      const t = (now - start) / duration
      if (t < 1) {
        // ใช้สูตร Parabolic curve (y = 4 * h * t * (1-t))
        const curve = 4 * t * (1 - t)
        playerBottomRef.current = 40 + jumpHeight * curve
        setPlayerBottom(playerBottomRef.current)
        requestAnimationFrame(animate)
      } else {
        playerBottomRef.current = 40
        setPlayerBottom(40)
        isJumpingRef.current = false
      }
    }
    requestAnimationFrame(animate)
  }, [])

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      const nextCorrect = correctAnswers + 1
      setCorrectAnswers(nextCorrect)
      correctAnswersRef.current = nextCorrect
      showFeedback('correct', '✔ ถูกต้อง! เยี่ยมมาก')
      if (nextCorrect >= 3) {
        scheduleReportRunComplete(true, 3, 600)
        return
      }
    } else {
      wrongAnswersRef.current += 1
      livesRef.current--
      setLives(livesRef.current)
      showFeedback('wrong', '❌ เกือบถูกแล้ว! ลองใหม่')
      if (livesRef.current <= 0) {
        gameRunningRef.current = false
        setGameRunning(false)
        setIsGameOver(true)
        scheduleReportRunComplete(false, correctAnswersRef.current, 800)
        return
      }
    }
    setShowQuestion(false)
    pausedRef.current = false
    setTimeout(() => spawnObstacle(), 300);
  }

  // --- Game Loop ---
  useEffect(() => {
    if (!isActive) return
    let id: number

    const loop = () => {
      if (gameRunningRef.current && !pausedRef.current) {
        // ความเร็วไม้กั้น
        obstacleLeftRef.current += 0.65
        setObstacleLeft(obstacleLeftRef.current)

        const left = obstacleLeftRef.current
        const height = obstacleHeightRef.current
        const pb = playerBottomRef.current

        // --- Collision Logic ---
        // ผู้เล่นอยู่ขวา 20% (left = 80%) 
        // เช็คการชนในช่วงที่ไม้กั้นวิ่งผ่านตัวละคร
        if (!obstaclePassedRef.current && left > 73 && left < 79) {
          if (pb < height + 35) { // Hitbox ใจดี (Offset 35px)
            obstaclePassedRef.current = true
            livesRef.current--
            setLives(livesRef.current)
            
            if (livesRef.current <= 0) {
              gameRunningRef.current = false
              setGameRunning(false)
              setIsGameOver(true)
              scheduleReportRunComplete(false, correctAnswersRef.current, 800)
            } else {
              showFeedback('hit', '💥 อุ๊ย! ชนซะแล้ว')
              spawnObstacle()
            }
          }
        }

        // --- Pass Obstacle Logic ---
        if (left > 85 && !obstaclePassedRef.current) {
          obstaclePassedRef.current = true
          scoreRef.current++
          setScore(scoreRef.current)
          
          pausedRef.current = true
          const nextQ = questionPool[scoreRef.current % QUESTIONS.length] || QUESTIONS[0]
          setCurrentQuestion(nextQ)
          setShowQuestion(true)
        }
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [isActive, questionPool, spawnObstacle, reportRunComplete])

  useEffect(() => {
    return () => clearCompletionTimeout()
  }, [])

  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (!gameRunningRef.current) {
            if (!showQuestion) resetGame()
        } else {
            jump()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jump, showQuestion])

  // --- Audio Setup ---
  useEffect(() => {
    // public assets are served from /sound/
    jumpAudioRef.current = new Audio('/sound/jump sound.mp3')
    // keep it ready
    jumpAudioRef.current.preload = 'auto'
    return () => {
      if (jumpAudioRef.current) {
        jumpAudioRef.current.pause()
        jumpAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    correctAnswersRef.current = correctAnswers
  }, [correctAnswers])

  return (
    <div className="max-w-2xl mx-auto p-4 select-none font-sans min-w-0 max-w-full overflow-x-hidden">
      {/* Header UI */}
      <div className="bg-slate-800 p-4 rounded-t-3xl flex justify-between items-center border-x-4 border-t-4 border-slate-700 shadow-lg">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mission Progress</span>
          <div className="flex space-x-1 mt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-10 h-2 rounded-full transition-all duration-500 ${i < correctAnswers ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
        <div className="text-2xl font-black text-white italic tracking-widest">
           <span className="text-blue-400">LEVEL:</span> {score}
        </div>
        <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-600 flex items-center">
          <span className="text-lg mr-2">❤️</span>
          <span className="font-bold text-white text-xl">{Math.max(0, lives)}</span>
        </div>
      </div>

      {/* Game Stage */}
      <div className="relative w-full h-80 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-x-4 border-slate-700 overflow-hidden shadow-inner">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-20" 
             style={{backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px'}} />

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-10 bg-slate-800 border-t-4 border-slate-600 z-10">
            <div className="flex w-full h-full opacity-20">
                {[...Array(20)].map((_, i) => <div key={i} className="flex-1 border-r border-white rotate-12" />)}
            </div>
        </div>
        
        {/* Player Character */}
        <div
          style={{ bottom: `${playerBottom}px`, right: '20%' }}
          className="absolute w-14 h-14 z-20 transition-transform duration-75"
        >
          <div className={`w-full h-full bg-yellow-400 rounded-xl border-b-4 border-r-4 border-yellow-600 flex items-center justify-center ${playerBottom > 45 ? 'animate-pulse' : ''}`}>
             <div className="flex space-x-2 bg-slate-900/10 p-1 rounded-md">
                <div className="w-2 h-2 bg-slate-900 rounded-full" />
                <div className="w-2 h-2 bg-slate-900 rounded-full" />
             </div>
          </div>
          {/* Shadow effect */}
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/40 rounded-full blur-sm transition-all duration-300 ${playerBottom > 45 ? 'scale-150 opacity-10' : 'scale-100 opacity-60'}`} />
        </div>

        {/* Moving Obstacle */}
        {obstacleVisible && (
          <div
            style={{ left: `${obstacleLeft}%`, height: `${obstacleHeight}px` }}
            className="absolute bottom-10 w-10 bg-gradient-to-t from-red-600 to-rose-400 border-2 border-red-900 z-10 rounded-t-lg shadow-[0_0_15px_rgba(225,29,72,0.5)]"
          >
            <div className="w-full h-1 bg-white/30 mt-2" />
            <div className="w-full h-1 bg-white/30 mt-3" />
          </div>
        )}

        {/* Start / Game Over Overlay */}
        {(!gameRunning || isGameOver) && (
          <div className="absolute inset-0 bg-slate-950/80 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
            <div className="mb-6 scale-110">
                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter italic drop-shadow-lg">
                    {isGameOver ? 'GAME OVER' : 'CSS SUPERJUMP'}
                </h2>
                <div className="h-1 w-full bg-blue-500 rounded-full" />
            </div>
            
            <p className="text-slate-300 mb-8 max-w-xs text-sm leading-relaxed">
                {isGameOver ? 'อย่าเพิ่งยอมแพ้! ทบทวน CSS แล้วลองอีกครั้ง' : 'หลบสิ่งกีดขวางแล้วตอบคำถาม CSS 3 ข้อเพื่อผ่านด่าน'}
            </p>

            <button 
                onClick={resetGame} 
                className="group relative bg-white text-slate-900 px-12 py-4 rounded-xl font-black text-xl transition-all hover:bg-blue-400 hover:text-white active:scale-95 shadow-xl"
            >
              {isGameOver ? 'TRY AGAIN' : 'START MISSION'}
            </button>
            <p className="text-slate-500 mt-4 text-[10px] uppercase tracking-widest font-bold">Press SPACE to jump</p>
          </div>
        )}

        {/* Real-time Feedback */}
        {feedback && (
          <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full font-black shadow-2xl animate-bounce border-2 ${
            feedback === 'correct' ? 'bg-green-500 text-white border-green-200' : 'bg-red-500 text-white border-red-200'
          }`}>
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* Quiz UI Section */}
      {showQuestion && currentQuestion && (
        <div className="bg-slate-800 p-6 rounded-b-3xl border-x-4 border-b-4 border-slate-700 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-2 mb-4">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
             <span className="text-blue-400 font-bold text-xs tracking-widest uppercase">Challenge Question:</span>
          </div>

          <div className="text-2xl text-emerald-300 font-mono mb-6 bg-slate-950 p-5 rounded-2xl border border-slate-700 shadow-inner" 
               dangerouslySetInnerHTML={{ __html: currentQuestion.q }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
            {currentQuestion.a.map((ans, idx) => (
              <button 
                key={idx} 
                onClick={() => handleAnswer(idx === currentQuestion.c)} 
                className="bg-slate-700/50 hover:bg-indigo-600 text-white p-3 sm:p-4 rounded-xl text-left transition-all border-b-4 border-slate-900 hover:border-indigo-800 active:border-b-0 active:translate-y-1 font-bold group min-w-0 break-words"
              >
                <span className="inline-block w-8 h-8 bg-slate-800 rounded-lg text-center leading-8 mr-3 group-hover:bg-indigo-400 transition-colors">
                    {idx + 1}
                </span>
                {ans}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}