import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { user_id, message } = await req.json()

    if (!user_id || !message) {
      return NextResponse.json({ error: 'user_id e message são obrigatórios' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Kick has no official chat API — save to overlay queue so the OBS overlay picks it up
    const expires = new Date(Date.now() + 10_000).toISOString()
    const { error } = await db
      .from('user_tokens')
      .upsert(
        { user_id, overlay_message: message, overlay_expires_at: expires, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, via: 'overlay' })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
