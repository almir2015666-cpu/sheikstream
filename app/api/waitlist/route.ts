import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  const { platform, platform_username, email } = await req.json()
  if (!platform) return NextResponse.json({ error: 'Plataforma obrigatória' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('waitlist')
    .insert({ platform, platform_username, email, status: 'pending' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
