// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component: HTMLInput_2_1 (Stage 2 - Input Types Quiz Game)
// Purpose: อธิบายให้ผู้เล่นเข้าใจเกี่ยวกับ input types, HTML tags และ attributes ต่างๆ
// Gameplay: ตอบคำถามให้ถูกติดต่อ 5 ข้อเพื่อให้จบเกม หากเวลาหมดหรือตอบผิด จะรีเซ็ต
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"use client"; // ← ใช้โค้ด Client Component ของ Next.js (ใช้ hooks และ interactivity)

// ↓ นำเข้า React hooks ที่จำเป็นสำหรับการจัดการ state และ side effects
import { useState, useCallback, useRef, useEffect } from "react";
import type { StageScorePayload } from "@/lib/utils/score";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERFACES & TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ กำหนด props ที่ Stage Component จะรับเข้ามา
interface StageProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

// ↓ โครงสร้างของคำถามแต่ละข้อ
interface Question {
  q: string; // ← ข้อความของคำถาม
  ans: string[]; // ← อาเรย์ของตัวเลือกคำตอบ 4 ตัว
  c: number; // ← ดัชนี (index) ของคำตอบที่ถูกต้อง (0-3)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUESTION POOL & CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ โปลของคำถามทั้งหมด 24 ข้อ (จะถูกสุ่มเลือก 5 ข้อในแต่ละเกม)
// ↓ โปลของคำถามทั้งหมด 37 ข้อ ซ่อมแซมแล้ว (จะถูกสุ่มเลือก 5 ข้อในแต่ละเกม)
const QUESTION_POOL: Question[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // กลุ่มคำถาม: Input Types (12 ข้อ) - เกี่ยวกับ HTML <input> element types ต่างๆ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  { q: 'input type ใดใช้รับ "อีเมล"?',
    ans: ["type=\"email\"", "type=\"text\"", "type=\"tel\"", "type=\"url\""], 
    c: 0 }, // ← คำตอบถูก: index 0 = type="email"
  
  { q: 'input type ใดใช้รับ "เบอร์โทร"?',
    ans: ["type=\"number\"", "type=\"email\"", "type=\"tel\"", "type=\"text\""], 
    c: 0 }, // ← คำตอบถูก: index 0 = type="tel"
  
  { q: 'input type ใดสร้าง "ช่องติ๊กเลือก"?',
    ans: ["type=\"radio\"", "type=\"select\"", "type=\"check\"", "type=\"checkbox\""], 
    c: 3 }, // ← คำตอบถูก: index 3 = type="checkbox"
  
  { q: 'input type ใดใช้เลือกแค่ตัวเดียวจากกลุ่ม?',
    ans: ["type=\"checkbox\"", "type=\"radio\"", "type=\"select\"", "type=\"option\""], 
    c: 1 }, // ← คำตอบถูก: index 1 = type="radio"
  
  { q: 'input type ใดใช้รับ "ตัวเลข"?',
    ans: ["type=\"digit\"", "type=\"int\"", "type=\"number\"", "type=\"count\""], 
    c: 2 }, // ← คำตอบถูก: index 2 = type="number"
  
  { q: 'input type ใดสร้าง "ปุ่ม Submit"?',
    ans: ["type=\"send\"", "type=\"button\"", "type=\"go\"", "type=\"submit\""], 
    c: 3 }, // ← คำตอบถูก: index 3 = type="submit"
  
  { q: 'input type ใดซ่อน "รหัสผ่าน"?',
    ans: ["type=\"hide\"", "type=\"secret\"", "type=\"password\"", "type=\"text\""], 
    c: 2 }, // ← คำตอบถูก: type="password"
  
  { q: 'input type ใดให้เลือก "ไฟล์"?',
    ans: ["type=\"upload\"", "type=\"file\"", "type=\"attach\"", "type=\"doc\""], 
    c: 1 }, // ← คำตอบถูก: index 1 = type="file"
  
  { q: 'input type ใดใช้รับ "URL เว็บไซต์"?',
    ans: ["type=\"link\"", "type=\"href\"", "type=\"src\"", "type=\"url\""], 
    c: 3 }, // ← คำตอบถูก: index 3 = type="url"
  
  { q: 'input type ใดสร้าง "Slider แถบเลื่อน"?',
    ans: ["type=\"range\"", "type=\"slide\"", "type=\"bar\"", "type=\"drag\""], 
    c: 0 }, // ← คำตอบถูก: index 0 = type="range"
  
  { q: 'input type ใดให้เลือก "สี"?',
    ans: ["type=\"palette\"", "type=\"hue\"", "type=\"color\"", "type=\"rgb\""], 
    c: 2 }, // ← คำตอบถูก: type="color"
  
