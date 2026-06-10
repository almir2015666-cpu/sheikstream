import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    kick_client_id_set: !!process.env.KICK_CLIENT_ID,
    kick_client_secret_set: !!process.env.KICK_CLIENT_SECRET,
    kick_webhook_secret_set: !!process.env.KICK_WEBHOOK_SECRET,
    spotify_client_id_set: !!process.env.SPOTIFY_CLIENT_ID,
    spotify_client_secret_set: !!process.env.SPOTIFY_CLIENT_SECRET,
    twitch_client_id_set: !!process.env.TWITCH_CLIENT_ID,
    twitch_client_secret_set: !!process.env.TWITCH_CLIENT_SECRET,
  })
}
