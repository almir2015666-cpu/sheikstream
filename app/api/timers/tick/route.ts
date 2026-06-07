import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sheikstream.com'

async function sendTwitch(access_token: string, channel_id: string, message: string) {
  const res = await fetch(`${BASE}/api/timers/send-twitch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token, channel_id, message }),
  })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error ?? `Twitch error ${res.status}`)
  }
}

async function sendYouTube(access_token: string, live_chat_id: string, message: string) {
  const res = await fetch(`${BASE}/api/timers/send-youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token, live_chat_id, message }),
  })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error ?? `YouTube error ${res.status}`)
  }
}

async function sendKick(user_id: string, message: string) {
  const res = await fetch(`${BASE}/api/timers/send-kick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, message }),
  })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error ?? `Kick overlay error ${res.status}`)
  }
}

async function sendTikTok(user_id: string, message: string) {
  // TikTok has no official live chat API — use overlay queue
  await sendKick(user_id, message)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const now = new Date()

  // Find all active timers whose next fire time has passed
  const { data: timers, error } = await db
    .from('timers')
    .select('*')
    .eq('ativo', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!timers || timers.length === 0) return NextResponse.json({ fired: 0 })

  const duePlats = (
    plataformas: string[],
    tipo_saida: string
  ): string[] => {
    if (tipo_saida === 'overlay') return plataformas
    return plataformas
  }

  let fired = 0

  for (const timer of timers) {
    const intervalMs = timer.intervalo_minutos * 60 * 1000
    const lastFired = timer.ultimo_disparo ? new Date(timer.ultimo_disparo).getTime() : 0
    if (now.getTime() - lastFired < intervalMs) continue

    fired++

    // Load user tokens
    const { data: tokenRow } = await db
      .from('user_tokens')
      .select('*')
      .eq('user_id', timer.user_id)
      .single()

    const plataformas: string[] = Array.isArray(timer.plataformas) ? timer.plataformas : []
    const logs: Array<{ timer_id: string; plataforma: string; status: string; erro: string | null }> = []

    for (const plat of plataformas) {
      let status = 'success'
      let erro: string | null = null

      try {
        if (plat === 'twitch' && timer.tipo_saida !== 'overlay') {
          if (!tokenRow?.twitch_token || !tokenRow?.twitch_channel_id) {
            throw new Error('Token Twitch não encontrado')
          }
          await sendTwitch(tokenRow.twitch_token, tokenRow.twitch_channel_id, timer.mensagem)
        } else if (plat === 'youtube' && timer.tipo_saida !== 'overlay') {
          if (!tokenRow?.youtube_token || !tokenRow?.youtube_live_chat_id) {
            throw new Error('Token YouTube não encontrado')
          }
          await sendYouTube(tokenRow.youtube_token, tokenRow.youtube_live_chat_id, timer.mensagem)
        } else if (plat === 'kick') {
          await sendKick(timer.user_id, timer.mensagem)
        } else if (plat === 'tiktok') {
          await sendTikTok(timer.user_id, timer.mensagem)
        }

        // If tipo_saida is 'both' or 'overlay', also write to overlay queue for all platforms
        if (timer.tipo_saida === 'both' || timer.tipo_saida === 'overlay') {
          const expires = new Date(now.getTime() + 10_000).toISOString()
          await db
            .from('user_tokens')
            .upsert(
              {
                user_id: timer.user_id,
                overlay_message: timer.mensagem,
                overlay_expires_at: expires,
                updated_at: now.toISOString(),
              },
              { onConflict: 'user_id' }
            )
        }
      } catch (e: unknown) {
        status = 'error'
        erro = String(e)
      }

      logs.push({ timer_id: timer.id, plataforma: plat, status, erro })
    }

    // Batch insert logs
    if (logs.length > 0) {
      await db.from('timer_logs').insert(logs)
    }

    // Update ultimo_disparo
    await db
      .from('timers')
      .update({ ultimo_disparo: now.toISOString() })
      .eq('id', timer.id)
  }

  return NextResponse.json({ fired, checkedAt: now.toISOString() })
}
