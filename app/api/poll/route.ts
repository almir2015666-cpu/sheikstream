import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const TYPE = 'poll'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  const id = uid ?? getUser(req)?.id
  if (!id) return NextResponse.json(null)
  const { data } = await getSupabaseAdmin()
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', id)
    .eq('type', TYPE)
    .maybeSingle()
  if (!data?.config) return NextResponse.json(null, { headers: { 'Cache-Control': 'no-store' } })
  // Strip internal voters list before returning — clients don't need it
  const { voters: _v, ...pub } = data.config as Record<string, unknown> & { voters?: unknown }
  return NextResponse.json(pub, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { question, options } = body
  if (!question?.trim() || !Array.isArray(options) || options.length < 2)
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const config = {
    question: question.trim(),
    options: options.map((o: string) => ({ text: o.trim(), votes: 0 })),
    status: 'active',
    voters: [],
    created_at: new Date().toISOString(),
  }
  await getSupabaseAdmin()
    .from('overlay_configs')
    .upsert({ broadcaster_id: user.id, type: TYPE, config, updated_at: new Date().toISOString() },
      { onConflict: 'broadcaster_id,type' })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()

  if (body.close || body.reset) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data } = await getSupabaseAdmin()
      .from('overlay_configs').select('config')
      .eq('broadcaster_id', user.id).eq('type', TYPE).maybeSingle()
    if (!data?.config) return NextResponse.json({ error: 'No poll' }, { status: 404 })
    const newCfg = body.reset
      ? { ...data.config, options: data.config.options.map((o: { text: string }) => ({ ...o, votes: 0 })), status: 'active', voters: [] }
      : { ...data.config, status: 'closed' }
    await getSupabaseAdmin()
      .from('overlay_configs')
      .update({ config: newCfg, updated_at: new Date().toISOString() })
      .eq('broadcaster_id', user.id).eq('type', TYPE)
    return NextResponse.json({ ok: true })
  }

  // public vote
  const { uid, optionIndex, username } = body
  if (!uid || optionIndex === undefined) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('overlay_configs').select('config')
    .eq('broadcaster_id', uid).eq('type', TYPE).maybeSingle()
  if (!data?.config || data.config.status !== 'active')
    return NextResponse.json({ error: 'No active poll' }, { status: 404 })

  const cfg = data.config as Record<string, unknown> & { options: { text: string; votes: number }[]; voters?: string[] }
  const options = [...cfg.options]
  if (optionIndex < 0 || optionIndex >= options.length)
    return NextResponse.json({ error: 'Invalid option' }, { status: 400 })

  // Server-side dedup by username
  if (username) {
    const voters: string[] = cfg.voters ?? []
    const key = String(username).toLowerCase()
    if (voters.includes(key)) return NextResponse.json({ error: 'Already voted' }, { status: 409 })
    options[optionIndex] = { ...options[optionIndex], votes: (options[optionIndex].votes ?? 0) + 1 }
    await db.from('overlay_configs')
      .update({ config: { ...cfg, options, voters: [...voters, key] }, updated_at: new Date().toISOString() })
      .eq('broadcaster_id', uid).eq('type', TYPE)
  } else {
    // URL-based voting (no username) — no dedup, trust client
    options[optionIndex] = { ...options[optionIndex], votes: (options[optionIndex].votes ?? 0) + 1 }
    await db.from('overlay_configs')
      .update({ config: { ...cfg, options }, updated_at: new Date().toISOString() })
      .eq('broadcaster_id', uid).eq('type', TYPE)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await getSupabaseAdmin()
    .from('overlay_configs')
    .delete()
    .eq('broadcaster_id', user.id).eq('type', TYPE)
  return NextResponse.json({ ok: true })
}
