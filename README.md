# README: Code Land Game (`game-s`)

เอกสารนี้สรุปจาก **ซอร์สโค้ดใน workspace โปรเจคนี้เท่านั้น** (โฟลเดอร์แอปหลัก: `app/`, `components/`, `lib/`, `supabase/`, `public/`, `middleware.ts`) — **ไม่รวม** `node_modules/`, `.next/`  
ข้อความอ้างอิง trigger ฐานข้อมูลใน comment ของ `components/auth/RegisterForm.tsx` (**`handle_new_user`**) — **ไฟล์ SQL / migration ที่สร้าง trigger นี้ไม่พบในโค้ดที่ตรวจสอบ**

---

## 1. ภาพรวมโปรเจค

### โปรเจคนี้คืออะไร

- ชื่อแพ็กเกจ: **`game-s`** (`package.json`)
- ชื่อที่แสดงในเบราว์เซอร์ (metadata): **Code Land Game** (`app/layout.tsx` — `title`, `description`)
- ประเภท: เว็บแอป **Next.js (App Router)** แนวมินิเกม/แบบฝึกหัด HTML, CSS, JavaScript และเนื้อหาแบบ Python-สไตล์ ผ่านด่านที่ map เป็นคอมโพเนนต์ React
- ข้อมูลผู้ใช้และคะแนน: **Supabase** (Auth + ตาราง `profiles`, `global_scores`, `rooms`, `room_players`, `room_scores` ตามที่เรียกในโค้ด)
- สไตล์: **Tailwind CSS** (`package.json`, `app/globals.css`)
- ภาษา: **TypeScript**

### ผู้ใช้ทำอะไรได้ (จากหน้าและ flow ที่มีจริง)

| กิจกรรม | ตำแหน่งในโค้ด |
|---------|----------------|
| ดูหน้าแรงโปรโมท + ลิงก์ไป login / dashboard / leaderboard | `app/page.tsx` |
| ล็อกอิน (`signInWithPassword`) | `components/auth/LoginForm.tsx` → redirect `window.location.href = '/'` |
| สมัคร (`signUp` + metadata `username`, `role`) | `components/auth/RegisterForm.tsx` |
| แดชบอร์ดนักเรียน — เลือกด่านตามหมวด | `app/(student)/dashboard/page.tsx` → ลิงก์ `/game/{category}/{stageId}` |
| หน้าครู — สร้างห้อง | `app/(teacher)/teacher/page.tsx`, `components/room/CreateRoomForm.tsx` |
| เล่นด่านเดี่ยว | `app/game/[category]/[stageId]/page.tsx` |
| เข้าห้องด้วยรหัส | `app/game/room/[roomCode]/page.tsx` |
| ดู Leaderboard รวม | `app/leaderboard/page.tsx` + `components/leaderboard/GlobalLeaderboard.tsx` |

### Flow ของระบบ (สรุปจากโค้ด)

1. **Session / Role**: `middleware.ts` → `lib/supabase/middleware.ts` เรียก `getUser()` และถ้ามี user จะอ่าน `profiles.role` เพื่อ redirect `/login`, `/register`, `/dashboard`, `/teacher` ตามเงื่อนไขในไฟล์นั้น
2. **Auth ฝั่ง client**: `AuthProvider` (`lib/hooks/AuthProvider.tsx`) subscribe `onAuthStateChange` แล้วโหลด `profiles` ด้วย `select('*').eq('id', userId).maybeSingle()`
3. **เล่นเกม**: หน้า `app/game/[category]/[stageId]/page.tsx` ใช้ `useTimer` จับเวลา (persist `localStorage` เมื่อมี `user` + `stage`) ส่ง `onComplete` ให้คอมโพเนนต์ด่าน
4. **บันทึกคะแนน (ล็อกอิน)**: `handleComplete` → `persistCompletion` เขียน `global_scores` (อ่านแถวเดิม `limit(50)` แล้วเลือกผลดีที่สุด) + `persistLocalCachedStageResult` + `broadcastGlobalScoresUpdate` (`localStorage` key `global_scores:lastUpdate` + event `global_scores_updated`)
5. **Guest**: ถ้าไม่มี `user` แต่ `success` — ตั้ง `stageResult` และ `setIsFinished(true)` **ไม่**เรียก `persistCompletion` (ดู `handleComplete` ใน `page.tsx`)

### มีเกม / ด่านอะไรบ้าง (จาก `STAGES` ใน `app/game/[category]/[stageId]/page.tsx`)

| `stage_id` | ชื่อใน `STAGES` | คอมโพเนนต์ | `category` ใน URL |
|------------|------------------|------------|-------------------|
| 1 | HTML Structure | `HTMLStructure_1_1` (`components/game/stages/stage1/1_HTMLStructure.tsx`) | `html` |
| 2 | HTML Input | `HTMLInput_1_2` (`components/game/stages/stage1/2_HTMLInput.tsx`) | `html` |
| 3 | CSS Styling | `CSSStyling_2_1` (`components/game/stages/stage2/1_CSSStyling.tsx`) | `css` |
| 4 | Boxing Quiz Battle | `BoxingQuizBattle_2_2` (`components/game/stages/stage2/2_BoxingQuizBattle.tsx`) | `css` |
| 5 | JS Function | `JSFunction_3_1` (`components/game/stages/stage3/1_JSFunction.tsx`) | `js` |
| 6 | JS Logic | `JSLogic_3_2` (`components/game/stages/stage3/2_JSLogic.tsx`) | `js` |
| 101 | Variables Game | `VariablesGame_4_1` (`components/game/stages/stage4/1_VariablesGame.tsx`) | `python` |
| 102 | Weightlifting | `Weightlifting_4_2` (`components/game/stages/stage4/2_Weightlifting.tsx`) | `python` |

