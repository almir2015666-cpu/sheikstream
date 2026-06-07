import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { logActivity } from '@/app/lib/log-activity'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null

  if (user) {
    await logActivity('auth', 'logout', user.name, user.platform ?? null)
  }

  const response = NextResponse.redirect(new URL('/login', req.url))
  response.cookies.delete(COOKIE_NAME)
  return response
}
