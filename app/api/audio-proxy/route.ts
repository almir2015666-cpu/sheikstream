import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)(\?.*)?$/i
const ALLOWED_CONTENT_TYPES = ['audio/', 'video/ogg', 'application/ogg', 'application/octet-stream']
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
const AUDIO_HEADERS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' }

function err(msg: string, status: number) {
  return new NextResponse(JSON.stringify({ error: msg }), { status, headers: JSON_HEADERS })
}

function audioResponse(buf: ArrayBuffer, ct: string) {
  return new NextResponse(buf, { headers: { 'Content-Type': ct, ...AUDIO_HEADERS } })
}

// For known sites, guess the direct audio URL without fetching the page
function guessDirectAudioUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // myinstants.com: /pt/instant/slug/ or /en/instant/slug/
    if (u.hostname.includes('myinstants.com')) {
      const m = /\/instant\/([^/?#]+)/i.exec(u.pathname)
      if (m) return `https://www.myinstants.com/media/sounds/${m[1]}.mp3`
    }
  } catch {}
  return null
}

// Try to extract a direct audio URL from an HTML page via regex
function extractAudioFromHtml(html: string, pageUrl: string): string | null {
  const base = new URL(pageUrl).origin
  const EXT = '(?:mp3|wav|ogg|m4a|aac|flac|opus)'
  const patterns = [
    new RegExp(`data-url=["']([^"']+\\.${EXT}(?:\\?[^"']*)?)["']`, 'i'),
    new RegExp(`data-sound=["']([^"']+\\.${EXT}(?:\\?[^"']*)?)["']`, 'i'),
    new RegExp(`data-src=["']([^"']+\\.${EXT}(?:\\?[^"']*)?)["']`, 'i'),
    new RegExp(`<source[^>]+src=["']([^"']+\\.${EXT}(?:\\?[^"']*)?)["']`, 'i'),
    new RegExp(`<audio[^>]+src=["']([^"']+\\.${EXT}(?:\\?[^"']*)?)["']`, 'i'),
    new RegExp(`play\\(['"]([^'"]+\\.${EXT}[^'"]*)['"]\\)`, 'i'),
    new RegExp(`["']([^"']*/media/sounds/[^"']+\\.${EXT})["']`, 'i'),
    new RegExp(`["'](https?://[^"']+\\.${EXT}(?:\\?[^"']*)?)["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = re.exec(html)
    if (!m) continue
    const found = m[1]
    if (found.startsWith('http')) return found
    if (found.startsWith('//')) return 'https:' + found
    if (found.startsWith('/')) return base + found
  }
  return null
}

async function fetchAudio(audioUrl: string): Promise<{ buf: ArrayBuffer; ct: string } | null> {
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

  // For known sites (e.g. myinstants), try constructing a direct audio URL first
  const guessed = guessDirectAudioUrl(url)
  if (guessed) {
    try {
      const audio = await fetchAudio(guessed)
      if (audio) return audioResponse(audio.buf, audio.ct)
    } catch {}
  }

  // Fetch the original URL
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

  if (isAudio) {
    return audioResponse(await res.arrayBuffer(), ct || 'audio/mpeg')
  }

  // HTML page — try to extract audio URL from the markup
  if (ct.includes('text/html')) {
    const html = await res.text()
    const audioUrl = extractAudioFromHtml(html, url)
    if (audioUrl) {
      try {
        const audio = await fetchAudio(audioUrl)
        if (audio) return audioResponse(audio.buf, audio.ct)
      } catch {}
    }
    return err(
      'Não foi possível encontrar o arquivo de áudio nessa página. ' +
      'Use o link direto do arquivo .mp3 (clique com botão direito no botão de play → copiar endereço do áudio).',
      415,
    )
  }

  return err(`Tipo de conteúdo inválido: ${ct || 'desconhecido'}. Esperado: audio/mpeg, audio/wav, etc.`, 415)
}
