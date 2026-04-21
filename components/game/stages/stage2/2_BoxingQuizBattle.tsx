'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StageScorePayload } from '@/lib/utils/score';

interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

interface CSSQuestion {
  id: number;
  question: string;
  code: string;
  choices: string[];
  correctIndex: number;
  category: 'flexbox' | 'grid' | 'animation' | 'selectors' | 'layout' | 'typography' | 'colors' | 'responsive';
}

type GameStatus = 'ready' | 'playing' | 'ko' | 'finished';
type AnswerFeedback = 'correct' | 'wrong' | 'timeout' | null;
type HitTarget = 'player' | 'bot' | null;

// ══════════════════════════════════════════════════════════
// คลังคำถามภาษาไทย — 40 ข้อ แบ่งหมวดหมู่
// ══════════════════════════════════════════════════════════
const QUESTION_POOL: CSSQuestion[] = [
  // ── FLEXBOX ────────────────────────────────────────────
  {
    id: 1, category: 'flexbox',
    question: 'คุณสมบัติใดทำให้ flex items ขึ้นบรรทัดใหม่เมื่อเต็มแถว?',
    code: '.container { display: flex; ??? }',
    choices: ['flex-direction: wrap', 'flex-wrap: wrap', 'flex-flow: wrap', 'wrap-items: true'],
    correctIndex: 1,
  },
  {
    id: 2, category: 'flexbox',
    question: 'จะจัด flex items ให้อยู่กึ่งกลางแนวตั้งได้อย่างไร?',
    code: '.container { display: flex; ??? }',
    choices: ['vertical-align: center', 'justify-content: center', 'align-items: center', 'text-align: center'],
    correctIndex: 2,
  },
  {
    id: 3, category: 'flexbox',
    question: 'คุณสมบัติใดควบคุมช่องว่างระหว่าง flex items?',
    code: '.container { display: flex; ??? }',
    choices: ['margin: auto', 'gap: 16px', 'spacing: 16px', 'flex-gap: 16px'],
    correctIndex: 1,
  },
  {
    id: 4, category: 'flexbox',
    question: 'จะทำให้ flex item ยืดขยายเต็มพื้นที่ที่เหลือได้อย่างไร?',
    code: '.item { ??? }',
    choices: ['flex-grow: 1', 'flex-fill: true', 'grow: auto', 'width: flex'],
    correctIndex: 0,
  },
  {
    id: 5, category: 'flexbox',
    question: 'คุณสมบัติใดกระจายพื้นที่ระหว่าง items ในแนวนอน?',
    code: '.container { display: flex; ??? }',
    choices: ['align-content: space-between', 'distribute-items: evenly', 'justify-content: space-between', 'flex-space: between'],
    correctIndex: 2,
  },
  {
    id: 6, category: 'flexbox',
    question: 'จะเปลี่ยนทิศทาง flex เป็นแนวตั้ง (column) ได้อย่างไร?',
    code: '.container { display: flex; ??? }',
    choices: ['direction: column', 'flex-direction: column', 'flex-axis: vertical', 'flow: column'],
    correctIndex: 1,
  },
  {
    id: 7, category: 'flexbox',
    question: 'ค่าใดของ align-items ทำให้ items ยืดเต็มความสูงของ container?',
    code: '.container { display: flex; align-items: ??? }',
    choices: ['fill', 'expand', 'stretch', 'auto'],
    correctIndex: 2,
  },
  {
    id: 8, category: 'flexbox',
    question: 'จะป้องกันไม่ให้ flex item หดตัวได้อย่างไร?',
    code: '.item { ??? }',
    choices: ['flex-shrink: 0', 'no-shrink: true', 'min-size: auto', 'flex-grow: 0'],
    correctIndex: 0,
  },
  {
    id: 9, category: 'flexbox',
    question: 'justify-content: space-around มีผลอย่างไร?',
    code: '.container { display: flex; justify-content: space-around }',
    choices: [
      'items อยู่ชิดซ้าย',
      'มีช่องว่างเท่ากันระหว่าง items เท่านั้น',
      'มีช่องว่างรอบทุก item (ขอบครึ่งหนึ่ง)',
      'items กระจายพื้นที่เท่ากันทุกด้านรวมขอบ',
    ],
    correctIndex: 2,
  },
  {
    id: 10, category: 'flexbox',
    question: 'shorthand ใดกำหนด flex-grow, flex-shrink และ flex-basis พร้อมกัน?',
    code: '.item { ??? : 1 0 auto }',
    choices: ['flex-all', 'flex', 'flex-box', 'flex-set'],
    correctIndex: 1,
  },
  {
    id: 11, category: 'flexbox',
    question: 'จะ align item เดียวให้อยู่ปลาย cross axis ได้อย่างไร?',
    code: '.item { ??? }',
    choices: ['align-self: flex-end', 'self-align: end', 'cross-align: end', 'justify-self: flex-end'],
    correctIndex: 0,
  },
  {
    id: 12, category: 'flexbox',
    question: 'คุณสมบัติใดกำหนดขนาดเริ่มต้นของ flex item?',
    code: '.item { ??? : 200px }',
    choices: ['flex-basis', 'flex-size', 'flex-initial', 'flex-start'],
    correctIndex: 0,
  },
  {
    id: 13, category: 'flexbox',
    question: 'order: -1 ทำให้ flex item เปลี่ยนแปลงอย่างไร?',
    code: '.item { order: -1 }',
    choices: [
      'นำ item ออกจาก flow',
      'ย้าย item ไปก่อน items ที่มี order: 0',
      'กลับทิศทางของ item',
      'ทำให้เป็น item สุดท้าย',
    ],
    correctIndex: 1,
  },
  {
    id: 14, category: 'flexbox',
    question: 'จะกลับทิศทางแถวใน flexbox ได้อย่างไร?',
    code: '.container { display: flex; ??? }',
    choices: ['flex-direction: reverse', 'flex-direction: row-reverse', 'direction: rtl', 'flex-reverse: true'],
    correctIndex: 1,
  },
  {
    id: 15, category: 'flexbox',
    question: 'ค่าใดทำให้ flex items มีขนาดเท่ากันโดยไม่คำนึงถึง content?',
    code: '.item { flex: ??? }',
    choices: ['1 1 0', 'auto', '1 0 auto', '0 1 auto'],
    correctIndex: 0,
  },

  // ── CSS GRID ───────────────────────────────────────────
  {
    id: 16, category: 'grid',
    question: 'จะสร้าง grid 3 คอลัมน์เท่าๆ กันได้อย่างไร?',
    code: '.container { display: grid; ??? }',
    choices: [
      'grid-cols: 3',
      'grid-template-columns: repeat(3, 1fr)',
      'columns: 3 equal',
      'grid-columns: 1fr 1fr 1fr',
    ],
    correctIndex: 1,
  },
  {
    id: 17, category: 'grid',
    question: 'คุณสมบัติใดกำหนดช่องว่างระหว่าง grid rows และ columns?',
    code: '.container { display: grid; ??? }',
    choices: ['spacing: 10px', 'grid-gap: 10px', 'gap: 10px', 'grid-space: 10px'],
    correctIndex: 2,
  },
  {
    id: 18, category: 'grid',
    question: 'จะทำให้ grid item ขยายข้ามสองคอลัมน์ได้อย่างไร?',
    code: '.item { ??? }',
    choices: ['column-span: 2', 'grid-column: span 2', 'col-span: 2', 'grid-col: 2'],
    correctIndex: 1,
  },
  {
    id: 19, category: 'grid',
    question: 'minmax() ใน CSS Grid ใช้ทำอะไร?',
    code: 'grid-template-columns: repeat(3, minmax(100px, 1fr))',
    choices: [
      'กำหนดจำนวน grid items',
      'กำหนดขนาดขั้นต่ำและขั้นสูงของ column',
      'จัดตำแหน่ง grid items',
      'สร้าง grid โดยอัตโนมัติ',
    ],
    correctIndex: 1,
  },
  {
    id: 20, category: 'grid',
    question: 'auto-fill vs auto-fit ต่างกันอย่างไรใน grid?',
    code: 'grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))',
    choices: [
      'ไม่ต่างกัน ใช้แทนกันได้',
      'auto-fill สร้าง column ว่างๆ, auto-fit ยืดขยาย items เต็มพื้นที่',
      'auto-fit สร้าง column ว่างๆ, auto-fill ยืดขยาย items',
      'auto-fill ใช้กับ rows เท่านั้น',
    ],
    correctIndex: 1,
  },

  // ── ANIMATION & TRANSITION ────────────────────────────
  {
    id: 21, category: 'animation',
    question: 'จะสร้าง CSS animation ที่วนซ้ำไม่หยุดได้อย่างไร?',
    code: '.box { animation: spin 1s ??? }',
    choices: ['loop: forever', 'repeat: infinite', 'infinite', 'animation-repeat: always'],
    correctIndex: 2,
  },
  {
    id: 22, category: 'animation',
    question: 'คุณสมบัติใดกำหนดสถานะสุดท้ายของ animation หลังจบ?',
    code: '.box { animation: slide 0.5s ease ??? }',
    choices: ['animation-stay: end', 'animation-fill-mode: forwards', 'animation-hold: last', 'fill: forward'],
    correctIndex: 1,
  },
  {
    id: 23, category: 'animation',
    question: 'transition-timing-function: ease-in-out หมายความว่าอะไร?',
    code: '.box { transition: all 0.3s ease-in-out }',
    choices: [
      'เริ่มเร็ว จบเร็ว',
      'ความเร็วสม่ำเสมอตลอด',
      'เริ่มช้า เร็วขึ้นกลาง แล้วช้าลงตอนจบ',
      'เริ่มเร็ว แล้วช้าลงตอนจบ',
    ],
    correctIndex: 2,
  },
  {
    id: 24, category: 'animation',
    question: '@keyframes ใช้ทำอะไร?',
    code: '@keyframes bounce { 0% { ... } 100% { ... } }',
    choices: [
      'กำหนด media queries',
      'นำเข้า font จากภายนอก',
      'กำหนดขั้นตอนของ animation ตาม %',
      'สร้าง CSS variables',
    ],
    correctIndex: 2,
  },
  {
    id: 25, category: 'animation',
    question: 'animation-direction: alternate ทำงานอย่างไร?',
    code: '.box { animation: slide 1s infinite alternate }',
    choices: [
      'animation เล่นย้อนกลับทุกครั้ง',
      'animation สลับทิศทางทุกรอบ (ไป-กลับ)',
      'animation หยุดกลางทาง',
      'animation เล่นจากกลาง',
    ],
    correctIndex: 1,
  },

  // ── CSS SELECTORS ─────────────────────────────────────
  {
    id: 26, category: 'selectors',
    question: 'selector :nth-child(2n+1) เลือก elements ใด?',
    code: 'li:nth-child(2n+1) { color: red }',
    choices: [
      'elements ที่ index เป็นเลขคู่',
      'elements ที่ index เป็นเลขคี่ (1, 3, 5, ...)',
      'elements ตัวที่ 2 ถึง n',
      'elements ตัวแรกเท่านั้น',
    ],
    correctIndex: 1,
  },
  {
    id: 27, category: 'selectors',
    question: '::before และ ::after ต่างจาก :before และ :after อย่างไร?',
    code: '.box::before { content: "" }',
    choices: [
      'ไม่ต่างกัน ใช้แทนกันได้ทุกกรณี',
      ':: เป็น CSS3 standard สำหรับ pseudo-elements, : เป็น CSS2',
      ':: ใช้กับ class เท่านั้น',
      ':: ทำงานได้เร็วกว่า',
    ],
    correctIndex: 1,
  },
  {
    id: 28, category: 'selectors',
    question: 'selector :not() ทำงานอย่างไร?',
    code: 'button:not(.disabled) { cursor: pointer }',
    choices: [
      'เลือก elements ที่ไม่มี parent',
      'เลือก elements ที่ไม่ตรงกับ selector ใน ()',
      'ยกเว้น CSS ทั้งหมดของ element',
      'ใช้ได้เฉพาะกับ class เท่านั้น',
    ],
    correctIndex: 1,
  },
  {
    id: 29, category: 'selectors',
    question: 'Specificity ของ selector ใดสูงที่สุด?',
    code: '/* เปรียบเทียบ specificity */',
    choices: [
      '.class element',
      '#id',
      'element.class',
      '.class.class',
    ],
    correctIndex: 1,
  },
  {
    id: 30, category: 'selectors',
    question: 'selector ~ (tilde) ใช้เลือก elements อย่างไร?',
    code: 'h2 ~ p { color: gray }',
    choices: [
      'เลือก p ที่อยู่ภายใน h2',
      'เลือก p ที่อยู่ติดกับ h2 โดยตรง',
      'เลือก p ทุกตัวที่เป็น sibling ตามหลัง h2',
      'เลือก p ตัวแรกหลัง h2 เท่านั้น',
    ],
    correctIndex: 2,
  },

  // ── LAYOUT ────────────────────────────────────────────
  {
    id: 31, category: 'layout',
    question: 'position: sticky ทำงานต่างจาก position: fixed อย่างไร?',
    code: '.nav { position: sticky; top: 0 }',
    choices: [
      'ไม่ต่างกัน ใช้แทนกันได้',
      'sticky ยึดตาม viewport เสมอ, fixed ยึดตาม parent',
      'sticky ยึดตาม parent container เมื่อ scroll ถึง, fixed ยึด viewport ตลอด',
      'sticky ทำงานได้เฉพาะ mobile',
    ],
    correctIndex: 2,
  },
  {
    id: 32, category: 'layout',
    question: 'box-sizing: border-box เปลี่ยนการคำนวณขนาดอย่างไร?',
    code: '.box { box-sizing: border-box; width: 200px; padding: 20px }',
    choices: [
      'ความกว้างรวม margin ด้วย',
      'padding และ border รวมอยู่ใน width แล้ว (width = 200px)',
      'padding บวกเพิ่มเข้าไปใน width (width = 240px)',
      'ไม่มีผลต่อการคำนวณ',
    ],
    correctIndex: 1,
  },
  {
    id: 33, category: 'layout',
    question: 'z-index ทำงานอย่างไรกับ position: static?',
    code: '.box { position: static; z-index: 999 }',
    choices: [
      'z-index: 999 ทำให้ element อยู่บนสุดเสมอ',
      'z-index ไม่มีผลกับ static elements',
      'z-index ใช้ได้กับทุก position',
      'z-index เป็น negative จะทำงาน',
    ],
    correctIndex: 1,
  },
  {
    id: 34, category: 'layout',
    question: 'overflow: hidden มีผลต่อ float children อย่างไร?',
    code: '.parent { overflow: hidden } .child { float: left }',
    choices: [
      'ซ่อน children ทั้งหมด',
      'ไม่มีผลใดๆ',
      'ทำให้ parent ขยายรวม float children (clearfix)',
      'บังคับ children ไม่ให้ float',
    ],
    correctIndex: 2,
  },

  // ── TYPOGRAPHY ────────────────────────────────────────
  {
    id: 35, category: 'typography',
    question: 'line-height: 1.5 หมายความว่าอะไร?',
    code: 'p { font-size: 16px; line-height: 1.5 }',
    choices: [
      'ความสูงบรรทัด = 1.5px',
      'ความสูงบรรทัด = 15px',
      'ความสูงบรรทัด = 1.5 × font-size = 24px',
      'ความสูงบรรทัด = 150% ของ parent',
    ],
    correctIndex: 2,
  },
  {
    id: 36, category: 'typography',
    question: 'text-overflow: ellipsis ต้องใช้ร่วมกับอะไร?',
    code: '.text { text-overflow: ellipsis; ??? }',
    choices: [
      'display: flex เท่านั้น',
      'overflow: hidden และ white-space: nowrap',
      'max-width และ font-size',
      'position: relative และ z-index',
    ],
    correctIndex: 1,
  },

  // ── COLORS & VARIABLES ────────────────────────────────
  {
    id: 37, category: 'colors',
    question: 'CSS Custom Properties (variables) ประกาศและใช้งานอย่างไร?',
    code: ':root { ??? } .box { color: var(--primary) }',
    choices: [
      '$primary: red',
      '--primary: red',
      'var-primary: red',
      '@primary: red',
    ],
    correctIndex: 1,
  },
  {
    id: 38, category: 'colors',
    question: 'ฟังก์ชัน rgba() ต่างจาก rgb() อย่างไร?',
    code: 'color: rgba(255, 0, 0, 0.5)',
    choices: [
      'rgba() ใช้ได้เฉพาะ background เท่านั้น',
      'rgba() รองรับค่า Alpha (ความโปร่งใส) ด้วย',
      'ไม่ต่างกัน ใช้แทนกันได้',
      'rgba() ใช้ค่า 0-255 สำหรับสี rgb() ใช้ %',
    ],
    correctIndex: 1,
  },

  // ── RESPONSIVE ────────────────────────────────────────
  {
    id: 39, category: 'responsive',
    question: 'Media query ใดทำงานเมื่อหน้าจอกว้างอย่างน้อย 768px?',
    code: '@media (??? : 768px) { ... }',
    choices: ['min-width', 'max-width', 'screen-width', 'min-screen'],
    correctIndex: 0,
  },
  {
    id: 40, category: 'responsive',
    question: 'หน่วย vw และ vh หมายถึงอะไร?',
    code: '.hero { width: 100vw; height: 100vh }',
    choices: [
      'vw = vertical width, vh = vertical height',
      'vw = % ของความกว้าง viewport, vh = % ของความสูง viewport',
      'vw = pixel viewport, vh = หน่วยความสูงเสมือน',
      'vw = % ของ parent width, vh = % ของ parent height',
    ],
    correctIndex: 1,
  },
];

