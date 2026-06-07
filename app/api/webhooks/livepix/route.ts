import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return new NextResponse('Bad Request', { status: 400 })

  const amount = Number(body.data?.amount ?? body.amount ?? 0) / 100
  const message = String(body.data?.message ?? body.message ?? '').toLowerCase()
  const channelId = String(body.data?.channel_id ?? body.channel_id ?? body.broadcaster_id ?? '')
  const donorName = String(body.data?.donor?.name ?? body.donor?.name ?? 'Anônimo')

  const db = getSupabaseAdmin()

  if (channelId && amount > 0) {
    // Record in donors table
    await db.from('livepix_donors').insert({
      broadcaster_id: channelId,
      username: donorName,
      amount,
      message: message || null,
      is_manual: false,
      tickets: Math.max(1, Math.floor(amount)),
      date: new Date().toISOString().split('T')[0],
    }).catch(() => {})

    const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', channelId).single()
    if (sub?.is_active) {
      const secsPerUnit = Number(sub.seconds_per_livepix ?? 120)
      const units = Math.max(1, Math.floor(amount))
      const secondsToAdd = secsPerUnit * units
      const now = new Date()
      if (!sub.is_paused && sub.end_time) {
        const base = new Date(sub.end_time) > now ? new Date(sub.end_time) : now
        await db.from('subathon_state').update({
          end_time: new Date(base.getTime() + secondsToAdd * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', channelId)
      } else if (sub.is_paused) {
        await db.from('subathon_state').update({
          paused_remaining: (sub.paused_remaining ?? 0) + secondsToAdd,
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', channelId)
      }
    }

    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', channelId).eq('type', 'donations').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: Number(m.current_value) + amount }).eq('id', m.id)
    }
  }

  if (message.includes('dev') || message.includes('apoiar') || message.includes('suporte')) {
    const { data: banner } = await db.from('dev_banner').select('*').eq('id', 1).single()
    if (banner?.active) {
      await db.from('dev_banner').update({
        amount_current: Number(banner.amount_current) + amount,
        supporter_count: Number(banner.supporter_count) + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', 1)
    }
  }

  console.log(`[livepix] ${donorName} doou R$${amount.toFixed(2)} — canal: ${channelId || 'n/a'} — msg: ${message || 'n/a'}`)
  return NextResponse.json({ ok: true })
}
