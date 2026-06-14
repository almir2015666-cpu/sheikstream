import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { skipSpotifyTrack } from '@/app/lib/spotify'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()

  // Mark current playing as skipped
  await db.from('song_requests').update({ status: 'skipped' })
    .eq('broadcaster_id', user.id).eq('status', 'playing')

  // Skip on Spotify
  const ok = await skipSpotifyTrack(user.id)

  // Promote next pending to playing
  const { data: next } = await db.from('song_requests').select('id')
    .eq('broadcaster_id', user.id).eq('status', 'pending')
    .order('position', { ascending: true }).limit(1).maybeSingle()
  if (next) {
    await db.from('song_requests').update({ status: 'playing' }).eq('id', next.id)
  }

  return NextResponse.json({ ok, next: next?.id ?? null })
}
