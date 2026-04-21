'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setMessage('Password reset link sent. Please check your email.');
        setLoading(false);
    };

    return (
        <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <h1 className="text-2xl font-[var(--font-display)] font-bold text-white mb-2">Forgot Password</h1>
                    <p className="text-white/60 mb-6">Enter your email to receive a reset link.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="block w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3"
                        />
                        {error ? <p className="text-red-300 text-sm">{error}</p> : null}
                        {message ? <p className="text-green-300 text-sm">{message}</p> : null}
                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link href="/login" className="text-sm text-sky-light hover:text-sky">Back to login</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
