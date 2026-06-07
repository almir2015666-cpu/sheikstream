import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET() {
  try {
    const db = getSupabaseAdmin()
    const { count, error } = await db
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
    if (error) return NextResponse.json({ count: 0 }, { status: 500 })
    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
