import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a Next.js response object that we can pass to the Supabase helper
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const existing = req.cookies.get(name)?.value
          if (existing === value) return // avoid duplicate set-cookie bloating headers
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth',
    '/auth/login',
    '/auth/callback',
    '/auth/signup',
    '/debug-auth', // Debug page for troubleshooting auth issues
    '/events', // Allow public access to event pages (they handle auth internally)
  ]

  // API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth',
    '/api/health',
    '/api/env-check',
    '/api/test', // Allow test endpoints
  ]

  const { pathname } = req.nextUrl

  // Allow all static files and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Static assets (.png, .css, .js, etc.)
  ) {
    return res
  }

  // Determine if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  const isGuestResponseRoute = pathname.includes('/guest-response') && pathname.startsWith('/api/events/')

  if (isPublicRoute || isPublicApiRoute || isGuestResponseRoute) {
    return res
  }

  // Fetch session (middleware helper auto-refreshes if needed)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  console.log(`[Middleware] ${pathname} – Session: ${session?.user?.id || 'none'} | Error: ${sessionError?.message || 'none'}`)

  if (!session?.user) {
    // If unauthenticated, redirect to login with redirect path
    if (pathname === '/auth/login') return res

    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated – allow request to proceed (cookies already attached by helper)
  return res
}

export const config = {
  matcher: [
    // Exclude Next.js internals & static assets from middleware processing
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 