// ══════════════════════════════════════════════════════════
// ระบบสุ่มคำถามแบบ Smart Random
// - สุ่มจากหมวดหมู่ต่างๆ ให้ครบ
// - ไม่ซ้ำใน session เดียวกัน
// - กระจายระดับความยาก
// ══════════════════════════════════════════════════════════
function smartShuffleQuestions(count = 3): CSSQuestion[] {
  const pool = [...QUESTION_POOL];

  // Shuffle Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // พยายามเลือกให้มีหมวดหมู่หลากหลาย
  const categories = [...new Set(pool.map(q => q.category))];
  const selected: CSSQuestion[] = [];
  const usedIds = new Set<number>();

  // เลือก 1 ข้อจากแต่ละหมวดก่อน (ถ้า count >= จำนวนหมวด)
  if (count <= categories.length) {
    const shuffledCats = [...categories].sort(() => Math.random() - 0.5).slice(0, count);
    for (const cat of shuffledCats) {
      const inCat = pool.filter(q => q.category === cat && !usedIds.has(q.id));
      if (inCat.length > 0) {
        const pick = inCat[Math.floor(Math.random() * inCat.length)];
        selected.push(pick);
        usedIds.add(pick.id);
      }
    }
  } else {
    // เลือก 1 จากแต่ละหมวดก่อน
    for (const cat of categories) {
      if (selected.length >= count) break;
      const inCat = pool.filter(q => q.category === cat && !usedIds.has(q.id));
      if (inCat.length > 0) {
        const pick = inCat[Math.floor(Math.random() * inCat.length)];
        selected.push(pick);
        usedIds.add(pick.id);
      }
    }
    // เติมที่เหลือจาก pool สุ่ม
    const remaining = pool.filter(q => !usedIds.has(q.id));
    for (const q of remaining) {
      if (selected.length >= count) break;
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  // Trim ให้ได้ count ข้อ
  const final = selected.slice(0, count);

  // สุ่มลำดับตัวเลือกของแต่ละข้อ
  return final.map(q => {
    const correctAnswer = q.choices[q.correctIndex];
    const shuffledChoices = [...q.choices];
    for (let i = shuffledChoices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j], shuffledChoices[i]];
    }
    const newCorrectIndex = shuffledChoices.indexOf(correctAnswer);
    return { ...q, choices: shuffledChoices, correctIndex: newCorrectIndex };
  });
}