  { q: 'input type ใดใช้เลือก "วันที่"?',
    ans: ["type=\"calendar\"", "type=\"day\"", "type=\"date\"", "type=\"time\""], 
    c: 2 }, // ← คำตอบถูก:type="date"

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // กลุ่มคำถาม: HTML Tags (25 ข้อ) - เกี่ยวกับ HTML elements ต่างๆ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  { q: "แท็กใดใช้สร้างเส้นคั่นเนื้อหาใน HTML?",
    ans: ["<h1>", "<hr>", "<a>", "<p>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <hr>
  
  { q: "แท็กใดใช้สร้างกล่องจัดโครงสร้าง Layout?",
    ans: ["<img>", "<a>", "<span>", "<div>"], 
    c: 3 }, // ← คำตอบถูก: index 3 = <div>
  
  { q: "แท็กใดใช้ครอบข้อความสั้นๆ ภายในบรรทัด?",
    ans: ["<img>", "<span>", "<pic>", "<a>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <span>

  { q: "แท็กใดใช้เป็นหัวข้อใหญ่?",
    ans: ["<h1>", "<li>", "<td>", "<h6>"], 
    c: 0 }, // ← คำตอบถูก: index 0 = <h1>

  { q: "แท็กใดคือปุ่มกด?",
    ans: ["<body>", "<button>", "<span>", "<head>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <button>

  { q: "แท็กใดใช้แสดงรูปภาพ?",
    ans: ["<pic>", "<photo>", "<img>", "<src>"], 
    c: 2 }, // ← คำตอบถูก: index 2 = <img>

  { q: "แท็กใดใช้สร้างลิงก์?",
    ans: ["<link>", "<a>", "<href>", "<nav>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <a>

  { q: "แท็กใดใช้สร้าง Dropdown เลือกตัวเลือก?",
    ans: ["<input>", "<option>", "<list>", "<select>"], 
    c: 3 }, // ← คำตอบถูก: index 3 = <select>

  { q: "แท็กใดใช้สร้างพื้นที่กรอกข้อความหลายบรรทัด?",
    ans: ["<input>", "<textbox>", "<textarea>", "<multiline>"], 
    c: 2 }, // ← คำตอบถูก: index 2 = <textarea>

  { q: "แท็กใดใช้จัดกลุ่ม input พร้อม label ใน form?",
    ans: ["<group>", "<fieldset>", "<section>", "<form>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <fieldset>

  { q: 'attribute ใดกำหนดให้ input "ห้ามว่าง"?',
    ans: ["needed", "must", "required", "notempty"], 
    c: 2 }, // ← คำตอบถูก: index 2 = required

  { q: 'attribute ใดกำหนด "ข้อความตัวอย่าง" ใน input?',
    ans: ["hint", "example", "label", "placeholder"], 
    c: 3 }, // ← คำตอบถูก: index 3 = placeholder
 
  { q: "แท็กใดคือรายการใน list?",
    ans: ["<li>", "<ol>", "<ul>", "<td>"], 
    c: 0 }, // ← คำตอบถูก: index 0 = <li>

  { q: "แท็กใดคือรายการแบบมีลำดับเลข?",
    ans: ["<li>", "<ol>", "<ul>", "<td>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <ol>

  { q: "แท็กใดคือรายการแบบจุด?",
    ans: ["<li>", "<tr>", "<ul>", "<ol>"], 
    c: 2 }, // ← คำตอบถูก: index 2 = <ul>

  { q: "แท็กใดคือตัวเอียง?",
    ans: ["<tr>", "<td>", "<h1>", "<em>"], 
    c: 3 }, // ← คำตอบถูก: index 3 = <em>

  { q: "แท็กใดคือส่วนหัวเว็ป?",
    ans: ["<header>", "<src>", "<footer>", "<body>"], 
    c: 0 }, // ← คำตอบถูก: index 0 = <header>

  { q: "แท็กใดคือส่วนท้ายเว็ป?",
    ans: ["<header>", "<src>", "<footer>", "<body>"], 
    c: 2 }, // ← คำตอบถูก: index 2 = <footer>

  { q: "แท็กใดคือใช้สร้างแถวในตาราง?",
    ans: ["<tr>", "<td>", "<h1>", "<em>"], 
    c: 0 }, // ← คำตอบถูก: index 0 = <tr>
 
  { q: "แท็กใดใช้สร้างช่องข้อมูลในตาราง?",
    ans: ["<tr>", "<td>", "<h1>", "<em>"], 
    c: 1 }, // ← คำตอบถูก: index 1 = <td>

  { q: "แท็กใดคือส่วนหัวเว็ป?",
    ans: ["<header>", "<src>", "<footer>", "<body>"], 
    c: 0 }, // ← คำตอบถูก: index 0 = <header>
 
  { q: "แท็กใดใช้เชื่อม CSS เข้ากับ HTML?",
    ans: ["<style>", "<script>", "<link>", "<body>"], 
    c: 0 }, // ← คำตอบถูก: index 0 = <link> หรือ <style>

  { q: "แท็กใดใช้เชื่อม JavaScript เข้ากับ HTML?",
    ans: ["<style>", "<link>", "<footer>", "<script>"], 
    c: 3 }, // ← คำตอบถูก: <script>
];

// ↓ จำนวนคำถามที่จะเล่นในแต่ละรอบ (ต้องตอบถูกติดต่อ 5 ข้อเพื่อให้จบ)
const TOTAL_Q = 5;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ ฟังก์ชันสำหรับสุ่มเลือกคำถาม 5 ข้อจากโปล 24 ข้อ
function pickQuestions(): Question[] {
  // ↓ สร้างสำเนาแล้วสุ่มลำดับ
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
  // ↓ คืนค่าเฉพาะ 5 ข้อแรก
  return shuffled.slice(0, TOTAL_Q);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS & CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ อาเรย์ของทิศทางคำตอบ 4 ตัว (top-left, top-right, bottom-left, bottom-right)
const DIRS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

// ↓ Type เพื่อแทนที่ทิศทางใดทิศทางหนึ่งจากอาเรย์ DIRS
type Dir = (typeof DIRS)[number]; // ← จะเป็น "top-left" | "top-right" | "bottom-left" | "bottom-right"

// ↓ State type สำหรับตำแหน่งผู้รักษาประตู (keeper)
type KeeperState = "idle" | "left" | "right" | "top-left" | "top-right"; // ← สามารถอยู่ในตำแหน่งเหล่านี้

// ↓ ระยะเวลาสูงสุดของตัวจับเวลา (12 วินาที)
const TIMER_MAX = 12;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KEEPER COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ Component สำหรับแสดงผู้รักษาประตู (Chibi-style pixel art)
function ChibiKeeper({ state }: { state: KeeperState }) {
  // ↓ กำหนดตำแหน่งและการหมุนของผู้รักษาตามสถานะ
  const pos: React.CSSProperties =
    state === "left" // ← ถ้าอยู่ซ้าย ให้หมุนซ้าย -25 องศา
      ? { left: "18%", right: "auto", marginLeft: 0, marginRight: 0, transform: "rotate(-25deg)" }
      : state === "right" // ← ถ้าอยู่ขวา ให้หมุนขวา +25 องศา
        ? { left: "auto", right: "18%", marginLeft: 0, marginRight: 0, transform: "rotate(25deg)" }
        : state === "top-left" // ← ถ้าอยู่บนซ้าย ให้หมุนและเลื่อนขึ้น -45 องศา
          ? { left: "18%", right: "auto", marginLeft: 0, marginRight: 0, transform: "rotate(-45deg) translateY(-60px)" }
          : state === "top-right" // ← ถ้าอยู่บนขวา ให้หมุนและเลื่อนขึ้น +45 องศา
            ? { left: "auto", right: "18%", marginLeft: 0, marginRight: 0, transform: "rotate(45deg) translateY(-60px)" }
            : { left: 0, right: 0, marginLeft: "auto", marginRight: "auto" }; // ← ถ้า idle ให้อยู่ตรงกลาง

  return (
    <div // ← Container หลักของผู้รักษา
      style={{
        position: "absolute", // ← ตำแหน่งสัมพัทธ์กับ parent
        top: 90, // ← เลื่อนลงมาจากด้านบน 90px
        bottom: "auto", // ← ไม่ใช้ bottom
        width: 40, // ← กว้าง 40px
        height: 64, // ← สูง 64px
        imageRendering: "pixelated", // ← แสดงผล pixel art แบบคมชัด
        transition: "transform 0.35s cubic-bezier(.4,1.4,.6,1), left 0.35s ease, right 0.35s ease", // ← ลูกอ้ด animation เมื่อเปลี่ยนตำแหน่ง
        zIndex: 2, // ← ชั้นการแสดง (อยู่เหนือสิ่งอื่น)
        animation: state === "idle" ? "keeperBob 1.4s ease-in-out infinite" : "none", // ← หากอยู่ idle ให้ bob ขึ้นลง
        ...pos, // ← ใช้Style ตำแหน่งที่คำนวณแล้ว
      }}
    >
      {/* Pixel art body structure */}
      <div style={{ width: 40, height: 64, position: "relative" }}>
        {/* Head - brown hair */}
        <div style={{ position: "absolute", top: 0, left: 6, width: 28, height: 8, background: "#5c3a1e", border: "2px solid #3a2010" }} />
        {/* Face - skin tone */}
        <div style={{ position: "absolute", top: 0, left: 6, width: 28, height: 22, background: "#f5c5a3", border: "2px solid #8b5e3c" }} />
        {/* Hair band - yellow */}
        <div style={{ position: "absolute", top: 6, left: 6, width: 28, height: 4, background: "#f5c842", borderTop: "2px solid #d4a520" }} />
        {/* Left eye */}
        <div style={{ position: "absolute", top: 9, left: 12, width: 4, height: 4, background: "#1a1a2e" }} />
        {/* Right eye */}
        <div style={{ position: "absolute", top: 9, left: 24, width: 4, height: 4, background: "#1a1a2e" }} />
        {/* Mouth - smile */}
        <div style={{ position: "absolute", top: 15, left: 16, width: 8, height: 2, background: "#c0786e" }} />
        {/* Chest - orange shirt */}
        <div style={{ position: "absolute", top: 22, left: 4, width: 32, height: 20, background: "#e05a00", border: "2px solid #a03c00" }} />
        {/* Left arm */}
        <div style={{ position: "absolute", top: 24, left: 0, width: 6, height: 10, background: "#fff", border: "2px solid #aaa" }} />
        {/* Right arm */}
        <div style={{ position: "absolute", top: 24, right: 0, width: 6, height: 10, background: "#fff", border: "2px solid #aaa" }} />
        {/* Lower body - red pants */}
        <div style={{ position: "absolute", top: 40, left: 4, width: 32, height: 12, background: "#c00000", border: "2px solid #800000" }} />
        {/* Left leg - orange sock */}
        <div style={{ position: "absolute", top: 52, left: 6, width: 10, height: 8, background: "#e05a00", border: "2px solid #a03c00" }} />
        {/* Right leg - orange sock */}
        <div style={{ position: "absolute", top: 52, left: 22, width: 10, height: 8, background: "#e05a00", border: "2px solid #a03c00" }} />
        {/* Left shoe - black */}
        <div style={{ position: "absolute", top: 58, left: 4, width: 12, height: 6, background: "#222", border: "1px solid #555" }} />
        {/* Right shoe - black */}
        <div style={{ position: "absolute", top: 58, left: 22, width: 12, height: 6, background: "#222", border: "1px solid #555" }} />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POSITION & TARGET CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ ตำแหน่งของลูกบอลคำตอบ 4 ลูก (หน่วยเป็น pixel)
const ANS_POS: React.CSSProperties[] = [
  { top: 10, left: 100 }, // ← บอล 0: บนซ้าย
  { top: 10, left: 320 }, // ← บอล 1: บนขวา
  { top: 110, left: 100 }, // ← บอล 2: ล่างซ้าย
  { top: 110, left: 320 }, // ← บอล 3: ล่างขวา
];

// ↓ ตำแหน่งเป้าหมายการยิงลูกบอล สำหรับแต่ละทิศทาง
const SHOT_TARGET: Record<Dir, { leftOffset: number; bottomTarget: number }> = {
  "top-left": { leftOffset: -120, bottomTarget: 280 }, // ← ถ้าคลิกบนซ้าย บอลจะยิงไปทางซ้าย
  "top-right": { leftOffset: 120, bottomTarget: 280 }, // ← ถ้าคลิกบนขวา บอลจะยิงไปทางขวา
  "bottom-left": { leftOffset: -120, bottomTarget: 185 }, // ← ถ้าคลิกล่างซ้าย บอลจะยิงไปทางซ้াย (ต่ำกว่า)
  "bottom-right": { leftOffset: 120, bottomTarget: 185 }, // ← ถ้าคลิกล่างขวา บอลจะยิงไปทางขวา (ต่ำกว่า)
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT: HTMLInput_2_1
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ↓ Component หลักของขั้นที่ 2: Input Types Quiz
export function HTMLInput_2_1({ onComplete, isActive }: StageProps) {
  // ← รับ props: onComplete (เรียกเมื่อจบเกม) และ isActive (ตรวจสอบว่าใช้งาน)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE HOOKS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ Ref เพื่อเก็บ reference ของ HTMLAudioElement (เล่นเสียงตอบถูก)
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);

  // ↓ State: อาเรย์ของคำถาม 5 ข้อที่สุ่มมา
  const [questions, setQuestions] = useState<Question[]>(() => pickQuestions());

  // ↓ State: ดัชนีของคำถามปัจจุบัน (0-4)
  const [cur, setCur] = useState(0);

  // ↓ State: จำนวนคำตอบที่ถูกติดต่อแล้ว (0-5 หรือจบเกม)
  const [passed, setPassed] = useState(0);

  // ↓ State: ตำแหน่งปัจจุบันของผู้รักษา
  const [keeper, setKeeper] = useState<KeeperState>("idle");

  // ↓ State: ทิศทางการยิงลูกบอล (null หรือหนึ่งใน DIRS)
  const [shotDir, setShotDir] = useState<Dir | null>(null);

  // ↓ State: flash effect (good/bad) เมื่อตอบถูก/ผิด
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);

  // ↓ State: ตรวจสอบว่าเกมกำลังเล่นอยู่หรือแอนิเมชั่นกำลังเรียกใช้
  const [busy, setBusy] = useState(false);

  // ↓ State: เวลาที่เหลือ (นับถอยหลัง จาก 12 ถึง 0)
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);

  // ↓ Ref: เก็บ reference ของ setInterval เพื่อเหยื่อ/ยกเลิก
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPUTED VALUES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ ดึงคำถามปัจจุบัน (หรือใช้คำถามแรกถ้าไม่มี)
  const q = questions[cur] ?? questions[0];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIMER FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ ฟังก์ชัน: หยุดตัวจับเวลา
  const stopTimer = useCallback(() => {
    // ← ตรวจสอบว่า timerRef มีค่า
    if (timerRef.current) {
      clearInterval(timerRef.current); // ← ยกเลิก interval
      timerRef.current = null; // ← ตั้งค่าเป็น null
    }
  }, []);

  // ↓ ฟังก์ชัน: เริ่มตัวจับเวลา
  const startTimer = useCallback(() => {
    stopTimer(); // ← หยุดตัวจับเวลาเดิมก่อน (ป้องกัน double)
    setTimeLeft(TIMER_MAX); // ← รีเซ็ต timeLeft เป็น 12
    timerRef.current = setInterval(() => { // ← เริ่ม interval ใหม่
      setTimeLeft((t) => { // ← อัปเดต timeLeft ทีละ 1
        if (t <= 1) { // ← ถ้าเวลาหมด
          clearInterval(timerRef.current!); // ← หยุด interval
          timerRef.current = null; // ← ตั้งค่าเป็น null
          return 0; // ← คืนค่า 0
        }
        return t - 1; // ← ลดเวลา 1 วินาที
      });
    }, 1000); // ← ให้ interval ทำงานทุก 1 วินาที
  }, [stopTimer]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIMER EFFECT: Handle timeout
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ Ref: เก็บค่า timeLeft ที่ผ่านมา (เพื่อตรวจสอบว่าเวลาพึ่งหมดเมื่อไหร่)
  const prevTimeLeft = useRef(TIMER_MAX);

  // ↓ Effect: เมื่อ timeLeft เปลี่ยน
  useEffect(() => {
    // ← ตรวจสอบเงื่อนไข: เวลาหมด และ เวลาที่ผ่านมาไม่ได้หมด และ ไม่ทำภารกิจ และ สเตจใช้งาน
    if (timeLeft === 0 && prevTimeLeft.current !== 0 && !busy && isActive) {
      // ↓ หยุดตัวจับเวลา
      stopTimer();
      // ↓ ตั้ง busy เป็น true (ห้ามปรับปรุง state)
      setBusy(true);
      // ↓ แสดง flash "bad" เพื่อบ่งบอกว่าหมดเวลา
      setFlash("bad");
      // ↓ ลบ flash หลังจาก 380ms
      setTimeout(() => setFlash(null), 380);
      // ↓ หลังจาก 950ms รีเซ็ตเกม
      setTimeout(() => {
        setShotDir(null); // ← ลบ shotDir
        setKeeper("idle"); // ← ตั้ง keeper เป็น idle
        setQuestions(pickQuestions()); // ← เลือกคำถาม 5 ข้อใหม่
        setCur(0); // ← ตั้ง cur เป็น 0
        setPassed(0); // ← ตั้ง passed เป็น 0 (รีเซ็ต)
        setBusy(false); // ← ตั้ง busy เป็น false
        startTimer(); // ← เริ่มตัวจับเวลา
      }, 950);
    }
    prevTimeLeft.current = timeLeft; // ← อัปเดต prevTimeLeft
  }, [timeLeft, busy, isActive, stopTimer, startTimer]);

  // ↓ Effect: เมื่อ questions หรือ isActive เปลี่ยน
  useEffect(() => {
    if (!isActive) { // ← ถ้าสเตจไม่ใช้งาน
      stopTimer(); // ← หยุดตัวจับเวลา
      return; // ← ออกจาก effect
    }
    startTimer(); // ← ถ้าใช้งาน ให้เริ่มตัวจับเวลา
    return stopTimer; // ← Cleanup: หยุดตัวจับเวลาเมื่อ unmount
  }, [questions, isActive, startTimer, stopTimer]); // ← Dependencies

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLASH EFFECT FUNCTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ ฟังก์ชัน: แสดง flash effect (green สำหรับถูก, red สำหรับผิด)
  const triggerFlash = (type: "good" | "bad") => {
    // ← รับ type: "good" หรือ "bad"
    setFlash(type); // ← ตั้ง flash
    setTimeout(() => setFlash(null), 380); // ← ลบ flash หลังจาก 380ms
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN HANDLER: PICK (Answer selection)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ ฟังก์ชัน: เมื่อผู้เล่นคลิกตัวเลือกคำตอบ
  const pick = useCallback(
    (idx: number, dir: Dir) => {
      // ← idx: ดัชนีของคำตอบ (0-3), dir: ทิศทาง (top-left, etc.)
      if (busy || !isActive) return; // ← ถ้าเล่นอยู่หรือไม่ใช้งาน ให้ออก
      stopTimer(); // ← หยุดตัวจับเวลา
      setBusy(true); // ← ตั้ง busy เป็น true

      const correct = q.c; // ← ดึงดัชนีของคำตอบที่ถูก

      // ↓ ฟังก์ชันช่วย: แปลงทิศทางคำตอบเป็นตำแหน่ง keeper
      const dirToKeeper = (d: Dir): KeeperState => {
        // ← ถ้า top shots ให้ keeper jump ขึ้น, ถ้า bottom shots ให้ keeper อยู่ด้านข้าง
        if (d === "top-left") return "top-left"; // ← ถ้าคลิกบนซ้าย keeper ไปบนซ้าย
        if (d === "top-right") return "top-right"; // ← ถ้าคลิกบนขวา keeper ไปบนขวา
        return d === "bottom-left" ? "left" : "right"; // ← ถ้าคลิกล่างซ้าย keeper ไปซ้าย, ล่างขวา ไปขวา
      };

      // ↓ ฟังก์ชันช่วย: ได้ตำแหน่ง keeper แบบตรงข้าม (left ↔ right)
      const oppositeKeeper = (d: Dir): KeeperState =>
        // ← ถ้า top-left หรือ bottom-left ให้ไปขวา, ไม่ก็ไปซ้าย
        d === "top-left" || d === "bottom-left" ? "right" : "left";

      if (idx === correct) {
        // ← ถ้าตอบถูก
        if (correctAudioRef.current) { // ← ถ้า ref มีค่า
          correctAudioRef.current.currentTime = 0; // ← รีเซ็ต position เสียง
          correctAudioRef.current.play(); // ← เล่นเสียง
        }
        setKeeper(oppositeKeeper(dir)); // ← ตั้ง keeper ตำแหน่งตรงข้าม
        setShotDir(dir); // ← เก็บทิศทาง (ใช้สำหรับแอนิเมชั่น)
        triggerFlash("good"); // ← แสดง green flash

        const newPassed = passed + 1; // ← เพิ่ม passed
        setPassed(newPassed);

        const next = cur + 1; // ← หาคำถามถัดไป
        if (newPassed >= TOTAL_Q || next >= questions.length) {
          // ← ถ้าตอบถูก 5 ข้อ หรือ สิ้นสุดโปลคำถาม
          setTimeout(() => onComplete?.({ correct: 5, total: 5 }), 950);
        } else {
          // ← ถ้ายังมีคำถามเหลือ
          setTimeout(() => { // ← หลังจาก 950ms
            setShotDir(null); // ← ลบ shotDir
            setKeeper("idle"); // ← ตั้ง keeper เป็น idle
            setCur(next); // ← ไปคำถามถัดไป
            setBusy(false); // ← ตั้ง busy เป็น false
            startTimer(); // ← เริ่มตัวจับเวลา
          }, 950);
        }
      } else {
        // ← ถ้าตอบผิด
        setKeeper(dirToKeeper(dir)); // ← ตั้ง keeper ตำแหน่งที่คลิก (ไม่รับ)
        setShotDir(dir); // ← เก็บทิศทาง
        triggerFlash("bad"); // ← แสดง red flash

        setTimeout(() => { // ← หลังจาก 950ms
          setShotDir(null); // ← ลบ shotDir
          setKeeper("idle"); // ← ตั้ง keeper เป็น idle
          setQuestions(pickQuestions()); // ← เลือกคำถาม 5 ข้อใหม่ (รีเซ็ต)
          setCur(0); // ← ตั้ง cur เป็น 0
          setPassed(0); // ← ตั้ง passed เป็น 0 (รีเซ็ตการนับ)
          setBusy(false); // ← ตั้ง busy เป็น false
          startTimer(); // ← เริ่มตัวจับเวลา
        }, 950);
      }
    },
    [busy, isActive, cur, passed, q, questions.length, stopTimer, startTimer, onComplete]
    // ← Dependencies: ค่าที่ใช้ในฟังก์ชัน
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPUTED VALUES FOR RENDERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ คำนวณเปอร์เซ็นต์สำหรับ timer bar (0-100%)
  const timerPct = (timeLeft / TIMER_MAX) * 100;

  // ↓ เลือกสีของ timer bar ตามเวลาเหลือ
  const timerColor =
    timeLeft > 7 ? "#4dff6e" : // ← มากกว่า 7 วิ: สีเขียว
    timeLeft > 4 ? "#f5e642" : // ← มากกว่า 4 วิ: สีเหลือง
    "#ff4444"; // ← 4 วิหรือน้อยกว่า: สีแดง

  // ↓ ดึงข้อมูลการยิงจาก SHOT_TARGET (ตำแหน่งเป้าหมาย)
  const shot = shotDir ? SHOT_TARGET[shotDir] : null;

  // ↓ คำนวณตำแหน่ง x ของลูกบอล
  const ballLeft = shot ? `calc(50% + ${shot.leftOffset}px)` : "50%";

  // ↓ คำนวณตำแหน่ง y ของลูกบอล
  const ballBottom = shot ? shot.bottomTarget : 24;

  // ↓ ความโปร่งใส: ถ้ากำลังยิง ให้ fade out
  const ballOpacity = shot ? 0 : 1;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INLINE STYLES OBJECT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ↓ Object ที่เก็บ inline styles ทั้งหมด (ป้องกันการสร้าง object ซ้ำๆ)
  const S = {
    game: {
      // ← Container หลักของเกม
      fontFamily: "'Press Start 2P', monospace", // ← Font pixel-style
      background: "#1a5c1a", // ← สีเขียวเทพพื้น
      width: "100%",
      maxWidth: 680, // ← ความกว้างสูงสุด 680px
      margin: "0 auto", // ← จัดตรงกลาง
      position: "relative" as const,
      overflow: "hidden" as const, // ← ซ่อนเนื้อหาที่เกินขอบ
      border: "4px solid #0d3d0d", // ← กรอบ pixel-style
      imageRendering: "pixelated" as const, // ← ปิด anti-aliasing
    },
    sky: {
      // ← พื้นหลัง (ท้องฟ้า)
      backgroundImage: "url('/images/bg.png')", // ← ใช้ background image
      backgroundSize: "cover", // ← ครอบปิดทั้งพื้นที่
      backgroundPosition: "center top", // ← จัดตำแหน่งบนสุด
      width: "100%",
      height: 350, // ← ความสูง 350px
      position: "relative" as const,
    },
    goalWrap: {
      // ← ส่วนประตู + ผู้รักษา + บอล
      position: "absolute" as const,
      top: 150, // ← เลื่อนลงมา 150px
      left: "50%", // ← จัดตรงกลาง
      transform: "translateX(-50%)",
      width: 430, // ← ความกว้าง 430px
      height: 280, // ← ความสูง 280px
      zIndex: 2, // ← ชั้นการแสดง
    },
    goalImg: {
      // ← รูปภาพประตู
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      width: "100%",
      imageRendering: "pixelated" as const,
      zIndex: 1, // ← ต่ำกว่าบอลคำตอบ
      pointerEvents: "none" as const, // ← ไม่รับ click event
    },
    bubble: {
      // ← ฟองคำถาม
      position: "absolute" as const,
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#f5e642", // ← สีเหลือง
      border: "4px solid #c4aa00",
      borderRadius: 12,
      padding: "10px 18px",
      fontSize: 13,
      color: "#1a1a1a", // ← ข้อความสีดำ
      lineHeight: 1.8,
      zIndex: 20,
      width: 360,
      textAlign: "center" as const,
      boxShadow: "3px 3px 0 #00000055", // ← เงา
      fontFamily: "'Noto Sans Thai', monospace", // ← Font Thai
    },
    field: {
      // ← พื้นหญ้านอก (สนาม)
      background: "#2d7a2d", // ← สีเขียว
      width: "100%",
      height: 80,
      position: "relative" as const,
      borderTop: "4px solid #fff",
      backgroundImage: // ← ลายเส้นศร
        "repeating-linear-gradient(90deg,#2d7a2d 0px,#2d7a2d 40px,#267026 40px,#267026 80px)",
    },
    hud: {
      // ← HUD (สถิติด้านล่าง)
      background: "#0d3d0d",
      padding: "10px 16px",
      borderTop: "3px solid #1a6e1a",
      display: "flex",
      flexDirection: "column" as const,
      gap: 6,
    },
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <>
      {/* ← Fragment เพื่อเพิ่ม <style> tag ไปด้วย */}
      <style>{`
        /* ← Import fonts จาก Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+Thai&display=swap');
        
        /* ← Animation: keeper bob ขึ้นลงตลอด */
        @keyframes keeperBob {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        
        /* ← Animation: บอลลอยขึ้นลงตลอด */
        @keyframes ballBob {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(-11px); }
        }
        
        /* ← Class: บอลคำตอบขณะ idle */
        .fans-ball {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.13s ease-out;
        }
        
        /* ← Hover effect: บอลเล็กขึ้น */
        .fans-ball:hover {
          transform: scale(1.15);
        }
        
        /* ← Animation: timer pulse เมื่อเวลาเหลือน้อย */
        @keyframes timerPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>

      {/* ← Container หลักของเกม */}
      <div style={S.game}>
        
        {/* ← Audio element สำหรับเล่นเสียงตอบถูก */}
        <audio ref={correctAudioRef} src="/sound/gameball.mp3" preload="auto" />

        {/* ← ส่วน Sky (ท้องฟ้า + ประตู + บอลคำตอบ + ผู้รักษา) */}
        <div style={S.sky}>
          
          {/* ← ดาวขนาดเล็กกระจายทั่วท้องฟ้า */}
          {[[9, 7], [6, 21], [13, 37], [5, 57], [16, 73], [8, 88], [21, 13], [19, 48], [24, 66]].map(([t, l], i) => (
            <div // ← ดาวแต่ละดวง
              key={i}
              style={{ position: "absolute", width: 2, height: 2, background: "#fff", top: `${t}%`, left: `${l}%` }}
            />
          ))}

          {/* ← Container ประตู + บอล + ผู้รักษา */}
          <div style={S.goalWrap}>

            {/* ← บอลคำตอบ 4 ลูก */}
            {[0, 1, 2, 3].map((i) => (
              <div // ← Container บอลแต่ละลูก
                key={i}
                style={{
                  position: "absolute",
                  zIndex: 4, // ← อยู่หน้าประตู
                  transform: "translate(-50%, -50%)", // ← จัดตรงกลางบอล
                  ...ANS_POS[i], // ← ตำแหน่งจาก ANS_POS
                }}
              >
                <div // ← Class ที่มี hover effect
                  className="fans-ball"
                  onClick={() => pick(i, DIRS[i])} // ← เมื่อคลิก เรียก pick() ส่ง idx และ ทิศทาง
                >
                  {/* ← รูปภาพบอล */}
                  <img
                    src="/images/ball.png"
                    alt={q.ans[i]} // ← alt text คือคำตอบ
                    width={56}
                    height={56}
                    style={{ imageRendering: "pixelated", display: "block" }}
                  />
                  
                  {/* ← ข้อความคำตอบใต้บอล */}
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace", // ← Font pixel
                      fontSize: 11, // ← ขนาด 11px
                      color: "#fff", // ← สีขาว
                      textAlign: "center" as const,
                      textShadow: "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000", // ← เงาสีดำรอบข้อความ
                      marginTop: 2,
                      maxWidth: 100, // ← ความกว้างสูงสุด 100px
                      lineHeight: 1.4,
                      fontWeight: "bold",
                    }}
                  >
                    {q.ans[i]} {/* ← แสดงข้อความคำตอบ */}
                  </div>
                </div>
              </div>
            ))}

            {/* ← Component ผู้รักษา */}
            <ChibiKeeper state={keeper} />

            {/* ← รูปประตู (อยู่หลังบอล) */}
            <img src="/images/goal.png" alt="goal" style={S.goalImg} />
          </div>

          {/* ← ฟองคำถาม */}
          <div style={S.bubble}>
            ข้อ {cur + 1}: {q.q} {/* ← แสดงหมายเลขข้อและคำถาม */}
          </div>

          {/* ← Timer bar ด้านบน */}
          <div
            style={{
              position: "absolute",
              top: 80, // ← เลื่อนลงมา 80px
              left: "50%",
              transform: "translateX(-50%)",
              width: 300,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: 8, // ← ระยะห่างระหว่าง element
            }}
          >
            {/* ← ตัวเลขแสดงเวลา */}
            <span
              style={{
                fontSize: 8,
                color: timerColor, // ← เปลี่ยนสีตามเวลา
                fontFamily: "'Press Start 2P', monospace",
                minWidth: 16,
                animation: timeLeft <= 3 ? "timerPulse 0.6s infinite" : "none", // ← pulse เมื่อเวลาเหลือน้อย
              }}
            >
              {timeLeft} {/* ← แสดงจำนวนวินาที */}
            </span>
            
            {/* ← Progress bar ของ timer */}
            <div
              style={{
                flex: 1,
                height: 8,
                background: "#0008", // ← สีพื้นหลัง
                border: "2px solid #fff4",
                borderRadius: 5,
                overflow: "hidden", // ← ซ่อนส่วนที่เกินขอบ
              }}
            >
              {/* ← Fill bar ที่ลดลงเรื่อยๆ */}
              <div
                style={{
                  height: "100%",
                  width: `${timerPct}%`, // ← เปลี่ยนความกว้างตามเวลา
                  background: timerColor,
                  transition: "width 0.25s linear, background 0.5s", // ← smooth animation
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        </div>

        {/* ← ส่วน Field (สนามหญ้า) */}
        <div style={S.field} />

        {/* ← ลูกบอลการเตะ (ยิงขึ้นไปทำประตู) */}
        <img
          src="/images/ball.png"
          alt="ball"
          style={{
            position: "absolute",
            left: ballLeft, // ← เปลี่ยนตำแหน่ง x
            transform: shot ? "translateX(-50%)" : undefined, // ← ปรับตำแหน่ง
            zIndex: 5,
            width: 66,
            imageRendering: "pixelated",
            transition: shot
              ? "bottom 0.55s cubic-bezier(.2,1,.5,1), left 0.55s cubic-bezier(.2,1,.5,1), opacity 0.45s" // ← animation เมื่อยิง
              : "none",
            bottom: ballBottom, // ← เปลี่ยนตำแหน่ง y
            opacity: ballOpacity, // ← fade out เมื่อยิง
            animation: shot ? "none" : "ballBob 1.2s ease-in-out infinite", // ← bob เมื่อ idle
          }}
        />

        {/* ← HUD (แสดงสถิติด้านล่าง) */}
        <div style={S.hud}>
          
          {/* ← บรรทัด 1: Stage progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 8, color: "#60c060", whiteSpace: "nowrap", fontFamily: "'Press Start 2P', monospace" }}>
              STAGE {/* ← ป้ายชื่อ */}
            </span>
            
            {/* ← Progress bar ของแต่ละข้อ */}
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {Array.from({ length: TOTAL_Q }, (_, i) => {
                // ← สร้าง 5 สี่เหลี่ยมตามจำนวนคำถาม
                const filled = i < passed; // ← ถ้าคำถามนี้ตอบถูกแล้ว
                const isCurrent = i === cur; // ← ถ้าเป็นคำถามปัจจุบัน
                return (
                  <div // ← Bar แต่ละอัน
                    key={i}
                    style={{
                      flex: 1,
                      height: 14,
                      background: filled ? "#f5e642" : isCurrent ? "#ffffff33" : "#ffffff11", // ← เปลี่ยนสีตามสถานะ
                      border: `2px solid ${filled ? "#c4aa00" : isCurrent ? "#ffffff66" : "#ffffff22"}`,
                      borderRadius: 3,
                      transition: "background 0.3s, border-color 0.3s",
                    }}
                  />
                );
              })}
            </div>
            
            {/* ← ตัวเลข passed/total */}
            <span style={{ fontSize: 8, color: "#a0ffa0", whiteSpace: "nowrap", fontFamily: "'Press Start 2P', monospace" }}>
              {passed}/{TOTAL_Q} {/* ← แสดง 0/5, 1/5, ... */}
            </span>
          </div>

          {/* ← บรรทัด 2: Question number & consecutive count */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#60c060", marginLeft: 4, fontFamily: "'Press Start 2P', monospace" }}>
              ข้อที่ {/* ← ป้ายชื่อ */}
            </span>
            <span style={{ fontSize: 10, color: "#f5e642", fontFamily: "'Press Start 2P', monospace" }}>
              {cur + 1} {/* ← แสดง 1, 2, 3, 4, 5 */}
            </span>
            <span style={{ fontSize: 10, color: "#4dff6e", marginLeft: 4, fontFamily: "'Noto Sans Thai', monospace" }}>
              : ตอบถูกติดต่อ {passed} ข้อ {/* ← แสดงจำนวนตอบถูกติดต่อ */}
            </span>
          </div>
        </div>

        {/* ← Flash effect (overlay สีเขียว/แดง) */}
        {flash && (
          <div // ← Overlay full-screen
            style={{
              position: "absolute",
              inset: 0, // ← ครอบปิด (top 0, left 0, right 0, bottom 0)
              pointerEvents: "none", // ← ไม่รับ click event
              zIndex: 30,
              background:
                flash === "good" ? "rgba(0,255,80,0.35)" : "rgba(255,0,0,0.38)", // ← สีเขียวถ้าถูก, แดงถ้าผิด
            }}
          />
        )}
      </div>
    </>
  );
}

// ↓ Export default เพื่อให้สามารถ import ได้ง่าย
export default HTMLInput_2_1;
