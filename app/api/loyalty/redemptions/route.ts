import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('loyalty_redemptions')
    .select('*, loyalty_rewards(name, cost)')
    .eq('broadcaster_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  const db = getSupabaseAdmin()

  if (status === 'rejected') {
    const { data: redemption } = await db.from('loyalty_redemptions').select('*, loyalty_rewards(cost)').eq('id', id).eq('broadcaster_id', user.id).single()
    if (redemption) {
      const cost = (redemption.loyalty_rewards as { cost?: number } | null)?.cost ?? 0
      if (cost > 0) {
        const { data: lp } = await db.from('loyalty_points').select('points').eq('broadcaster_id', user.id).eq('viewer_login', redemption.viewer_login).maybeSingle()
        if (lp) {
          await db.from('loyalty_points').update({ points: (lp.points ?? 0) + cost, updated_at: new Date().toISOString() }).eq('broadcaster_id', user.id).eq('viewer_login', redemption.viewer_login)
        }
      }
    }
  }

  const { data, error } = await db.from('loyalty_redemptions').update({ status }).eq('id', id).eq('broadcaster_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