const TIMER_SECONDS = 12;
const BASE_DAMAGE = 20;
const MAX_HP = 100;

const CATEGORY_LABELS: Record<CSSQuestion['category'], string> = {
  flexbox: 'Flexbox'
  , grid: 'Grid'
  , animation: 'Animation'
  , selectors: 'Selectors'
  , layout: 'Layout'
  , typography: 'Typography'
  , colors: 'Colors & Variables'
  , responsive: 'Responsive Design'
};

const SPARKLE_POSITIONS = [
  { left: 12, top: 15, size: 10, dur: 2.1, delay: 0.3 },
  { left: 78, top: 22, size: 14, dur: 1.8, delay: 1.1 },
  { left: 35, top: 70, size: 8,  dur: 2.5, delay: 0.7 },
  { left: 55, top: 45, size: 12, dur: 1.6, delay: 1.5 },
  { left: 88, top: 60, size: 9,  dur: 2.3, delay: 0.1 },
  { left: 20, top: 85, size: 11, dur: 1.9, delay: 0.9 },
  { left: 65, top: 12, size: 13, dur: 2.0, delay: 1.8 },
  { left: 42, top: 55, size: 8,  dur: 2.4, delay: 0.4 },
  { left: 10, top: 40, size: 15, dur: 1.7, delay: 1.3 },
  { left: 90, top: 82, size: 10, dur: 2.2, delay: 0.6 },
];

/* ══════════════════════════════════════════════════════════
   SCOPED KEYFRAMES
   ══════════════════════════════════════════════════════════ */