**หมายเหตุจากโค้ดจริง:** `lib/constants/categories.ts` นิยาม `CATEGORIES` สำหรับห้องครูโดยหมวด `python` มีเพียงด่าน **id 101** — **ไม่มี id 102 ใน array นี้** ในขณะที่แดชบอร์ดและหน้าเกมหลักรองรับ 102 — เป็นความต่างของข้อมูลระหว่างไฟล์ที่พบใน repo

---

## 2. Tech Stack

| รายการ | หลักฐานใน repo |
|--------|----------------|
| **Next.js** `16.1.6` | `package.json`; โฟลเดอร์ `app/` (App Router); `next.config.ts` |
| **React** `19.2.3` | `package.json` |
| **Supabase** `@supabase/supabase-js`, `@supabase/ssr` | `package.json`; `lib/supabase/client.ts`, `server.ts`, `middleware.ts` |
| **Tailwind CSS** `4` + `@tailwindcss/postcss` | `package.json`; `app/globals.css` |
| **TypeScript** `^5` | `package.json` |
| **sweetalert2** | `package.json`; ใช้ใน `components/game/stages/stage3/2_JSLogic.tsx` (`Swal.fire`) |
| **lucide-react** | `package.json`; ใช้ใน `components/ui/Navbar.tsx` (`Menu`, `X`) |

---

## 3. โครงสร้างโปรเจค

### `app/`

| ไฟล์ / เส้นทาง | หน้าที่ |
|----------------|--------|
| `layout.tsx` | Root layout, `AuthProvider`, `Navbar`, `main` |
| `page.tsx` | Landing |
| `globals.css` | สไตล์ global |
| `(auth)/login/page.tsx`, `register/page.tsx` | หน้า auth |
| `(student)/dashboard/page.tsx` | แดชบอร์ดนักเรียน + realtime `global_scores` |
| `(teacher)/teacher/page.tsx` | แดชบอร์ดครู + จัดการ `rooms` |
| `game/[category]/[stageId]/page.tsx` | หน้าเล่นด่าน + timer + บันทึกคะแนน |
| `game/room/[roomCode]/page.tsx` | ห้อง — โหลด `rooms`, join, เริ่มเกม, ลบห้อง |
| `leaderboard/page.tsx` | ห่อ `GlobalLeaderboard` |
| `auth/signout/route.ts` | **Route Handler** POST — `signOut` + redirect `/login` |

**การเชื่อม:** dynamic segment `[category]` / `[stageId]` / `[roomCode]` ถูกอ่านด้วย `useParams()` ในคอมโพเนนต์ `'use client'` ที่เกี่ยวข้อง

### `components/`

| โฟลเดอร์ / ไฟล์ | หน้าที่ |
|------------------|--------|
| `components/game/stages/stage1`–`stage4` | คอมโพเนนต์มินิเกมแต่ละด่าน |
| `components/game/stages/stage3/file2_JSLogic.tsx` | `LogicProgrammingGuide` — UI คู่มือ (import ใน `2_JSLogic.tsx`) |
| `components/game/GameTimer.tsx` | แสดงเวลาจาก object ที่ส่งมาจาก `useTimer` |
| `components/leaderboard/GlobalLeaderboard.tsx` | Leaderboard รวมจาก `global_scores` |
| `components/leaderboard/RoomLeaderboard.tsx` | Leaderboard ในห้อง (ถูก import จาก `app/game/room/[roomCode]/page.tsx`) |
| `components/ui/*` | `Navbar`, `Button`, `Card` |
| `components/auth/*` | `LoginForm`, `RegisterForm` |
| `components/room/*` | `CreateRoomForm`, `JoinRoomForm`, `RoomLobby` |

### `lib/`

| รายการ | หน้าที่ |
|--------|--------|
| `lib/hooks/AuthProvider.tsx` | Context auth + `useAuth()` |
| `lib/hooks/useTimer.ts` | จับเวลา + optional `localStorage` |
| `lib/hooks/useRealtime.ts` | Realtime `room_players`, `room_scores` |
| `lib/hooks/useAuth.ts`, `useAuth.tsx` | มีเพียง comment ชี้ไป `AuthProvider` — **ไม่พบ import จากไฟล์อื่นในโค้ดที่ตรวจสอบ** |
| `lib/supabase/*` | client / server / middleware สำหรับ Supabase |
| `lib/constants/categories.ts` | `CATEGORIES` + import คอมโพเนนต์ด่าน (ใช้ในห้องเกม) |
| `lib/types/index.ts` | TypeScript interfaces (`Profile`, `GlobalScore`, `Room`, …) |
| `lib/utils/score.ts` | `calculateStageScore` |
| `lib/utils/roomCode.ts` | `generateRoomCode` (ใช้ในฟอร์มสร้างห้อง) |
| `lib/utils/medal.ts` | `calculateMedal` — **ไม่พบการ import จากไฟล์อื่นในโค้ดที่ตรวจสอบ** |

### `hooks/` (ที่ root ของโปรเจค)

- **ไม่พบโฟลเดอร์ `hooks/` ที่ root** — hook อยู่ที่ `lib/hooks/`

### `types/` (ที่ root ของโปรเจค)

- **ไม่พบโฟลเดอร์ `types/` ที่ root** — type หลักอยู่ที่ `lib/types/index.ts`

### `supabase/`

- `config.toml` — config สำหรับ Supabase CLI
- `supabase/.temp/*` — ไฟล์ชั่วคราวของ CLI
- **ไม่พบ** โฟลเดอร์ `supabase/migrations/` หรือไฟล์ `.sql` นิยาม schema ใน repo ที่ตรวจสอบ

### `public/`

- SVG พื้นฐาน (`next.svg`, `globe.svg`, ฯลฯ) — ไม่ใช่ asset หลักของเกมในโค้ดที่อ่าน

### `middleware.ts` (root)

- เรียก `updateSession` จาก `lib/supabase/middleware.ts` — `matcher` ยกเว้น static / image ตาม comment ในไฟล์

---

## 4. การทำงานของระบบ

### 4.1 Login → Dashboard / Teacher → Game → Save score

1. **Login** (`LoginForm`): `supabase.auth.signInWithPassword` สำเร็จ → `window.location.href = '/'`
2. **Middleware** (`lib/supabase/middleware.ts`): ถ้ามี user และ path เป็น `/login` หรือ `/register` → redirect ไป `/dashboard` หรือ `/teacher` ตาม `profiles.role`
3. **Dashboard** (`app/(student)/dashboard/page.tsx`): ถ้า `profile.role === 'teacher'` → `router.replace('/teacher')`; โหลดความคืบหน้าจาก `global_scores` (`select('stage_id')`, `limit(1000)`) รวมกับ `localStorage` (`global_scores:localCache`, `global_scores:completedStageIds`) และ realtime filter `user_id=eq.{id}`
4. **Game page** (`app/game/[category]/[stageId]/page.tsx`):
   - หา `stage` จาก `STAGES` ตาม `stageId` ใน URL
   - `useTimer(0, user && stage ? \`stage_time_${user.id}_${stage.id}\` : undefined)` — เริ่ม/หยุดตาม `hasCompletedStage`
   - `handleComplete`: `timer.stop()`; `setStageResult`; ถ้าไม่ success จบ; ถ้า success แต่ไม่มี user → `setIsFinished(true)`; ถ้ามี user → `persistCompletedStageId`, `persistLocalCachedStageResult`, `broadcastGlobalScoresUpdate`, `persistCompletion`
5. **`persistCompletion`**: อ่านแถวเดิมสูงสุด 50 แถวต่อ user+stage; เลือกคะแนน/เวลาที่ดีที่สุด; `update` หรือ `insert` ลง `global_scores`; รองรับกรณีไม่มีคอลัมน์ `score` (ตรวจจากข้อความ error)

### 4.2 Game loop (ความหมายจากโค้ด)

- **ไม่มี game loop เดียวของทั้งแอป** — แต่ละด่านมี loop ของตัวเอง:
  - **Timer หลักของด่าน**: `useTimer` — `setInterval` ทุก 1000 ms เมื่อ `isActive` (`lib/hooks/useTimer.ts`)
  - **HTML Structure**: `setInterval` spawn bubble / เคลื่อนฟอง (`1_HTMLStructure.tsx`)
  - **CSS Styling / LOGIC canvas**: `requestAnimationFrame` วนเรียกฟังก์ชันลูป (`1_CSSStyling.tsx`, `2_JSLogic.tsx`) — รายละเอียดในโฟลเดอร์ `components/game/stages/`
- **หน้าเกม**: `useEffect` สลับ `timer.start()` / `timer.stop()` ตาม `stage` และ `hasCompletedStage`

### 4.3 Leaderboard ดึงข้อมูลอย่างไร

สรุปจาก `components/leaderboard/GlobalLeaderboard.tsx` (รายละเอียดเต็มอยู่ในหัวข้อ 5 และ 7):

- Query `global_scores` ด้วย `.in('stage_id', KNOWN_STAGE_IDS)` โดย `KNOWN_STAGE_IDS = new Set([1,2,3,4,5,6,101,102])`
- `.limit(1000)`; merge กับ cache ผู้เล่นปัจจุบันจาก `global_scores:localCache`
- รวมแถวด้วย `aggregateLeaderboardRows` แล้ว sort และ `slice(0, 20)`
- Realtime + `global_scores_updated` + `storage` บน key `global_scores:lastUpdate` (debounce ~150 ms)

### 4.4 `localStorage` ใช้ตรงไหน (ที่พบในโค้ด)

