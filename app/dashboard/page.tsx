'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.15)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  rad: '16px', radSm: '12px',
}

const PLAT_COLOR: Record<string, string> = {
  livepix: '#ff4d6d', twitch: '#9147ff', kick: '#53fc18',
  paypal: '#009cde', youtube: '#ff0000', tiktok: '#69c9d0',
}
const PLAT_LABEL: Record<string, string> = {
  livepix: 'Livepix', twitch: 'Twitch', kick: 'Kick',
  paypal: 'PayPal', youtube: 'YouTube', tiktok: 'TikTok',
}
const TYPE_LABEL: Record<string, string> = {
  donation: 'doou', sub: 'assinou na', resub: 'reinscreveu na',
  giftsub: 'presenteou na', bits: 'enviou bits na', follow: 'seguiu na',
}

const USD_BRL = 5.70
const REPASSE = [
  { label: 'Livepix',  key: 'livepix',  color: '#ff2d6b', pct: 95, brl: true,  threshold: 0   },
  { label: 'Twitch',   key: 'twitch',   color: '#a855f7', pct: 50, brl: false, threshold: 50  },
  { label: 'YouTube',  key: 'youtube',  color: '#ff3333', pct: 70, brl: false, threshold: 100 },
  { label: 'Kick',     key: 'kick',     color: '#39ff14', pct: 50, brl: false, threshold: 50  },
  { label: 'TikTok',   key: 'tiktok',   color: '#00e5ff', pct: 50, brl: false, threshold: 50, badge: 'NOVO' as const },
  { label: 'PayPal',   key: 'paypal',   color: '#00b4ff', pct: 97, brl: true,  threshold: 0   },
]