const SCOPED_STYLES = `
  @keyframes hpPulse { from { opacity:1; } to { opacity:0.45; } }
  @keyframes floatDmg {
    0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
    60%  { opacity:1; transform:translateX(-50%) translateY(-28px) scale(1.2); }
    100% { opacity:0; transform:translateX(-50%) translateY(-52px) scale(0.85); }
  }
  @keyframes koIn {
    0%   { transform:scale(0.3) rotate(-10deg); opacity:0; }
    70%  { transform:scale(1.1) rotate(2deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes shakeX {
    0%,100% { transform:translateX(0); }
    20% { transform:translateX(-5px); }
    40% { transform:translateX(5px); }
    60% { transform:translateX(-4px); }
    80% { transform:translateX(4px); }
  }
  @keyframes feedIn {
    0%   { opacity:0; transform:translateY(8px); }
    100% { opacity:1; transform:translateY(0); }
  }
  @keyframes timerWarn { from { transform:scale(1); } to { transform:scale(1.08); } }
  @keyframes fighterIdle {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes fighterIdleCPU {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-3px); }
  }
  @keyframes anticipatePlayer {
    0%   { transform: translateX(0) scale(1); }
    100% { transform: translateX(-12px) scale(1.06) rotate(-3deg); }
  }
  @keyframes anticipateCPU {
    0%   { transform: translateX(0) scale(1); }
    100% { transform: translateX(12px) scale(1.06) rotate(3deg); }
  }
  @keyframes punchPlayer {
    0%   { transform: translateX(-12px) scale(1.06); }
    35%  { transform: translateX(25px) scale(1.12) rotate(5deg); }
    70%  { transform: translateX(15px) scale(1.08); }
    100% { transform: translateX(0) scale(1); }
  }
  @keyframes punchCPU {
    0%   { transform: translateX(12px) scale(1.06); }
    35%  { transform: translateX(-25px) scale(1.12) rotate(-5deg); }
    70%  { transform: translateX(-15px) scale(1.08); }
    100% { transform: translateX(0) scale(1); }
  }
  @keyframes hitRecoil {
    0%   { transform: translateX(0) rotate(0); filter: brightness(1); }
    20%  { transform: translateX(14px) rotate(6deg); filter: brightness(2.2); }
    50%  { transform: translateX(-6px) rotate(-3deg); filter: brightness(1.4); }
    100% { transform: translateX(0) rotate(0); filter: brightness(1); }
  }
  @keyframes hitRecoilCPU {
    0%   { transform: translateX(0) rotate(0); filter: brightness(1); }
    20%  { transform: translateX(-14px) rotate(-6deg); filter: brightness(2.2); }
    50%  { transform: translateX(6px) rotate(3deg); filter: brightness(1.4); }
    100% { transform: translateX(0) rotate(0); filter: brightness(1); }
  }
  @keyframes comboPop {
    0%   { transform: scale(0) rotate(-10deg); opacity:0; }
    50%  { transform: scale(1.35) rotate(3deg); opacity:1; }
    100% { transform: scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes comboGlow {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(255,215,0,0.4)); }
    50%      { filter: drop-shadow(0 0 18px rgba(255,215,0,0.9)) drop-shadow(0 0 36px rgba(255,100,0,0.5)); }
  }
  @keyframes impactRing {
    0%   { transform: translate(-50%,-50%) scale(0.2); opacity:1; border-width:4px; }
    100% { transform: translate(-50%,-50%) scale(2.5); opacity:0; border-width:1px; }
  }
  @keyframes roundIn {
    0%   { transform: scale(3.5) rotate(-6deg); opacity:0; }
    60%  { transform: scale(1.08) rotate(1deg); opacity:1; }
    100% { transform: scale(1) rotate(0); opacity:1; }
  }
  @keyframes roundOut {
    0%   { transform: scale(1); opacity:1; }
    100% { transform: scale(0.5) translateY(-50px); opacity:0; }
  }
  @keyframes vignettePulse {
    0%, 100% { opacity:0; }
    50%      { opacity:0.6; }
  }
  @keyframes readySway {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25%      { transform: translateY(-7px) rotate(-2deg); }
    75%      { transform: translateY(-3px) rotate(2deg); }
  }
  @keyframes vsPulse {
    0%, 100% { transform: scale(1); text-shadow: 0 0 20px rgba(255,50,50,0.5); }
    50%      { transform: scale(1.18); text-shadow: 0 0 44px rgba(255,50,50,0.9), 0 0 64px rgba(255,200,0,0.4); }
  }
  @keyframes fightBtnGlow {
    0%, 100% { box-shadow: 0 0 16px rgba(255,50,50,0.3), inset 0 0 10px rgba(255,255,255,0.08); }
    50%      { box-shadow: 0 0 34px rgba(255,50,50,0.7), 0 0 64px rgba(255,100,0,0.3), inset 0 0 16px rgba(255,255,255,0.15); }
  }
  @keyframes sparkle {
    0%, 100% { opacity:0; transform: scale(0) rotate(0deg); }
    50%      { opacity:1; transform: scale(1) rotate(180deg); }
  }
  @keyframes flashHit {
    0%   { opacity:0.55; }
    50%  { opacity:0; }
    70%  { opacity:0.2; }
    100% { opacity:0; }
  }
  @keyframes winPop {
    0%   { transform: scale(0.3) rotate(-8deg); opacity: 0; }
    65%  { transform: scale(1.12) rotate(2deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes statFadeIn {
    0%   { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes categoryBadge {
    0%   { opacity: 0; transform: translateY(-6px) scale(0.9); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

/* ─────────────────────────────────────────────────────
   Custom hook for all boxing game state & logic
   ───────────────────────────────────────────────────── */
function useBoxingGame() {
  const [questions, setQuestions] = useState<CSSQuestion[]>(() => smartShuffleQuestions(3));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [botHP, setBotHP] = useState(MAX_HP);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [buttonsLocked, setButtonsLocked] = useState(false);
  const [hitTarget, setHitTarget] = useState<HitTarget>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lastDmg, setLastDmg] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [anticipating, setAnticipating] = useState<HitTarget>(null);
  const [roundText, setRoundText] = useState<string | null>(null);
  const [roundTextPhase, setRoundTextPhase] = useState<'in' | 'out'>('in');
  const [allCorrect, setAllCorrect] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const question = questions[questionIndex] ?? null;
  const totalQ = questions.length;

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (nextRef.current) { clearTimeout(nextRef.current); nextRef.current = null; }
  }, []);

  const calcDamage = useCallback((c: number) => {
    if (c >= 4) return Math.floor(BASE_DAMAGE * 2.0);
    if (c >= 3) return Math.floor(BASE_DAMAGE * 1.75);
    if (c >= 2) return Math.floor(BASE_DAMAGE * 1.5);
    return BASE_DAMAGE;
  }, []);

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
  }, []);

  const showRoundTransition = useCallback((text: string, duration = 1600, onDone?: () => void) => {
    setRoundText(text);
    setRoundTextPhase('in');
    setTimeout(() => setRoundTextPhase('out'), duration - 400);
    setTimeout(() => { setRoundText(null); onDone?.(); }, duration);
  }, []);

  const advance = useCallback((pHP: number, bHP: number) => {
    if (pHP <= 0 || bHP <= 0) {
      setGameStatus('ko');
      nextRef.current = setTimeout(() => setGameStatus('finished'), 2200);
      return;
    }
    if (questionIndex + 1 >= totalQ) {
      nextRef.current = setTimeout(() => setGameStatus('finished'), 1800);
      return;
    }
    nextRef.current = setTimeout(() => {
      setQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setButtonsLocked(false);
      setHitTarget(null);
      setAnticipating(null);
      setTimer(TIMER_SECONDS);
      setLastDmg(0);
    }, 2000);
  }, [questionIndex, totalQ]);

  const processAnswer = useCallback((isCorrect: boolean) => {
    setButtonsLocked(true);
    clearTimers();
    if (!isCorrect) setAllCorrect(false);

    if (isCorrect) {
      const newCombo = combo + 1;
      const dmg = calcDamage(newCombo);
      setAnticipating('player');
      setTimeout(() => {
        setAnticipating(null);
        setCombo(newCombo);
        setMaxCombo(prev => Math.max(prev, newCombo));
        setCorrect(prev => prev + 1);
        setFeedback('correct');
        setHitTarget('bot');
        setLastDmg(dmg);
        triggerShake();
        const newBotHP = Math.max(0, botHP - dmg);
        setBotHP(newBotHP);
        advance(playerHP, newBotHP);
      }, 250);
    } else {
      const dmg = BASE_DAMAGE;
      setAnticipating('bot');
      setTimeout(() => {
        setAnticipating(null);
        setCombo(0);
        setWrong(prev => prev + 1);
        setFeedback('wrong');
        setHitTarget('player');
        setLastDmg(dmg);
        triggerShake();
        const newPlayerHP = Math.max(0, playerHP - dmg);
        setPlayerHP(newPlayerHP);
        advance(newPlayerHP, botHP);
      }, 250);
    }
  }, [combo, calcDamage, botHP, playerHP, clearTimers, triggerShake, advance]);

  const handleAnswer = useCallback((idx: number) => {
    if (buttonsLocked || gameStatus !== 'playing' || !question) return;
    setSelectedAnswer(idx);
    processAnswer(idx === question.correctIndex);
  }, [buttonsLocked, gameStatus, question, processAnswer]);

  const handleTimeout = useCallback(() => {
    if (buttonsLocked || gameStatus !== 'playing') return;
    setFeedback('timeout');
    processAnswer(false);
  }, [buttonsLocked, gameStatus, processAnswer]);

  const startGame = useCallback(() => {
    const newQuestions = smartShuffleQuestions(3);
    setQuestions(newQuestions);
    setQuestionIndex(0); setPlayerHP(MAX_HP); setBotHP(MAX_HP);
    setTimer(TIMER_SECONDS); setSelectedAnswer(null);
    setFeedback(null); setButtonsLocked(true); setHitTarget(null);
    setCombo(0); setMaxCombo(0); setCorrect(0); setWrong(0);
    setLastDmg(0); setScreenShake(false); setAnticipating(null);
    setAllCorrect(true);
    clearTimers();

    showRoundTransition('ยก 1', 1400, () => {
      setGameStatus('playing');
      setButtonsLocked(false);
    });
    setGameStatus('playing');
  }, [clearTimers, showRoundTransition]);

  const punchAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    punchAudioRef.current = new Audio('/sound/punt.mp3');
    punchAudioRef.current.preload = 'auto';
    return () => { punchAudioRef.current = null; };
  }, []);

  useEffect(() => {
    if (hitTarget === 'bot' || hitTarget === 'player') {
      try {
        if (punchAudioRef.current) {
          punchAudioRef.current.currentTime = 0;
          void punchAudioRef.current.play();
        }
      } catch (e) { /* ignore */ }
    }
  }, [hitTarget]);

  useEffect(() => {
    if (gameStatus !== 'playing' || buttonsLocked) return;
    timerRef.current = setInterval(() => {
      setTimer(prev => { if (prev <= 1) { handleTimeout(); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStatus, buttonsLocked, questionIndex, handleTimeout]);

  useEffect(() => { return () => clearTimers(); }, [clearTimers]);

  const winner: 'player' | 'bot' | 'draw' =
    playerHP > botHP ? 'player' : botHP > playerHP ? 'bot' : 'draw';
  const canAdvance = winner === 'player' && allCorrect;

  return {
    question, questionIndex, totalQ,
    playerHP, botHP, timer,
    gameStatus, selectedAnswer, feedback,
    buttonsLocked, hitTarget, combo, maxCombo,
    correct, wrong, lastDmg, screenShake, winner, canAdvance, allCorrect,
    anticipating, roundText, roundTextPhase,
    startGame, handleAnswer,
  };
}

/* ══════════════════════════════════════════════════════════
   Pixel Art Fighters
   ══════════════════════════════════════════════════════════ */
function PlayerFighter({ isHit, isPunching }: { isHit: boolean; isPunching: boolean }) {
  return (
    <svg width="80" height="120" viewBox="0 0 80 120" style={{ imageRendering: 'pixelated' }}>
      <rect x="24" y="4" width="32" height="28" fill="#F4C28A" />
      <rect x="20" y="8" width="4" height="20" fill="#F4C28A" />
      <rect x="56" y="8" width="4" height="20" fill="#F4C28A" />
      <rect x="24" y="4" width="32" height="8" fill="#2C1810" />
      <rect x="20" y="8" width="8" height="4" fill="#2C1810" />
      <rect x="30" y="16" width="6" height="6" fill="#FFFFFF" />
      <rect x="44" y="16" width="6" height="6" fill="#FFFFFF" />
      <rect x="32" y="18" width="4" height="4" fill="#1A1A2E" />
      <rect x="46" y="18" width="4" height="4" fill="#1A1A2E" />
      {isHit && <><rect x="28" y="13" width="10" height="3" fill="#2C1810" /><rect x="42" y="13" width="10" height="3" fill="#2C1810" /></>}
      <rect x="32" y="26" width="16" height="3" fill="#C0603A" />
      <rect x="32" y="32" width="16" height="6" fill="#F4C28A" />
      <rect x="16" y="38" width="48" height="36" fill="#1A6B7C" />
      <rect x="12" y="42" width="4" height="28" fill="#1A6B7C" />
      <rect x="64" y="42" width="4" height="28" fill="#1A6B7C" />
      <rect x="36" y="38" width="8" height="36" fill="#E8F4F8" opacity="0.3" />
      <rect x="16" y="72" width="48" height="6" fill="#2C1810" />
      <rect x="34" y="73" width="12" height="4" fill="#D4A017" />
      <rect x="16" y="78" width="48" height="24" fill="#0D3B4F" />
      <rect x="20" y="102" width="16" height="14" fill="#F4C28A" />
      <rect x="44" y="102" width="16" height="14" fill="#F4C28A" />
      <rect x="16" y="112" width="20" height="8" fill="#1A1A2E" />
      <rect x="44" y="112" width="20" height="8" fill="#1A1A2E" />
      {isPunching ? (
        <><rect x="60" y="10" width="16" height="14" rx="3" fill="#E53935" /><rect x="64" y="38" width="16" height="14" rx="3" fill="#E53935" /><rect x="60" y="12" width="16" height="4" fill="#B71C1C" /><rect x="64" y="40" width="16" height="4" fill="#B71C1C" /></>
      ) : (
        <><rect x="4" y="48" width="16" height="14" rx="3" fill="#E53935" /><rect x="60" y="48" width="16" height="14" rx="3" fill="#E53935" /><rect x="4" y="50" width="16" height="4" fill="#B71C1C" /><rect x="60" y="50" width="16" height="4" fill="#B71C1C" /></>
      )}
      {isHit && <rect x="0" y="0" width="80" height="120" fill="#FF0000" opacity="0.35" />}
    </svg>
  );
}

function BotFighter({ isHit, isPunching }: { isHit: boolean; isPunching: boolean }) {
  return (
    <svg width="80" height="120" viewBox="0 0 80 120" style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}>
      <rect x="20" y="4" width="36" height="30" fill="#8B4513" />
      <rect x="16" y="8" width="4" height="22" fill="#8B4513" />
      <rect x="60" y="8" width="4" height="22" fill="#8B4513" />
      <rect x="20" y="4" width="36" height="6" fill="#1A0A00" />
      <rect x="26" y="14" width="8" height="8" fill="#FFFFFF" />
      <rect x="46" y="14" width="8" height="8" fill="#FFFFFF" />
      <rect x="29" y="16" width="5" height="6" fill="#FF3300" />
      <rect x="49" y="16" width="5" height="6" fill="#FF3300" />
      <rect x="24" y="10" width="12" height="4" fill="#1A0A00" />
      <rect x="44" y="10" width="12" height="4" fill="#1A0A00" />
      <rect x="38" y="18" width="2" height="10" fill="#5A2D0C" />
      <rect x="28" y="28" width="20" height="4" fill="#5A1A0A" />
      <rect x="32" y="28" width="4" height="4" fill="#F0F0F0" />
      <rect x="44" y="28" width="4" height="4" fill="#F0F0F0" />
      <rect x="30" y="34" width="16" height="6" fill="#8B4513" />
      <rect x="12" y="40" width="52" height="38" fill="#1A1A1A" />
      <rect x="8" y="44" width="4" height="30" fill="#1A1A1A" />
      <rect x="64" y="44" width="8" height="30" fill="#1A1A1A" />
      <rect x="32" y="48" width="16" height="2" fill="#E53935" />
      <rect x="36" y="44" width="8" height="2" fill="#E53935" />
      <rect x="12" y="76" width="52" height="6" fill="#1A1A1A" />
      <rect x="32" y="77" width="12" height="4" fill="#888" />
      <rect x="12" y="82" width="52" height="22" fill="#2C2C2C" />
      <rect x="12" y="86" width="52" height="4" fill="#E53935" />
      <rect x="18" y="104" width="16" height="12" fill="#8B4513" />
      <rect x="46" y="104" width="16" height="12" fill="#8B4513" />
      <rect x="14" y="112" width="22" height="8" fill="#0D0D0D" />
      <rect x="44" y="112" width="22" height="8" fill="#0D0D0D" />
      {isPunching ? (
        <><rect x="58" y="12" width="18" height="16" rx="3" fill="#222" /><rect x="60" y="40" width="18" height="14" rx="3" fill="#222" /><rect x="58" y="14" width="18" height="5" fill="#444" /><rect x="60" y="42" width="18" height="5" fill="#444" /></>
      ) : (
        <><rect x="2" y="52" width="18" height="16" rx="3" fill="#222" /><rect x="60" y="52" width="18" height="16" rx="3" fill="#222" /><rect x="2" y="54" width="18" height="5" fill="#444" /><rect x="60" y="54" width="18" height="5" fill="#444" /></>
      )}
      {isHit && <rect x="0" y="0" width="80" height="120" fill="#FF0000" opacity="0.35" />}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   HP Bar
   ══════════════════════════════════════════════════════════ */
function HPBar({ hp, maxHP, side }: { hp: number; maxHP: number; side: 'player' | 'bot' }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHP) * 100));
  const isLow = pct <= 30;
  const isMid = pct <= 60;
  const color = isLow ? '#ff4444' : isMid ? '#ffaa00' : side === 'player' ? '#00e5ff' : '#ff5252';
  const glow = isLow ? 'rgba(255,68,68,0.5)' : isMid ? 'rgba(255,170,0,0.4)' : side === 'player' ? 'rgba(0,229,255,0.4)' : 'rgba(255,82,82,0.4)';
  return (
    <div style={{ width: '100%', height: '14px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}bb, ${color})`, borderRadius: '7px', boxShadow: `0 0 8px ${glow}`, transition: 'width 0.5s ease-out', animation: isLow ? 'hpPulse 0.8s infinite alternate' : undefined }} />
      <div style={{ position: 'absolute', top: '2px', left: '4px', right: '4px', height: '3px', background: 'rgba(255,255,255,0.18)', borderRadius: '3px' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Boxing Ring
   ══════════════════════════════════════════════════════════ */
function BoxingRing({
  hitTarget, feedback, lastDmg, botHP, showKO, combo,
  anticipating, roundText, roundTextPhase, timer,
}: {
  hitTarget: HitTarget; feedback: AnswerFeedback;
  lastDmg: number; playerHP: number; botHP: number; showKO: boolean;
  combo: number; anticipating: HitTarget;
  roundText: string | null; roundTextPhase: 'in' | 'out';
  timer: number;
}) {
  const botPunching = hitTarget === 'player';
  const playerPunching = hitTarget === 'bot';
  const botHit = hitTarget === 'bot' && feedback === 'correct';
  const playerHit = hitTarget === 'player';
  const botAnticipating = anticipating === 'bot';
  const playerAnticipating = anticipating === 'player';
  const timerDanger = timer <= 4 && !showKO;

  const getPlayerStyle = (): React.CSSProperties => {
    if (playerAnticipating) return { animation: 'anticipatePlayer 0.22s ease-out forwards' };
    if (playerPunching) return { animation: 'punchPlayer 0.38s ease-out forwards' };
    if (playerHit) return { animation: 'hitRecoil 0.4s ease-out forwards' };
    return { animation: 'fighterIdle 1.2s ease-in-out infinite' };
  };
  const getCPUStyle = (): React.CSSProperties => {
    if (botAnticipating) return { animation: 'anticipateCPU 0.22s ease-out forwards' };
    if (botPunching) return { animation: 'punchCPU 0.38s ease-out forwards' };
    if (botHit) return { animation: 'hitRecoilCPU 0.4s ease-out forwards' };
    return { animation: 'fighterIdleCPU 1.4s ease-in-out infinite' };
  };

  const fighterLabelStyle = {
    marginTop: '2px', textAlign: 'center' as const,
    fontFamily: 'monospace', fontSize: '8px', letterSpacing: '1px',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    borderRadius: '3px', padding: '2px 6px',
  };

  return (
    <div className="relative isolate mx-auto aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/10 bg-[#090912]">
      {/* Crowd Background */}
      <div className="absolute inset-0 bg-[#090912]">
        {[0, 1, 2, 3, 4].map(row => (
          <div key={row} style={{ position: 'absolute', top: `${row * 12}%`, left: 0, right: 0, height: '12%', display: 'flex', overflow: 'hidden' }}>
            {[...Array(32)].map((_, i) => {
              const c = ['#1e0d04', '#130505', '#070c18', '#0c0c1c', '#180508', '#050f0c', '#180c04', '#080514'][(i * 3 + row * 5) % 8];
              return <div key={i} style={{ flex: 1, height: '100%', background: c }} />;
            })}
          </div>
        ))}
        <div style={{ position: 'absolute', top: '3%', left: 0, right: 0, display: 'flex', overflow: 'hidden', padding: '0 1%' }}>
          {[...Array(48)].map((_, i) => (
            <div key={i} style={{
              flexShrink: 0, width: '2.1%', height: '16px',
              background: ['#8B4513', '#D2691E', '#F4C28A', '#3C2A1A', '#6B3A2A', '#C68642', '#4A3728', '#A07850'][i % 8],
              borderRadius: '50% 50% 10% 10%', marginRight: '0.1%',
              animation: `fighterIdle ${2 + (i % 3) * 0.5}s ${(i % 5) * 0.3}s ease-in-out infinite`,
            }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, transparent, rgba(5,5,15,0.6))' }} />
      </div>

      {/* Ring Floor */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '56%', background: 'linear-gradient(180deg, #1a5fa8 0%, #1e6bb8 50%, #2474cc 100%)', clipPath: 'polygon(7% 0%, 93% 0%, 100% 100%, 0% 100%)', zIndex: 2 }}>
        <div style={{ position: 'absolute', top: '18%', left: '8%', right: '8%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', top: '48%', left: '14%', right: '14%', height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', top: '74%', left: '20%', right: '20%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Apron Edge */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '8%', background: 'linear-gradient(180deg, #c62828, #8b0000)', zIndex: 3, borderTop: '1px solid rgba(255,100,100,0.3)' }} />
      <div className="absolute" style={{ bottom: '54.5%', left: '5.5%', right: '5.5%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.25), transparent)', zIndex: 3 }} />

      {/* Back Ropes */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 4 }}>
        <defs>
          <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ccc" /><stop offset="50%" stopColor="#fff" /><stop offset="100%" stopColor="#999" />
          </linearGradient>
        </defs>
        <rect x="4.5" y="18" width="2" height="52" fill="url(#postGrad)" rx="0.3" />
        <rect x="3.8" y="16.5" width="3.4" height="2" fill="#ddd" rx="0.4" />
        <rect x="3.8" y="69.5" width="3.4" height="2" fill="#aaa" rx="0.4" />
        <rect x="93.5" y="18" width="2" height="52" fill="url(#postGrad)" rx="0.3" />
        <rect x="93.2" y="16.5" width="3.4" height="2" fill="#ddd" rx="0.4" />
        <rect x="93.2" y="69.5" width="3.4" height="2" fill="#aaa" rx="0.4" />
        <line x1="5.5" y1="20" x2="5.5" y2="68" stroke="#bb1111" strokeWidth="1.1" />
        <line x1="5.5" y1="24" x2="5.5" y2="64" stroke="rgba(220,220,220,0.85)" strokeWidth="0.8" />
        <line x1="94.5" y1="20" x2="94.5" y2="68" stroke="#bb1111" strokeWidth="1.1" />
        <line x1="94.5" y1="24" x2="94.5" y2="64" stroke="rgba(220,220,220,0.85)" strokeWidth="0.8" />
        <line x1="5.5" y1="20" x2="94.5" y2="20" stroke="#bb1111" strokeWidth="1.2" />
        <line x1="5.5" y1="24" x2="94.5" y2="24" stroke="rgba(230,230,230,0.9)" strokeWidth="0.9" />
        <line x1="5.5" y1="28" x2="94.5" y2="28" stroke="#bb1111" strokeWidth="1.2" />
        <rect x="3.4" y="18.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
        <rect x="3.4" y="26.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
        <rect x="92.6" y="18.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
        <rect x="92.6" y="26.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
      </svg>

      {/* Fighters */}
      <div className="pointer-events-none absolute left-[7%] right-[7%] top-[18%] bottom-[14%]" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 flex items-end justify-between">
          <div className="relative flex h-full w-[42%] items-end justify-start pb-[18%] pl-[1%]">
            <div style={{ position: 'relative', width: 'clamp(80px, 14vw, 116px)', transformOrigin: 'bottom center', filter: botHit ? 'brightness(1.6) drop-shadow(0 0 8px rgba(255,50,50,0.8))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.55))', ...getCPUStyle() }}>
              {combo >= 3 && !botHit && (<div style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,0,0.15) 0%, transparent 70%)', animation: 'comboGlow 1.5s ease-in-out infinite', pointerEvents: 'none' }} />)}
              {hitTarget === 'bot' && lastDmg > 0 && (<div style={{ position: 'absolute', top: '-20px', left: '50%', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#ffcc00', textShadow: '1px 1px 0 #000, 0 0 8px rgba(255,200,0,0.6)', whiteSpace: 'nowrap', zIndex: 40, animation: 'floatDmg 1.4s ease-out forwards' }}>-{lastDmg} HP!</div>)}
              {botHit && (<div style={{ position: 'absolute', top: '30%', left: '60%', width: 30, height: 30, border: '3px solid rgba(255,255,100,0.9)', borderRadius: '50%', animation: 'impactRing 0.5s ease-out forwards', pointerEvents: 'none', zIndex: 30 }} />)}
              <div className="w-full"><BotFighter isHit={botHit} isPunching={botPunching} /></div>
              <div style={{ ...fighterLabelStyle, color: '#ff7070', border: '1px solid rgba(255,80,80,0.3)' }}>CPU</div>
            </div>
          </div>
          <div className="relative flex h-full w-[46%] items-end justify-end pb-[2%] pr-[1%]">
            <div style={{ position: 'relative', width: 'clamp(92px, 18vw, 144px)', transformOrigin: 'bottom center', filter: playerHit ? 'brightness(1.6) drop-shadow(0 0 8px rgba(255,50,50,0.8))' : 'drop-shadow(0 5px 10px rgba(0,0,0,0.7))', ...getPlayerStyle() }}>
              {combo >= 2 && !playerHit && (<div style={{ position: 'absolute', inset: '-16px', borderRadius: '50%', background: `radial-gradient(circle, rgba(0,255,100,${Math.min(0.15 + combo * 0.04, 0.4)}) 0%, transparent 70%)`, animation: 'comboGlow 1.2s ease-in-out infinite', pointerEvents: 'none' }} />)}
              {hitTarget === 'player' && lastDmg > 0 && (<div style={{ position: 'absolute', top: '-20px', left: '50%', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#ff5252', textShadow: '1px 1px 0 #000, 0 0 8px rgba(255,50,50,0.6)', whiteSpace: 'nowrap', zIndex: 40, animation: 'floatDmg 1.4s ease-out forwards' }}>-{lastDmg} HP!</div>)}
              {playerHit && (<div style={{ position: 'absolute', top: '30%', left: '30%', width: 30, height: 30, border: '3px solid rgba(255,100,100,0.9)', borderRadius: '50%', animation: 'impactRing 0.5s ease-out forwards', pointerEvents: 'none', zIndex: 30 }} />)}
              <div className="w-full"><PlayerFighter isHit={playerHit} isPunching={playerPunching} /></div>
              <div style={{ ...fighterLabelStyle, color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)' }}>YOU</div>
            </div>
          </div>
        </div>
      </div>

      {/* Front Ropes */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 14 }}>
        <line x1="5.5" y1="60" x2="94.5" y2="60" stroke="#bb1111" strokeWidth="1.2"><animate attributeName="y1" values="60;60.3;60" dur="2.5s" repeatCount="indefinite" /><animate attributeName="y2" values="60;60.3;60" dur="2.5s" repeatCount="indefinite" /></line>
        <line x1="5.5" y1="60" x2="94.5" y2="60" stroke="rgba(255,60,60,0.32)" strokeWidth="2.4" />
        <line x1="5.5" y1="64" x2="94.5" y2="64" stroke="rgba(230,230,230,0.9)" strokeWidth="0.9"><animate attributeName="y1" values="64;64.25;64" dur="3s" repeatCount="indefinite" /><animate attributeName="y2" values="64;64.25;64" dur="3s" repeatCount="indefinite" /></line>
        <line x1="5.5" y1="68" x2="94.5" y2="68" stroke="#bb1111" strokeWidth="1.2"><animate attributeName="y1" values="68;68.35;68" dur="2s" repeatCount="indefinite" /><animate attributeName="y2" values="68;68.35;68" dur="2s" repeatCount="indefinite" /></line>
        <line x1="5.5" y1="68" x2="94.5" y2="68" stroke="rgba(255,60,60,0.32)" strokeWidth="2.4" />
        <rect x="3.4" y="58.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
        <rect x="3.4" y="66.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
        <rect x="92.6" y="58.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
        <rect x="92.6" y="66.5" width="4" height="3.5" fill="#7a1a1a" rx="0.6" opacity="0.9" />
      </svg>

      {/* Combo */}
      {combo >= 2 && hitTarget === 'bot' && (
        <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', zIndex: 25, pointerEvents: 'none', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '3px', fontSize: combo >= 4 ? '28px' : combo >= 3 ? '24px' : '20px', color: combo >= 4 ? '#ff6d00' : combo >= 3 ? '#ffcc00' : '#fff', textShadow: `0 0 ${8 + combo * 4}px rgba(255,${220 - combo * 25},0,0.9), 2px 2px 0 rgba(0,0,0,0.5)`, animation: 'comboPop 0.4s ease-out forwards' }}>
          🔥 {combo}x COMBO!
        </div>
      )}

      {/* Flash overlay */}
      {feedback && (<div style={{ position: 'absolute', inset: 0, zIndex: 18, pointerEvents: 'none', background: feedback === 'correct' ? 'rgba(255,255,255,0.25)' : 'rgba(255,40,40,0.2)', animation: 'flashHit 0.4s ease-out forwards' }} />)}

      {/* Timer danger */}
      {timerDanger && (<div style={{ position: 'absolute', inset: 0, zIndex: 16, pointerEvents: 'none', boxShadow: 'inset 0 0 50px 15px rgba(255,0,0,0.25)', animation: 'vignettePulse 1s ease-in-out infinite' }} />)}

      {/* Hit text */}
      {feedback && (
        <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', fontFamily: 'monospace', fontWeight: 900, fontSize: '18px', letterSpacing: '2px', color: feedback === 'correct' ? '#ffd600' : '#ff4444', textShadow: feedback === 'correct' ? '0 0 12px rgba(255,214,0,0.8), 2px 2px 0 rgba(0,0,0,0.5)' : '0 0 12px rgba(255,68,68,0.8), 2px 2px 0 rgba(0,0,0,0.5)', animation: 'feedIn 0.2s ease-out' }}>
          {feedback === 'correct' ? '💥 โจมตีสำเร็จ!' : feedback === 'timeout' ? '⏰ หมดเวลา!' : '💢 โดนสกัด!'}
        </div>
      )}

      {/* Round Transition */}
      {roundText && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '5px', fontSize: roundText.includes('K.O.') ? '56px' : '42px', color: roundText.includes('K.O.') ? (botHP <= 0 ? '#ffcc00' : '#ff4444') : '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.6), 0 0 20px rgba(100,180,255,0.4)', animation: roundTextPhase === 'in' ? 'roundIn 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'roundOut 0.35s ease-in forwards' }}>
            {roundText}
          </div>
        </div>
      )}

      {/* KO Overlay */}
      {showKO && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '72px', fontWeight: 900, letterSpacing: '4px', color: botHP <= 0 ? '#ffcc00' : '#ff4444', textShadow: botHP <= 0 ? '3px 3px 0 #996600, 0 0 24px rgba(255,200,0,0.5)' : '3px 3px 0 #880000, 0 0 24px rgba(255,0,0,0.5)', animation: 'koIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>K.O.!</div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '8px', letterSpacing: '1px' }}>{botHP <= 0 ? 'น็อคเอาท์! คุณชนะ CPU!' : 'คุณโดนน็อคเอาท์!'}</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HUD
   ══════════════════════════════════════════════════════════ */
function GameHUD({ playerHP, botHP, timer, questionIndex, totalQ, combo, currentCategory }: {
  playerHP: number; botHP: number; timer: number; questionIndex: number; totalQ: number; combo: number;
  currentCategory?: CSSQuestion['category'];
}) {
  const crit = timer <= 3;
  const warn = timer <= 5;
  const timerPct = (timer / TIMER_SECONDS) * 100;

  return (
    <div style={{ background: 'rgba(8,10,22,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: '30px', height: '30px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,80,80,0.35)', background: '#1a0808' }}>
              <svg width="30" height="30" viewBox="14 4 50 42" style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)', transformOrigin: '15px 50%' }}>
                <rect x="0" y="0" width="80" height="80" fill="#1A1A1A" />
                <rect x="20" y="4" width="36" height="30" fill="#8B4513" />
                <rect x="20" y="4" width="36" height="6" fill="#1A0A00" />
                <rect x="26" y="14" width="8" height="8" fill="#FFF" /><rect x="46" y="14" width="8" height="8" fill="#FFF" />
                <rect x="29" y="16" width="5" height="6" fill="#FF3300" /><rect x="49" y="16" width="5" height="6" fill="#FF3300" />
                <rect x="24" y="10" width="12" height="4" fill="#1A0A00" /><rect x="44" y="10" width="12" height="4" fill="#1A0A00" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff5252', letterSpacing: '2px', marginBottom: '4px' }}>CPU</div>
              <HPBar hp={botHP} maxHP={MAX_HP} side="bot" />
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{botHP}/{MAX_HP}</div>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,255,255,0.28)', marginBottom: '3px', letterSpacing: '1px' }}>เวลา</div>
          <div style={{ width: '52px', height: '52px', background: crit ? 'rgba(255,50,50,0.12)' : 'rgba(255,255,255,0.04)', border: `2px solid ${crit ? 'rgba(255,80,80,0.65)' : warn ? 'rgba(255,180,0,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: crit ? '#ff5252' : warn ? '#ffaa00' : '#fff', backdropFilter: 'blur(4px)', animation: crit ? 'timerWarn 0.5s infinite alternate' : undefined, boxShadow: crit ? '0 0 16px rgba(255,50,50,0.4)' : 'none' }}>
            {timer}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,255,255,0.22)', marginTop: '3px' }}>ข้อ {questionIndex + 1}/{totalQ}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexDirection: 'row-reverse' }}>
            <div style={{ width: '30px', height: '30px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,229,255,0.35)', background: '#0a1520' }}>
              <svg width="30" height="30" viewBox="16 4 44 42" style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}>
                <rect x="0" y="0" width="80" height="80" fill="#1A6B7C" />
                <rect x="24" y="4" width="32" height="28" fill="#F4C28A" />
                <rect x="24" y="4" width="32" height="8" fill="#2C1810" />
                <rect x="30" y="16" width="6" height="6" fill="#FFF" /><rect x="44" y="16" width="6" height="6" fill="#FFF" />
                <rect x="32" y="18" width="4" height="4" fill="#1A1A2E" /><rect x="46" y="18" width="4" height="4" fill="#1A1A2E" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#00e5ff', letterSpacing: '2px', marginBottom: '4px', textAlign: 'right' }}>PLAYER</div>
              <HPBar hp={playerHP} maxHP={MAX_HP} side="player" />
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', textAlign: 'right' }}>{playerHP}/{MAX_HP}</div>
            </div>
          </div>
          {combo >= 2 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace', fontSize: '10px', color: '#ffaa00', background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: '4px', padding: '2px 8px', animation: 'comboGlow 1.5s ease-in-out infinite' }}>
                🔥 {combo}x COMBO
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category badge */}
      {currentCategory && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '6px', padding: '2px 10px', animation: 'categoryBadge 0.3s ease-out' }}>
            {CATEGORY_LABELS[currentCategory]}
          </div>
        </div>
      )}

      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '4px', width: `${timerPct}%`, background: crit ? '#f44336' : warn ? 'linear-gradient(90deg, #ff9800, #ffc107)' : 'linear-gradient(90deg, #4caf50, #8bc34a)', transition: 'width 1s linear', boxShadow: crit ? '0 0 8px rgba(244,67,54,0.6)' : 'none' }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Question Panel (ภาษาไทย)
   ══════════════════════════════════════════════════════════ */
function QuestionPanel({ question, selected, feedback, locked, onAnswer }: {
  question: CSSQuestion; selected: number | null;
  feedback: AnswerFeedback; locked: boolean; onAnswer: (idx: number) => void;
}) {
  const labels = ['A', 'B', 'C', 'D'];
  const cfg = [
    { idle: 'rgba(139,92,246,0.18)', border: 'rgba(167,139,250,0.45)', accent: '#a78bfa', glow: 'rgba(139,92,246,0.3)' },
    { idle: 'rgba(6,182,212,0.18)', border: 'rgba(34,211,238,0.45)', accent: '#22d3ee', glow: 'rgba(6,182,212,0.3)' },
    { idle: 'rgba(249,115,22,0.18)', border: 'rgba(251,146,60,0.45)', accent: '#fb923c', glow: 'rgba(249,115,22,0.3)' },
    { idle: 'rgba(236,72,153,0.18)', border: 'rgba(244,114,182,0.45)', accent: '#f472b6', glow: 'rgba(236,72,153,0.3)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, width: '100%' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(15,20,50,0.92), rgba(10,14,38,0.95))', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(100,130,255,0.2)', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#60a5fa', letterSpacing: '2px' }}>คำถาม CSS</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '9px', color: '#475569' }}>{CATEGORY_LABELS[question.category]}</span>
        </div>
        <p style={{ margin: '0 0 12px', color: '#f0f4ff', fontSize: '14px', fontWeight: 600, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{question.question}</p>
        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(74,222,128,0.2)', borderLeft: '3px solid #4ade80', borderRadius: '8px', padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#86efac', letterSpacing: '0.3px' }}>{question.code}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '8px', minWidth: 0 }}>
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          const show = feedback !== null;
          const c = cfg[i];
          let bg = c.idle, border = c.border, textColor = '#e2e8f0', shadow = 'none', labelBg = c.accent + '22', labelColor = c.accent, opacity = 1;
          if (show) {
            if (isCorrect) { bg = 'rgba(34,197,94,0.22)'; border = 'rgba(74,222,128,0.7)'; shadow = '0 0 18px rgba(74,222,128,0.28), inset 0 0 12px rgba(74,222,128,0.08)'; labelBg = 'rgba(74,222,128,0.28)'; labelColor = '#4ade80'; textColor = '#bbf7d0'; }
            else if (isSelected) { bg = 'rgba(239,68,68,0.22)'; border = 'rgba(248,113,113,0.7)'; shadow = '0 0 18px rgba(239,68,68,0.25)'; labelBg = 'rgba(248,113,113,0.25)'; labelColor = '#f87171'; textColor = '#fca5a5'; }
            else { bg = 'rgba(15,20,40,0.4)'; border = 'rgba(255,255,255,0.06)'; textColor = 'rgba(255,255,255,0.2)'; labelColor = 'rgba(255,255,255,0.15)'; labelBg = 'transparent'; opacity = 0.5; }
          }
          return (
            <button key={i} onClick={() => onAnswer(i)} disabled={locked}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 10px', minWidth: 0, background: bg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${border}`, borderRadius: '12px', boxShadow: shadow, cursor: locked ? 'default' : 'pointer', transition: 'all 0.18s ease', color: textColor, textAlign: 'left', opacity }}
              onMouseEnter={e => { if (!locked && !show) { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${c.glow}`; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!locked) { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; } }}
            >
              <span style={{ flexShrink: 0, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', background: labelBg, border: `1px solid ${labelColor}55`, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: labelColor, boxShadow: show && isCorrect ? `0 0 8px ${labelColor}55` : 'none' }}>
                {show && isCorrect ? '✓' : show && isSelected ? '✗' : labels[i]}
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', lineHeight: 1.45, letterSpacing: '0.2px', minWidth: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{choice}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '12px', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'feedIn 0.22s ease-out', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontWeight: 600, ...(feedback === 'correct' ? { background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(74,222,128,0.35)', color: '#86efac', boxShadow: '0 0 20px rgba(74,222,128,0.12)' } : feedback === 'wrong' ? { background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(248,113,113,0.35)', color: '#fca5a5', boxShadow: '0 0 20px rgba(239,68,68,0.12)' } : { background: 'rgba(234,179,8,0.14)', border: '1px solid rgba(250,204,21,0.35)', color: '#fde68a', boxShadow: '0 0 20px rgba(234,179,8,0.12)' }) }}>
          <span style={{ fontSize: '18px' }}>{feedback === 'correct' ? '👊' : feedback === 'wrong' ? '💥' : '⏰'}</span>
          <span>
            {feedback === 'correct' && 'โจมตีสำเร็จ! หมัดของคุณถูกเป้า!'}
            {feedback === 'wrong' && 'โอ้โห! CPU สวนกลับมา!'}
            {feedback === 'timeout' && 'หมดเวลา! CPU ต่อยฟรี!'}
          </span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Ready Screen
   ══════════════════════════════════════════════════════════ */
function ReadyScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 16px', gap: '24px',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, rgba(10,8,30,0.5) 0%, rgba(30,10,10,0.3) 100%)',
      borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {SPARKLE_POSITIONS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${s.left}%`, top: `${s.top}%`,
          color: '#ffd60055', fontSize: `${s.size}px`,
          animation: `sparkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }}>✦</div>
      ))}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px' }}>
        <div style={{ animation: 'readySway 2s ease-in-out infinite', filter: 'drop-shadow(0 6px 16px rgba(255,80,80,0.35))' }}>
          <BotFighter isHit={false} isPunching={false} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '48px', fontWeight: 900, color: '#ff4444', alignSelf: 'center', textShadow: '3px 3px 0 rgba(0,0,0,0.6), 0 0 30px rgba(255,60,60,0.5)', animation: 'vsPulse 1.5s ease-in-out infinite' }}>VS</div>
        <div style={{ animation: 'readySway 2s 0.5s ease-in-out infinite', filter: 'drop-shadow(0 6px 16px rgba(0,229,255,0.35))' }}>
          <PlayerFighter isHit={false} isPunching={false} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: 'monospace', fontSize: '26px', fontWeight: 900, letterSpacing: '4px', color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.5), 0 0 20px rgba(100,180,255,0.3)' }}>
          CSS Quiz Battle
        </h2>
        <p style={{ margin: '6px 0 0', fontFamily: 'system-ui', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
          ตอบ CSS ให้ถูกทุกข้อเพื่อเดินหน้าต่อ! 🥊
        </p>
        {/* หมวดหมู่คำถาม */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
          {Object.entries(CATEGORY_LABELS).map(([, label]) => (
            <span key={label} style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '4px', padding: '2px 8px' }}>{label}</span>
          ))}
        </div>
      </div>

      {/* <div style={{ display: 'flex', gap: '10px' }}>
        {([['❤️', '#ff5252', '100 HP'], ['⏱️', '#60a5fa', `${TIMER_SECONDS} วิ`], ['🎯', '#ffaa00', 'ต้องถูกทุกข้อ'], ['🎲', '#a78bfa', '']] as [string, string, string][]).map(([icon, color, label]) => (
          <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '10px 12px' }}>
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color, marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div> */}

      <button onClick={onStart}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 56px', background: 'linear-gradient(135deg, rgba(220,30,30,0.95), rgba(200,80,0,0.95))', backdropFilter: 'blur(8px)', color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 900, letterSpacing: '5px', border: '2px solid rgba(255,140,80,0.4)', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 6px 30px rgba(220,50,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)', animation: 'fightBtnGlow 2s ease-in-out infinite', transition: 'transform 0.15s ease' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
      >
        🥊 ชก!
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Finished Screen
   ══════════════════════════════════════════════════════════ */
function FinishedScreen({ winner, canAdvance, playerHP, botHP, correct, wrong, maxCombo, totalQ, onPlayAgain, onRoomSkip, onBackToDashboard }: {
  winner: 'player' | 'bot' | 'draw'; canAdvance: boolean;
  playerHP: number; botHP: number;
  correct: number; wrong: number; maxCombo: number; totalQ: number;
  onPlayAgain: () => void;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}) {
  const isWin = winner === 'player';
  const isDraw = winner === 'draw';
  const isPerfect = correct === totalQ && wrong === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 16px', gap: '22px',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, rgba(10,8,30,0.6) 0%, rgba(30,10,10,0.4) 100%)',
      borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {canAdvance && SPARKLE_POSITIONS.map((s, i) => (
        <div key={i} style={{ position: 'absolute', pointerEvents: 'none', left: `${s.left}%`, top: `${s.top}%`, color: i % 2 === 0 ? '#ffd60055' : '#00e5ff44', fontSize: `${s.size}px`, animation: `sparkle ${s.dur}s ${s.delay}s ease-in-out infinite` }}>✦</div>
      ))}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', animation: 'statFadeIn 0.5s ease-out' }}>
        <div style={{ opacity: !isWin ? 1 : 0.4, filter: !isWin ? 'drop-shadow(0 6px 16px rgba(255,80,80,0.35))' : 'grayscale(0.5)', animation: 'readySway 2s ease-in-out infinite' }}>
          <BotFighter isHit={isWin} isPunching={!isWin} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', alignSelf: 'center' }}>
          <span style={{ fontSize: '52px', animation: 'winPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            {canAdvance ? '🏆' : isDraw ? '🤝' : '😵'}
          </span>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 900, letterSpacing: '3px', color: canAdvance ? '#ffcc00' : isDraw ? '#94a3b8' : '#ff5252', textShadow: canAdvance ? '2px 2px 0 #996600, 0 0 20px rgba(255,200,0,0.5)' : isDraw ? '2px 2px 0 rgba(0,0,0,0.5)' : '2px 2px 0 #880000, 0 0 20px rgba(255,0,0,0.4)', animation: 'winPop 0.6s 0.1s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            {canAdvance ? 'ชนะ!' : isDraw ? 'เสมอ!' : 'แพ้!'}
          </div>
          {isPerfect && canAdvance && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', padding: '3px 10px', letterSpacing: '1px' }}>
              ⭐ คะแนนสมบูรณ์!
            </div>
          )}
        </div>
        <div style={{ opacity: isWin ? 1 : 0.4, filter: isWin ? 'drop-shadow(0 6px 16px rgba(0,229,255,0.35))' : 'grayscale(0.5)', animation: 'readySway 2s 0.5s ease-in-out infinite' }}>
          <PlayerFighter isHit={!isWin} isPunching={isWin} />
        </div>
      </div>

      <div style={{ textAlign: 'center', animation: 'statFadeIn 0.5s 0.15s ease-out both' }}>
        <p style={{ margin: 0, fontFamily: 'system-ui', fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>
          {canAdvance ? 'เจ๋งมาก! ตอบถูกทุกข้อ!' : isDraw ? 'สูสีมากเลย!' : isWin ? 'ชนะแต่ตอบผิดบางข้อ — ต้องถูกทุกข้อถึงจะผ่านได้!' : 'ฝึกเพิ่มแล้วมาใหม่!'}
        </p>
        {!canAdvance && (
          <div style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', padding: '8px 16px', lineHeight: 1.6 }}>
            ⚠️ ต้องตอบ<strong>ถูกทุกข้อ</strong>ถึงจะเดินหน้าต่อได้!
          </div>
        )}
      </div>

      {/* HP Bars */}
      <div style={{ width: '100%', maxWidth: '320px', animation: 'statFadeIn 0.5s 0.2s ease-out both' }}>
        {([{ label: 'PLAYER', hp: playerHP, side: 'player' as const, color: '#00e5ff' }, { label: 'CPU', hp: botHP, side: 'bot' as const, color: '#ff5252' }]).map(({ label, hp, side, color }) => (
          <div key={label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color, letterSpacing: '1px' }}>{label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{hp} HP</span>
            </div>
            <HPBar hp={hp} maxHP={MAX_HP} side={side} />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%', maxWidth: '320px', animation: 'statFadeIn 0.5s 0.3s ease-out both' }}>
        {([{ icon: '✅', val: correct, label: 'ถูก', color: '#4ade80' }, { icon: '❌', val: wrong, label: 'ผิด', color: '#f87171' }, { icon: '🔥', val: maxCombo, label: 'คอมโบ', color: '#ffaa00' }] as {icon:string;val:number;label:string;color:string}[]).map(({ icon, val, label, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border: `1px solid ${color}30`, borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', color, fontWeight: 700, marginTop: '4px' }}>{val}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: color + '88' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ animation: 'statFadeIn 0.5s 0.4s ease-out both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <button onClick={onPlayAgain}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 48px', background: canAdvance ? 'linear-gradient(135deg, rgba(30,120,50,0.95), rgba(20,80,40,0.95))' : 'linear-gradient(135deg, rgba(220,30,30,0.95), rgba(200,80,0,0.95))', backdropFilter: 'blur(8px)', color: '#fff', fontFamily: 'monospace', fontSize: '20px', fontWeight: 900, letterSpacing: '4px', border: `2px solid ${canAdvance ? 'rgba(80,220,120,0.4)' : 'rgba(255,140,80,0.4)'}`, borderRadius: '14px', cursor: 'pointer', boxShadow: canAdvance ? '0 6px 30px rgba(30,120,50,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 6px 30px rgba(220,50,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)', animation: 'fightBtnGlow 2s ease-in-out infinite', transition: 'transform 0.15s ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        >
          {canAdvance ? '🏆 เล่นอีกครั้ง' : '🔄 แก้แค้น!'}
        </button>
        {(onRoomSkip || onBackToDashboard) ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '100%' }}>
            {onRoomSkip ? (
              <button type="button" onClick={onRoomSkip}
                style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.45)', background: 'rgba(30,58,138,0.45)', color: '#e0f2fe', fontFamily: 'system-ui', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                ข้ามด่านนี้
              </button>
            ) : null}
            {onBackToDashboard ? (
              <button type="button" onClick={onBackToDashboard}
                style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'system-ui', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                กลับ Dashboard
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */
export default function BoxingQuizBattle({ onComplete, isActive, onRoomSkip, onBackToDashboard }: StageProps) {
  const g = useBoxingGame();
  const completedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio("/sound/เพลงมวยไทย.mp3");
    a.loop = true;
    a.preload = "auto";
    audioRef.current = a;
    const tryPlay = () => { void a.play(); };
    tryPlay();
    const onFirstGesture = () => tryPlay();
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      a.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (g.gameStatus === 'finished' && g.canAdvance && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ correct: g.correct, total: g.totalQ });
    }
  }, [g.gameStatus, g.canAdvance, g.correct, g.totalQ, onComplete]);

  useEffect(() => {
    if (g.gameStatus === 'ready' || g.gameStatus === 'playing') completedRef.current = false;
  }, [g.gameStatus]);

  if (!isActive) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-white/40 text-lg font-semibold">Stage ยังไม่พร้อม</p>
    </div>
  );

  if (g.gameStatus === 'ready') return (
    <div className="mx-auto w-full max-w-2xl">
      <style>{SCOPED_STYLES}</style>
      <ReadyScreen onStart={g.startGame} />
    </div>
  );

  if (g.gameStatus === 'finished') return (
    <div className="mx-auto w-full max-w-2xl">
      <style>{SCOPED_STYLES}</style>
      <FinishedScreen
        winner={g.winner}
        canAdvance={g.canAdvance}
        playerHP={g.playerHP}
        botHP={g.botHP}
        correct={g.correct}
        wrong={g.wrong}
        maxCombo={g.maxCombo}
        totalQ={g.totalQ}
        onPlayAgain={g.startGame}
        onRoomSkip={onRoomSkip}
        onBackToDashboard={onBackToDashboard}
      />
    </div>
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
    <div
      className="select-none flex flex-col xl:grid xl:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)] xl:gap-6 2xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] 2xl:gap-8 w-full min-w-0 mx-auto xl:items-stretch"
      style={{ animation: g.screenShake ? 'shakeX 0.4s ease-out' : undefined }}
    >
      <style>{SCOPED_STYLES}</style>

      {/* ปุ่ม mute */}
      <div style={{ position: 'absolute', top: 16, right: 24, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => setIsMuted(m => !m)}
          title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
          style={{ background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "0.75rem", padding: "0.25rem 0.6rem", color: "#fff", fontSize: "1.3rem", cursor: "pointer", boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          {isMuted ? "🔕" : "🔔"}
        </button>
      </div>

      {/* Arena */}
      <div className="flex flex-col gap-4 w-full min-w-0 shrink-0 bg-[#112240] border border-white/10 shadow-2xl rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <GameHUD
          playerHP={g.playerHP} botHP={g.botHP} timer={g.timer}
          questionIndex={g.questionIndex} totalQ={g.totalQ} combo={g.combo}
          currentCategory={g.question?.category}
        />
        <BoxingRing
          hitTarget={g.hitTarget} feedback={g.feedback}
          lastDmg={g.lastDmg} playerHP={g.playerHP} botHP={g.botHP}
          showKO={g.gameStatus === 'ko'} combo={g.combo}
          anticipating={g.anticipating}
          roundText={g.roundText} roundTextPhase={g.roundTextPhase}
          timer={g.timer}
        />
      </div>

      {/* Question Panel */}
      <div className="w-full min-w-0 shrink-0 flex flex-col">
        <div className="bg-[#112240] border border-white/10 shadow-2xl rounded-2xl p-3 sm:p-6 h-full min-w-0 flex flex-col justify-start relative">
          {g.question && g.gameStatus === 'playing' && !g.roundText && (
            <QuestionPanel
              question={g.question}
              selected={g.selectedAnswer}
              feedback={g.feedback}
              locked={g.buttonsLocked}
              onAnswer={g.handleAnswer}
            />
          )}
        </div>
      </div>
    </div>
    </div>
  );
}