import React, { useState, useEffect, useRef, useCallback } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

const STAGES = [
	{
		id: 1,
		name: "The Rookie",
		subtitle: "JavaScript Basics",
		botName: "Dusty Pete",
		botHP: 50,
		botColor: "#8B4513",
		botHatColor: "#6b3410",
		laserSpeed: 1.0,
		bg: {
			sky1: "#ffd4a8",
			sky2: "#ffb366",
			ground: "#d4956a",
			groundDark: "#c07a4f",
		},
		questions: [
			{
				q: "JavaScript ใช้ทำอะไร?",
				choices: [
					"ตกแต่งเว็บ",
					"สร้างเว็บไซต์แบบ interactive",
					"เก็บข้อมูลใน server",
					"วาดรูปเท่านั้น",
				],
				answer: 1,
			},
			{
				q: "ตัวแปรใน JS ประกาศด้วยคีย์เวิร์ดอะไร?",
				choices: ["var let const", "int float string", "def let var", "new old var"],
				answer: 0,
			},
			{
				q: "console.log() ใช้ทำอะไร?",
				choices: ["รับค่าจากผู้ใช้", "แสดงผลใน console", "สร้างตัวแปร", "วนลูป"],
				answer: 1,
			},
			{
				q: "String ใน JS ใส่ใน?",
				choices: ["[]", "'' หรือ \"\"", "//", "{}"],
				answer: 1,
			},
			{
				q: "typeof 42 คืนค่าอะไร?",
				choices: ["string", "number", "object", "boolean"],
				answer: 1,
			},
			{
				q: "typeof 'hello' คืนค่าอะไร?",
				choices: ["number", "string", "object", "array"],
				answer: 1,
			},
			{
				q: "! คือ operator อะไร?",
				choices: ["logical not", "logical and", "logical or", "bitwise not"],
				answer: 0,
			},
			{
				q: "=== ต่างจาก == อย่างไร?",
				choices: ["เปรียบ type ด้วย", "เปรียบเฉพาะค่า", "ใช้กับ array เท่านั้น", "ไม่มีความต่าง"],
				answer: 0,
			},
		],
	},
	{
		id: 2,
		name: "The Outlaw",
		subtitle: "Functions & Arrays",
		botName: "Snake McGee",
		botHP: 50,
		botColor: "#2d4a1e",
		botHatColor: "#1a2e10",
		laserSpeed: 1.2,
		bg: {
			sky1: "#b8d4f0",
			sky2: "#7ab0d4",
			ground: "#8faa6b",
			groundDark: "#6e8a4d",
		},
		questions: [
			{
				q: "function คืออะไร?",
				choices: ["บล็อกโค้ดที่เรียกใช้ซ้ำได้", "ตัวแปรชนิดหนึ่ง", "ค่าคงที่", "ลูป"],
				answer: 0,
			},
			{
				q: "Array คืออะไร?",
				choices: ["ตัวแปรชนิดตัวเลข", "ชุดข้อมูลที่เก็บหลายค่า", "ฟังก์ชัน", "ข้อความ"],
				answer: 1,
			},
			{
				q: "array.length คืออะไร?",
				choices: ["ค่ามากสุดใน array", "จำนวน element ใน array", "ชื่อ array", "ชนิดข้อมูล"],
				answer: 1,
			},
			{
				q: "array.push() ทำอะไร?",
				choices: ["เพิ่ม element ท้าย array", "ลบ element สุดท้าย", "หาค่าเฉลี่ย", "วนลูป"],
				answer: 0,
			},
			{
				q: "array.pop() ทำอะไร?",
				choices: ["เพิ่ม element ท้าย array", "ลบ element สุดท้าย", "หาค่ามากสุด", "แปลงเป็น string"],
				answer: 1,
			},
			{
				q: "return statement ทำอะไร?",
				choices: ["วนลูป", "ส่งค่ากลับจาก function", "สร้างตัวแปรใหม่", "รับค่าจากผู้ใช้"],
				answer: 1,
			},
			{
				q: "Arrow function เขียนด้วยสัญลักษณ์อะไร?",
				choices: ["->", "<-", "=>", "==>"],
				answer: 2,
			},
			{
				q: "typeof [] คืนค่าอะไร?",
				choices: ["array", "object", "string", "number"],
				answer: 1,
			},
		],
	},
	{
		id: 3,
		name: "The Sheriff",
		subtitle: "Objects & Loops",
		botName: "Iron Jack",
		botHP: 50,
		botColor: "#1a1a4e",
		botHatColor: "#0d0d2e",
		laserSpeed: 2.0,
		bg: {
			sky1: "#1a0a2e",
			sky2: "#2d1a4e",
			ground: "#3d2a1a",
			groundDark: "#2a1a0a",
		},
		questions: [
			{
				q: "Object คืออะไร?",
				choices: ["ชุดข้อมูล key-value", "ตัวแปรชนิดตัวเลข", "ลูป", "ฟังก์ชัน"],
				answer: 0,
			},
			{
				q: "for loop ใช้ทำอะไร?",
				choices: ["วนซ้ำตามจำนวนที่กำหนด", "รับค่าจากผู้ใช้", "แสดงผลบนจอ", "สร้างตัวแปร"],
				answer: 0,
			},
			{
				q: "while loop ต่างจาก for อย่างไร?",
				choices: ["วนซ้ำตาม condition", "วนซ้ำตามจำนวนที่กำหนด", "ใช้กับ array เท่านั้น", "ไม่มีความต่าง"],
				answer: 0,
			},
			{
				q: "Object.keys() ทำอะไร?",
				choices: ["คืน array ของ key ทั้งหมด", "คืน array ของ value ทั้งหมด", "วนลูป", "สร้าง object ใหม่"],
				answer: 0,
			},
			{
				q: "forEach() ทำอะไร?",
				choices: ["วนซ้ำทุก element ใน array", "คืน array ใหม่", "ลบ element", "แปลงเป็น string"],
				answer: 0,
			},
			{
				q: "map() ต่างจาก forEach() อย่างไร?",
				choices: ["คืน array ใหม่", "ลบ element", "วนซ้ำทุก element", "ไม่มีความต่าง"],
				answer: 0,
			},
			{
				q: "filter() ทำอะไร?",
				choices: ["กรอง element ตาม condition", "วนซ้ำทุก element", "คืน array ใหม่", "แปลงเป็น string"],
				answer: 0,
			},
			{
				q: "spread operator ... ทำอะไร?",
				choices: ["กระจาย element ออกมา", "วนซ้ำทุก element", "คืน array ใหม่", "ลบ element"],
				answer: 0,
			},
		],
	},
];

