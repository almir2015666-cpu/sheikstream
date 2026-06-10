import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    kick_client_id_set: !!process.env.KICK_CLIENT_ID,
    kick_client_secret_set: !!process.env.KICK_CLIENT_SECRET,
    kick_webhook_secret_set: !!process.env.KICK_WEBHOOK_SECRET,
    kick_client_id_preview: process.env.KICK_CLIENT_ID?.slice(0, 6) ?? 'NOT SET',
  })
}
