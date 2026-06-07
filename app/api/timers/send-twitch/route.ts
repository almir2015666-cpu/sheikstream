import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { channel_id, message, access_token } = await req.json()

    if (!channel_id || !message || !access_token) {
      return NextResponse.json({ error: 'channel_id, message e access_token são obrigatórios' }, { status: 400 })
    }

    const res = await fetch('https://api.twitch.tv/helix/chat/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: channel_id,
        sender_id: channel_id,
        message,
      }),
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: (body as { message?: string }).message ?? `Twitch API error ${res.status}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
