import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json(null, { status: 401 })
  const user = decodeSession(token)
  if (!user) return NextResponse.json(null, { status: 401 })
  return NextResponse.json(user)
}
