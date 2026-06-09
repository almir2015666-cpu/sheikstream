import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const BUCKET = 'overlay-assets'
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

async function ensureBucket(db: ReturnType<typeof getSupabaseAdmin>) {
  const { error } = await db.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
    fileSizeLimit: MAX_BYTES,
  })
  // Ignore "already exists" error
  if (error && !error.message?.includes('already exists') && !error.message?.includes('Duplicate')) {
    throw error
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { data: b64, mimeType, assetType } = body as { data: string; mimeType: string; assetType: string }

  if (!b64 || !mimeType || !assetType) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowed.includes(mimeType)) {
    return NextResponse.json({ error: 'Tipo de imagem não suportado' }, { status: 400 })
  }

  const base64Data = b64.includes(',') ? b64.split(',')[1] : b64
  const bytes = Buffer.from(base64Data, 'base64')
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 4 MB)' }, { status: 400 })
  }

  const ext = mimeType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
  const filename = `${user.id}/${assetType}_${Date.now()}.${ext}`

  const db = getSupabaseAdmin()
  try {
    await ensureBucket(db)
  } catch (e: unknown) {
    return NextResponse.json({ error: `Erro ao criar bucket: ${(e as Error).message}` }, { status: 500 })
  }

  const { error: upErr } = await db.storage.from(BUCKET).upload(filename, bytes, {
    contentType: mimeType,
    upsert: true,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: urlData.publicUrl })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { url } = await req.json() as { url: string }
  if (!url) return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 })

  // Extract path after bucket name
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return NextResponse.json({ ok: true }) // not our asset

  const path = url.slice(idx + marker.length)
  // Security: only allow deleting own assets
  if (!path.startsWith(user.id + '/')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const db = getSupabaseAdmin()
  await db.storage.from(BUCKET).remove([path])
  return NextResponse.json({ ok: true })
}
