import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('ai_image_generations')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({ image_url: data.image_url })
}