const MAX_BULLETS = 6;
const LASER_RANGE = 65;
const MAX_HP = 50;

const ZONES = [
  { name: "หัว", color: "#ff3333", min: -9, max: -1, damage: 20 },
  { name: "ลำตัว", color: "#ffaa00", min: 0.75, max: 10, damage: 10 },
  { name: "ขา", color: "#33aaff", min: 4, max: 25, damage: 5 },
];

type Screen = "menu" | "game" | "stageclear" | "gameover";
type Phase = "question" | "aiming" | "result";

interface JSFunctionProps {
	onComplete?: (result?: StageScorePayload) => void;
	isActive?: boolean;
	onRoomSkip?: () => void;
	onBackToDashboard?: () => void;
}

type SfxName = "uiStart" | "shoot" | "hit" | "miss" | "botShoot" | "stageClear" | "gameOver";

function useSfx(enabled = true) {
	const audioCtxRef = useRef<AudioContext | null>(null);
	const poolRef = useRef<Record<SfxName, HTMLAudioElement[]>>({
		uiStart: [],
		shoot: [],
		hit: [],
		miss: [],
		botShoot: [],
		stageClear: [],
		gameOver: [],
	});

	const sfxUrl: Record<SfxName, string> = {
		uiStart: "/sfx/ui_start.mp3",
		shoot: "/sound/gun2.mp3",
		hit: "/sfx/hit.mp3",
		miss: "/sfx/miss.mp3",
		botShoot: "/sound/dragon-studio-gunshot-372470.mp3",
		stageClear: "/sfx/stage_clear.mp3",
		gameOver: "/sfx/game_over.mp3",
	};

	const ensureCtx = useCallback(() => {
		if (!audioCtxRef.current) {
			const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
			audioCtxRef.current = Ctx ? new Ctx() : null;
		}
		return audioCtxRef.current;
	}, []);

	const beep = useCallback((kind: SfxName) => {
		const ctx = ensureCtx();
		if (!ctx) return;
		if (ctx.state === "suspended") void ctx.resume();

		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 1500;

		const map: Record<SfxName, { f: number; dur: number; type: OscillatorType; vol: number }> = {
			uiStart: { f: 660, dur: 0.09, type: "triangle", vol: 0.14 },
			shoot: { f: 120, dur: 0.08, type: "square", vol: 0.22 },
			hit: { f: 240, dur: 0.07, type: "sawtooth", vol: 0.18 },
			miss: { f: 420, dur: 0.06, type: "sine", vol: 0.12 },
			botShoot: { f: 90, dur: 0.085, type: "square", vol: 0.22 },
			stageClear: { f: 880, dur: 0.12, type: "triangle", vol: 0.16 },
			gameOver: { f: 110, dur: 0.18, type: "sawtooth", vol: 0.16 },
		};

		const { f, dur, type, vol } = map[kind];
		osc.type = type;
		osc.frequency.setValueAtTime(f, now);
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(vol, now + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + dur + 0.02);
	}, [ensureCtx]);

	const play = useCallback((name: SfxName, opts?: { volume?: number; rate?: number }) => {
		if (!enabled) return;
		const src = sfxUrl[name];
		const pool = poolRef.current[name];
		const vol = opts?.volume ?? 1;
		const rate = opts?.rate ?? 1;

		try {
			const a = pool.find(x => x.paused || x.ended) ?? (() => {
				const na = new Audio(src);
				na.preload = "auto";
				pool.push(na);
				return na;
			})();

			a.currentTime = 0;
			a.volume = Math.max(0, Math.min(1, vol));
			a.playbackRate = rate;
			void a.play().catch(() => beep(name));
		} catch {
			beep(name);
		}
	}, [beep, enabled]);

	const unlock = useCallback(() => {
		if (!enabled) return;
		beep("uiStart");
		(Object.keys(sfxUrl) as SfxName[]).forEach((k) => {
			const a = new Audio(sfxUrl[k]);
			a.preload = "auto";
			a.volume = 0;
			void a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
		});
	}, [beep, enabled]);

	return { play, unlock };
}

function getZone(angle: number) {
	return ZONES.find((z) => angle >= z.min && angle < z.max) ?? null;
}

function shuffled<T>(arr: T[]): T[] {
	return [...arr].sort(() => Math.random() - 0.5);
}

function RevolverCylinder({ total, loaded, size = 90 }: { total: number; loaded: number; size?: number }) {
	const cx = size / 2, cy = size / 2, r = size * 0.32;
	const slots = Array.from({ length: total }, (_, i) => {
		const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
		return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), filled: i < loaded };
	});
	const hr = size * 0.42;
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<circle cx={cx} cy={cy} r={hr} fill="url(#cylGrad)" stroke="#888" strokeWidth="2" />
			{[0, 60, 120, 180, 240, 300].map((a, i) => (
				<line key={i} x1={cx} y1={cy}
					x2={cx + Math.cos(a * Math.PI / 180) * hr} y2={cy + Math.sin(a * Math.PI / 180) * hr}
					stroke="#666" strokeWidth="0.8" opacity="0.5" />
			))}
			<circle cx={cx} cy={cy} r={size * 0.12} fill="#222" stroke="#666" strokeWidth="1.5" />
			<circle cx={cx} cy={cy} r={size * 0.07} fill="#111" />
			{slots.map((s, i) => (
				<g key={i}>
					<circle cx={s.x} cy={s.y} r={size * 0.11} fill="#111" stroke="#555" strokeWidth="1" />
					{s.filled ? (
						<>
							<circle cx={s.x} cy={s.y} r={size * 0.09} fill="#a06000" />
							<circle cx={s.x} cy={s.y} r={size * 0.065} fill="#d4a017" />
							<circle cx={s.x} cy={s.y} r={size * 0.04} fill="#ffd700" />
							<circle cx={s.x - size * 0.015} cy={s.y - size * 0.015} r={size * 0.015} fill="#fffde0" opacity={0.85} />
						</>
					) : (
						<circle cx={s.x} cy={s.y} r={size * 0.07} fill="#1a1a1a" />
					)}
				</g>
			))}
			<defs>
				<radialGradient id="cylGrad" cx="35%" cy="35%" r="65%">
					<stop offset="0%" stopColor="#5a5a5a" />
					<stop offset="100%" stopColor="#1e1e1e" />
				</radialGradient>
			</defs>
		</svg>
	);
}

interface Particle {
	id: number; x: number; y: number; vx: number; vy: number;
	color: string; size: number; life: number; maxLife: number;
}

