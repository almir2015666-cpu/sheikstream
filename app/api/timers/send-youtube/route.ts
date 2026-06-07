import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { live_chat_id, message, access_token } = await req.json()

    if (!live_chat_id || !message || !access_token) {
      return NextResponse.json({ error: 'live_chat_id, message e access_token são obrigatórios' }, { status: 400 })
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            liveChatId: live_chat_id,
            type: 'textMessageEvent',
            textMessageDetails: { messageText: message },
          },
        }),
      }
    )

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      const errBody = body as { error?: { message?: string } }
      return NextResponse.json(
        { error: errBody.error?.message ?? `YouTube API error ${res.status}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
