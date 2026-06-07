import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { logSystem } from '@/app/lib/logger'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = decodeSession(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform } = await req.json() as { platform: string }

  const field: Record<string, string> = {
    twitch: 'twitch_token',
    youtube: 'youtube_token',
  }

  if (!field[platform]) {
    return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('user_tokens')
    .update({ [field[platform]]: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logSystem('token.disconnect', `${user.name} desconectou ${platform}`, user.id, { platform, username: user.name })
  return NextResponse.json({ ok: true })
}
