import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { pauseSpotify, resumeSpotify, previousSpotify } from '@/app/lib/spotify'

export async function PUT(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = decodeSession(token)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json()
  if (action === 'pause') {
    const ok = await pauseSpotify(user.id)
    return NextResponse.json({ ok })
  }
  if (action === 'resume') {
    const ok = await resumeSpotify(user.id)
    return NextResponse.json({ ok })
  }
  if (action === 'previous') {
    const ok = await previousSpotify(user.id)
    return NextResponse.json({ ok })
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
