import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/twitch/callback`,
    response_type: 'code',
    scope: 'user:read:email',
  })
  return NextResponse.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`)
}
