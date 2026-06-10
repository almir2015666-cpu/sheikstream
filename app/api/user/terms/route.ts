import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ needs_acceptance: true })
  const { data } = await getSupabaseAdmin()
    .from('users')
    .select('terms_accepted_at,privacy_accepted_at,marketing_emails')
    .eq('id', user.id)
    .maybeSingle()
  return NextResponse.json({
    terms_accepted:    !!data?.terms_accepted_at,
    privacy_accepted:  !!data?.privacy_accepted_at,
    marketing_emails:  data?.marketing_emails ?? false,
    needs_acceptance:  !data?.terms_accepted_at || !data?.privacy_accepted_at,
  })
}

export async function POST(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { terms, privacy, marketing } = await req.json()
  const now = new Date().toISOString()
  await getSupabaseAdmin()
    .from('users')
    .update({
      terms_accepted_at:   terms   ? now : null,
      privacy_accepted_at: privacy ? now : null,
      marketing_emails:    !!marketing,
    })
    .eq('id', user.id)
  return NextResponse.json({ ok: true })
}
