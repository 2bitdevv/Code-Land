import React, { useMemo, useState } from 'react';

type Lesson = {
  id: string;
  title: string;
  desc: string;
  bullets: string[];
  blocks?: string[];
  example?: string[];
};

const SECTIONS: Lesson[] = [
  {
    id: 'if-else',
    title: 'IF / ELSE',
    desc: 'ตัดสินใจเลือกทางตามเงื่อนไข',
    bullets: [
      'รูปแบบ: IF (เงื่อนไข) → ทำ A, ELSE → ทำ B',
      'ใช้เมื่อ “ถ้า…ไม่งั้น…” เช่น เลี้ยวซ้าย/เดินตรง',
      'คำใบ้: ดู “Mission” แล้วหาเงื่อนไขหลักก่อนเสมอ',
    ],
    blocks: ['IF ...', 'ELSE', 'เลี้ยวซ้าย', 'เดินตรง', 'หยุด'],
    example: ['IF ประตูเปิด', 'เดินตรง', 'ELSE', 'หยุด'],
  },
  {
    id: 'loop',
    title: 'LOOP',
    desc: 'วนทำซ้ำตามจำนวนครั้ง',
    bullets: [
      'รูปแบบ: LOOP n ครั้ง → (คำสั่งที่จะทำซ้ำ)',
      'ใช้เมื่อ Mission บอกให้ทำซ้ำ เช่น “โจมตี 4 ครั้ง”, “เก็บ gem 3 อัน”',
      'ถ้า loop มากไป/น้อยไป จะทำให้ไม่ผ่านหรือ HP ลดจากบอสได้',
    ],
    blocks: ['LOOP 3 ครั้ง', 'โจมตี', 'เก็บ coin', 'หยุด'],
    example: ['LOOP 3 ครั้ง', 'เก็บ gem', 'หยุด'],
  },
  {
    id: 'variables',
    title: 'Variables (ตัวแปร)',
    desc: 'เก็บค่าที่ใช้ซ้ำ และเอาไปใช้กับ LOOP/พลังโจมตี',
    bullets: [
      'ตัวอย่าง: setVar speed=2 แล้ว LOOP speed ครั้ง',
      'ตัวอย่าง: setVar power=2 แล้ว “โจมตี power”',
      'หัวใจสำคัญ: ตั้งค่าตัวแปรก่อนใช้งานเสมอ',
    ],
    blocks: ['setVar speed=2', 'LOOP speed', 'โจมตี power', 'หยุด'],
    example: ['setVar speed=2', 'LOOP speed', 'เก็บ torch', 'หยุด'],
  },
  {
    id: 'functions',
    title: 'Functions (เรียกฟังก์ชัน)',
    desc: 'คำสั่งพิเศษแบบ “ทำสิ่งนี้” เช่น เก็บกุญแจ เปิดประตู',
    bullets: [
      'บางด่านต้องเรียกฟังก์ชันตามลำดับ เช่น pickUpKey() ก่อน unlockDoor()',
      'บางด่านต้อง define ก่อน call เช่น define jump() แล้วค่อย call jump()',
      'อ่าน Mission แล้วจับคู่ “กริยา” กับ block ให้ครบ',
    ],
    blocks: ['pickUpKey()', 'unlockDoor()', 'define jump()', 'call jump()', 'หยุด'],
    example: ['pickUpKey()', 'unlockDoor()', 'เดินตรง', 'หยุด'],
  },
  {
    id: 'return',
    title: 'Return / ส่งค่าระหว่างฟังก์ชัน',
    desc: 'ด่านสายคำนวณ: ฟังก์ชันหนึ่งคืนค่าให้อีกฟังก์ชันใช้',
    bullets: [
      'แนวคิด: calcDamage() คืนค่า แล้ว applyDamage() ใช้ค่านั้น',
      'ลำดับสำคัญ: เรียกตัวที่ “คำนวณ” ก่อนตัวที่ “นำไปใช้”',
    ],
    blocks: ['calcDamage()', 'applyDamage()', 'หยุด'],
    example: ['calcDamage()', 'applyDamage()', 'เก็บ flask', 'หยุด'],
  },
  {
    id: 'nested',
    title: 'Nested / หลายขั้นตอน',
    desc: 'งานที่ต้องทำต่อเนื่องหลายสเต็ป',
    bullets: [
      'เช่น openPath() → enterRoom() → หยุด',
      'จุดพลาดบ่อย: สลับลำดับ หรือข้ามขั้น',
    ],
    blocks: ['openPath()', 'enterRoom()', 'หยุด'],
    example: ['openPath()', 'enterRoom()', 'หยุด'],
  },
  {
    id: 'debug',
    title: 'Debug',
    desc: 'แก้บั๊กแบบเป็นขั้นตอน',
    bullets: [
      'แนวคิด: หาเจอ → แก้ → เดินต่อ',
      'ตัวอย่าง: findBug() → fixBug()',
    ],
    blocks: ['findBug()', 'fixBug()', 'หยุด'],
    example: ['findBug()', 'fixBug()', 'เดินตรง', 'หยุด'],
  },
  {
    id: 'try-catch',
    title: 'Try / Catch / Finally',
    desc: 'จัดการข้อผิดพลาด',
    bullets: [
      'แนวคิด: ลองทำ (try) → ถ้าพัง (catch) → ทำท้ายสุด (finally)',
      'ในเกมจะมาในรูป block ที่ต้องเรียงตามลำดับ',
    ],
    blocks: ['IF พบข้อผิดพลาด', 'try()', 'catch()', 'finally()', 'หยุด'],
    example: ['IF พบข้อผิดพลาด', 'try()', 'catch()', 'finally()', 'หยุด'],
  },
  {
    id: 'recursion',
    title: 'Recursion',
    desc: 'เรียกตัวเอง + มี base case หยุด',
    bullets: [
      'แนวคิด: มี “ฐาน” (base) เพื่อหยุดการเรียกซ้ำ',
      'เกมจะสื่อด้วย block อย่าง setBase … และ baseCase',
    ],
    blocks: ['setBase n=0', 'call solve(n)', 'baseCase', 'หยุด'],
    example: ['setBase n=0', 'call solve(n)', 'baseCase', 'หยุด'],
  },
  {
    id: 'algorithms',
    title: 'Algorithms (ขั้นสูง)',
    desc: 'โลกท้าย ๆ จะเจออัลกอริทึม',
    bullets: [
      'binarySearch(): ค้นหาค่าแบบแบ่งครึ่ง',
      'bubbleSort(): เรียงข้อมูลแบบสลับทีละคู่',
      'DFS(): สำรวจกราฟ/เส้นทาง',
      'ในเกมโฟกัสที่ “เรียง block ให้ถูกลำดับ” มากกว่ารายละเอียดโค้ดจริง',
    ],
    blocks: ['binarySearch()', 'bubbleSort()', 'DFS()', 'verify()', 'collectAll()', 'หยุด'],
    example: ['binarySearch()', 'unlock()', 'เดินตรง', 'หยุด'],
  },
  // {
  //   id: 'hint-stars',
  //   title: 'Hint + ดาว + รางวัล',
  //   desc: 'ทำความเข้าใจผลของการใช้ Hint ต่อการได้ดาว',
  //   bullets: [
  //     'ใช้ Hint ได้เมื่อ Hint > 0 และ HP มากกว่า 1',
  //     'ใช้ Hint จะเสีย -1 Hint และ -1 ❤️',
  //     'ถ้าใช้ Hint ในด่านนั้น จะไม่ได้ 3 ดาว (อย่างน้อยเป็น 2 ดาว)',
  //     'รางวัล Gems จะขึ้นกับจำนวนดาวที่ได้',
  //   ],
  // },
];

