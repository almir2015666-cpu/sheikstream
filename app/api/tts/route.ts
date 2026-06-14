import { NextRequest, NextResponse } from 'next/server'

// Try multiple free TTS sources in order
async function fetchTts(text: string, lang: string): Promise<ArrayBuffer | null> {
  const q = encodeURIComponent(text)
  const l = encodeURIComponent(lang)

  // 1. Google Translate TTS (client=gtx is less restricted than tw-ob)
  try {
    const r = await fetch(
      `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${q}&tl=${l}&client=gtx&ttsspeed=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://translate.google.com/',
        },
      }
    )
    if (r.ok) {
      const buf = await r.arrayBuffer()
      if (buf.byteLength > 100) return buf
    }
  } catch {}

  // 2. Google Translate TTS (classic endpoint)
  try {
    const r = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=${l}&client=t&ttsspeed=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*',
          'Referer': 'https://translate.google.com/',
        },
      }
    )
    if (r.ok) {
      const buf = await r.arrayBuffer()
      if (buf.byteLength > 100) return buf
    }
  } catch {}

  return null
}

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get('text') || '').slice(0, 200)
  const lang = req.nextUrl.searchParams.get('lang') || 'pt-BR'
  if (!text.trim()) return NextResponse.json({ error: 'no text' }, { status: 400 })

  const buf = await fetchTts(text, lang)
  if (!buf) return NextResponse.json({ error: 'all_tts_failed' }, { status: 502 })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
