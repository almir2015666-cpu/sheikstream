import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function logError(
  endpoint: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  try {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? (error.stack ?? null) : null
    await getSupabaseAdmin().from('error_logs').insert({
      endpoint,
      error_message: message,
      error_stack: stack,
      user_id: (context?.user_id as string) ?? null,
      context: context ?? null,
    })
  } catch {
    // never throw from logger
  }
}

export async function logSystem(
  type: string,
  message: string,
  userId?: string | null,
  data?: Record<string, unknown>
) {
  try {
    await getSupabaseAdmin().from('system_logs').insert({
      type,
      message,
      user_id: userId ?? null,
      data: data ?? null,
    })
  } catch {
    // never throw from logger
  }
}