function useParticles() {
	const [particles, setParticles] = useState<Particle[]>([]);
	const pidRef = useRef(0);
	const rafRef = useRef<number | null>(null);

	const spawnParticles = useCallback((x: number, y: number, color: string, count = 12) => {
		const newP: Particle[] = Array.from({ length: count }, () => {
			const angle = Math.random() * Math.PI * 2;
			const speed = 2 + Math.random() * 5;
			return {
				id: pidRef.current++, x, y,
				vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
				color, size: 3 + Math.random() * 5, life: 1,
				maxLife: 30 + Math.floor(Math.random() * 20),
			};
		});
		setParticles(p => [...p, ...newP]);
	}, []);

	useEffect(() => {
		function tick() {
			setParticles(prev => {
				const next = prev
					.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 1 / p.maxLife }))
					.filter(p => p.life > 0);
				return next.length === prev.length && prev.length === 0 ? prev : next;
			});
			rafRef.current = requestAnimationFrame(tick);
		}
		rafRef.current = requestAnimationFrame(tick);
		return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
	}, []);

	return { particles, spawnParticles };
}

// DUAL HP BAR
function DualHPBar({
	playerHP, botHP, maxHP, botName, flashSide,
}: {
	playerHP: number; botHP: number; maxHP: number;
	botName: string; flashSide: "player" | "bot" | null;
}) {
	const pPct = Math.max(0, (playerHP / maxHP) * 50);
	const bPct = Math.max(0, (botHP / maxHP) * 50);
	const pCol = playerHP > maxHP * 0.6 ? "#22c55e" : playerHP > maxHP * 0.3 ? "#f59e0b" : "#ef4444";
	const bCol = botHP > maxHP * 0.6 ? "#ef4444" : botHP > maxHP * 0.3 ? "#b91c1c" : "#7f1d1d";

	return (
		<div style={{ padding: "0 4px 8px" }}>
			<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
				<span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
					 ผู้เล่น
					<span style={{ color: pCol, fontWeight: "bold", fontSize: 13 }}>{playerHP}</span>
				</span>
				<span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
					<span style={{ color: bCol, fontWeight: "bold", fontSize: 13 }}>{botHP}</span>
					{botName} 
				</span>
			</div>
			<div style={{
				display: "flex", height: 16, borderRadius: 8, overflow: "hidden",
				background: "#0f172a", border: "1px solid #1e293b", position: "relative",
			}}>
				<div style={{
					width: `${pPct}%`, background: pCol, borderRadius: "8px 0 0 8px",
					transition: "width 0.5s ease, background 0.3s",
					animation: flashSide === "player" ? "hpPulse 0.3s ease 3" : "none",
				}} />
				<div style={{ flex: 1, background: "#0f172a" }} />
				<div style={{
					width: `${bPct}%`, background: bCol, borderRadius: "0 8px 8px 0",
					transition: "width 0.5s ease, background 0.3s",
					animation: flashSide === "bot" ? "hpPulse 0.3s ease 3" : "none",
				}} />
				<div style={{
					position: "absolute", left: "50%", top: 0, bottom: 0,
					width: 2, background: "#334155", transform: "translateX(-50%)",
				}} />
			</div>
		</div>
	);
}

