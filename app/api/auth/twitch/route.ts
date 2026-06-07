import { NextResponse } from 'next/server'

const REDIRECT_URI = 'https://sheikstream.vercel.app/api/auth/twitch/callback'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'user:read:email',
    force_verify: 'true',
  })
  return NextResponse.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`)
}
