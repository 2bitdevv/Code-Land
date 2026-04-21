'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [hasRecoverySession, setHasRecoverySession] = useState(false);

    useEffect(() => {
        const bootstrapRecoverySession = async () => {
            const queryError = searchParams.get('error');
            if (queryError) {
                setError(queryError);
            }
            const recoveryFlag = searchParams.get('recovery') === '1';
            const hasRecoveryInQuery = searchParams.get('type') === 'recovery' || Boolean(searchParams.get('token_hash'));
            const hasRecoveryInHash = typeof window !== 'undefined' && /(?:^|&)type=recovery(?:&|$)/.test(window.location.hash.replace(/^#/, ''));
            const isRecoveryFlow = recoveryFlag || hasRecoveryInQuery || hasRecoveryInHash;

            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type');
            if (tokenHash && type === 'recovery') {
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    type: 'recovery',
                    token_hash: tokenHash,
                });
                if (verifyError) {
                    setError(verifyError.message);
                }
            }

            if (typeof window !== 'undefined' && window.location.hash) {
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const hashType = hashParams.get('type');

                if (accessToken && refreshToken && hashType === 'recovery') {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) {
                        setError(sessionError.message);
                    } else {
                        window.history.replaceState({}, '', '/reset-password');
                    }
                }
            }

            const { data } = await supabase.auth.getSession();
            if (!isRecoveryFlow && data.session) {
                await supabase.auth.signOut();
                setHasRecoverySession(false);
                return;
            }
            setHasRecoverySession(Boolean(data.session));
        };

        void bootstrapRecoverySession();
    }, [searchParams, supabase.auth]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message);
                return;
            }

            await supabase.auth.signOut();
            window.location.replace('/login');
        } catch (unknownError) {
            const msg = unknownError instanceof Error ? unknownError.message : 'Unable to reset password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <h1 className="text-2xl font-[var(--font-display)] font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-white/60 mb-6">Set a new password for your account.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="New password"
                            className="block w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                            className="block w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3"
                        />
                        {error ? <p className="text-red-300 text-sm">{error}</p> : null}
                        {message ? <p className="text-green-300 text-sm">{message}</p> : null}
                        <Button type="submit" fullWidth disabled={loading || !hasRecoverySession}>
                            {loading ? 'Saving...' : 'Save new password'}
                        </Button>
                        {!hasRecoverySession ? (
                            <p className="text-yellow-300 text-sm">Please open this page from the reset link in your email.</p>
                        ) : null}
                    </form>
                    <div className="mt-4 text-center">
                        <Link href="/login" className="text-sm text-sky-light hover:text-sky">Back to login</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <h1 className="text-2xl font-[var(--font-display)] font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-white/50 text-sm">Loading…</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
