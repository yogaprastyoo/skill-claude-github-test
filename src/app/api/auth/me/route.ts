import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend'

export async function GET(request: NextRequest) {
  const laravelRes = await fetch(`${BACKEND_URL}/api/user`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      Cookie: request.headers.get('cookie') ?? '',
    },
  })

  if (!laravelRes.ok) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  }

  const data = await laravelRes.json()
  return NextResponse.json(data)
}
