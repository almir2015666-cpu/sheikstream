import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json(null, { status: 401 })
  const user = decodeSession(token)
  if (!user) return NextResponse.json(null, { status: 401 })

  try {
    const db = getSupabaseAdmin()
    const { data: entry } = await db
      .from('waitlist')
      .select('status')
      .eq('platform_id', user.id)
      .maybeSingle()
    if (entry?.status === 'banned') {
      return NextResponse.json({ banned: true }, { status: 403 })
    }
  } catch {
    // Ban check unavailable
  }

  return NextResponse.json(user)
}
