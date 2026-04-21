import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/reset-password';
    const nextUrl = new URL(next, request.url);

    if (nextUrl.pathname === '/reset-password' && !nextUrl.searchParams.get('recovery')) {
        nextUrl.searchParams.set('recovery', '1');
    }

    const response = NextResponse.redirect(nextUrl);
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        return response;
    }

    const errorUrl = new URL('/reset-password', request.url);
    errorUrl.searchParams.set('error', 'Invalid or expired reset link.');
    return NextResponse.redirect(errorUrl);
}
