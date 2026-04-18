import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend'

export async function POST(request: NextRequest) {
  const laravelRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      Cookie: request.headers.get('cookie') ?? '',
    },
  })

  const response = NextResponse.json({ message: 'Logged out' }, { status: 200 })

  // Clear Laravel session cookies
  const setCookies = laravelRes.headers.getSetCookie?.() ?? []
  setCookies.forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie)
  })

  // Clear the app_session cookie used by proxy
  response.cookies.set('app_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
  })

  return response
}
