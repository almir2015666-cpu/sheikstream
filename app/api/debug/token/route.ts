import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null

  if (!user) return NextResponse.json({ error: 'Não logado', user: null })

  const db = getSupabaseAdmin()

  const { data, error } = await db
    .from('user_tokens')
    .select('user_id, twitch_username, twitch_token, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    user_id: user.id,
    user_name: user.name,
    row: data,
    db_error: error ? { code: error.code, message: error.message } : null,
  })
}
