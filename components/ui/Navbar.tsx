'use client';

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from '@/lib/hooks/AuthProvider';

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile } = useAuth();

    const username = profile?.username || user?.email?.split('@')[0] || "Guest";
    const metadataRole = user?.user_metadata?.role;
    const normalizedMetadataRole = metadataRole === 'teacher' || metadataRole === 'student'
        ? metadataRole
        : null;
    const resolvedRole = profile?.role || normalizedMetadataRole;
    const role = resolvedRole === 'teacher' ? 'Teacher' : 'Student';
    const avatar = username.charAt(0).toUpperCase();

    const isTeacher = resolvedRole === 'teacher';
    const activeDashboardLink = isTeacher ? '/teacher' : '/dashboard';
    const activeDashboardText = isTeacher ? '👨‍🏫 Teacher' : '🎮 Dashboard';

    const handleSignOut = async () => {
        try {
            await fetch('/auth/signout', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
                redirect: 'follow',
            });
        } finally {
            window.location.href = '/login';
        }
    };

    return (
        <nav className="bg-[#0a1628] sticky top-0 z-50 w-full border-b border-white/10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-[64px] lg:h-[72px]">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3 group" aria-label="Home">
                            <span className="text-3xl group-hover:animate-wave">🏆</span>
                            <span className="text-lg md:text-xl font-bold tracking-wide text-white">Code Land</span>
                        </Link>
                    </div>

                    {/* Desktop/Tablet Nav Links */}
                    <div className="hidden md:flex flex-1 justify-center items-center gap-4 lg:gap-8">
                        <Link href="/leaderboard" className="text-white/80 hover:text-sky transition-colors px-2 md:px-3 py-2 rounded-xl text-sm md:text-base font-semibold hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky/50" aria-label="Leaderboard">
                            🏅 Leaderboard
                        </Link>
                        {user && (
                            <Link href="/quiz" className="text-white/80 hover:text-sky transition-colors px-2 md:px-3 py-2 rounded-xl text-sm md:text-base font-semibold hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky/50" aria-label="Quiz">
                                🧠 Quiz
                            </Link>
                        )}
                        {user && (
                            <Link href={activeDashboardLink} className="text-white/80 hover:text-sky transition-colors px-2 md:px-3 py-2 rounded-xl text-sm md:text-base font-semibold hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky/50" aria-label="Dashboard">
                                {activeDashboardText}
                            </Link>
                        )}
                    </div>

                    {/* Desktop/Tablet Profile & Sign Out */}
                    <div className="hidden md:flex items-center gap-2 lg:gap-4">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-full border border-white/10">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-sky to-aqua flex items-center justify-center text-white font-bold text-base">
                                        {avatar}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs md:text-sm font-bold text-white leading-tight">{username}</span>
                                        <span className="text-[10px] md:text-[11px] text-white/40 leading-tight">{role}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="inline-flex items-center justify-center rounded-xl font-bold px-3 md:px-4 py-2 text-xs md:text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-sky/50"
                                    aria-label="Sign Out"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center rounded-xl font-bold px-3 md:px-4 py-2 text-xs md:text-sm text-white hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center rounded-xl font-bold px-3 md:px-4 py-2 text-xs md:text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Hamburger (Mobile only) */}
                    <button
                        className="md:hidden flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky/50 transition-all"
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setMobileMenuOpen((open) => !open)}
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden fixed left-0 top-0 w-full bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/10 shadow-xl transition-transform duration-300 z-40 ${mobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}
                style={{ willChange: "transform", height: "100vh" }}
                aria-hidden={!mobileMenuOpen}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3 group" aria-label="Home" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-3xl group-hover:animate-wave">🏆</span>
                        <span className="text-lg font-bold tracking-wide text-white">Code Land</span>
                    </Link>
                    <button
                        className="flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky/50 transition-all"
                        aria-label="Close menu"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X size={28} />
                    </button>
                </div>
                <div className="flex flex-col gap-2 px-6 py-6">
                    <Link
                        href="/leaderboard"
                        className="text-white/90 hover:text-sky transition-colors px-3 py-3 rounded-xl text-base font-semibold hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky/50"
                        aria-label="Leaderboard"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        🏅 Leaderboard
                    </Link>
                    {user && (
                        <Link
                            href="/quiz"
                            className="text-white/90 hover:text-sky transition-colors px-3 py-3 rounded-xl text-base font-semibold hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky/50"
                            aria-label="Quiz"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            🧠 Quiz
                        </Link>
                    )}
                    {user && (
                        <Link
                            href={activeDashboardLink}
                            className="text-white/90 hover:text-sky transition-colors px-3 py-3 rounded-xl text-base font-semibold hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky/50"
                            aria-label="Dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {activeDashboardText}
                        </Link>
                    )}
                    
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-full border border-white/10 mt-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky to-aqua flex items-center justify-center text-white font-bold text-base">
                                    {avatar}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white leading-tight">{username}</span>
                                    <span className="text-[11px] text-white/40 leading-tight">{role}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                                className="inline-flex items-center justify-center rounded-xl font-bold px-4 py-3 text-base text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/20 mt-4 focus:outline-none focus:ring-2 focus:ring-sky/50"
                                aria-label="Sign Out"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-xl font-bold px-4 py-3 text-base text-white hover:bg-white/10 transition-all cursor-pointer mt-4"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-xl font-bold px-4 py-3 text-base text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