| Key / รูปแบบ | ไฟล์ |
|--------------|------|
| `stage_time_${user.id}_${stage.id}` | `useTimer` — จาก `app/game/[category]/[stageId]/page.tsx` |
| `global_scores:localCache` | หน้าเกม, แดชบอร์ด, `GlobalLeaderboard` |
| `global_scores:completedStageIds` | หน้าเกม, แดชบอร์ด |
| `global_scores:lastUpdate` + event `global_scores_updated` | หน้าเกม, `GlobalLeaderboard` |
| `global_scores:leaderboardCache` | `GlobalLeaderboard` |
| `jslogic_stage3_2_save_v2` | `components/game/stages/stage3/2_JSLogic.tsx` (เซฟ state เกม LOGIC QUEST) |

### 4.5 Supabase ใช้อย่างไร

- **ฝั่ง browser**: `createClient()` จาก `lib/supabase/client.ts` ในคอมโพเนนต์ `'use client'` เป็นหลักสำหรับ query/insert/update
- **Middleware**: `createServerClient` ใน `lib/supabase/middleware.ts` อ่าน session จาก cookie
- **Sign out route**: `createServerClient` + `cookies()` ใน `app/auth/signout/route.ts`

---

## 5. Frontend / Backend / Database

### Frontend

- **คอมโพเนนต์สำคัญ:** ด่านใน `components/game/stages/**`, layout เกมใน `app/game/[category]/[stageId]/page.tsx`, `GlobalLeaderboard`, `Navbar`, ฟอร์ม auth
- **State management:** โดยทั่วไปเป็น **React `useState` / `useRef` / `useEffect` / `useCallback`** ในหน้าและในเกม; **Context เฉพาะ auth** ผ่าน `AuthProvider`
- **ปฏิสัมพันธ์:** คีย์บอร์ด (เช่น `1_HTMLStructure.tsx`), คลิกปุ่มควิซ, ลาก/เรียง block ใน `2_JSLogic.tsx`, ฯลฯ

### Backend

- **API Route:** พบ **`app/auth/signout/route.ts`** (POST) เท่านั้น — **ไม่พบ** `app/api/**/route.ts` ในโค้ดที่ตรวจสอบ
- **Server Actions:** ค้นหา `'use server'` ในไฟล์ `.ts`/`.tsx` ภายใต้ `app/`, `components/`, `lib/` — **ไม่พบในโค้ดที่ตรวจสอบ**
- **Logic หลัก:** อยู่ฝั่ง **client component** + **Supabase JS** และ **middleware** สำหรับ session/role

### Database (สรุปจากการเรียก `.from(...)` ในโค้ด)

| ตาราง | การใช้งานที่พบ |
|--------|----------------|
| `profiles` | `AuthProvider`: `select('*')`; middleware: `select('role')`; leaderboard/ห้อง: `profiles(username)` join ผ่าน select ของ Supabase |
| `global_scores` | แดชบอร์ด, หน้าเกม (read/write), `GlobalLeaderboard` |
| `rooms` | ครูสร้าง/ลบ/อัปเดตสถานะ; หน้า room โหลดด้วย `room_code` |
| `room_players` | insert เมื่อ join; delete เมื่อปิดห้อง; realtime ใน `useRoomPlayers` |
| `room_scores` | insert คะแนนในห้อง; delete เมื่อปิดห้อง; realtime ใน `useRoomScores` |

**Relation (จากการใช้งานในโค้ด):**

- `global_scores.user_id` สัมพันธ์กับ `profiles.id` (query ตาม user id)
- `rooms.teacher_id` ใช้เทียบกับ `user.id` ของครูเจ้าของห้อง
- `room_players.room_id`, `room_scores.room_id` ผูกกับ `rooms.id`; select รวม `profiles(username)` สำหรับแสดงชื่อ

**Schema เต็มของคอลัมน์ทุกฟิลด์ใน DB:** **ไม่พบใน repo ที่ตรวจสอบ** — มีเพียง TypeScript types ใน `lib/types/index.ts` เป็นตัวแทนในระดับแอป

---

## 6. วิเคราะห์เกมแต่ละเกม

คอลัมน์: ไฟล์ | ทำอะไร | Input | ตรวจคำตอบ | จบเกม / `onComplete` | โครงสร้างข้อมูล / อัลกอริทึมที่ปรากฏชัดในโค้ด

### 6.1 HTML Structure — `components/game/stages/stage1/1_HTMLStructure.tsx`

- **ทำอะไร:** เกมว่ายน้ำจับฟอง (bubble) แล้วเข้าสู่ควิซ HTML
- **Input:** คีย์ลูกศร / W / S; คลิกตัวเลือกควิซ
- **ตรวจคำตอบ:** ปุ่มที่ `opt.isCorrect` จาก `shuffleOptions` (สร้างจากคำตอบ + distractors แล้ว `.sort(() => Math.random() - 0.5)`)
- **จบเกม:** `score >= 3` → `onComplete()` (ไม่ส่ง argument — parent ใช้ค่า default success)
- **โครงสร้างข้อมูล:** `Bubble[]`, `ShuffledOption[]`, state `questionQueue` (array จาก `shuffleQuestions` แบบ sort สุ่ม)
- **อัลกอริทึม:** spawn/move ด้วย `setInterval`; ชนฟองแล้วสุ่มคำถามจาก `ALL_QUESTIONS`; `requestAnimationFrame` ครั้งเดียวตอน mount เพื่อ set คิวคำถาม

