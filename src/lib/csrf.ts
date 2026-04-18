import { BACKEND_URL } from './backend'

interface CsrfTokens {
  cookieHeader: string
  setCookies: string[]
  xsrfToken: string
}

export function createStatefulRequestHeaders(origin: string) {
  return {
    Origin: origin,
    Referer: `${origin}/`,
  }
}

export async function fetchCsrfTokens(origin: string): Promise<CsrfTokens> {
  const res = await fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
    headers: {
      Accept: 'application/json',
      ...createStatefulRequestHeaders(origin),
    },
  })

  const cookies = res.headers.getSetCookie?.() ?? []

  let xsrfToken = ''
  const cookieParts: string[] = []

  for (const cookie of cookies) {
    const [nameValue] = cookie.split(';')
    const [name, value] = nameValue.split('=')
    cookieParts.push(nameValue.trim())

    if (name.trim() === 'XSRF-TOKEN') {
      // Laravel URL-encodes the token — decode it for the header
      xsrfToken = decodeURIComponent(value.trim())
    }
  }

  return { cookieHeader: cookieParts.join('; '), setCookies: cookies, xsrfToken }
}

export function getSetCookies(response: Response): string[] {
  return response.headers.getSetCookie?.() ?? []
}

export function createCookieHeader(...cookieSources: string[]): string {
  const cookies = new Map<string, string>()

  for (const source of cookieSources) {
    if (!source) {
      continue
    }

    for (const cookie of source.split(/;\s*/)) {
      const [name] = cookie.split('=')

      if (name) {
        cookies.set(name, cookie)
      }
    }
  }

  return Array.from(cookies.values()).join('; ')
}

export function createCookieHeaderFromSetCookies(setCookies: string[]): string {
  return setCookies.map((cookie) => cookie.split(';')[0]).join('; ')
}

export function uniqueSetCookies(setCookies: string[]): string[] {
  const cookies = new Map<string, string>()

  for (const cookie of setCookies) {
    const [nameValue] = cookie.split(';')
    const [name] = nameValue.split('=')

    if (name) {
      cookies.set(name, cookie)
    }
  }

  return Array.from(cookies.values())
}

export async function readJsonOrNull(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  return JSON.parse(text)
}
