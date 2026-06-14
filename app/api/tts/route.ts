import { NextRequest, NextResponse } from 'next/server'

// Google Translate TTS — unofficial but widely used, no API key needed
const GTTS = 'https://translate.google.com/translate_tts'

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get('text') || '').slice(0, 200)
  const lang = req.nextUrl.searchParams.get('lang') || 'pt-BR'
  if (!text.trim()) return NextResponse.json({ error: 'no text' }, { status: 400 })

  try {
    const url = `${GTTS}?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob&ttsspeed=1`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    })
    if (!res.ok) return NextResponse.json({ error: 'tts_failed', status: res.status }, { status: 502 })
    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
