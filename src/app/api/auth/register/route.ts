import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend'

export async function POST(request: NextRequest) {
  const body = await request.json()

  await fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  const laravelRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: request.headers.get('cookie') ?? '',
    },
    body: JSON.stringify(body),
  })

  const data = await laravelRes.json()

  if (!laravelRes.ok) {
    return NextResponse.json(data, { status: laravelRes.status })
  }

  const userRes = await fetch(`${BACKEND_URL}/api/user`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      Cookie: laravelRes.headers.getSetCookie?.()?.join('; ') ?? request.headers.get('cookie') ?? '',
    },
  })

  const userData = await userRes.json()
  const response = NextResponse.json(userData)

  const setCookies = laravelRes.headers.getSetCookie?.() ?? []
  setCookies.forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie)
  })

  response.cookies.set('app_session', '1', {
    httpOnly: true,
    path: '/',
    maxAge: 7200,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
