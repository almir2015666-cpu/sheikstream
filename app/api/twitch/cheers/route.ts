import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const days = Number(url.searchParams.get('days') || 30)
  const since = from ?? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const until = to ?? new Date().toISOString().split('T')[0]

  const { data, error } = await getSupabaseAdmin()
    .from('twitch_cheers')
    .select('*')
    .eq('broadcaster_id', user.id)
    .gte('date', since)
    .lte('date', until)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
