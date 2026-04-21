'use client';

import { useCallback, useEffect, useState } from 'react';

type HandbookSection = 'html' | 'css' | 'js' | 'python' | 'games';

const SECTIONS: { id: HandbookSection; label: string; short: string }[] = [
    { id: 'html', label: 'HTML พื้นฐาน', short: 'HTML' },
    { id: 'css', label: 'CSS พื้นฐาน', short: 'CSS' },
    { id: 'js', label: 'JavaScript พื้นฐาน', short: 'JS' },
    { id: 'python', label: 'Python พื้นฐาน', short: 'Py' },
    { id: 'games', label: 'วิธีเล่นแต่ละเกม', short: 'เกม' },
];

const GAME_GUIDES: { icon: string; title: string; lines: string[] }[] = [
    {
        icon: '🏊',
        title: '1 — HTML Structure (ว่ายน้ำ)',
        lines: [
            'เลื่อนตัวละครเก็บฟองสบู่ให้ครบตามเป้า จากนั้นจะเข้าโหมดคำถาม',
            'ตอบคำถาม HTML ให้ถูกเพื่อเก็บคะแนน — ผิดจะโดนสตั้น/เสียจังหวะ',
            'ปุ่มกระดิ่ง = เปิด/ปิดเสียง BGM',
        ],
    },
    {
        icon: '⚽',
        title: '2 — HTML Input (ฟุตบอล)',
        lines: [
            'อ่านโจทย์แล้วเลือกแท็กหรือแอตทริบิวต์ที่ถูกต้อง',
            'ตอบครบตามเงื่อนไขด่านเพื่อจบและบันทึกเวลา',
        ],
    },
    {
        icon: '🏃‍♂️',
        title: '3 — CSS Styling (ฮัลด์)',
        lines: [
            'กระโดดข้ามสิ่งกีดขณะเลือกคำตอบ CSS ที่ถูก',
            'ใช้จังหวะกระโดดให้พ้น obstacle และตอบให้ครบ',
        ],
    },
    {
        icon: '🥊',
        title: '4 — CSS Quiz / Boxing',
        lines: [
            'ตอบคำถาม CSS ภายในเวลา — ถูกแล้วตัวละครจะชก CPU และลด HP ฝั่งตรงข้าม',
            'ถ้าชนะ HP แต่เคยตอบผิดในด่านนั้น ระบบจะไม่ให้ “ผ่านด่านไปต่อ” จนกว่าจะถูกทุกข้อในรอบนั้น',
            'กด “ชก!” เพื่อเริ่ม — จบแล้วใช้ปุ่มเล่นอีกครั้ง / กลับ Dashboard ตามที่แสดง',
        ],
    },
    {
        icon: '🔫',
        title: '5 — JS Function (ดวลปืน)',
        lines: [
            'อ่านคำถาม JavaScript แล้วเลือกคำตอบ',
            'มีเฟสเล็ง/ยิงและเอฟเฟกต์เสียง — ใช้ปุ่มปิดเสียงได้ตามหน้าเกม',
        ],
    },
    {
        icon: '🤖',
        title: '6 — LOGIC QUEST (JS Logic)',
        lines: [
            'ลากเรียงบล็อกคำสั่งให้ตรงกับเฉลยของด่าน แล้วกด Run',
            'มีมินิเกมเรียงบล็อกแยก — เรียงลำดับให้ตรงกับโจทย์',
            'สำรวจแผนที่/HP/เก็บของตาม mission ของแต่ละเวิร์ล',
        ],
    },
    {
        icon: '🏐',
        title: '7 — Python Variables (วอลเลย์บอล)',
        lines: [
            'ตอบคำถาม Python ให้ถูกเพื่อทำคะแนนในแมตช์',
            'ควบคุมเสียง/จังหวะจาก UI ของด่าน — เล่นจนครบเงื่อนไขชนะด่าน',
        ],
    },
    {
        icon: '🏋️‍♀️',
        title: '8 — Python Functions (ยกน้ำหนัก)',
        lines: [
            'กดตามจังหวะและตอบคำถามฟังก์ชัน/โค้ด Python',
            'โฟกัสที่คำถามและการจับเวลาของด่าน',
        ],
    },
];

function SectionHtml() {
    return (
        <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm leading-relaxed">
            <li><strong className="text-white">แท็ก</strong> ห่อเนื้อหา เช่น <code className="text-sunny/90">&lt;p&gt;</code>, <code className="text-sunny/90">&lt;section&gt;</code></li>
            <li><strong className="text-white">แอตทริบิวต์</strong> ใส่ในแท็กเปิด เช่น <code className="text-sunny/90">class</code>, <code className="text-sunny/90">id</code>, <code className="text-sunny/90">href</code></li>
            <li><strong className="text-white">โครงสร้าง</strong> หัวเรื่อง <code className="text-sunny/90">h1–h6</code>, รายการ <code className="text-sunny/90">ul/ol/li</code>, ลิงก์ <code className="text-sunny/90">a</code></li>
            <li><strong className="text-white">ฟอร์ม</strong> <code className="text-sunny/90">input</code>, <code className="text-sunny/90">button</code>, <code className="text-sunny/90">label</code> — เชื่อมกับคำถามในเกม HTML Input</li>
        </ul>
    );
}

