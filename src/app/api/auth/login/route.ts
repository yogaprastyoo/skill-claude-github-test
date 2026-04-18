import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend'
import {
  createCookieHeader,
  createCookieHeaderFromSetCookies,
  createStatefulRequestHeaders,
  fetchCsrfTokens,
  getSetCookies,
  readJsonOrNull,
  uniqueSetCookies,
} from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const origin = request.nextUrl.origin
    const statefulHeaders = createStatefulRequestHeaders(origin)

    // 1. Get CSRF tokens from Laravel (credentials: 'include' is browser-only — must manage cookies manually)
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
    })

    const data = await readJsonOrNull(laravelRes)

    if (!laravelRes.ok) {
      return NextResponse.json(data ?? { message: 'Authentication failed' }, { status: laravelRes.status })
    }

    // 3. Fetch user using the CSRF session cookies plus any cookies refreshed by login.
    const authSetCookies = getSetCookies(laravelRes)
    const authCookies = createCookieHeaderFromSetCookies(authSetCookies)
    const sessionCookies = createCookieHeader(csrfCookies, authCookies)

    const userRes = await fetch(`${BACKEND_URL}/api/user`, {
      headers: {
        Accept: 'application/json',
        Cookie: sessionCookies,
        ...statefulHeaders,
      },
    })

    const userData = await readJsonOrNull(userRes)

    if (!userRes.ok) {
      return NextResponse.json(userData ?? { message: 'Unauthenticated' }, { status: userRes.status })
    }

    const response = NextResponse.json(userData)

    // 4. Set app_session so proxy can detect authenticated state
    response.cookies.set('app_session', '1', {
      httpOnly: true,
      path: '/',
      maxAge: 7200,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    // 5. Forward Laravel session cookies to browser after Next mutates Set-Cookie.
    for (const cookie of uniqueSetCookies([...csrfSetCookies, ...authSetCookies])) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    console.error('Login BFF error:', error)

    return NextResponse.json({ message: 'Unable to login' }, { status: 500 })
  }
}