export function JSFunction_3_1({ onComplete, isActive = true }: JSFunctionProps) {
	const [screen, setScreen] = useState<Screen>("menu");
	const [stageIdx, setStageIdx] = useState(0);
	const [playerHP, setPlayerHP] = useState(MAX_HP);
	const [botHP, setBotHP] = useState(MAX_HP);
	const [bullets, setBullets] = useState(MAX_BULLETS);
	const [phase, setPhase] = useState<Phase>("question");
	const [qPool, setQPool] = useState<typeof STAGES[0]["questions"]>([]);
	const [qIdx, setQIdx] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<"" | "correct" | "wrong">("");
	const [laserAngle, setLaserAngle] = useState(0);
	const [flash, setFlash] = useState<{ type: "hit" | "miss" | "bot"; zone?: typeof ZONES[0] } | null>(null);
	const [flashSide, setFlashSide] = useState<"player" | "bot" | null>(null);
	const [resultMsg, setResultMsg] = useState<{ text: string; color: string } | null>(null);
	const [botShooting, setBotShooting] = useState(false);
	const [playerShooting, setPlayerShooting] = useState(false);
	const [shakeScreen, setShakeScreen] = useState(false);
	const [startedAt] = useState(() => Date.now());
	const [introAnim, setIntroAnim] = useState(false);
	const [showDraw, setShowDraw] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [wrongCount, setWrongCount] = useState(0);
	const correctAnswersRef = useRef(0);
	const wrongAnswersRef = useRef(0);
	const { play: playSfx, unlock: unlockSfx } = useSfx(!isMuted);
	const { play: playBgm, stop: stopBgm } = useCowboyBgm(!isMuted);

	const { particles, spawnParticles } = useParticles();
	const rafRef = useRef<number | null>(null);
	const angleRef = useRef(0);
	const dirRef = useRef(1);
	const inputRef = useRef<HTMLInputElement>(null);

	const stage = STAGES[stageIdx];
	const question = qPool[qIdx] ?? stage.questions[0];

	function initStage(idx: number) {
		const s = STAGES[idx];
		setStageIdx(idx);
		setPlayerHP(MAX_HP);
		setBotHP(MAX_HP);
		setBullets(MAX_BULLETS);
		setPhase("question");
		setQPool(shuffled(s.questions));
		setQIdx(0);
		setFeedback("");
		setFlash(null);
		setFlashSide(null);
		setResultMsg(null);
		setBotShooting(false);
		setPlayerShooting(false);
		setIntroAnim(true);
		setShowDraw(false);
		setWrongCount(0);
		correctAnswersRef.current = 0;
		wrongAnswersRef.current = 0;
		setTimeout(() => setIntroAnim(false), 800);
		setTimeout(() => { setShowDraw(true); setTimeout(() => setShowDraw(false), 1200); }, 900);
	}

	function startGame() {
		unlockSfx();
		playSfx("uiStart", { volume: 0.8 });
		setScreen("game");
		initStage(0);
	}

	useEffect(() => {
		if (screen === "game") {
			playBgm();
		} else {
			stopBgm();
		}
		return () => { stopBgm(); };
	}, [screen, playBgm, stopBgm]);

	const startLaser = useCallback(() => {
		angleRef.current = -LASER_RANGE / 2 - 12;
		dirRef.current = 1;
		setLaserAngle(angleRef.current);
		function tick() {
			angleRef.current += stage.laserSpeed * dirRef.current;
			if (angleRef.current > LASER_RANGE / 2 + 12) dirRef.current = -1;
			else if (angleRef.current < -LASER_RANGE / 2 - 12) dirRef.current = 1;
			setLaserAngle(angleRef.current);
			rafRef.current = requestAnimationFrame(tick);
		}
		rafRef.current = requestAnimationFrame(tick);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stage.laserSpeed]);

	const stopLaser = useCallback(() => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
	}, []);

	useEffect(() => () => stopLaser(), [stopLaser]);

	function nextQuestion(currentIdx: number, pool: typeof qPool) {
		const next = (currentIdx + 1) % pool.length;
		setQIdx(next);
		if (next === 0) setQPool(shuffled(stage.questions));
	}

	function handleAnswer(idx: number) {
		if (feedback !== "" || phase !== "question") return;
		setSelected(idx);
		const correct = idx === question.answer;
		if (correct) {
			correctAnswersRef.current += 1;
			setFeedback("correct");
			setTimeout(() => { setFeedback(""); setSelected(null); setPhase("aiming"); startLaser(); }, 600);
		} else {
			setFeedback("wrong");
			wrongAnswersRef.current += 1;
			setWrongCount(prev => prev + 1);
			setTimeout(() => { setFeedback(""); setSelected(null); nextQuestion(qIdx, qPool); doBotAttack(); }, 600);
		}
	}

	function doBotAttack() {
		// --- MODIFIED: ถ้าตอบผิดเกิน 2 ครั้งสะสม บอทยิงหัวเสมอ ---
		const headZone = ZONES.find(z => z.name === "หัว")!;
		const zone = wrongCount >= 2 ? headZone : ZONES[Math.floor(Math.random() * ZONES.length)];

		setBotShooting(true);
		playSfx("botShoot", { volume: 0.9, rate: 0.98 });
		setTimeout(() => {
			setBotShooting(false);
			spawnParticles(120, 160, zone.color, 15);
			setFlash({ type: "bot", zone });
			setFlashSide("player");
			setShakeScreen(true);
			setTimeout(() => setShakeScreen(false), 500);
			setTimeout(() => setFlashSide(null), 900);
			// --- MODIFIED: แสดง warning ถ้าโดนยิงหัวเพราะตอบผิดเยอะ ---
			const warningText = wrongCount >= 2 ? ` ⚠️ ตอบผิดบ่อย!` : "";
			setResultMsg({ text: `💢 บอทยิง${zone.name}คุณ! −${zone.damage}${warningText}`, color: zone.color });
			setPlayerHP(hp => {
				const next = Math.max(0, hp - zone.damage);
				if (next <= 0) {
					setTimeout(() => { stopLaser(); setScreen("gameover"); }, 1200);
					playSfx("gameOver", { volume: 0.95 });
					onComplete?.({
						success: false,
						seconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
						correct: correctAnswersRef.current,
						total: Math.max(1, correctAnswersRef.current + wrongAnswersRef.current),
					});
				}
				return next;
			});
			setTimeout(() => { setFlash(null); setResultMsg(null); }, 1500);
		}, 600);
	}

	function handleFire() {
		if (phase !== "aiming" || bullets <= 0) return;
		stopLaser();
		playSfx("shoot", { volume: 0.95, rate: 1.02 });
		const angle = angleRef.current;
		const zone = getZone(angle);
		const missed = zone === null;
		const newBullets = bullets - 1;
		setBullets(newBullets);
		setPhase("result");
		setPlayerShooting(true);
		setTimeout(() => setPlayerShooting(false), 400);

		if (missed) {
			playSfx("miss", { volume: 0.8, rate: 1.05 });
			setFlash({ type: "miss" });
			setResultMsg({ text: " MISS! เลเซอร์เลยบอท", color: "#888" });
			spawnParticles(430, 160, "#888", 6);
			setTimeout(() => {
				setFlash(null); setResultMsg(null);
				if (newBullets <= 0) {
					setScreen("gameover");
					playSfx("gameOver", { volume: 0.95 });
					onComplete?.({
						success: false,
						seconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
						correct: correctAnswersRef.current,
						total: Math.max(1, correctAnswersRef.current + wrongAnswersRef.current),
					});
				} else { nextQuestion(qIdx, qPool); setPhase("question"); setTimeout(() => inputRef.current?.focus(), 100); }
			}, 1400);
			return;
		}

		playSfx("hit", { volume: 0.9 });
		setFlash({ type: "hit", zone });
		setFlashSide("bot");
		setTimeout(() => setFlashSide(null), 900);
		spawnParticles(430, 160, zone.color, 20);

		setBotHP(hp => {
			const next = Math.max(0, hp - zone.damage);
			setResultMsg({ text: `💥 โดน${zone.name}! −${zone.damage}`, color: zone.color });
			if (next <= 0) {
				setTimeout(() => {
					setFlash(null); setResultMsg(null); stopLaser(); setScreen("stageclear");
					playSfx("stageClear", { volume: 0.95 });
					onComplete?.({
						success: true,
						seconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
						correct: correctAnswersRef.current,
						total: Math.max(1, correctAnswersRef.current + wrongAnswersRef.current),
					});
				}, 1800);
			} else {
				setTimeout(() => {
					setFlash(null); setResultMsg(null);
					if (newBullets <= 0) {
						setScreen("gameover");
						playSfx("gameOver", { volume: 0.95 });
						onComplete?.({
							success: false,
							seconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
							correct: correctAnswersRef.current,
							total: Math.max(1, correctAnswersRef.current + wrongAnswersRef.current),
						});
					} else { nextQuestion(qIdx, qPool); setPhase("question"); setTimeout(() => inputRef.current?.focus(), 100); }
				}, 1600);
			}
			return next;
		});
	}

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.code === "Space" && phase === "aiming") { e.preventDefault(); handleFire(); }
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase, bullets]);

	if (!isActive) return null;

	const W = 760, H = 300;
	const gunX = 1, gunY = 148;
	const rad = (laserAngle * Math.PI) / 180;
	const laserEndX = gunX + Math.cos(rad) * 700;
	const laserEndY = gunY + Math.sin(rad) * 700;
	const curZone = getZone(laserAngle);
	const isMiss = curZone === null;
	const laserCol = isMiss ? "#444" : curZone.color;

	return (
		<div style={C.root}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Noto+Sans+Thai:wght@400;700&display=swap');
        @keyframes pulse{from{opacity:0.7;transform:scale(1)}to{opacity:1;transform:scale(1.04)}}
        @keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
        @keyframes boom{0%{transform:scale(0.3);opacity:1}60%{opacity:1}100%{transform:scale(3);opacity:0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes drawText{0%{opacity:0;letter-spacing:0.5em}100%{opacity:1;letter-spacing:0.08em}}
        @keyframes laserPulse{0%,100%{opacity:0.85}50%{opacity:0.4}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes starTwinkle{0%,100%{opacity:0.3}50%{opacity:1}}
        @keyframes hpPulse{0%{filter:brightness(1)}50%{filter:brightness(1.5)}100%{filter:brightness(1)}}
      `}</style>

			{screen === "menu" && (
				<div style={C.menuRoot}>
					{Array.from({ length: 20 }).map((_, i) => (
						<div
							key={i}
							style={{
								position: "absolute",
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 60}%`,
								width: 2 + Math.random() * 2,
								height: 2 + Math.random() * 2,
								borderRadius: "50%",
								background: "#fff",
								animation: `starTwinkle ${1 + Math.random() * 2}s infinite`,
								animationDelay: `${Math.random() * 2}s`,
							}}
						/>
					))}
					<div style={C.menuSun} />
					<div style={C.menuMountain} />
					<div style={C.menuGround} />
					<div style={C.menuContent}>
						<div style={C.menuBadge}>⭐ JS DUEL ACADEMY ⭐</div>
						<h1 style={C.menuTitle}>CODE DUEL</h1>
						<p style={C.menuSub}>เรียน JavaScript ผ่านการดวลปืน</p>

						<button style={C.menuBtn} onClick={startGame}>🔫 เริ่มดวล</button>
						<p style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>Space = ยิง</p>
					</div>
				</div>
			)}

			{screen === "game" && (
				<div style={{ ...C.gameRoot, animation: shakeScreen ? "shake 0.5s ease" : "none" }}>
					<div style={C.stageBanner}>
						<span style={{ color: "#ffd700", fontWeight: "bold", fontFamily: "Rye,serif" }}>Stage {stage.id}</span>
						<span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 6 }}>{stage.subtitle}</span>
						<span style={{ flex: 1 }} />
						{/* --- ADDED: แสดง warning indicator เมื่อตอบผิดเกิน 2 ครั้ง --- */}
						{wrongCount >= 2 && (
							<span style={{ color: "#ff3333", fontSize: 11, fontWeight: "bold", marginRight: 8, animation: "pulse 0.7s infinite alternate" }}>
								💀 บอทเล็งหัว! ({wrongCount} ผิด)
							</span>
						)}
						<span style={{ color: "#94a3b8", fontSize: 11 }}>SPACE = ยิง</span>
					</div>

					<DualHPBar playerHP={playerHP} botHP={botHP} maxHP={MAX_HP} botName={stage.botName} flashSide={flashSide} />

					<div style={C.arenaWrap}>
						<svg width="100%" viewBox={`0 0 ${W} ${H}`}>
							<defs>
								<linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={stage.bg.sky1} /><stop offset="100%" stopColor={stage.bg.sky2} />
								</linearGradient>
								<radialGradient id="sun" cx="75%" cy="30%" r="15%">
									<stop offset="0%" stopColor="#fff7d6" stopOpacity="1" />
									<stop offset="100%" stopColor={stage.bg.sky1} stopOpacity="0" />
								</radialGradient>
								<radialGradient id="muzzleGrad" cx="50%" cy="50%" r="50%">
									<stop offset="0%" stopColor="#fff" stopOpacity="1" />
									<stop offset="60%" stopColor="#ffaa00" stopOpacity="0.8" />
									<stop offset="100%" stopColor="#ff4400" stopOpacity="0" />
								</radialGradient>
								<filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" />
									<feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
								<filter id="softGlow"><feGaussianBlur stdDeviation="6" result="blur" />
									<feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
							</defs>
							<rect x="0" y="0" width={W} height={H} fill="url(#skyGrad)" />
							<rect x="0" y="0" width={W} height={H} fill="url(#sun)" />
							<polygon points="0,220 80,150 160,220" fill={stage.bg.groundDark} opacity="0.4" />
							<polygon points="100,220 200,130 300,220" fill={stage.bg.groundDark} opacity="0.3" />
							<polygon points="400,220 520,145 640,220" fill={stage.bg.groundDark} opacity="0.35" />
							<rect x="0" y="220" width={W} height={H - 220} fill={stage.bg.ground} />
							<rect x="0" y="218" width={W} height="6" fill={stage.bg.groundDark} />
							{[0, 1, 2].map(i => (
								<line key={i} x1="0" y1={228 + i * 10} x2={W} y2={228 + i * 10}
									stroke={stage.bg.groundDark} strokeWidth="0.5" opacity="0.3" />
							))}
							<ellipse cx="68" cy="245" rx="55" ry="8" fill="#0003" />
							<ellipse cx="685" cy="245" rx="55" ry="8" fill="#0003" />
							{showDraw && (
								<text x={W / 2} y={H / 2 - 20} textAnchor="middle" fill="#ffd700" fontSize="52"
									fontWeight="bold" fontFamily="Rye,serif"
									style={{ animation: "drawText 0.4s ease-out forwards", filter: "url(#softGlow)" }}>
									DRAW!
								</text>
							)}
							<g transform="translate(28,55)" style={{ animation: introAnim ? "slideUp 0.5s ease" : "none" }}>
								<ellipse cx="42" cy="24" rx="34" ry="8" fill="#7a5a10" />
								<rect x="22" y="3" width="40" height="24" rx="6" fill="#9b7120" />
								<rect x="22" y="19" width="40" height="6" fill="#6b4f10" />
								<rect x="30" y="8" width="24" height="4" rx="2" fill="#7a5a10" opacity="0.5" />
								<circle cx="42" cy="46" r="21" fill="#f5c5a3" />
								<rect x="25" y="51" width="34" height="13" rx="6" fill="#2244cc" />
								<rect x="25" y="51" width="34" height="7" rx="3" fill="#3355ee" opacity="0.5" />
								<circle cx="34" cy="41" r="4" fill="#222" /><circle cx="50" cy="41" r="4" fill="#222" />
								<circle cx="35" cy="40" r="1.5" fill="#fff" /><circle cx="51" cy="40" r="1.5" fill="#fff" />
								<rect x="20" y="67" width="46" height="62" rx="8" fill="#c0392b" />
								<rect x="20" y="67" width="46" height="10" rx="5" fill="#e74c3c" />
								<rect x="20" y="116" width="46" height="9" rx="3" fill="#7a4200" />
								<rect x="38" y="114" width="10" height="13" rx="2" fill="#d4a017" />
								<circle cx="43" cy="120" r="3" fill="#b8860b" />
								<rect x="62" y="78" width="32" height="12" rx="6" fill="#c0392b" />
								<rect x="87" y="73" width="40" height="10" rx="4" fill="#3a3a3a" />
								<rect x="90" y="67" width="14" height="22" rx="4" fill="#2a2a2a" />
								<rect x="88" y="74" width="38" height="3" rx="2" fill="#555" opacity="0.6" />
								<path d="M94 78 Q98 86 102 78" stroke="#555" strokeWidth="2" fill="none" />
								{playerShooting && (
									<g filter="url(#softGlow)">
										<circle cx="127" cy="78" r="18" fill="url(#muzzleGrad)" />
										<circle cx="127" cy="78" r="9" fill="#ffee00" opacity="0.95" />
										<circle cx="127" cy="78" r="5" fill="#fff" />
										{[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
											<line key={i} x1={127 + Math.cos(a * Math.PI / 180) * 9} y1={78 + Math.sin(a * Math.PI / 180) * 9}
												x2={127 + Math.cos(a * Math.PI / 180) * 22} y2={78 + Math.sin(a * Math.PI / 180) * 22}
												stroke="#ff8800" strokeWidth="2.5" opacity="0.9" />
										))}
									</g>
								)}
								<rect x="22" y="126" width="20" height="54" rx="6" fill="#b87820" />
								<rect x="44" y="126" width="20" height="54" rx="6" fill="#b87820" />
								<rect x="18" y="168" width="27" height="16" rx="5" fill="#5a3510" />
								<rect x="15" y="179" width="30" height="8" rx="4" fill="#3a2008" />
								<rect x="40" y="168" width="27" height="16" rx="5" fill="#5a3510" />
								<rect x="37" y="179" width="30" height="8" rx="4" fill="#3a2008" />
							</g>
							{phase === "aiming" && (
								<g filter="url(#glow)">
									<line x1={gunX} y1={gunY} x2={laserEndX} y2={laserEndY}
										stroke={laserCol} strokeWidth="6" opacity="0.1" style={{ animation: "laserPulse 0.5s infinite" }} />
									<line x1={gunX} y1={gunY} x2={laserEndX} y2={laserEndY}
										stroke={laserCol} strokeWidth="2.5" strokeDasharray={isMiss ? "4 8" : "12 4"}
										opacity={isMiss ? 0.3 : 0.9} style={{ animation: "laserPulse 0.5s infinite" }} />
									<circle cx={laserEndX} cy={laserEndY} r={isMiss ? 4 : 8}
										fill={laserCol} opacity={isMiss ? 0.3 : 0.95}
										style={{ filter: `drop-shadow(0 0 6px ${laserCol})` }} />
									<text x={W / 2} y="22" textAnchor="middle" fill={isMiss ? "#555" : laserCol}
										fontSize="13" fontWeight="bold" fontFamily="monospace"
										style={{ filter: isMiss ? "none" : `drop-shadow(0 0 4px ${laserCol})` }}>
										{isMiss ? "⚠ เลยบอท — MISS" : `● ${curZone?.name} (${curZone?.damage} DMG)`}
									</text>
								</g>
							)}
							{botShooting && (
								<circle r="6" fill="#ff4444" cx={380} cy={148}
									style={{ transform: "translateX(-250px)", transition: "transform 0.4s linear" }} />
							)}
							{flash?.type === "hit" && flash.zone && (
								<g transform="translate(490,155)" style={{ animation: "boom 0.6s ease-out forwards" }}>
									{[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((a, i) => (
										<line key={i} x1="0" y1="0"
											x2={Math.cos(a * Math.PI / 180) * 40} y2={Math.sin(a * Math.PI / 180) * 40}
											stroke={flash.zone!.color} strokeWidth="3.5" opacity="0.95" />
									))}
									<circle r="18" fill={flash.zone.color} opacity="0.85" />
									<text textAnchor="middle" y="6" fontSize="13" fill="#fff" fontWeight="bold">-{flash.zone.damage}</text>
								</g>
							)}
							{flash?.type === "miss" && (
								<text x="460" y="100" textAnchor="middle" fontSize="28" fontWeight="bold"
									fontFamily="monospace" fill="#666" style={{ animation: "boom 1s ease-out forwards" }}>MISS</text>
							)}
							{flash?.type === "bot" && flash.zone && (
								<g transform="translate(130,160)" style={{ animation: "boom 0.6s ease-out forwards" }}>
									{[0, 60, 120, 180, 240, 300].map((a, i) => (
										<line key={i} x1="0" y1="0"
											x2={Math.cos(a * Math.PI / 180) * 30} y2={Math.sin(a * Math.PI / 180) * 30}
											stroke="#ff4444" strokeWidth="3" opacity="0.95" />
									))}
									<circle r="14" fill="#ff4444" opacity="0.8" />
								</g>
							)}
							{particles.map(p => (
								<circle key={p.id} cx={p.x} cy={p.y} r={p.size * p.life} fill={p.color} opacity={p.life * 0.9} />
							))}
							<g transform="translate(645,55)" style={{ animation: introAnim ? "slideUp 0.6s ease" : "none" }}>
								<ellipse cx="40" cy="24" rx="36" ry="9" fill={stage.botHatColor} />
								<rect x="20" y="2" width="40" height="26" rx="6" fill={stage.botHatColor} />
								<rect x="20" y="20" width="40" height="7" fill="#0a0a0a" opacity="0.6" />
								<rect x="24" y="8" width="32" height="3" rx="1" fill="#ff4444" opacity="0.5" />
								<circle cx="52" cy="10" r="8" fill="#cc2222" />
								<circle cx="48" cy="8" r="6" fill="#aa1111" />
								<circle cx="55" cy="9" r="4" fill="#ff6666" />
								<circle cx="52" cy="7" r="2" fill="#ff9999" />
								<circle cx="40" cy="47" r="21" fill="#f5c5a3" />
								<circle cx="33" cy="42" r="4.5" fill="#111" /><circle cx="47" cy="42" r="4.5" fill="#111" />
								<circle cx="34" cy="41" r="1.5" fill="#fff" /><circle cx="48" cy="41" r="1.5" fill="#fff" />
								<path d="M29 37 L37 39" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
								<path d="M43 39 L51 37" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
								<path d="M33 54 Q40 60 47 54" stroke="#c0392b" strokeWidth="2" fill="none" />
								<path d="M44 44 L48 52" stroke="#c07060" strokeWidth="1.5" opacity="0.7" />
								<rect x="18" y="68" width="46" height="62" rx="8" fill={stage.botColor} />
								<rect x="18" y="68" width="46" height="10" rx="5" fill={stage.botColor} opacity="0.7" />
								<rect x="18" y="116" width="46" height="9" rx="3" fill="#1a0a0a" />
								<rect x="36" y="114" width="10" height="13" rx="2" fill="#9b59b6" />
								<circle cx="41" cy="120" r="3" fill="#7d3c98" />
								<rect x="-26" y="78" width="46" height="12" rx="6" fill={stage.botColor} />
								<rect x="-60" y="74" width="36" height="10" rx="4" fill="#3a3a3a" />
								<rect x="-36" y="68" width="14" height="22" rx="4" fill="#2a2a2a" />
								<rect x="-59" y="75" width="34" height="3" rx="2" fill="#555" opacity="0.6" />
								<path d="M-32 80 Q-28 88 -24 80" stroke="#555" strokeWidth="2" fill="none" />
								{botShooting && (
									<g filter="url(#softGlow)">
										<circle cx="-60" cy="79" r="16" fill="url(#muzzleGrad)" />
										<circle cx="-60" cy="79" r="8" fill="#ffee00" opacity="0.95" />
										<circle cx="-60" cy="79" r="4" fill="#fff" />
									</g>
								)}
								<rect x="20" y="127" width="20" height="54" rx="6" fill={stage.botColor} />
								<rect x="42" y="127" width="20" height="54" rx="6" fill={stage.botColor} />
								<rect x="16" y="169" width="27" height="16" rx="5" fill="#111" />
								<rect x="13" y="180" width="30" height="8" rx="4" fill="#0a0a0a" />
								<rect x="38" y="169" width="27" height="16" rx="5" fill="#111" />
								<rect x="35" y="180" width="30" height="8" rx="4" fill="#0a0a0a" />
							</g>
							<foreignObject x={W / 2 - 36} y="204" width="72" height="72">
								<div><RevolverCylinder total={MAX_BULLETS} loaded={bullets} size={72} /></div>
							</foreignObject>
							<text x={W / 2} y="270" textAnchor="middle" fill="#888" fontSize="10"
								fontFamily="monospace" letterSpacing="1">{bullets}/{MAX_BULLETS} ROUNDS</text>
						</svg>
						{resultMsg && (
							<div style={{ ...C.resultOverlay, color: resultMsg.color, borderColor: resultMsg.color, animation: "slideUp 0.2s ease" }}>
								{resultMsg.text}
							</div>
						)}
					</div>

					{phase === "question" && (
						<div style={C.qPanel}>
							<div style={C.qHeader}>
								<span style={C.qStage}> {stage.subtitle}</span>
								<span style={C.qBullets}> {bullets} นัด</span>
							</div>
							<div style={C.qText}>{question.q}</div>
							<div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 10 }}>
								{question.choices.map((choice: string, idx: number) => (
									<button key={idx}
										style={{
											...C.qBtn,
											background: selected === idx
												? (feedback === "correct" && idx === question.answer ? "linear-gradient(135deg,#22c55e,#16a34a)" : feedback === "wrong" && idx === selected ? "linear-gradient(135deg,#ef4444,#991b1b)" : C.qBtn.background)
												: C.qBtn.background,
											border: idx === question.answer && feedback !== "" ? "2px solid #22c55e" : "none",
											opacity: feedback !== "" && selected !== idx ? 0.7 : 1,
											cursor: feedback !== "" ? "default" : "pointer",
										}}
										disabled={feedback !== ""}
										onClick={() => handleAnswer(idx)}>
										{String.fromCharCode(65 + idx)}. {choice}
									</button>
								))}
							</div>
							{feedback === "correct" && <div style={{ color: "#22c55e", fontWeight: "bold", marginTop: 8, animation: "slideUp 0.2s ease", fontSize: 13 }}>✓ ถูกต้อง! เล็งและยิง!</div>}
							{feedback === "wrong" && <div style={{ color: "#ef4444", fontWeight: "bold", marginTop: 8, animation: "slideUp 0.2s ease", fontSize: 13 }}>✗ ผิด! บอทโต้กลับ — คำถามใหม่</div>}
						</div>
					)}

					{phase === "aiming" && (
						<div style={C.aimPanel}>
							<div style={C.aimTitle}> เล็งด้วยเลเซอร์ — กด FIRE หรือ SPACE!</div>
							<div style={C.zoneRow}>
								{ZONES.map(z => (
									<div key={z.name} style={{ textAlign: "center" }}>
										<div style={{ color: z.color, fontWeight: "bold", fontSize: 13, textShadow: `0 0 8px ${z.color}` }}>{z.name}</div>
										<div style={{ color: "#94a3b8", fontSize: 11 }}>{z.damage} DMG</div>
									</div>
								))}
								<div style={{ textAlign: "center" }}>
									<div style={{ color: "#475569", fontWeight: "bold", fontSize: 13 }}>นอก</div>
									<div style={{ color: "#475569", fontSize: 11 }}>MISS</div>
								</div>
							</div>
							<button style={C.fireBtn} onClick={handleFire}> FIRE!</button>
						</div>
					)}

					{/* ปุ่มควบคุมเสียง */}
					<button
						onClick={() => setIsMuted((m) => !m)}
						style={{ position: "absolute", top: 16, right: 125, zIndex: 200 }}
						title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
						className="bg-white/80 rounded-full shadow p-2 hover:bg-blue-100 transition"
					>
						{isMuted ? "🔕" : "🔔"}
					</button>
				</div>
			)}

			{screen === "stageclear" && (
				<div style={C.endRoot}>
					<div style={{ ...C.endCard, borderColor: "#ffd700" }}>
						<div style={{ fontSize: 60, marginBottom: 8, animation: "float 2s infinite" }}>🏆</div>
						<div style={{ fontFamily: "Rye,serif", fontSize: 28, color: "#ffd700", marginBottom: 4, textShadow: "0 0 20px #ffd700aa" }}>STAGE CLEAR!</div>
						<div style={{ color: "#22c55e", fontSize: 16, marginBottom: 4 }}>ชนะ {stage.botName}!</div>
						<div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 24 }}>เวลา: {Math.floor((Date.now() - startedAt) / 1000)} วินาที</div>
						<div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
							{stageIdx < STAGES.length - 1 ? (
								<button style={{ ...C.endBtn, background: "linear-gradient(135deg,#ffd700,#f59e0b)" }}
									onClick={() => { setScreen("game"); initStage(stageIdx + 1); }}>
									▶ Next Stage: {STAGES[stageIdx + 1].name}
								</button>
							) : (
								<button style={{ ...C.endBtn, background: "linear-gradient(135deg,#ffd700,#f59e0b)" }}
									onClick={() => setScreen("menu")}>🏆 จบเกม — เมนูหลัก</button>
							)}
							<button style={{ ...C.endBtn, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}
								onClick={() => { setScreen("game"); initStage(stageIdx); }}>🔄 Restart Stage</button>
							<button style={{ ...C.endBtn, background: "linear-gradient(135deg,#475569,#334155)" }}
								onClick={() => setScreen("menu")}>🏠 Menu</button>
						</div>
					</div>
				</div>
			)}

			{screen === "gameover" && (
				<div style={C.endRoot}>
					<div style={{ ...C.endCard, borderColor: "#ef4444" }}>
						<div style={{ fontSize: 60, marginBottom: 8 }}>💀</div>
						<div style={{ fontFamily: "Rye,serif", fontSize: 28, color: "#ef4444", marginBottom: 4, textShadow: "0 0 20px #ef4444aa" }}>GAME OVER</div>
						<div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>{bullets <= 0 ? "กระสุนหมด!" : "HP หมด!"}</div>
						<div style={{ color: "#64748b", fontSize: 12, marginBottom: 24 }}>เวลา: {Math.floor((Date.now() - startedAt) / 1000)} วินาที</div>
						<div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
							<button style={{ ...C.endBtn, background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
								onClick={() => { setScreen("game"); initStage(stageIdx); }}>🔄 Restart</button>
							<button style={{ ...C.endBtn, background: "linear-gradient(135deg,#475569,#334155)" }}
								onClick={() => setScreen("menu")}>🏠 Menu</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// --- BGM HOOK ---
function useCowboyBgm(enabled = true) {
	const bgmRef = React.useRef<HTMLAudioElement | null>(null);
	React.useEffect(() => {
		if (!enabled) return;
		if (!bgmRef.current) {
			const a = new Audio("/sound/คาวบอย.mp3");
			a.loop = true;
			a.volume = 0.45;
			bgmRef.current = a;
		}
		return () => {
			if (bgmRef.current) {
				bgmRef.current.pause();
				bgmRef.current.currentTime = 0;
			}
		};
	}, [enabled]);
	const play = React.useCallback(() => {
		if (enabled && bgmRef.current) {
			void bgmRef.current.play().catch(() => { });
		}
	}, [enabled]);
	const stop = React.useCallback(() => {
		if (bgmRef.current) {
			bgmRef.current.pause();
			bgmRef.current.currentTime = 0;
		}
	}, []);
	return { play, stop };
}

const C: Record<string, React.CSSProperties> = {
	root: { fontFamily: "'Noto Sans Thai',sans-serif", maxWidth: 920, margin: "0 auto", background: "#060d1a", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px #000c, 0 0 0 1px #1e293b" },
	menuRoot: { position: "relative", minHeight: 460, background: "linear-gradient(180deg,#0d0520 0%,#1a0a3e 40%,#3d1a0a 80%,#6b3010 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
	menuSun: { position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,#fff7d6,#ffaa00 40%,transparent 70%)", top: 30, right: 80, boxShadow: "0 0 60px 30px #ffaa0044" },
	menuMountain: { position: "absolute", bottom: 80, left: 0, right: 0, height: 120, background: "linear-gradient(180deg,transparent 0%,#2d1a0a 100%)", clipPath: "polygon(0 100%,10% 40%,20% 100%,30% 30%,45% 100%,55% 35%,70% 100%,85% 25%,100% 100%)" },
	menuGround: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "#5a2d0a" },
	menuContent: { position: "relative", zIndex: 1, textAlign: "center", padding: "20px 24px" },
	menuBadge: { display: "inline-block", background: "#ffd70022", border: "1px solid #ffd70066", borderRadius: 20, padding: "4px 16px", color: "#ffd700", fontSize: 11, letterSpacing: 2, marginBottom: 16 },
	menuTitle: { fontFamily: "Rye,serif", fontSize: 48, color: "#ffd700", margin: "0 0 4px", textShadow: "0 0 30px #ffd700aa,0 4px 0 #8B6914" },
	menuSub: { color: "#c4a882", fontSize: 14, margin: "0 0 4px" },
	stageCard: { display: "flex", gap: 10, alignItems: "center", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, padding: "6px 16px", fontSize: 13, minWidth: 200, justifyContent: "space-between" },
	menuBtn: { marginTop: 20, padding: "14px 40px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff", fontSize: 18, fontWeight: "bold", cursor: "pointer", fontFamily: "Rye,serif", letterSpacing: 1, boxShadow: "0 0 24px #dc262666", animation: "pulse 1.2s infinite alternate" },
	gameRoot: { background: "#060d1a", padding: "8px 12px 12px", zoom: 0.9 },
	stageBanner: { display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 8px", borderBottom: "1px solid #1e293b", marginBottom: 10, fontSize: 13 },
	arenaWrap: { position: "relative", borderRadius: 12, overflow: "hidden", border: "2px solid #1e293b", marginBottom: 10 },
	resultOverlay: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontWeight: "bold", fontSize: 18, padding: "10px 20px", border: "2px solid", borderRadius: 12, background: "#060d1aee", pointerEvents: "none", whiteSpace: "nowrap", textAlign: "center", letterSpacing: 0.5 },
	qPanel: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px" },
	qHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
	qStage: { fontSize: 11, color: "#475569", letterSpacing: 1, textTransform: "uppercase" },
	qBullets: { fontSize: 12, color: "#ef4444", fontWeight: "bold" },
	qText: { fontSize: 17, fontWeight: "bold", color: "#e2e8f0", marginBottom: 12, lineHeight: 1.5 },
	qBtn: { padding: "10px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", fontSize: 14, fontWeight: "bold", cursor: "pointer" },
	aimPanel: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 16px", textAlign: "center" },
	aimTitle: { fontSize: 13, color: "#f59e0b", fontWeight: "bold", marginBottom: 8, letterSpacing: 0.5 },
	zoneRow: { display: "flex", gap: 20, justifyContent: "center", marginBottom: 12 },
	fireBtn: { padding: "13px 48px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#991b1b)", color: "#fff", fontSize: 20, fontWeight: "bold", cursor: "pointer", letterSpacing: 1, boxShadow: "0 0 24px #ef444466", animation: "pulse 0.7s infinite alternate", fontFamily: "Rye,serif" },
	endRoot: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 360, background: "#060d1a", padding: 20 },
	endCard: { background: "#0a1628", border: "2px solid", borderRadius: 20, padding: "32px 28px", textAlign: "center", width: "100%", maxWidth: 400 },
	endBtn: { padding: "11px 22px", borderRadius: 9, border: "none", color: "#fff", fontSize: 14, fontWeight: "bold", cursor: "pointer", letterSpacing: 0.5 },
};