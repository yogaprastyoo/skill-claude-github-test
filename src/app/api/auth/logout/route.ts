import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend'
import {
  createStatefulRequestHeaders,
  fetchCsrfTokens,
  getSetCookies,
} from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin
    const statefulHeaders = createStatefulRequestHeaders(origin)

    const { cookieHeader: csrfCookies, xsrfToken } = await fetchCsrfTokens(origin)

    const laravelRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Cookie: csrfCookies || (request.headers.get('cookie') ?? ''),
        'X-XSRF-TOKEN': xsrfToken,
        ...statefulHeaders,
      },
    })

    const response = NextResponse.json({ message: 'Logged out' }, { status: 200 })

    // Forward any cookies Laravel invalidates (session deletion, etc.)
    for (const cookie of getSetCookies(laravelRes)) {
      response.headers.append('Set-Cookie', cookie)
    }

    // Always clear app_session regardless of Laravel response
    response.cookies.set('app_session', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    return response
  } catch (error) {
    console.error('Logout BFF error:', error)

    // Even on error, clear app_session so the user can navigate away
    const response = NextResponse.json({ message: 'Logged out' }, { status: 200 })
    response.cookies.set('app_session', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    return response
  }
}
