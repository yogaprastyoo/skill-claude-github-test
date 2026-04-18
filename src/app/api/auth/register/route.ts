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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const origin = request.nextUrl.origin
    const statefulHeaders = createStatefulRequestHeaders(origin)

    const { cookieHeader: csrfCookies, setCookies: csrfSetCookies, xsrfToken } = await fetchCsrfTokens(origin)

    const laravelRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
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
      return NextResponse.json(data ?? { message: 'Registration failed' }, { status: laravelRes.status })
    }

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

    response.cookies.set('app_session', '1', {
      httpOnly: true,
      path: '/',
      maxAge: 7200,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    for (const cookie of uniqueSetCookies([...csrfSetCookies, ...authSetCookies])) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ message: 'Backend timeout' }, { status: 504 })
    }
    console.error('Register BFF error:', error)

    return NextResponse.json({ message: 'Unable to register' }, { status: 500 })
  }
}
