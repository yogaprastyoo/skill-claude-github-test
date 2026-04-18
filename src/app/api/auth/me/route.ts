import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend'
import { createStatefulRequestHeaders } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  const laravelRes = await fetch(`${BACKEND_URL}/api/user`, {
    headers: {
      Accept: 'application/json',
      Cookie: request.headers.get('cookie') ?? '',
      ...createStatefulRequestHeaders(request.nextUrl.origin),
    },
  })

  if (!laravelRes.ok) {
    const response = NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

    response.cookies.set('app_session', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })

    return response
  }

  const data = await laravelRes.json()
  return NextResponse.json(data)
}
