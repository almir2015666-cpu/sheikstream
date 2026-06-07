import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'sk-local-secret'
export const COOKIE_NAME = 'sk-s2'

export type SessionUser = {
  id: string
  name: string
  email: string
  image: string
  platform?: string
}

export function encodeSession(user: SessionUser): string {
  const data = Buffer.from(JSON.stringify(user)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function decodeSession(token: string): SessionUser | null {
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const data = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  if (expected !== sig) return null
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionUser
  } catch {
    return null
  }
}
