'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // ไม่ต้องอัปเดต displayName ตอน login

        // Force full page reload to trigger middleware redirect based on role
        window.location.href = '/';
        return;  // Don't set loading false since we're navigating away
    };

    return (
        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3 transition-all"
                    placeholder="you@example.com"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3 transition-all"
                    placeholder="Enter your password"
                />
                <div className="mt-2 text-right">
                    <Link href="/forgot-password" className="text-sm text-sky-light hover:text-sky">
                        Forgot password?
                    </Link>
                </div>
            </div>

            {/* ไม่ต้องกรอก displayName ตอน login */}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="mt-2">
                {loading ? '⏳ Logging in...' : '🚀 Log in'}
            </Button>
        </form>
    );
}
