  'use client';

  import { useAuth } from '@/lib/hooks/AuthProvider';
  import Link from 'next/link';

  export default function Home() {
    const { user, profile, loading } = useAuth();

    return (
      <div
        className="relative overflow-hidden bg-[#040a22] text-white"
        style={{ fontFamily: "'Nunito', 'Noto Sans Thai', sans-serif" }}
      >
        {/* subtle grid + blobs */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(56,189,248,0.14) 1px, transparent 1px), radial-gradient(rgba(59,130,246,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px, 80px 80px',
            backgroundPosition: '0 0, 10px 16px',
          }}
        />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-24 right-[-220px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-220px] left-[-140px] h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />

        {/* HERO */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-[#0b1d46]/90 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-500/20 backdrop-blur">
                <span className="text-lg">🏆</span>
                <span>เรียนโค้ดแบบเกม • แข่งกับเวลา • เก็บคะแนน เพื่อพิสูจน์ว่าใครเจ๋งที่สุด</span>
              </div>

              <h1 className="mt-8 text-5xl sm:text-6xl font-[800] tracking-tight drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                <span className="text-white">Code Land</span>
                <span className="text-white"> </span>
                <span className="text-cyan-300">Game</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-200 font-[500] max-w-2xl mx-auto leading-relaxed">
                ฝึก HTML / CSS / JavaScript ผ่านด่านเกม
                <br />
                เก็บคะแนน แข่งอันดับ และปลดล็อกด่านต่อไป
              </p>

              <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href={user ? '/dashboard' : '/login'}
                  className="game-cta inline-flex items-center justify-center rounded-xl font-[700] transition-all duration-200 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/35 hover:bg-cyan-400 hover:-translate-y-0.5 active:translate-y-0 px-6 py-3 text-lg"
                >
                  เริ่มเล่นเลย
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center justify-center rounded-xl font-[700] transition-all duration-200 bg-white/10 text-white border border-white/20 shadow-sm hover:bg-white/20 hover:-translate-y-0.5 px-6 py-3 text-lg"
                >
                  ดูอันดับ
                </Link>
                {(profile?.role === 'teacher') ? (
                  <Link
                    href="/teacher"
                    className="inline-flex items-center justify-center rounded-xl font-[700] transition-all duration-200 bg-white/10 text-white border border-white/20 shadow-sm hover:bg-white/20 px-6 py-3 text-lg"
                  >
                    สำหรับครู
                  </Link>
                ) : (!user && !loading) ? (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl font-[700] transition-all duration-200 bg-white/10 text-white border border-white/20 shadow-sm hover:bg-white/20 px-6 py-3 text-lg"
                  >
                    สำหรับครู
                  </Link>
                ) : null}
              </div>
            </div>

            {/* layered preview card */}
            <div className="mt-12 mx-auto max-w-5xl">
              <div className="relative">
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[28px] bg-black/20" />
                <div className="absolute inset-0 -translate-x-2 -translate-y-2 rounded-[28px] bg-cyan-500/10 border border-cyan-200/20" />
                <div className="relative rounded-[28px] border border-cyan-200/20 bg-[#081a3d]/85 shadow-xl shadow-black/30 backdrop-blur ring-1 ring-cyan-300/10">
                  <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-cyan-200/15">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-[800]">CL</div>
                      <div>
                        <div className="font-[800] leading-tight text-white">Code Land</div>
                        <div className="text-xs text-slate-300 font-[500]">แดชบอร์ดผู้เล่น</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-cyan-100">
                      <span className="rounded-full border border-cyan-200/30 bg-cyan-500/15 px-3 py-1 font-[600]"> HTML</span>
                      <span className="rounded-full border border-cyan-200/30 bg-cyan-500/15 px-3 py-1 font-[600]"> CSS</span>
                      <span className="rounded-full border border-cyan-200/30 bg-cyan-500/15 px-3 py-1 font-[600]"> JS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    {[
                      { t: 'ด่านสั้น เล่นไว', d: 'เรียนทีละสกิลแบบเข้าใจจริง', v: '8+' },
                      { t: 'ระบบคะแนน', d: 'ทำเวลาให้ดีเพื่อไต่อันดับ', v: 'Rank' },
                      { t: 'ห้องเรียนสด', d: 'เข้าห้องด้วยโค้ดจากครู', v: 'Live' },
                    ].map((c) => (
                      <div key={c.t} className="rounded-2xl border border-cyan-200/20 bg-white/10 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/15">
                        <div className="text-sm font-[700] text-cyan-100">{c.t}</div>
                        <div className="mt-2 text-3xl font-[800] text-white">{c.v}</div>
                        <div className="mt-2 text-sm text-slate-300 font-[500] leading-relaxed">{c.d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* ── STEPS — horizontal timeline ── */}
        <section className="relative z-10 bg-[#091428]/70 px-12 py-16">
          <div className="mb-12 text-center">
            <p className="mb-2.5 text-[20px] font-bold uppercase tracking-[2px] text-cyan-400">วิธีเล่น</p>
            <h2
              className="text-[34px] font-extrabold tracking-[-0.8px]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              3 ขั้นตอน เริ่มได้เลย
            </h2>
          </div>
          <div className="relative grid grid-cols-3 gap-0">
            {/* connecting line */}
            <div className="pointer-events-none absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-cyan-400/30 to-blue-500/30" />
            {[
              { n: '1', ico: '🎮', t: 'เลือกด่าน', d: 'เลือกหมวดที่อยากเรียน HTML, CSS, JS หรือ Python แล้วกดเริ่ม' },
              { n: '2', ico: '⌨️', t: 'เขียนโค้ด', d: 'เล่นเกม อ่านโจทย์ ตอบคำถาม ดูผลลัพธ์' },
              { n: '3', ico: '🏆', t: 'เก็บคะแนน', d: 'ทำเวลาให้ดี รับเหรียญ ไต่อันดับ Leaderboard' },
            ].map((s) => (
              <div key={s.t} className="relative z-10 px-6 text-center">
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-400/25 bg-[#0f1f3d] text-3xl transition-all hover:scale-105 hover:border-cyan-400/60">
                  {s.ico}
                  <span
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[11px] font-extrabold text-slate-950"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {s.n}
                  </span>
                </div>
                <h3
                  className="mb-2 text-base font-extrabold"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.t}
                </h3>
                <p className="text-sm leading-[1.65] text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
  
        <div className="mx-12 h-px bg-gradient-to-r from-transparent via-cyan-400/12 to-transparent" />

        {/* STAGES */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-[800]">ด่านทั้งหมด</h2>
              <p className="mt-2 text-slate-300 font-[500]">เลือกหมวด แล้วเริ่มไล่ด่านไปทีละสเต็ป</p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {[
                { k: 'HTML', sub: 'ว่ายน้ำ & ฟุตบอล', icon: <i className="fa-brands fa-html5 text-orange-600"></i>, pills: ['1-1', '1-2'] },
                { k: 'CSS', sub: 'วิ่งข้ามรั้ว & มวย', icon: <i className="fa-brands fa-css3-alt text-sky-600"></i>, pills: ['2-1', '2-2'] },
                { k: 'JavaScript', sub: 'ยิงปืน & LOGIC QUEST', icon: <i className="fa-brands fa-js text-amber-500"></i>, pills: ['3-1', '3-2'] },
                { k: 'Python', sub: 'Volleyball & Weightlifting', icon: <i className="fa-brands fa-python text-blue-600"></i>, pills: ['4-1', '4-2'] },
              ].map((c) => (
                <div key={c.k} className="rounded-2xl border border-cyan-200/20 bg-white/10 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_10px_30px_rgba(56,189,248,0.18)]">
                  <div className="p-6">
                    <div className="text-5xl">{c.icon}</div>
                    <div className="mt-4 text-xl font-[800]">{c.k}</div>
                    <div className="mt-1 text-sm text-slate-300 font-[500]">{c.sub}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.pills.map((p) => (
                        <span key={p} className="rounded-full border border-cyan-200/25 bg-cyan-500/10 px-3 py-1 text-xs font-[700] text-cyan-100">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADERBOARD CTA */}
        <section className="relative px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[28px] border border-cyan-200/20 bg-white/10 shadow-xl shadow-black/30 px-6 py-10 sm:px-10 ring-1 ring-cyan-300/10">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-[800]">แข่งอันดับเพื่อชิงเหรียญ</h2>
                <p className="mt-2 text-slate-300 font-[500]">ทำเวลาให้ดีขึ้น แล้วดูชื่อคุณบนกระดานคะแนน</p>
                <div className="mt-6 flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl">🥇</div>
                    <div className="mt-1 text-xs font-bold text-slate-200">ทอง</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl">🥈</div>
                    <div className="mt-1 text-xs font-bold text-slate-200">เงิน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl">🥉</div>
                    <div className="mt-1 text-xs font-bold text-slate-200">ทองแดง</div>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/leaderboard"
                    className="game-cta inline-flex items-center justify-center rounded-xl font-[700] transition-all duration-200 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 hover:-translate-y-0.5 active:translate-y-0 px-6 py-3 text-lg"
                  >
                    ไปที่กระดานอันดับ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative border-t border-cyan-200/20 bg-[#071633]/85 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="font-[800] text-white">Code Land</div>
                <div className="mt-1 text-sm text-slate-300 font-[500]">เรียนรู้การเขียนโปรแกรมผ่านเกมด่านสั้น ๆ</div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link className="text-slate-200 hover:text-white font-[700]" href={user ? '/dashboard' : '/login'}>เริ่มเล่น</Link>
                <Link className="text-slate-200 hover:text-white font-[700]" href="/leaderboard">อันดับ</Link>
                <Link className="text-slate-200 hover:text-white font-[700]" href={user ? '/dashboard' : '/login'}>แดชบอร์ด</Link>
              </div>
            </div>
            <div className="mt-8 text-xs text-slate-400 font-[500]">
              © {new Date().getFullYear()} Code Land. สงวนลิขสิทธิ์
            </div>
          </div>
        </footer>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Noto+Sans+Thai:wght@100..900&display=swap');
          @keyframes gamePulse {
            0%,
            100% {
              box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.35);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(34, 211, 238, 0);
            }
          }
          .game-cta {
            animation: gamePulse 2.2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }
