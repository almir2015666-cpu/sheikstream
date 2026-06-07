import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function isAdminPassword(password: string): Promise<boolean> {
  if (!password) return false
  if (password === process.env.ADMIN_PASSWORD) return true
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('admin_passwords')
    .select('id, expires_at')
    .eq('password', password)
    .eq('active', true)
    .single()
  if (!data) return false
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false
  return true
}
