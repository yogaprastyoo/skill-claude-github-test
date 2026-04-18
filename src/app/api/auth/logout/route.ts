import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, BACKEND_TIMEOUT_MS } from '@/lib/backend'
import { createStatefulRequestHeaders, getSetCookies } from '@/lib/csrf'

function extractXsrfToken(cookieHeader: string): string {
  for (const cookie of cookieHeader.split(';')) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'XSRF-TOKEN' && value) {
      return decodeURIComponent(value)
    }
  }
  return ''
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin
    const statefulHeaders = createStatefulRequestHeaders(origin)

    const userCookies = request.headers.get('cookie') ?? ''
    const xsrfToken = extractXsrfToken(userCookies)

    const laravelRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Cookie: userCookies,
        'X-XSRF-TOKEN': xsrfToken,
        ...statefulHeaders,
      },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })

    const response = NextResponse.json({ message: 'Logged out' }, { status: 200 })

    // Always clear app_session regardless of Laravel response
    response.cookies.set('app_session', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    // Forward any cookies Laravel invalidates (session deletion, etc.)
    for (const cookie of getSetCookies(laravelRes)) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ message: 'Backend timeout' }, { status: 504 })
    }
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
