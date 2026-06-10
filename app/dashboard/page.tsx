'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.15)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.08)',
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

const REPASSE = [
  { label: 'Livepix',  key: 'livepix',  color: '#ff2d6b', pct: 95, note: 'pago em R$' },
  { label: 'Twitch',   key: 'twitch',   color: '#a855f7', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'YouTube',  key: 'youtube',  color: '#ff3333', pct: 70, note: 'U$ 0,00 · 0,0% de U$100' },
  { label: 'Kick',     key: 'kick',     color: '#39ff14', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'TikTok',   key: 'tiktok',   color: '#00e5ff', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'PayPal',   key: 'paypal',   color: '#00b4ff', pct: 97, note: 'pago em R$' },
]

type Period = '7d' | '30d' | '90d' | 'custom'
const PERIODS: [Period, string][] = [['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['custom','Personalizado']]

type Activity = { id: string; platform: string; type: string; username: string; amount?: number; created_at: string }
type ChannelStats = {
  broadcaster_name: string; title: string; game_name: string
  is_live: boolean; viewer_count: number; started_at: string | null
  follower_count: number | null; view_count: number | null; language: string; broadcaster_login: string
}
type DashStats = {
  livepix_total: number; livepix_donors: number; livepix_unique: number
  twitch_subs: number; twitch_tickets: number; twitch_total: number; tickets_total: number; participants: number
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
function fmtBRL(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
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

function buildDailyData(activities: Activity[], fromStr: string, toStr: string) {
  const from = new Date(fromStr)
  const to = new Date(toStr)
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

  const W = 800, H = 140, PAD_L = 0, PAD_R = 0, BAR_AREA_H = 110
  const barW = Math.max(2, Math.floor((W - PAD_L - PAD_R) / Math.max(days.length, 1)) - 1)
  const gap = (W - PAD_L - PAD_R - barW * days.length) / Math.max(days.length - 1, 1)

  // Choose ~6 date labels evenly
  const labelStep = Math.max(1, Math.ceil(days.length / 6))
  const labelDays = days.filter((_, i) => i % labelStep === 0)

  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: string; data: Record<string, number> } | null>(null)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: '0.6rem' }}>
        Passe o mouse sobre uma barra para ver o detalhamento
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          onMouseLeave={() => { setHovered(null); setTooltip(null) }}>
          {/* baseline */}
          <line x1={PAD_L} y1={BAR_AREA_H} x2={W - PAD_R} y2={BAR_AREA_H} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

          {days.map((day, i) => {
            const x = PAD_L + i * (barW + gap)
            const dayTotal = dailyTotals[i]
            if (dayTotal === 0) return null
            let yOff = BAR_AREA_H
            return (
              <g key={day}
                onMouseEnter={e => { setHovered(day); setTooltip({ x: i / days.length, y: 0, day, data: byDate[day] }) }}
                style={{ cursor: 'pointer' }}>
                {platforms.map(p => {
                  const val = byDate[day][p] ?? 0
                  if (!val) return null
                  const bh = Math.max(2, (val / maxBar) * BAR_AREA_H * 0.92)
                  yOff -= bh
                  const rect = <rect key={p} x={x} y={yOff} width={barW} height={bh}
                    fill={PLAT_COLOR[p] ?? '#888'}
                    opacity={hovered && hovered !== day ? 0.35 : 0.9}
                    rx={i === 0 || i === days.length - 1 ? 1 : 0}
                  />
                  return rect
                })}
                {/* hover highlight */}
                <rect x={x} y={0} width={barW} height={BAR_AREA_H} fill="transparent" />
              </g>
            )
          })}

          {/* X labels */}
          {days.map((day, i) => {
            if (!labelDays.includes(day)) return null
            const x = PAD_L + i * (barW + gap) + barW / 2
            const label = day.slice(5).replace('-', '/')
            return <text key={day} x={x} y={H - 2} textAnchor="middle" fill="rgba(232,230,248,0.25)" fontSize="9" fontFamily="inherit">{label}</text>
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position: 'absolute', top: 8, left: `${Math.min(tooltip.x * 100, 75)}%`, background: '#1a1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.72rem', pointerEvents: 'none', zIndex: 10, minWidth: '120px' }}>
            <div style={{ color: C.dim, marginBottom: '0.3rem' }}>{tooltip.day.split('-').reverse().join('/')}</div>
            {Object.entries(tooltip.data).map(([p, v]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PLAT_COLOR[p] ?? '#888', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ color: C.muted, flex: 1 }}>{PLAT_LABEL[p] ?? p}</span>
                <span style={{ color: C.text, fontWeight: 700 }}>{fmtBRL(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
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
        <div style={{ color: C.muted, fontWeight: 700 }}>
          Total no período <span style={{ color: C.text }}>{fmtBRL(grandTotal)}</span>
        </div>
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

  // Compute platform totals directly from activity data
  const platTotals: Record<string, number> = {}
  ;(activities ?? []).filter(a => a.amount && a.amount > 0).forEach(a => {
    platTotals[a.platform] = (platTotals[a.platform] ?? 0) + a.amount!
  })
  const grandTotal = Object.values(platTotals).reduce((s, v) => s + v, 0)

  const { from: periodFrom, to: periodTo } = periodDates()

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Banner de boas-vindas */}
      <div style={{ background: 'linear-gradient(90deg,rgba(59,130,246,0.12),rgba(99,102,241,0.06))', borderBottom: '1px solid rgba(59,130,246,0.15)', padding: isMobile ? '0.6rem 1rem' : '0.6rem 2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
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

      <div style={{ padding: isMobile ? '1rem' : '1.4rem 2rem' }}>

        {/* Canal Twitch */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '0.9rem 1.2rem', marginBottom: '0.8rem' }}>
          {channelErr ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: C.muted }}>
              <span style={{ fontSize: '1rem' }}>📡</span>
              <span>{channelErr} — </span>
              <Link href="/dashboard/conexoes" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Conectar Twitch</Link>
            </div>
          ) : !channel ? (
            <div style={{ fontSize: '0.78rem', color: C.vdim }}>Carregando dados do canal...</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {channel.is_live ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', letterSpacing: '0.4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} /> AO VIVO
                  </span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: C.vdim, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>OFFLINE</span>
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9147ff' }}>{channel.broadcaster_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{channel.follower_count !== null ? fmtNum(channel.follower_count) : '—'}</div>
                  <div style={{ fontSize: '0.63rem', color: C.vdim }}>Seguidores</div>
                </div>
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

        {/* Cabeçalho + período */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: C.text }}>Bot da Live — painel de controle</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1rem 1.4rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary, fontSize: '0.8rem' }}>↗</span> Total arrecadado — todas as plataformas
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>{statsLoading && !activities ? '...' : fmtBRL(grandTotal)}</div>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['livepix', 'twitch', 'kick', 'youtube', 'tiktok', 'paypal'].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: PLAT_COLOR[p], opacity: (platTotals[p] ?? 0) > 0 ? 1 : 0.25, display: 'inline-block' }} />
                <div>
                  <div style={{ fontSize: '0.65rem', color: C.vdim }}>{PLAT_LABEL[p]}</div>
                  <div style={{ fontSize: '0.78rem', color: (platTotals[p] ?? 0) > 0 ? C.muted : C.vdim, fontWeight: 600 }}>{fmtBRL(platTotals[p] ?? 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        {(() => {
          const live = stats
          const actMonetary = (activities ?? []).filter(a => a.amount && a.amount > 0)
          const twitchActCount = (activities ?? []).filter(a => a.platform === 'twitch' && (a.type === 'sub' || a.type === 'resub' || a.type === 'giftsub')).length
          const statCards = [
            { label: 'Tickets ativos',  value: live ? String(live.tickets_total)  : '0',   sub: 'em circulação',  badge: false },
            { label: 'Participantes',   value: live ? String(live.participants)    : '0',   sub: 'únicos',         badge: false },
            { label: 'Total Livepix',   value: fmtBRL(platTotals['livepix'] ?? 0),          sub: 'no período',     badge: true  },
            { label: 'Doadores',        value: live ? String(live.livepix_donors) : '0',   sub: 'no período',     badge: true  },
            { label: 'Subs Twitch',     value: String(twitchActCount),                      sub: 'no período',     badge: false },
            { label: 'Total Twitch',    value: fmtBRL(platTotals['twitch'] ?? 0),           sub: 'no período',     badge: false },
            { label: 'Total Kick',      value: fmtBRL(platTotals['kick'] ?? 0),             sub: 'no período',     badge: false },
            { label: 'Total geral',     value: fmtBRL(grandTotal),                          sub: 'arrecadado',     badge: false },
          ]
          return (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '0.65rem', marginBottom: '0.65rem' }}>
              {statCards.map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', color: C.muted, lineHeight: 1.3 }}>{s.label}</div>
                    {s.badge && <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: 'rgba(59,130,246,0.16)', color: '#60a5fa', borderRadius: '999px', flexShrink: 0 }}>NOVO</span>}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{statsLoading && !activities ? '...' : s.value}</div>
                  <div style={{ fontSize: '0.67rem', color: C.vdim, marginTop: '0.18rem' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )
        })()}

        <div style={{ fontSize: '0.69rem', color: C.vdim, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Dados filtrados por: <strong style={{ color: C.dim }}>{periodLabel}</strong>
        </div>

        {/* Estimativa de repasse + Receita líquida */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Estimativa de repasse</div>
            {(() => {
              const maxVal = Math.max(...REPASSE.map(r => platTotals[r.key] ?? 0), 0.01)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
                  {REPASSE.map(r => {
                    const raw = platTotals[r.key] ?? 0
                    const net = raw * r.pct / 100
                    const barPct = (raw / maxVal) * 100
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '54px', fontSize: '0.75rem', color: raw > 0 ? C.muted : C.vdim, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block', opacity: raw > 0 ? 1 : 0.3 }} />
                          {r.label}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: raw > 0 ? C.dim : C.vdim, width: '50px' }}>{fmtBRL(raw)}</div>
                        <div style={{ fontSize: '0.74rem', color: raw > 0 ? C.text : C.vdim, fontWeight: raw > 0 ? 700 : 400, width: '58px' }}>→ {fmtBRL(net)}</div>
                        <div style={{ fontSize: '0.7rem', color: C.vdim, width: '28px' }}>{r.pct}%</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${barPct}%`, background: r.color, opacity: raw > 0 ? 0.85 : 0.12, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                        <div style={{ fontSize: '0.63rem', color: C.vdim, minWidth: '76px', textAlign: 'right' }}>{r.note}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary }}>↗</span> Receita líquida por plataforma
            </div>
            {(() => {
              const allPlats = REPASSE.map(r => ({ label: r.label, color: r.color, value: (platTotals[r.key] ?? 0) * r.pct / 100 })).filter(p => p.value > 0)
              const total = allPlats.reduce((s, p) => s + p.value, 0)
              const r = 46, cx = 58, cy = 58
              const circ = 2 * Math.PI * r
              let acc = 0
              const segs = allPlats.map(p => {
                const arc = total > 0 ? (p.value / total) * circ : 0
                const s = { ...p, arc, off: acc }; acc += arc; return s
              })
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <svg width={116} height={116} style={{ flexShrink: 0 }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={15} />
                    <g transform={`rotate(-90 ${cx} ${cy})`}>
                      {total > 0 && segs.map(s => (
                        <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={15}
                          strokeDasharray={`${s.arc} ${circ}`} strokeDashoffset={-s.off} />
                      ))}
                    </g>
                    {total > 0 ? (
                      <>
                        <text x={cx} y={cx - 5} textAnchor="middle" fill="#e8e6f8" fontSize="10" fontWeight="800" fontFamily="inherit">{fmtBRL(total)}</text>
                        <text x={cx} y={cx + 9} textAnchor="middle" fill="rgba(232,230,248,0.3)" fontSize="8.5" fontFamily="inherit">líquido</text>
                      </>
                    ) : (
                      <text x={cx} y={cx + 4} textAnchor="middle" fill="rgba(232,230,248,0.15)" fontSize="9" fontFamily="inherit">R$ 0,00</text>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                    {REPASSE.map(r2 => {
                      const v = (platTotals[r2.key] ?? 0) * r2.pct / 100
                      return (
                        <div key={r2.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: r2.color, flexShrink: 0, opacity: v > 0 ? 1 : 0.2 }} />
                          <span style={{ fontSize: '0.75rem', color: v > 0 ? C.muted : C.vdim, flex: 1 }}>{r2.label}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: v > 0 ? C.text : C.vdim }}>{fmtBRL(v)}</span>
                          <span style={{ fontSize: '0.68rem', color: C.vdim, minWidth: 30, textAlign: 'right' }}>
                            {total > 0 ? `${Math.round(v / total * 100)}%` : '—'}
                          </span>
                        </div>
                      )
                    })}
                    {total === 0 && <div style={{ fontSize: '0.72rem', color: C.vdim, marginTop: '0.2rem' }}>Conecte suas plataformas para ver dados</div>}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Arrecadação no período — bar chart */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '0.8rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                Sorteios ativos
              </div>
              <Link href="/dashboard/sorteios" style={{ fontSize: '0.75rem', color: C.primary, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Ver todos ↗
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: C.vdim }}>Nenhum sorteio aberto</div>
              <Link href="/dashboard/sorteios/novo" style={{ fontSize: '0.78rem', color: C.primary, textDecoration: 'none', background: C.primaryBg, padding: '0.35rem 1rem', borderRadius: '6px', fontWeight: 600 }}>Criar sorteio</Link>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
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
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: platColor, display: 'inline-block' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', color: C.muted, lineHeight: 1.4 }}>
                          <strong style={{ color: C.text }}>{a.username}</strong>{' '}
                          {action}{' '}
                          <span style={{ color: platColor }}>via {platName}</span>
                          {a.amount ? <span style={{ color: C.text, fontWeight: 700 }}> {fmtBRL(a.amount)}</span> : null}
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
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
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
                    const ini = initials(d.username)
                    return (
                      <div key={d.username} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${platColor}22`, border: `1px solid ${platColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, color: platColor, letterSpacing: '0.3px' }}>
                          {ini}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text }}>{d.username}</div>
                          <div style={{ fontSize: '0.7rem', color: C.vdim }}>{fmtBRL(d.total)}</div>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.vdim} strokeWidth="2" style={{ flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
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