### 6.2 HTML Input — `components/game/stages/stage1/2_HTMLInput.tsx`

- **ทำอะไร:** ควิซแท็ก HTML แบบ “ยิงลูก” ไปปุ่มคำตอบ
- **Input:** คลิกปุ่มแท็กบนสนาม
- **ตรวจคำตอบ:** เทียบ `tag === shuffledQuestions[qIndex].correct`
- **จบเกม:** เมื่อตอบครบข้อสุดท้าย (`qIndex === shuffledQuestions.length - 1`) → `setCompleted(true)` แล้ว `setTimeout(onComplete, 1200)`
- **โครงสร้างข้อมูล:** `shuffleArray<T>` (loop สลับคู่แบบ Fisher–Yates ใน comment); `answeredQuestions` เป็น **`Set<number>`** (ใน state — ใช้ตาม logic ในไฟล์); `shuffledQuestions` มาจาก `shuffleArray(filtered).slice(0, 5)`

### 6.3 CSS Styling — `components/game/stages/stage2/1_CSSStyling.tsx`

- **ทำอะไร:** กระโดดข้ามสิ่งกีดขวาง + ควิซ CSS
- **Input:** Space กระโดด (`keydown`); คลิกตัวเลือกเมื่อมีคำถาม
- **ตรวจคำตอบ:** เทียบ index ที่เลือกกับ `Question.c`
- **จบเกม:** `scoreRef.current >= 3` → `setTimeout(() => { onComplete(); resetGame() }, 1500)`
- **Game loop:** `requestAnimationFrame(loop)` เลื่อน obstacle; `shuffle` คำถามด้วย `[...arr].sort(() => Math.random() - 0.5)`; `askQuestion` ใช้ `pool.shift()` บน **สำเนา array** (`questionPool`)

### 6.4 Boxing Quiz Battle — `components/game/stages/stage2/2_BoxingQuizBattle.tsx`

- **ทำอะไร:** ควิซ CSS Flexbox แบบต่อสู้ HP + timer ข้อละ 10 วินาที (ค่าคงที่ `TIMER_SECONDS`)
- **Input:** เลือกข้อความคำตอบในระหว่างเล่น (รายละเอียดใน hook `useBoxingGame` ในไฟล์เดียวกัน)
- **ตรวจคำตอบ:** เทียบกับ `correctIndex` หลังสลับตัวเลือก
- **จบเกม / advance:** `useEffect` ใน default export: ถ้า `gameStatus === 'finished' && canAdvance` → `onComplete()` ครั้งเดียว (`completedRef` กันซ้ำ)
- **อัลกอริทึม:** `shuffleQuestions` — สลับก้อน `BASE_QUESTIONS` แบบ loop Fisher–Yates แล้ว slice; สลับตัวเลือกแต่ละข้อแบบ Fisher–Yates และคำนวณ `newCorrectIndex` ด้วย `indexOf`

### 6.5 JS Function (Bike Game) — `components/game/stages/stage3/1_JSFunction.tsx`

- **ทำอะไร:** เลือกภูเขา 3 ลูก แต่ละลูกมีชุดคำถาม JS — ตอบครบทั้งสามยอด
- **Input:** คลิก Start ต่อภูเขา; คลิกตัวเลือกคำตอบ
- **ตรวจคำตอบ:** `choiceIdx === question.answer` (ค่าใน `stageQuestions`)
- **จบเกม:** เมื่อ `newAnswered.every(v => v)` → `setShowResult(true)`; ผู้เล่นต้องกดปุ่ม **"Complete Stage"** ถึงเรียก `onComplete?.()`
- **โครงสร้างข้อมูล:** `answered: boolean[]`, `stageQuestionIdx: number[]`, ข้อมูลคำถามเป็น array ซ้อนในไฟล์

### 6.6 JS Logic (LOGIC QUEST) — `components/game/stages/stage3/2_JSLogic.tsx`

- **ทำอะไร:** เกมใหญ่หลายหน้าจอ (home, worlds, stage, game, shop, minigame, guide) — เรียง “block” เป็นสายคำสั่งจำลอง; มี **20 ด่าน** ใน `LEVELS` (5 โลก × 4 ด่าน ตาม index `worldIdx*4+stageIdx`)
- **Input:** UI ภายในเกม (ลาก/เลือก block — รายละเอียดใน JSX ของไฟล์); อ่าน/เขียน `localStorage` key `jslogic_stage3_2_save_v2`
- **ตรวจคำตอบหลัก:** `runCode` — เทียบ `s.code` กับ `lv.sol` ทีละช่อง (`every`); ถ้าตรงจะสร้างลำดับ `stepsRef: GameStep[]` แล้วประมวลผลใน game loop; ถ้าไม่ตรง push `{t:'fail',msg:...}`
- **จบเกมต่อแพลตฟอร์ม:** `nextStage` — เมื่ออยู่ด่านสุดท้ายของโลกสุดท้ายและผ่านเงื่อนไข จะเรียก `onCompleteRef.current({ success: true })` หนึ่งครั้ง (`appStageDoneRef` กันซ้ำ)
- **Game loop:** `initCanvas` → `gameLoop` ด้วย `requestAnimationFrame`; refs หลายตัว (`collsRef`, `enemiesRef`, `stepsRef`, `stepIdxRef`, …)
- **โครงสร้างข้อมูล:** `Level[]`, `GameState` (รวม `worldProgress: number[][]`), `Map`/`array` ของศัตรูและเหรียญใน map ต่อด่าน — **ไม่ใช่ graph data structure ที่ implement algorithm กราฟในภาษา**
- **คู่มือแยก:** `components/game/stages/stage3/file2_JSLogic.tsx` — `LogicProgrammingGuide`

