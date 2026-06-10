import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/kick/callback`

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(req: NextRequest) {
  if (!process.env.KICK_CLIENT_ID) {
    return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=kick_not_configured`)
  }
  const isPopup = req.nextUrl.searchParams.get('popup') === '1'

  // PKCE
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest())

  const params = new URLSearchParams({
    client_id: process.env.KICK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'user:read channel:read events:subscribe',
    state: isPopup ? 'popup' : 'default',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  const res = NextResponse.redirect(`https://id.kick.com/oauth/authorize?${params}`)
  res.cookies.set('kick_verifier', verifier, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
  })
  return res
}
