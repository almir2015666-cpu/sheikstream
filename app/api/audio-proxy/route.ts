import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)(\?.*)?$/i
const ALLOWED_CONTENT_TYPES = ['audio/', 'video/ogg', 'application/ogg', 'application/octet-stream']

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

function err(msg: string, status: number) {
  return new NextResponse(JSON.stringify({ error: msg }), { status, headers: JSON_HEADERS })
}

// Try to extract a direct audio URL from an HTML page
function extractAudioFromHtml(html: string, pageUrl: string): string | null {
  const base = new URL(pageUrl).origin

  // Patterns ordered by specificity: data-url, data-sound, <source>, <audio src>
  const patterns = [
    /data-url=["']([^"']+\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?[^"']*)?)["']/i,
    /data-sound=["']([^"']+\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?[^"']*)?)["']/i,
    /data-src=["']([^"']+\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?[^"']*)?)["']/i,
    /<source[^>]+src=["']([^"']+\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?[^"']*)?)["']/i,
    /<audio[^>]+src=["']([^"']+\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?[^"']*)?)["']/i,
    /["']([^"']*\/media\/sounds\/[^"']+\.(?:mp3|wav|ogg))["']/i,
    /["'](https?:\/\/[^"']+\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?[^"']*)?)["']/i,
  ]

  for (const re of patterns) {
    const m = re.exec(html)
    if (m) {
      const found = m[1]
      if (found.startsWith('http')) return found
      if (found.startsWith('//')) return 'https:' + found
      if (found.startsWith('/')) return base + found
    }
  }
  return null
}

async function fetchAudio(audioUrl: string) {
  const res = await fetch(audioUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SheikStream/1.0)' },
    redirect: 'follow',
  })
  if (!res.ok) return null
  const ct = res.headers.get('content-type') ?? ''
  const isAudio = ALLOWED_CONTENT_TYPES.some(t => ct.includes(t)) || AUDIO_EXTENSIONS.test(audioUrl)
  if (!isAudio) return null
  return { buf: await res.arrayBuffer(), ct: ct || 'audio/mpeg' }
}

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url') ?? ''

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  if (!url) return err('URL obrigatória', 400)

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SheikStream/1.0)' },
      redirect: 'follow',
    })
  } catch {
    return err('Falha ao buscar URL. Verifique se o link está correto.', 502)
  }

  if (!res.ok) return err(`Servidor de origem retornou erro ${res.status}`, res.status)

  const ct = res.headers.get('content-type') ?? ''
  const isAudio = ALLOWED_CONTENT_TYPES.some(t => ct.includes(t))

  // Direct audio file — return it
  if (isAudio) {
    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': ct || 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  // HTML page — try to extract embedded audio URL
  if (ct.includes('text/html')) {
    const html = await res.text()
    const audioUrl = extractAudioFromHtml(html, url)
    if (audioUrl) {
      try {
        const audio = await fetchAudio(audioUrl)
        if (audio) {
          return new NextResponse(audio.buf, {
            headers: {
              'Content-Type': audio.ct,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=300',
            },
          })
        }
      } catch {}
    }
    return err(
      'A URL aponta para uma página web e não foi possível encontrar o arquivo de áudio nela. ' +
      'Tente clicar com o botão direito no botão de play do site e copiar o link direto do .mp3.',
      415,
    )
  }

  return err(`Tipo de conteúdo inválido: ${ct || 'desconhecido'}. Esperado: audio/mpeg, audio/wav, etc.`, 415)
}
