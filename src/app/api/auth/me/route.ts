import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, BACKEND_TIMEOUT_MS } from '@/lib/backend'
import { createStatefulRequestHeaders } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const laravelRes = await fetch(`${BACKEND_URL}/api/user`, {
      headers: {
        Accept: 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
        ...createStatefulRequestHeaders(request.nextUrl.origin),
      },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
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
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ message: 'Backend timeout' }, { status: 504 })
    }
    console.error('Me BFF error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