function SectionCss() {
    return (
        <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm leading-relaxed">
            <li><strong className="text-white">เลือกตัวที่ถูก</strong> (selector) ให้ตรงกับองค์ประกอบที่ต้องการ style</li>
            <li><strong className="text-white">Box model</strong> margin / padding / border — มักออกเป็นตัวเลือกในคำถาม</li>
            <li><strong className="text-white">Flexbox</strong> <code className="text-sunny/90">display:flex</code>, <code className="text-sunny/90">justify-content</code>, <code className="text-sunny/90">align-items</code>, <code className="text-sunny/90">flex-direction</code></li>
            <li><strong className="text-white">Grid / Animation</strong> อาจโผล่ในด่าน Boxing หรือ Styling — อ่านตัวเลือกให้ครบก่อนกด</li>
        </ul>
    );
}

function SectionJs() {
    return (
        <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm leading-relaxed">
            <li><strong className="text-white">ตัวแปร</strong> <code className="text-sunny/90">let</code>, <code className="text-sunny/90">const</code>, ประเภทข้อมูลพื้นฐาน</li>
            <li><strong className="text-white">ฟังก์ชัน</strong> ประกาศ เรียกใช้ พารามิเตอร์ และค่าที่ return</li>
            <li><strong className="text-white">เงื่อนไข</strong> <code className="text-sunny/90">if / else</code> และลูป <code className="text-sunny/90">for</code></li>
            <li><strong className="text-white">อาร์เรย์ / อ็อบเจ็กต์</strong> การเข้าถึงสมาชิก — มักใช้ในคำถามดวลปืนและ Logic</li>
        </ul>
    );
}

function SectionPython() {
    return (
        <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm leading-relaxed">
            <li><strong className="text-white">ตัวแปรและชนิดข้อมูล</strong> ตัวเลข สตริง บูลีน</li>
            <li><strong className="text-white">ฟังก์ชัน</strong> <code className="text-sunny/90">def</code>, พารามิเตอร์, <code className="text-sunny/90">return</code></li>
            <li><strong className="text-white">ลิสต์ / ดิกชันนารี</strong> การอ่านค่าและการแก้ไขเบื้องต้น</li>
            <li><strong className="text-white">โอเปอเรเตอร์</strong> เปรียบเทียบและตรรกะพื้นฐานที่ใช้ในคำถามวอลเลย์บอลและยกน้ำหนัก</li>
        </ul>
    );
}

function SectionGames() {
    return (
        <div className="space-y-5">
            {GAME_GUIDES.map((g) => (
                <div
                    key={g.title}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                    <p className="font-[var(--font-display)] font-bold text-white text-sm mb-2 flex items-center gap-2">
                        <span className="text-lg">{g.icon}</span>
                        {g.title}
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-white/75 text-xs sm:text-sm">
                        {g.lines.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export function PlayerHandbook() {
    const [open, setOpen] = useState(false);
    const [section, setSection] = useState<HandbookSection>('games');

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, close]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title="เปิดคู่มือ Code Land"
                className="group flex flex-col items-center gap-1 rounded-xl border border-amber-800/50 bg-gradient-to-b from-amber-950/80 to-[#1a1208] px-2.5 py-2 shadow-lg shadow-black/40 transition hover:border-amber-500/50 hover:shadow-amber-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
                <span className="text-2xl leading-none drop-shadow-md" aria-hidden>📖</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100/90">คู่มือ</span>
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="handbook-title"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                        aria-label="ปิดคู่มือ"
                        onClick={close}
                    />
                    <div className="relative z-10 flex h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1f1814] via-[#141018] to-[#0c0a10] shadow-2xl shadow-black/60">
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 bg-black/20">
                            <h2 id="handbook-title" className="font-[var(--font-display)] text-lg font-bold text-amber-100 flex items-center gap-2">
                                <span aria-hidden>📔</span>
                                สมุดคู่มือ Code Land
                            </h2>
                            <button
                                type="button"
                                onClick={close}
                                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition"
                            >
                                ปิด
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
                            <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-2 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r sm:overflow-y-auto">
                                {SECTIONS.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setSection(s.id)}
                                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-xs font-semibold transition sm:text-[11px] ${
                                            section === s.id
                                                ? 'bg-amber-600/25 text-amber-100 border border-amber-500/40'
                                                : 'text-white/55 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </nav>
                            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                                {section === 'html' && <SectionHtml />}
                                {section === 'css' && <SectionCss />}
                                {section === 'js' && <SectionJs />}
                                {section === 'python' && <SectionPython />}
                                {section === 'games' && <SectionGames />}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
