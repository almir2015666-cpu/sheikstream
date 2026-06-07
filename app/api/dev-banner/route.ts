import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('dev_banner')
      .select('*')
      .eq('id', 1)
      .single()
    if (error || !data) return NextResponse.json({ active: false })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ active: false })
  }
}
