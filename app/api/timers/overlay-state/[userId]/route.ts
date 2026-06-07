import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

type Ctx = { params: Promise<{ userId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId } = await params
  const db = getSupabaseAdmin()

  const { data, error } = await db
    .from('user_tokens')
    .select('overlay_message, overlay_expires_at')
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ message: null })

  const expired = data.overlay_expires_at
    ? new Date(data.overlay_expires_at).getTime() < Date.now()
    : true

  return NextResponse.json({
    message: expired ? null : data.overlay_message,
    expires_at: data.overlay_expires_at,
  })
}
