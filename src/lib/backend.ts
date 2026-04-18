// Server-side only — backend base URL for Next.js API routes
export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'
export const BACKEND_TIMEOUT_MS = parseInt(process.env.BACKEND_TIMEOUT_MS ?? '5000', 10)