### 6.7 Variables Game (Volleyball) — `components/game/stages/stage4/1_VariablesGame.tsx`

- **ทำอะไร:** ควิซชนิดข้อมูล Python-สไตล์ คะแนนทีมถึง 25 แต้มชนะ
- **Input:** คลิกตัวเลือก
- **ตรวจคำตอบ:** `option === shuffledQuestions[current].answer`
- **จบเกม:** `useEffect` เมื่อ `completed` — `teamScore >= 25` → `onComplete?.({ success: true })`; `opponentScore >= 25` → `success: false`
- **Timer ภายในเกม:** `setInterval` +1 วินาทีเมื่อยังไม่ `completed` (**แยกจาก** `useTimer` ของหน้าเกมหลัก)
- **อัลกอริทึม:** `shuffleArray` แบบสลับคู่ (คล้าย Fisher–Yates)

### 6.8 Weightlifting — `components/game/stages/stage4/2_Weightlifting.tsx`

- **ทำอะไร:** คลิกสะสมพลังแข่งบอท + ควิซเมื่อถึง threshold แต่ละ `stage`
- **Input:** คลิกปุ่มพลัง; ตอบข้อความถาม
- **ตรวจคำตอบ:** `i === currentQ.a`
- **จบเกม:** `player >= 100` → `onComplete({ success: true })` หลัง delay 1500 ms; `bot >= 100` → `success: false` หลัง 2000 ms
- **Loop บอท:** `setInterval` ทุก 250 ms เพิ่ม `bot` ทีละ 0.5 ขณะ `gameRef.current`

---

## 7. Data Structure & Algorithm

สำหรับแต่ละหัวข้อ: (1) พบหรือไม่พบ (2) ไฟล์ (3) ใช้ทำอะไร (4) การทำงานจริงจากโค้ด (5) แยก ✅ ใช้จริง / ⚠️ แนวคิดในเกมหรือ UI

### Recursive Function

1. **พบหรือไม่พบ:** **ไม่พบ** ฟังก์ชัน recursive ที่มี base case สำหรับโครงสร้างข้อมูล (เช่น tree traversal) ในโค้ดที่ตรวจสอบ
2. **ไฟล์:** รูปแบบที่ใกล้เคียงที่สุดคือ **animation loop** ที่เรียก `requestAnimationFrame` ซ้ำ — `components/game/stages/stage1/1_HTMLStructure.tsx` (ครั้งเดียวตอน mount), `components/game/stages/stage2/1_CSSStyling.tsx` (`loop` / `animate`), `components/game/stages/stage3/2_JSLogic.tsx` (`gameLoop`, `loop` ในหลาย canvas ย่อย)
3. **ใช้ทำอะไร:** ขับแอนิเมชัน / อัปเดตเฟรม ไม่ใช่ recursive algorithm ในความหมายวิชา DSA แบบมีการแตกปัญหา
4. **การทำงานจริง:** ฟังก์ชันลูปเรียก `requestAnimationFrame(ตัวเอง)` เพื่อวาด/อัปเดต state ต่อเฟรม
5. **แยก:** ✅ ใช้จริง = **RAF loop**; ⚠️ คำว่า recursion ใน `LEVELS` (เช่นด่าน “Recursion”, block `call solve(n)`) ใน `2_JSLogic.tsx` = **เนื้อหาในเกม ไม่ใช่การรันฟังก์ชัน recursive ใน TypeScript**

### Linked List

1. **ไม่พบ** การ implement linked list (node + pointer `next`) ในโค้ดที่ตรวจสอบ  
2. **ไฟล์:** —  
3. **—**  
4. **—**  
5. **แยก:** ⚠️ ลำดับ `GameStep` ใน `stepsRef` (`2_JSLogic.tsx`) เป็น **array** ที่สแกนด้วย index — **ไม่ใช่ linked list**

### Stack

1. **ไม่พบ** Stack ADT (`push`/`pop` สำหรับ undo หรือโครงสร้าง stack ชัดเจน) ในโค้ดที่ตรวจสอบ  
2. **ไฟล์:** —  
3. **—**  
4. **—**  
5. **แยก:** ⚠️ **Call stack** ของ JavaScript เกิดจากการเรียกฟังก์ชันซ้อนโดยธรรมชาติของภาษา — **ไม่ใช่โค้ดใน repo ที่สร้าง Stack**

### Queue

