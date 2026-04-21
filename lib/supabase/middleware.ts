import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type MiddlewareAuthResult = {
    data: {
        user: {
            id: string
        } | null
    }
}

type MiddlewareProfileResult = {
    data: {
        role?: string
    } | null
    error?: {
        message?: string
    } | null
}

function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
    return Promise.race([
        Promise.resolve(promiseLike),
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
        }),
    ])
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let user = null

    try {
        const authResult = await withTimeout<MiddlewareAuthResult>(
            supabase.auth.getUser(),
            5000,
            'supabase.auth.getUser()'
        )

        user = authResult.data.user
    } catch (error) {
        console.error('[middleware] auth lookup failed, allowing request to continue:', error)
        return supabaseResponse
    }

    const path = request.nextUrl.pathname;

    // Public routes that don't need auth
    const isTeacherRoute = path.startsWith('/teacher')

    if (!user && isTeacherRoute) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }

    // For authenticated users, fetch profile ONCE and use for all checks
    if (user) {
        let role: string | undefined

        try {
            const profileResult = await withTimeout<MiddlewareProfileResult>(
                supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle(),
                5000,
                'profiles role lookup'
            )

            if (profileResult.error?.message) {
                console.error('[middleware] profile role lookup returned error, allowing request to continue:', profileResult.error.message)
                return supabaseResponse
            }

            role = profileResult.data?.role
        } catch (error) {
            console.error('[middleware] profile role lookup failed, allowing request to continue:', error)
            return supabaseResponse
        }

        // If on login/register, redirect to appropriate dashboard
        if (path.startsWith('/login') || path.startsWith('/register')) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = role === 'teacher' ? '/teacher' : '/dashboard'
            return NextResponse.redirect(redirectUrl)
        }

        // Teacher-only routes
        if (path.startsWith('/teacher') && role !== 'teacher') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/dashboard'
            return NextResponse.redirect(redirectUrl)
        }

        // Student-only routes
        if (path.startsWith('/dashboard') && role === 'teacher') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/teacher'
            return NextResponse.redirect(redirectUrl)
        }
    }

    return supabaseResponse
}
