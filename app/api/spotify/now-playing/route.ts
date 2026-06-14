import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getNowPlaying } from '@/app/lib/spotify'

export async function GET(req: NextRequest) {
  // Support both authenticated and uid-based access (for overlay)
  const { searchParams } = new URL(req.url)
  const uid = searchParams.get('uid')

  let broadcasterId: string | null = null
  if (uid) {
    broadcasterId = uid
  } else {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = decodeSession(token)
    broadcasterId = user?.id ?? null
  }

  if (!broadcasterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await getNowPlaying(broadcasterId)
  return NextResponse.json(data)
}