1. **ไม่พบ** Queue ADT (`enqueue`/`dequeue`) ในโค้ดที่ตรวจสอบ  
2. **ไฟล์ที่เกี่ยวข้องเชิงชื่อ:** `1_HTMLStructure.tsx` ใช้ state ชื่อ `questionQueue` แต่เป็น **array** ที่สุ่มด้วย `shuffleQuestions` ไม่ได้ implement queue operations  
3. **`1_CSSStyling.tsx`:** `askQuestion` ใช้ `pool.shift()` บน array — พฤติกรรมคล้าย “นำหัวคิวออก” แต่เก็บใน **array** ไม่ใช่คลาส Queue  
4. **การทำงานจริง:** `shift()` บน array ใน JavaScript  
5. **แยก:** ✅ พฤติกรรม dequeue จากหัว array มีจริงใน `1_CSSStyling.tsx`; ❌ ไม่มี Queue ADT ทั่วทั้งโปรเจค

### Sorting

1. **พบ**  
2. **ไฟล์:**  
   - **Comparator สุ่ม + `Array.prototype.sort`:** `1_HTMLStructure.tsx` (`shuffleQuestions`, `shuffleOptions`); `1_CSSStyling.tsx` (`shuffle`);  
   - **Fisher–Yates (loop สลับคู่):** `2_HTMLInput.tsx` (`shuffleArray`); `2_BoxingQuizBattle.tsx` (`shuffleQuestions`); `1_VariablesGame.tsx` (`shuffleArray`);  
   - **Leaderboard:** `GlobalLeaderboard.tsx` — `.sort` หลัง `aggregateLeaderboardRows`  
3. **ใช้ทำอะไร:** สุ่มลำดับคำถาม/ตัวเลือก; จัดอันดับผู้เล่น  
4. **การทำงานจริง:** ตาม implementation ในแต่ละไฟล์ข้างต้น; การ sort ของ engine สำหรับ `.sort` ไม่ได้ระบุ algorithm ในโค้ดแอป  
5. **แยก:** ✅ ใช้จริงในโค้ด; ⚠️ ข้อความ `bubbleSort()`, `binarySearch()`, ฯลฯ ใน `LEVELS` คือ **block ในเกม** ไม่ใช่การ implement sorting/search ใน TypeScript

### Tree

1. **ไม่พบ** tree ADT (node, children, parent) สำหรับเกมในโค้ดที่ตรวจสอบ  
2. **ไฟล์:** —  
3. **—**  
4. **—**  
5. **แยก:** ⚠️ โครงสร้าง component ของ React เป็น tree ของ UI — **เป็นแนวคิดแพลตฟอร์ม ไม่ใช่โค้ด Tree ในวิชา DSA**

### BST (Binary Search Tree)

1. **ไม่พบ** BST ในโค้ดที่ตรวจสอบ  
2. **ไฟล์:** —  
3. **—**  
4. **—**  
5. **แยก:** ⚠️ ด่าน `binarySearch()` ใน `LEVELS` (`2_JSLogic.tsx`) = **ข้อความในเกม**

### Performance (Performance Analysis / Big-O จากโค้ด)

1. **การวัดประสิทธิภาพแบบ benchmark / profiling:** **ไม่พบ** ในโค้ดที่ตรวจสอบ  
2. **ไฟล์ที่เกี่ยวข้องกับความซับซ้อนเชิงตรรกะ:**  
   - `lib/utils/score.ts` — `calculateStageScore` เป็นฟังก์ชันคงที่จำนวนขั้นตอน O(1) ต่อการเรียก  
   - `GlobalLeaderboard.tsx` — ลูปรวมแถว + `Map` ผู้เล่น; ดึงข้อมูล `.limit(1000)`; sort บน array ผลลัพธ์  
   - `app/game/[category]/[stageId]/page.tsx` — `persistCompletion` อ่านสูงสุด 50 แถวก่อนตัดสินใจ update/insert  
3. **ใช้ทำอะไร:** คำนวณคะแนน; รวม leaderboard; บันทึกผลดีที่สุดต่อด่าน  
4. **Big-O:** ระบุตัวเลข n ที่แม่นยำต้องอิงขนาดข้อมูลจริงใน DB — จากโค้ดเท่านั้น สรุปได้ว่า leaderboard จำกัดจำนวนแถวจาก DB ที่ **≤ 1000** (+ แถว local) แล้วประมวลผลใน memory  
5. **แยก:** ✅ มีขอบเขต `limit` ชัดในโค้ด; ❌ ไม่มีรายงานวัดเวลา / memory ใน repo

### Graph

1. **ไม่พบ** graph ADT (adjacency list/matrix) หรือ DFS/BFS ที่ implement เป็นอัลกอริทึมบนกราฟในโค้ดที่ตรวจสอบ  
2. **ไฟล์:** —  
3. **—**  
4. **—**  
5. **แยก:** ⚠️ ด่าน `DFS()`, `collectAll()` ใน `LEVELS` = **เนื้อหาเกม** ใน `2_JSLogic.tsx`

---

### กรณีพิเศษ: Leaderboard (สรุปย้ำ)