type Period = '7d' | '30d' | '90d' | 'custom'
const PERIODS: [Period, string][] = [['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['custom','Personalizado']]
type Activity = { id: string; platform: string; type: string; username: string; amount?: number; created_at: string }
type ChannelStats = { broadcaster_name: string; title: string; game_name: string; is_live: boolean; viewer_count: number; started_at: string | null; follower_count: number | null; view_count: number | null; language: string; broadcaster_login: string }
type DashStats = { livepix_total: number; livepix_donors: number; livepix_unique: number; twitch_subs: number; twitch_tickets: number; twitch_total: number; tickets_total: number; participants: number }

function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
function fmtBRL(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtUSD(v: number) { return `U$ ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtNum(v: number) { return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) }
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'há 1 dia'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  if (months < 12) return `há cerca de ${months === 1 ? '1 mês' : `${months} meses`}`
  const years = Math.floor(months / 12)
  return `há cerca de ${years === 1 ? '1 ano' : `${years} anos`}`
}

function PlatIcon({ p, size = 14 }: { p: string; size?: number }) {
  const color = PLAT_COLOR[p] ?? '#888'
  if (p === 'livepix') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )
  if (p === 'twitch') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  )
  if (p === 'youtube') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
  if (p === 'kick') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M2 2h7v20H2zm8 8l5-8h7L17 12l5 10h-7l-5-8z"/>
    </svg>
  )
  if (p === 'tiktok') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
  if (p === 'paypal') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.82c-.524 0-.968.382-1.05.9l-1.12 7.106H4.32l2.107-13.27h5.152c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.344-.553.515-1.052.515-1.503 0-.352-.073-.686-.215-.984.516.203.965.49 1.356.85.975.892 1.295 2.297.964 4.34z"/>
    </svg>
  )
  return null
}

function buildDailyData(activities: Activity[], fromStr: string, toStr: string) {
  const from = new Date(fromStr), to = new Date(toStr)
  const days: string[] = []
  const cur = new Date(from)
  while (cur <= to) { days.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1) }
  const byDate: Record<string, Record<string, number>> = {}
  for (const day of days) byDate[day] = {}
  for (const a of activities) {
    if (!a.amount || a.amount <= 0) continue
    const day = a.created_at.slice(0, 10)
    if (!byDate[day]) continue
    byDate[day][a.platform] = (byDate[day][a.platform] ?? 0) + a.amount
  }
  return { days, byDate }
}

function BarChart({ activities, from, to }: { activities: Activity[]; from: string; to: string }) {
  const { days, byDate } = buildDailyData(activities, from, to)
  const platforms = ['livepix', 'twitch', 'kick', 'paypal', 'youtube', 'tiktok']
  const platTotals: Record<string, number> = {}
  for (const a of activities) {
    if (a.amount && a.amount > 0) platTotals[a.platform] = (platTotals[a.platform] ?? 0) + a.amount
  }
  const grandTotal = Object.values(platTotals).reduce((s, v) => s + v, 0)
  const dailyTotals = days.map(d => Object.values(byDate[d]).reduce((s, v) => s + v, 0))
  const maxBar = Math.max(...dailyTotals, 0.01)
  const W = 800, H = 140, BAR_AREA_H = 110
  const barW = Math.max(2, Math.floor(W / Math.max(days.length, 1)) - 1)
  const gap = (W - barW * days.length) / Math.max(days.length - 1, 1)
  const labelStep = Math.max(1, Math.ceil(days.length / 6))
  const labelDays = days.filter((_, i) => i % labelStep === 0)
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; day: string; data: Record<string, number> } | null>(null)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: '0.6rem' }}>Passe o mouse sobre uma barra para ver o detalhamento</div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} onMouseLeave={() => { setHovered(null); setTooltip(null) }}>
          <line x1={0} y1={BAR_AREA_H} x2={W} y2={BAR_AREA_H} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          {days.map((day, i) => {
            const x = i * (barW + gap)
            const dayTotal = dailyTotals[i]
            if (dayTotal === 0) return null
            let yOff = BAR_AREA_H
            return (
              <g key={day} onMouseEnter={() => { setHovered(day); setTooltip({ x: i / days.length, day, data: byDate[day] }) }} style={{ cursor: 'pointer' }}>
                {platforms.map(p => {
                  const val = byDate[day][p] ?? 0
                  if (!val) return null
                  const bh = Math.max(2, (val / maxBar) * BAR_AREA_H * 0.92)
                  yOff -= bh
                  return <rect key={p} x={x} y={yOff} width={barW} height={bh} fill={PLAT_COLOR[p] ?? '#888'} opacity={hovered && hovered !== day ? 0.35 : 0.9} rx={1} />
                })}
                <rect x={x} y={0} width={barW} height={BAR_AREA_H} fill="transparent" />
              </g>
            )
          })}
          {days.map((day, i) => {
            if (!labelDays.includes(day)) return null
            const x = i * (barW + gap) + barW / 2
            return <text key={day} x={x} y={H - 2} textAnchor="middle" fill="rgba(232,230,248,0.25)" fontSize="9" fontFamily="inherit">{day.slice(5).replace('-', '/')}</text>
          })}
        </svg>
        {tooltip && (
          <div style={{ position: 'absolute', top: 8, left: `${Math.min(tooltip.x * 100, 75)}%`, background: '#1a1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.72rem', pointerEvents: 'none', zIndex: 10, minWidth: '120px' }}>
            <div style={{ color: C.dim, marginBottom: '0.3rem' }}>{tooltip.day.split('-').reverse().join('/')}</div>
            {Object.entries(tooltip.data).map(([p, v]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PlatIcon p={p} size={10} />
                <span style={{ color: C.muted, flex: 1 }}>{PLAT_LABEL[p] ?? p}</span>
                <span style={{ color: C.text, fontWeight: 700 }}>{fmtBRL(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.6rem', fontSize: '0.73rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
          {platforms.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: PLAT_COLOR[p], flexShrink: 0, opacity: (platTotals[p] ?? 0) > 0 ? 1 : 0.3, display: 'inline-block' }} />
              <span style={{ color: (platTotals[p] ?? 0) > 0 ? C.muted : C.vdim }}>{PLAT_LABEL[p]}</span>
              <span style={{ color: (platTotals[p] ?? 0) > 0 ? C.text : C.vdim, fontWeight: (platTotals[p] ?? 0) > 0 ? 700 : 400 }}>{fmtBRL(platTotals[p] ?? 0)}</span>
            </div>
          ))}
        </div>
        <div style={{ color: C.muted, fontWeight: 700 }}>Total no período <span style={{ color: C.text }}>{fmtBRL(grandTotal)}</span></div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState(daysAgoStr(30))
  const [customTo, setCustomTo] = useState(todayStr())
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState<DashStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [channel, setChannel] = useState<ChannelStats | null>(null)
  const [channelErr, setChannelErr] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const [activities, setActivities] = useState<Activity[] | null>(null)
  const periodLabel = PERIODS.find(([p]) => p === period)?.[1] ?? '30 dias'

  function periodDates() {
    if (period === 'custom') return { from: customFrom, to: customTo }
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    return { from: daysAgoStr(days), to: todayStr() }
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setRefreshTick(t => t + 1), 60000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const { from, to } = periodDates()
    setStatsLoading(true)
    fetch(`/api/dashboard/stats?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
    fetch(`/api/dashboard/activity?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: Activity[] | null) => { if (d) setActivities(d) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customFrom, customTo, refreshTick])

  useEffect(() => {
    const load = () =>
      fetch('/api/twitch/channel-stats')
        .then(r => r.ok ? r.json() : r.json().then((d: { error: string }) => Promise.reject(d.error)))
        .then((d: ChannelStats) => { setChannel(d); setChannelErr('') })
        .catch((e: string) => setChannelErr(e || 'Conta Twitch não conectada'))
    load()
    const iv = setInterval(load, 60000)
    return () => clearInterval(iv)
  }, [])

  // Activity-derived totals (for kick/paypal from twitch_events)
  const actTotals: Record<string, number> = {}
  ;(activities ?? []).filter(a => a.amount && a.amount > 0).forEach(a => {
    actTotals[a.platform] = (actTotals[a.platform] ?? 0) + a.amount!
  })

  // Display totals: all derived from activities (same source as bar chart) for consistency.
  // Livepix falls back to stats API when activities haven't loaded yet.
  const displayTotals: Record<string, number> = {
    livepix: stats?.livepix_total ?? actTotals['livepix'] ?? 0,
    twitch:  actTotals['twitch']  ?? stats?.twitch_total  ?? 0,
    kick:    actTotals['kick']    ?? 0,
    paypal:  actTotals['paypal']  ?? 0,
    youtube: 0,
    tiktok:  0,
  }
  const grandTotal = Object.values(displayTotals).reduce((s, v) => s + v, 0)

  const kickSubCount = (activities ?? []).filter(a => a.platform === 'kick' && (a.type === 'sub' || a.type === 'resub' || a.type === 'giftsub')).length
  const { from: periodFrom, to: periodTo } = periodDates()

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(90deg,rgba(59,130,246,0.12),rgba(99,102,241,0.06))', borderBottom: '1px solid rgba(59,130,246,0.15)', padding: isMobile ? '0.65rem 1.25rem' : '0.65rem 3rem', display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1rem' }}>🚀</span>
        <span style={{ fontSize: '0.81rem', color: '#93c5fd', fontWeight: 700 }}>Bem-vindo ao Beta!</span>
        <span style={{ fontSize: '0.81rem', color: C.dim }}>
          Seu painel está pronto. Configure suas{' '}
          <Link href="/dashboard/conexoes" style={{ color: '#9b30ff', textDecoration: 'none', fontWeight: 600 }}>conexões de plataforma</Link>
          {' '}e complete seu{' '}
          <Link href="/dashboard/perfil" style={{ color: '#9b30ff', textDecoration: 'none', fontWeight: 600 }}>perfil</Link>
          {' '}para começar.
        </span>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: isMobile ? '1.25rem 1.25rem' : '2rem 3rem' }}>

        {/* Canal Twitch */}
        {(channel || !channelErr) && (
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.1rem 1.5rem', marginBottom: '0.8rem' }}>
            {channelErr ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: C.muted }}>
                <span style={{ fontSize: '1rem' }}>📡</span>
                <span>{channelErr} — </span>
                <Link href="/dashboard/conexoes" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Conectar Twitch</Link>
              </div>
            ) : !channel ? null : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {channel.is_live ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} /> AO VIVO
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: C.vdim, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>OFFLINE</span>
                  )}
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9147ff' }}>{channel.broadcaster_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {channel.follower_count !== null && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{fmtNum(channel.follower_count)}</div>
                      <div style={{ fontSize: '0.63rem', color: C.vdim }}>Seguidores</div>
                    </div>
                  )}
                  {channel.is_live && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ff4444' }}>{fmtNum(channel.viewer_count)}</div>
                      <div style={{ fontSize: '0.63rem', color: C.vdim }}>Viewers</div>
                    </div>
                  )}
                  {channel.view_count !== null && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{fmtNum(channel.view_count)}</div>
                      <div style={{ fontSize: '0.63rem', color: C.vdim }}>Views totais</div>
                    </div>
                  )}
                  {channel.game_name && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{channel.game_name}</div>
                      <div style={{ fontSize: '0.63rem', color: C.vdim }}>Jogo</div>
                    </div>
                  )}
                  {channel.title && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>{channel.title}</div>
                      <div style={{ fontSize: '0.63rem', color: C.vdim }}>Título da stream</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header + período */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: C.text }}>Bot da Live — painel de controle</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.77rem', color: C.dim }}>Período:</span>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              {PERIODS.map(([p, label]) => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.28rem 0.85rem', borderRadius: '6px', border: 'none', background: p === period ? C.primaryBg : 'transparent', color: p === period ? C.primary : C.dim, fontSize: '0.77rem', fontWeight: p === period ? 700 : 400, cursor: 'pointer', outline: p === period ? `1px solid rgba(155,48,255,0.3)` : 'none', outlineOffset: '-1px' }}>
                  {label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,48,255,0.25)', borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }} />
                <span style={{ fontSize: '0.72rem', color: C.dim }}>até</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} min={customFrom} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,48,255,0.25)', borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
            )}
          </div>
        </div>

        {/* Total arrecadado */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1rem 1.4rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary, fontSize: '0.8rem' }}>↗</span> Total arrecadado — todas as plataformas
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>{statsLoading && !stats ? '...' : fmtBRL(grandTotal)}</div>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['livepix', 'twitch', 'youtube', 'kick', 'tiktok', 'paypal'].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <PlatIcon p={p} size={13} />
                <div style={{ fontSize: '0.78rem', color: (displayTotals[p] ?? 0) > 0 ? C.muted : C.vdim, fontWeight: 600 }}>{fmtBRL(displayTotals[p] ?? 0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid — 2 rows × 4 cols */}
        {(() => {
          const live = stats
          const twitchSubCount = live?.twitch_subs ?? 0
          const statCards = [
            // Row 1
            { label: 'Tickets ativos',    value: live ? String(live.tickets_total) : '0',  sub: 'em circulação' },
            { label: 'Participantes',      value: live ? String(live.participants) : '0',   sub: 'únicos' },
            { label: 'Total Livepix',      value: fmtBRL(displayTotals['livepix'] ?? 0),    sub: 'no período', badge: true },
            { label: 'Total PayPal',       value: fmtBRL(displayTotals['paypal'] ?? 0),     sub: 'no período' },
            // Row 2
            { label: 'Subs Twitch',        value: String(twitchSubCount),                   sub: 'no período' },
            { label: 'Membros YouTube',    value: '0',                                       sub: 'no período' },
            { label: 'Subs Kick',          value: String(kickSubCount),                     sub: 'no período' },
            { label: 'Subs TikTok',        value: '0',                                       sub: 'no período' },
          ]
          return (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '1rem', marginBottom: '1rem' }}>
              {statCards.map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.radSm, padding: '1.1rem 1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', color: C.muted, lineHeight: 1.3 }}>{s.label}</div>
                    {s.badge && <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: 'rgba(59,130,246,0.16)', color: '#60a5fa', borderRadius: '999px', flexShrink: 0 }}>NOVO</span>}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{statsLoading && !live ? '...' : s.value}</div>
                  <div style={{ fontSize: '0.67rem', color: C.vdim, marginTop: '0.18rem' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )
        })()}

        <div style={{ fontSize: '0.69rem', color: C.vdim, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Livepix, PayPal e subs filtrados por: <strong style={{ color: C.dim }}>{periodLabel}</strong>
          <span style={{ color: C.vdim }}>·</span>
          <span>Tickets e participantes refletem o sorteio/período completo</span>
        </div>

        {/* Estimativa de repasse + Receita líquida */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

          {/* Estimativa de repasse */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.3rem 1.5rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Estimativa de repasse</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {REPASSE.map(r => {
                const raw = displayTotals[r.key] ?? 0
                const net = raw * r.pct / 100
                const usdNet = net / USD_BRL
                const pctOfThreshold = r.threshold > 0 ? Math.min(usdNet / r.threshold, 1) : 0
                const pctLabel = r.threshold > 0 ? `${(pctOfThreshold * 100).toFixed(1)}% de U$${r.threshold}` : ''
                return (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minHeight: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '72px', flexShrink: 0 }}>
                      <PlatIcon p={r.key} size={13} />
                      <span style={{ fontSize: '0.74rem', color: raw > 0 ? C.muted : C.vdim }}>{r.label}</span>
                      {r.badge && <span style={{ fontSize: '0.48rem', fontWeight: 700, padding: '0.06rem 0.3rem', background: 'rgba(59,130,246,0.16)', color: '#60a5fa', borderRadius: '999px' }}>{r.badge}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: '130px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.73rem', color: raw > 0 ? C.dim : C.vdim }}>{fmtBRL(raw)}</span>
                      <span style={{ fontSize: '0.65rem', color: C.vdim }}>→</span>
                      <span style={{ fontSize: '0.73rem', color: raw > 0 ? C.text : C.vdim, fontWeight: raw > 0 ? 700 : 400 }}>{fmtBRL(net)}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: C.vdim, width: '28px', flexShrink: 0 }}>{r.pct}%</div>
                    {r.brl ? (
                      <div style={{ fontSize: '0.65rem', color: C.vdim, flex: 1, textAlign: 'right' }}>pago em R$</div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.65rem', color: raw > 0 ? C.dim : C.vdim, flexShrink: 0 }}>{fmtUSD(usdNet)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.max(pctOfThreshold * 100, usdNet > 0 ? 1.5 : 0)}%`, background: r.color, opacity: usdNet > 0 ? 1 : 0, transition: 'width 0.5s ease', borderRadius: '4px', boxShadow: usdNet > 0 ? `0 0 6px ${r.color}88` : 'none' }} />
                          </div>
                          <div style={{ fontSize: '0.6rem', color: C.vdim, marginTop: '3px', textAlign: 'right' }}>{pctLabel}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Receita líquida */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.3rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: C.primary }}>↗</span> Receita líquida por plataforma
              </div>
              <span style={{ fontSize: '0.65rem', color: C.vdim }}>repasse estimado</span>
            </div>
            {(() => {
              const allPlats = REPASSE.map(r => ({ label: r.label, key: r.key, color: r.color, value: (displayTotals[r.key] ?? 0) * r.pct / 100 })).filter(p => p.value > 0)
              const total = allPlats.reduce((s, p) => s + p.value, 0)
              const r = 48, cx = 60, cy = 60
              const circ = 2 * Math.PI * r
              let acc = 0
              const segs = allPlats.map(p => {
                const arc = total > 0 ? (p.value / total) * circ : 0
                const s = { ...p, arc, off: acc }; acc += arc; return s
              })
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <svg width={120} height={120} style={{ flexShrink: 0 }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={16} />
                    <g transform={`rotate(-90 ${cx} ${cy})`}>
                      {total > 0 && segs.map(s => (
                        <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={16}
                          strokeDasharray={`${s.arc} ${circ}`} strokeDashoffset={-s.off} />
                      ))}
                    </g>
                    {total > 0 ? (
                      <>
                        <text x={cx} y={cx - 5} textAnchor="middle" fill="#e8e6f8" fontSize="10" fontWeight="800" fontFamily="inherit">{fmtBRL(total)}</text>
                        <text x={cx} y={cx + 9} textAnchor="middle" fill="rgba(232,230,248,0.3)" fontSize="8" fontFamily="inherit">líquido</text>
                      </>
                    ) : (
                      <text x={cx} y={cx + 4} textAnchor="middle" fill="rgba(232,230,248,0.15)" fontSize="9" fontFamily="inherit">R$ 0,00</text>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
                    {REPASSE.map(r2 => {
                      const v = (displayTotals[r2.key] ?? 0) * r2.pct / 100
                      const pct = total > 0 ? Math.round(v / total * 100) : 0
                      return (
                        <div key={r2.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <PlatIcon p={r2.key} size={11} />
                          <span style={{ fontSize: '0.75rem', color: v > 0 ? C.muted : C.vdim, whiteSpace: 'nowrap' }}>{r2.label}</span>
                          <span style={{ flex: 1, borderBottom: '1px dotted rgba(232,230,248,0.13)', marginBottom: '1px', minWidth: '10px' }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: v > 0 ? C.text : C.vdim, whiteSpace: 'nowrap' }}>{fmtBRL(v)}</span>
                          {v > 0 && <span style={{ fontSize: '0.68rem', color: C.vdim, minWidth: 36, textAlign: 'right' }}>({pct}%)</span>}
                        </div>
                      )
                    })}
                    {total === 0 && <div style={{ fontSize: '0.72rem', color: C.vdim }}>Conecte suas plataformas para ver dados</div>}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Arrecadação no período — bar chart */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.3rem 1.5rem', marginBottom: '0.8rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Arrecadação no período
          </div>
          {!activities ? (
            <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.vdim, fontSize: '0.82rem' }}>Carregando...</div>
          ) : (
            <BarChart activities={activities} from={periodFrom} to={periodTo} />
          )}
        </div>

        {/* Sorteios ativos + Atividade recente */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.3rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                Sorteios ativos
              </div>
              <Link href="/dashboard/sorteios" style={{ fontSize: '0.75rem', color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Ver todos ↗</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: C.vdim }}>Nenhum sorteio aberto</div>
              <Link href="/dashboard/sorteios/novo" style={{ fontSize: '0.78rem', color: C.primary, textDecoration: 'none', background: C.primaryBg, padding: '0.35rem 1rem', borderRadius: '6px', fontWeight: 600 }}>Criar sorteio</Link>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.3rem 1.5rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Atividade recente
            </div>
            {!activities || activities.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: C.vdim, fontSize: '0.82rem' }}>Nenhuma atividade registrada</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {activities.slice(0, 6).map(a => {
                  const platColor = PLAT_COLOR[a.platform] ?? C.vdim
                  const platName = PLAT_LABEL[a.platform] ?? a.platform
                  const action = TYPE_LABEL[a.type] ?? a.type
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${platColor}22`, border: `1px solid ${platColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                        <PlatIcon p={a.platform} size={12} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', color: C.muted, lineHeight: 1.4 }}>
                          <strong style={{ color: C.text }}>{a.username}</strong>{' '}
                          {action}{' '}
                          <span style={{ color: platColor }}>{platName}</span>
                          {a.amount ? <span style={{ color: C.text, fontWeight: 700 }}> · {fmtBRL(a.amount)}</span> : null}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: C.vdim, flexShrink: 0, marginTop: '0.2rem' }}>{timeAgo(a.created_at)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top doadores */}
        {(() => {
          const totals: Record<string, { username: string; total: number; platform: string; count: number }> = {}
          ;(activities ?? []).filter(a => a.amount && a.amount > 0).forEach(a => {
            const k = a.username.toLowerCase()
            if (!totals[k]) totals[k] = { username: a.username, total: 0, platform: a.platform, count: 0 }
            totals[k].total += a.amount!
            totals[k].count += 1
          })
          const ranked = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5)
          return (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: C.rad, padding: '1.3rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Top doadores
                </div>
                <button style={{ background: 'none', border: 'none', color: C.dim, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => setRefreshTick(t => t + 1)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Sync
                </button>
              </div>
              {ranked.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', color: C.vdim, fontSize: '0.82rem' }}>Nenhum doador no período</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {ranked.map((d, i) => {
                    const platColor = PLAT_COLOR[d.platform] ?? C.vdim
                    return (
                      <div key={d.username} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${platColor}22`, border: `1px solid ${platColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, color: platColor }}>
                          {initials(d.username)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text }}>{d.username}</div>
                          <div style={{ fontSize: '0.7rem', color: C.vdim }}>{fmtBRL(d.total)}</div>
                        </div>
                        <div style={{ background: i === 0 ? 'rgba(251,191,36,0.15)' : C.primaryBg, border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.3)' : 'rgba(155,48,255,0.3)'}`, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: i === 0 ? '#fbbf24' : C.primary, flexShrink: 0 }}>
                          {d.count} {d.count === 1 ? 'evento' : 'eventos'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

      </div>
    </div>
  )
}
