import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-screen hero-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="absolute top-[15%] left-[10%] text-5xl animate-float opacity-30">🏊</span>
                <span className="absolute bottom-[20%] right-[10%] text-5xl animate-float-delay-1 opacity-30">🚴</span>
                <span className="absolute top-[60%] left-[5%] text-4xl animate-float-delay-2 opacity-20">🏃</span>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🏆</div>
                    <h2 className="text-3xl font-[var(--font-display)] font-bold text-white">
                        Welcome Back!
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                        Or{' '}
                        <Link href="/register" className="font-semibold text-sunny hover:text-sunny-light transition-colors">
                            register a new account
                        </Link>
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <LoginForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
