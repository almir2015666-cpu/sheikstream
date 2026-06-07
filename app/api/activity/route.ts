import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { logActivity } from '@/app/lib/log-activity'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null

  const body = await req.json().catch(() => ({}))
  const { category, event, details } = body as { category?: string; event?: string; details?: string }

  if (!category || !event) return NextResponse.json({ ok: false }, { status: 400 })

  await logActivity(
    category as 'auth' | 'dashboard' | 'feature',
    event,
    user?.name ?? null,
    user?.platform ?? null,
    details ?? null,
  )

  return NextResponse.json({ ok: true })
}