| หัวข้อ | ค่าจากโค้ด `GlobalLeaderboard.tsx` |
|--------|-------------------------------------|
| ดึงจากไหน | Supabase `global_scores` + `localStorage` (`global_scores:localCache`) สำหรับ user ปัจจุบัน |
| ใช้ stage ไหน | `KNOWN_STAGE_IDS` = `1,2,3,4,5,6,101,102` |
| aggregate | `aggregateLeaderboardRows` — ต่อ `user_id` เก็บผลดีที่สุดต่อ `stage_id` แล้ว sum |
| sort | `totalScore` desc → `stagesCompleted` desc → `totalTime` asc |
| limit แถวจาก DB | `.limit(1000)`; แสดงผลหลังรวม **`slice(0, 20)`** |

### กรณีพิเศษ: Game logic บนหน้าเกมหลัก

| หัวข้อ | ที่มา |
|--------|--------|
| Timer | `useTimer` — tick ทุก 1 s; key `stage_time_${user.id}_${stage.id}` |
| State หลัก | `stageResult`, `isFinished`, `isSavingResult`, `saveError` ใน `page.tsx` |
| Win / complete ต่อแพลตฟอร์ม | คอมโพเนนต์ด่านเรียก `onComplete` — พารามิเตอร์แตกต่างกันตามด่าน (บางด่านไม่ส่ง `success`) |
| คะแนน | `calculateStageScore` ใน `lib/utils/score.ts`: `Math.max(20, 120 - Math.floor(seconds/3))` |

---

## 8. สรุปเชิงเทคนิค

- สถาปัตยกรรมเป็น **แอป Next.js ที่เน้น Client Component** เป็นหลัก; การเขียน DB ส่วนใหญ่ทำจากเบราว์เซอร์ผ่าน Supabase client
- **Route Handler** ที่พบมีเพียง **sign out**; **ไม่มี** REST API ภายใน `app/api` ที่ตรวจพบ
- ด่านทั้งแปดใน `STAGES` เป็น React components อิสระ; ด่าน **LOGIC QUEST** มีความซับซ้อนและ state/`localStorage` มากที่สุดในโปรเจค
- ความสอดคล้องของรายการด่านใน **`lib/constants/categories.ts`** กับ **`STAGES` / แดชบอร์ด** ไม่ครบสำหรับด่าน python id **102** — เป็นจุดที่ควรทราบเมื่ออธิบายระบบให้อาจารย์

---

## 9. คำตอบไว้พรีเซนต์อาจารย์ (ภาษาพูด)

**โปรเจคนี้ทำอะไร**  
เป็นเว็บ Code Land สอนผ่านมินิเกมหลายด่าน ใช้ Next.js กับ Supabase ให้ล็อกอิน เก็บคะแนนในตาราง `global_scores` มีห้องเรียนในตาราง `rooms` / `room_players` / `room_scores` ตามที่โค้ดเรียกใช้

**Backend อยู่ตรงไหน**  
ไม่มีเซิร์ฟเวอร์แอปพลิเคชันที่เขียน API เองใน repo นี้เป็นหลัก นอกจาก route sign-out; logic อยู่ที่ client กับ Supabase และ middleware เช็ค session

**Stack / Queue / Tree / Graph ใช้ไหม**  
ในโค้ดที่ผมไล่ดู ไม่มีการสร้าง Stack, BST, Tree, Graph เป็นโครงสร้างข้อมูลจริง มีแค่ array, Set, Map และการ sort กับการสุ่มแบบ Fisher–Yates หรือ sort แบบสุ่ม comparator ส่วนคำว่า recursion, binary search, DFS ที่เห็นในด่าน LOGIC QUEST เป็นข้อความในเกม ไม่ใช่โค้ดอัลกอริทึมภาษา TypeScript

**Leaderboard คิดยังไง**  
ดึงคะแนนเฉพาะด่านที่กำหนดใน `KNOWN_STAGE_IDS` สูงสุดพันแถวจากฐานข้อมูล รวมกับ cache ในเครื่อง แล้วรวมเป็นคะแนนรวมต่อคน เรียงตามคะแนนรวม จำนวนด่านที่เล่น และเวลารวม แล้วเอาแค่ยี่สิบอันดับแรก

**มีการวัดประสิทธิภาพไหม**  
ใน repo ไม่มีชุดทดสอบประสิทธิภาพหรือ benchmark ที่เขียนไว้ มีแต่ขอบเขตอย่าง limit พันแถวและการคำนวณใน memory ตามโค้ด

**Schema ฐานข้อมูลอยู่ไฟล์ไหน**  
ในโปรเจคที่เปิดดูไม่มีไฟล์ migration SQL ให้เห็น schema เต็ม มีแต่ type ใน TypeScript และคำสั่ง query ในโค้ด ถ้าอาจารย์ถามรายละเอียดคอลัมน์ต้องไปดูที่ Supabase dashboard โดยตรง

**สมัครสมาชิกแล้วมี profiles ยังไง**  
ในฟอร์มสมัครมี comment ว่ามี trigger ชื่อ `handle_new_user` สร้างแถว profile อัตโนมัติ แต่ไฟล์ trigger นั้นไม่อยู่ใน repo ที่เรามี เราเลยยืนยันได้แค่ว่าแอปคาดหวังว่าจะมีแถวใน `profiles` หลัง sign up
