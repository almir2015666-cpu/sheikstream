import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['audio/', 'video/ogg', 'application/ogg', 'application/octet-stream']

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') ?? ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return new NextResponse('URL inválida', { status: 400 })
  }

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SheikStream/1.0)' },
      redirect: 'follow',
    })
  } catch {
    return new NextResponse('Falha ao buscar URL', { status: 502 })
  }

  if (!res.ok) return new NextResponse('Origem retornou erro', { status: res.status })

  const ct = res.headers.get('content-type') ?? 'audio/mpeg'
  if (!ALLOWED_TYPES.some(t => ct.includes(t))) {
    return new NextResponse('Tipo de conteúdo não permitido', { status: 415 })
  }

  const buf = await res.arrayBuffer()
  return new NextResponse(buf, {
    headers: {
      'Content-Type': ct,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
