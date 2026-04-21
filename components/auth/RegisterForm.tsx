'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create auth user with metadata — the database trigger
            // `handle_new_user` automatically creates the profile row
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        role,
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // Redirect based on role
                if (role === 'teacher') {
                    router.push('/teacher');
                } else {
                    router.push('/dashboard');
                }
                router.refresh(); // Important to refresh middleware context
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred during registration.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="block w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3 transition-all"
                    placeholder="Choose a cool username"
                />
            </div>

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
                    placeholder="Create a strong password"
                />
            </div>

            <div>
                <fieldset className="mt-2">
                    <legend className="block text-sm font-semibold text-white/80 mb-3">I am a:</legend>
                    <div className="grid grid-cols-2 gap-3">
                        <label
                            htmlFor="student"
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${role === 'student'
                                    ? 'border-sky bg-sky/20 text-white'
                                    : 'border-white/10 text-white/60 hover:border-white/30'
                                }`}
                        >
                            <input
                                id="student"
                                name="role"
                                type="radio"
                                value="student"
                                checked={role === 'student'}
                                onChange={(e) => setRole(e.target.value as 'student')}
                                className="sr-only"
                            />
                            <span className="text-xl">🎮</span>
                            <span className="font-bold">Student</span>
                        </label>
                        <label
                            htmlFor="teacher"
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${role === 'teacher'
                                    ? 'border-sunny bg-sunny/20 text-white'
                                    : 'border-white/10 text-white/60 hover:border-white/30'
                                }`}
                        >
                            <input
                                id="teacher"
                                name="role"
                                type="radio"
                                value="teacher"
                                checked={role === 'teacher'}
                                onChange={(e) => setRole(e.target.value as 'teacher')}
                                className="sr-only"
                            />
                            <span className="text-xl">👨‍🏫</span>
                            <span className="font-bold">Teacher</span>
                        </label>
                    </div>
                </fieldset>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="mt-2">
                {loading ? '⏳ Signing up...' : '🏁 Join the Race!'}
            </Button>
        </form>
    );
}
