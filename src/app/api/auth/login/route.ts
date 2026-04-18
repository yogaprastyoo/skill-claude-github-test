import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, BACKEND_TIMEOUT_MS } from '@/lib/backend'
import {
  createCookieHeader,
  createCookieHeaderFromSetCookies,
  createStatefulRequestHeaders,
  fetchCsrfTokens,
  getSetCookies,
  readJsonOrNull,
  uniqueSetCookies,
} from '@/lib/csrf'

function extractMaxAge(setCookies: string[], cookieName: string): number | undefined {
  for (const cookie of setCookies) {
    const [nameValue, ...parts] = cookie.split(';')
    if (nameValue.trim().startsWith(`${cookieName}=`)) {
      for (const part of parts) {
        const [key, value] = part.trim().split('=')
        if (key.toLowerCase() === 'max-age' && value) {
          const parsed = parseInt(value, 10)
          if (!isNaN(parsed)) return parsed
        }
      }
    }
  }
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const origin = request.nextUrl.origin
    const statefulHeaders = createStatefulRequestHeaders(origin)

    // 1. Get CSRF tokens from Laravel
    const { cookieHeader: csrfCookies, setCookies: csrfSetCookies, xsrfToken } = await fetchCsrfTokens(origin)

    // 2. Login — forward CSRF cookies + X-XSRF-TOKEN header
    const laravelRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Cookie: csrfCookies,
        'X-XSRF-TOKEN': xsrfToken,
        ...statefulHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })

    const data = await readJsonOrNull(laravelRes)

    if (!laravelRes.ok) {
      return NextResponse.json(data ?? { message: 'Authentication failed' }, { status: laravelRes.status })
    }

    // 3. Fetch user
    const authSetCookies = getSetCookies(laravelRes)
    const authCookies = createCookieHeaderFromSetCookies(authSetCookies)
    const sessionCookies = createCookieHeader(csrfCookies, authCookies)

    const userRes = await fetch(`${BACKEND_URL}/api/user`, {
      headers: {
        Accept: 'application/json',
        Cookie: sessionCookies,
        ...statefulHeaders,
      },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })

    const userData = await readJsonOrNull(userRes)

    if (!userRes.ok) {
      return NextResponse.json(userData ?? { message: 'Unauthenticated' }, { status: userRes.status })
    }

    const response = NextResponse.json(userData)

    // 4. Set app_session optimistic marker
    const sessionMaxAge = extractMaxAge([...csrfSetCookies, ...authSetCookies], 'laravel_session') ?? 7200
    response.cookies.set('app_session', '1', {
      httpOnly: true,
      path: '/',
      maxAge: sessionMaxAge,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    // 5. Forward Laravel session cookies
    for (const cookie of uniqueSetCookies([...csrfSetCookies, ...authSetCookies])) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ message: 'Backend timeout' }, { status: 504 })
    }
    console.error('Login BFF error:', error)

    return NextResponse.json({ message: 'Unable to login' }, { status: 500 })
  }
}
