import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'

// Stores the last 5 raw webhook payloads so admins can diagnose Livepix integration
const recentPayloads: { ts: string; slug: string; body: unknown }[] = []

export function storeDebugPayload(slug: string, body: unknown) {
  recentPayloads.unshift({ ts: new Date().toISOString(), slug, body })
  if (recentPayloads.length > 5) recentPayloads.pop()
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    recent_webhooks: recentPayloads,
    note: 'Last 5 raw payloads received at /api/livepix/webhook/[slug]',
  })
}
