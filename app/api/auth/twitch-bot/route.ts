import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'

const REDIRECT_URI = 'https://sheikstream.com.br/api/auth/twitch/callback'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = decodeSession(token)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'user:read:chat user:write:chat user:bot chat:edit',
    force_verify: 'true',
    state: `bot:popup:${user.id}`,
  })
  return NextResponse.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`)
}
