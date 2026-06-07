import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/session'

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url))
  response.cookies.delete(COOKIE_NAME)
  return response
}
