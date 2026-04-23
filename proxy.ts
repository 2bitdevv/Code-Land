import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
	const path = request.nextUrl.pathname
	const code = request.nextUrl.searchParams.get('code')
	const authError = request.nextUrl.searchParams.get('error')
	const authErrorDescription = request.nextUrl.searchParams.get('error_description')

	if (path === '/' && code) {
		const redirectUrl = request.nextUrl.clone()
		redirectUrl.pathname = '/auth/callback'
		redirectUrl.searchParams.set('next', '/reset-password')
		return Response.redirect(redirectUrl)
	}

	if (path === '/' && authError) {
		const redirectUrl = request.nextUrl.clone()
		redirectUrl.pathname = '/reset-password'
		redirectUrl.search = ''
		redirectUrl.searchParams.set('error', authErrorDescription || authError)
		return Response.redirect(redirectUrl)
	}

	return await updateSession(request)
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		'/((?!_next/static|_next/image|_astro|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|eot)$).*)',
	],
}