export const LogicProgrammingGuide: React.FC = () => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return SECTIONS;
    return SECTIONS.filter((s) => {
      const hay = [s.title, s.desc, ...(s.bullets || []), ...(s.blocks || [])].join(' ').toLowerCase();
      return hay.includes(t);
    });
  }, [q]);

  return (
    <div>
      <div
        className="text-sm font-black tracking-widest text-center text-white p-4 rounded-xl mb-3"
        style={{ fontFamily: "'Orbitron', monospace", background: 'linear-gradient(135deg,#7F77DD,#D4537E)' }}
      >
        🧠 คู่มือ Logic
      </div>

      <div className="mb-3 flex gap-2 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา: IF, LOOP, recursion, binarySearch..."
          className="flex-1 min-w-[220px] px-3 py-2 rounded-[12px] text-xs outline-none"
          style={{
            background: 'rgba(7,7,26,.6)',
            border: '1px solid rgba(127,119,221,.22)',
            color: '#e8e4ff',
          }}
        />
        <button
          onClick={() => setQ('')}
          className="px-3 py-2 rounded-[12px] text-xs font-medium"
          style={{ background: 'rgba(127,119,221,.08)', border: '1px solid rgba(127,119,221,.22)', color: '#AFA9EC' }}
        >
          ล้างค้นหา
        </button>
      </div>

      {filtered.map((s) => (
        <div
          key={s.id}
          className="rounded-[14px] p-3.5 mb-3"
          style={{ background: 'rgba(13,13,43,0.85)', border: '1px solid rgba(127,119,221,.22)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium mb-1.5" style={{ color: '#AFA9EC' }}>
                {s.title}
              </div>
              <div className="text-xs mb-2" style={{ color: '#9490c0' }}>
                {s.desc}
              </div>
            </div>
          </div>

          <ul className="text-xs leading-relaxed pl-5 list-disc" style={{ color: '#9490c0' }}>
            {s.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          {(s.blocks && s.blocks.length > 0) && (
            <div className="mt-2.5">
              <div className="text-[10px] tracking-widest mb-1.5" style={{ fontFamily: "'Orbitron', monospace", color: '#5a5880' }}>
                BLOCKS ที่มักเจอ
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.blocks.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 rounded-lg text-[11px]"
                    style={{ background: 'rgba(127,119,221,.08)', border: '1px solid rgba(127,119,221,.18)', color: '#e8e4ff' }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(s.example && s.example.length > 0) && (
            <div className="mt-2.5">
              <div className="text-[10px] tracking-widest mb-1.5" style={{ fontFamily: "'Orbitron', monospace", color: '#5a5880' }}>
                ตัวอย่างลำดับ
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.example.map((b, i) => (
                  <span
                    key={b + i}
                    className="px-2.5 py-1 rounded-lg text-[11px]"
                    style={{ background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.22)', color: '#9FE1CB' }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-xs p-3 rounded-xl text-center" style={{ color: '#9490c0', border: '1px solid rgba(127,119,221,.22)' }}>
          ไม่พบหัวข้อที่ค้นหา
        </div>
      )}
    </div>
  );
};

