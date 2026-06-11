import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export type IaVozConfig = {
  lang: string
  wakeEnabled: boolean
  wakeWord: string
  cooldown: number
  minWords: number
  ttsEnabled: boolean
  ttsRate: number
  sendChat: boolean
  emojiEnabled: boolean
  ignoreWords: string
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data } = await db
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', user.id)
    .eq('type', 'ia-voz-config')
    .maybeSingle()

  return NextResponse.json({ cfg: data?.config ?? null })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const cfg: IaVozConfig = body.cfg
  if (!cfg) return NextResponse.json({ error: 'cfg required' }, { status: 400 })

  const db = getSupabaseAdmin()
  await db.from('overlay_configs').upsert(
    { broadcaster_id: user.id, type: 'ia-voz-config', config: cfg },
    { onConflict: 'broadcaster_id,type' }
  )

  return NextResponse.json({ ok: true })
}
