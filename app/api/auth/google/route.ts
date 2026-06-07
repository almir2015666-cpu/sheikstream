import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = 'https://sheikstream.com.br/api/auth/google/callback'

export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(`${BASE}/login?error=google_not_configured`)
  }
  const popup = req.nextUrl.searchParams.get('popup')
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
    state: popup ? 'popup' : 'normal',
  })
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
