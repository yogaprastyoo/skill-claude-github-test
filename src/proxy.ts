import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route))
  const isAuthenticated = request.cookies.get('app_session')?.value === '1'

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
