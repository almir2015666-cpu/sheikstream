import { getSupabaseAdmin } from '@/app/lib/supabase'

type LogCategory = 'auth' | 'dashboard' | 'feature'

export async function logActivity(
  category: LogCategory,
  event: string,
  username?: string | null,
  platform?: string | null,
  details?: string | null,
) {
  try {
    const db = getSupabaseAdmin()
    await db.from('activity_logs').insert({
      category,
      event,
      username: username ?? null,
      platform: platform ?? null,
      details: details ?? null,
    })
  } catch { /* logging failure is never critical */ }
}
