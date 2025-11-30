import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/profile', '/bookings', '/settings']
  const adminPaths = ['/admin']

  const pathname = req.nextUrl.pathname

  // Check if user is trying to access protected routes
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!session) {
      // Redirect to home with auth modal trigger
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('auth', 'signin')
      return NextResponse.redirect(url)
    }
  }

  // Check if user is trying to access admin routes
  if (adminPaths.some(path => pathname.startsWith(path))) {
    if (!session) {
      // Redirect to home with auth modal trigger
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('auth', 'signin')
      return NextResponse.redirect(url)
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      // Redirect to home if not admin
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}