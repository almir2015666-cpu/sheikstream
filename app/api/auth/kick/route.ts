import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/kick/callback`

export async function GET(req: NextRequest) {
  if (!process.env.KICK_CLIENT_ID) {
    return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=kick_not_configured`)
  }
  const isPopup = req.nextUrl.searchParams.get('popup') === '1'
  const params = new URLSearchParams({
    client_id: process.env.KICK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'user:read channel:read events:subscribe',
    state: isPopup ? 'popup' : 'default',
  })
  return NextResponse.redirect(`https://id.kick.com/oauth/authorize?${params}`)
}
