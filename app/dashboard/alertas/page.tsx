'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLang } from '@/lib/i18n'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(155,48,255,0.2)',
  red: '#ef4444', green: '#22c55e', yellow: '#f59e0b',
}

type AlertStatus = 'pending' | 'played' | 'failed'
type AlertType = 'donation' | 'sub' | 'follow' | 'raid' | 'bits'

type Alert = {
  id: string
  type: AlertType
  username: string
  amount?: number
  message?: string
  platform: string
  status: AlertStatus
  created_at: string
}

type FilterTab = 'all' | 'pending' | 'failed'

const PREVIEW_EVENTS = [
  { slug: 'twitch-follow',   label: 'Follow',    emoji: '❤️'  },
  { slug: 'twitch-sub',      label: 'Sub',       emoji: '⭐'  },
  { slug: 'twitch-giftsub',  label: 'Gift Sub',  emoji: '🎁'  },
  { slug: 'twitch-resub',    label: 'Re-sub',    emoji: '🔁'  },
  { slug: 'twitch-bits',     label: 'Bits',      emoji: '💎'  },
  { slug: 'livepix',         label: 'Doação',    emoji: '💸'  },
]

function LivePreview({ uid }: { uid: string }) {
  const [firing, setFiring] = useState<string | null>(null)
  const [lastFired, setLastFired] = useState<string | null>(null)

  // Scale factor: render overlay at 1280×200 and scale down to fit container
  const OVERLAY_W = 1280
  const OVERLAY_H = 200
  const DISPLAY_H = 160
  const scale = DISPLAY_H / OVERLAY_H

  const fireTest = async (slug: string) => {
    setFiring(slug)
    setLastFired(slug)
    await fetch('/api/overlay/alert/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventSlug: slug }),
    }).finally(() => setTimeout(() => setFiring(null), 800))
  }

  const overlayUrl = uid ? `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/alert?uid=${uid}` : ''

  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '0.87rem', color: S.text }}>Pré-visualização ao vivo</span>
        <span style={{ fontSize: '0.72rem', color: S.muted }}>Clique em um tipo para disparar um alerta de teste</span>
      </div>

      {/* Test buttons */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${S.border}`, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {PREVIEW_EVENTS.map(ev => (
          <button key={ev.slug} onClick={() => fireTest(ev.slug)} disabled={firing !== null}
            style={{
              padding: '0.35rem 0.8rem', borderRadius: '7px', border: `1px solid ${lastFired === ev.slug ? S.borderP : S.border}`,
              background: firing === ev.slug ? S.primaryBg : lastFired === ev.slug ? 'rgba(155,48,255,0.06)' : 'rgba(255,255,255,0.04)',
              color: lastFired === ev.slug ? S.primary : S.muted,
              fontWeight: 600, fontSize: '0.78rem', cursor: firing !== null ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s',
              opacity: firing !== null && firing !== ev.slug ? 0.5 : 1,
            }}>
            <span>{ev.emoji}</span> {ev.label}
          </button>
        ))}
      </div>

      {/* Preview iframe — scaled down from full overlay dimensions */}
      <div style={{ background: '#0a0a0a', height: `${DISPLAY_H}px`, position: 'relative', overflow: 'hidden' }}>
        {uid && overlayUrl ? (
          <div style={{ position: 'absolute', top: 0, left: 0, width: `${OVERLAY_W}px`, height: `${OVERLAY_H}px`, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
            <iframe
              key={uid}
              src={overlayUrl}
              style={{ border: 'none', width: `${OVERLAY_W}px`, height: `${OVERLAY_H}px`, background: 'transparent', display: 'block' }}
              allow="autoplay"
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
            Carregando pré-visualização...
          </div>
        )}
        {!lastFired && uid && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>Clique em um evento acima para testar</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: '0.62rem', color: 'rgba(255,255,255,0.15)' }}>
          Simulação OBS
        </div>
      </div>
    </div>
  )
}

const TYPE_META: Record<AlertType, { emoji: string; color: string }> = {
  donation: { emoji: '💰', color: '#f59e0b' },
  sub:      { emoji: '⭐', color: '#9b30ff' },
  follow:   { emoji: '❤️',  color: '#ef4444' },
  raid:     { emoji: '⚔️',  color: '#06b6d4' },
  bits:     { emoji: '💎', color: '#60a5fa' },
}

const STATUS_COLOR: Record<AlertStatus, string> = {
  pending: '#f59e0b',
  played:  '#22c55e',
  failed:  '#ef4444',
}

// Demo/mock data shown when API returns nothing
const DEMO: Alert[] = [
  { id: 'd1', type: 'donation', username: 'GabrielXD', amount: 50, message: 'Boa live!', platform: 'Twitch', status: 'pending', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 'd2', type: 'sub', username: 'StreamFan99', platform: 'Twitch', status: 'played', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'd3', type: 'raid', username: 'KingRaider', amount: 42, platform: 'Kick', status: 'failed', created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'd4', type: 'follow', username: 'NovoFan', platform: 'Twitch', status: 'pending', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 'd5', type: 'bits', username: 'BitsDonor', amount: 200, platform: 'Twitch', status: 'pending', created_at: new Date(Date.now() - 1200000).toISOString() },
]

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function AlertasPage() {
  const { t } = useLang()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [replaying, setReplaying] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [uid, setUid] = useState('')

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => { if (u?.id) setUid(u.id) })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/alertas')
      if (r.ok) {
        const data = await r.json()
        if (data.length === 0) { setAlerts(DEMO); setIsDemo(true) }
        else { setAlerts(data); setIsDemo(false) }
      }
    } catch {
      setAlerts(DEMO)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  async function handleReplay(id: string) {
    if (isDemo) return
    setReplaying(id)
    try {
      await fetch('/api/alertas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending' }),
      })
      await load()
    } finally {
      setReplaying(null)
    }
  }

  async function handleClearPlayed() {
    if (isDemo) { setAlerts(a => a.filter(x => x.status !== 'played')); return }
    await fetch('/api/alertas?mode=played', { method: 'DELETE' })
    await load()
  }

  async function handleClearAll() {
    if (isDemo) { setAlerts([]); return }
    await fetch('/api/alertas?mode=all', { method: 'DELETE' })
    await load()
  }

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter)
  const pendingCount = alerts.filter(a => a.status === 'pending').length
  const playedToday = alerts.filter(a => a.status === 'played').length
  const failedCount = alerts.filter(a => a.status === 'failed').length

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: t('alertas_filter_all'), count: alerts.length },
    { id: 'pending', label: t('alertas_filter_pending'), count: pendingCount },
    { id: 'failed', label: t('alertas_filter_failed'), count: failedCount },
  ]

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: S.text, fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>{t('pt_alertas')}</h1>
          <p style={{ color: S.muted, fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
            {pendingCount} {t('alertas_pending_count')}
            {isDemo && <span style={{ marginLeft: '0.5rem', fontSize: '0.68rem', color: S.yellow, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '0.1rem 0.4rem', borderRadius: '99px' }}>DEMO</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleClearPlayed} style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, color: S.muted, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            {t('alertas_clear_played')}
          </button>
          <button onClick={handleClearAll} style={{ padding: '0.5rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: S.red, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            {t('alertas_clear_all')}
          </button>
        </div>
      </div>

      {/* Live preview */}
      {uid && <LivePreview uid={uid} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: t('alertas_status_pending'), count: pendingCount, color: S.yellow },
          { label: t('alertas_today'), count: playedToday, color: S.green },
          { label: t('alertas_status_failed'), count: failedCount, color: S.red },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
            <div style={{ color: S.muted, fontSize: '0.75rem', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.25rem', marginBottom: '1rem', width: 'fit-content' }}>
        {filterTabs.map(tb => (
          <button key={tb.id} onClick={() => setFilter(tb.id)} style={{
            padding: '0.4rem 0.9rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem',
            cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: filter === tb.id ? S.primary : 'transparent',
            color: filter === tb.id ? '#fff' : S.muted,
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            {tb.label}
            {tb.count > 0 && <span style={{ fontSize: '0.68rem', background: filter === tb.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', padding: '0 0.35rem', borderRadius: '99px' }}>{tb.count}</span>}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: S.dim, padding: '3rem' }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: S.card, borderRadius: '14px', border: `1px solid ${S.border}`, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
          <div style={{ color: S.muted, fontSize: '0.9rem' }}>{t('alertas_empty')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(alert => {
            const meta = TYPE_META[alert.type] ?? { emoji: '📢', color: S.primary }
            return (
              <div key={alert.id} style={{
                background: S.card, borderRadius: '12px',
                border: `1px solid ${alert.status === 'failed' ? 'rgba(239,68,68,0.2)' : S.border}`,
                padding: '0.85rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                opacity: alert.status === 'played' ? 0.65 : 1,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {meta.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ color: S.text, fontWeight: 700, fontSize: '0.88rem' }}>@{alert.username}</span>
                    {alert.amount != null && alert.amount > 0 && (
                      <span style={{ color: meta.color, fontWeight: 700, fontSize: '0.82rem' }}>
                        {alert.type === 'donation' ? `R$ ${alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                         alert.type === 'bits' ? `${alert.amount} bits` :
                         alert.type === 'raid' ? `${alert.amount} viewers` : ''}
                      </span>
                    )}
                    <span style={{ color: S.dim, fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', padding: '0.05rem 0.4rem', borderRadius: '99px' }}>{alert.platform}</span>
                  </div>
                  {alert.message && (
                    <div style={{ color: S.muted, fontSize: '0.78rem', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{alert.message}"
                    </div>
                  )}
                  <div style={{ color: S.dim, fontSize: '0.7rem', marginTop: '0.2rem' }}>{timeAgo(alert.created_at)} atrás</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_COLOR[alert.status], background: `${STATUS_COLOR[alert.status]}15`, border: `1px solid ${STATUS_COLOR[alert.status]}33`, padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {t(`alertas_status_${alert.status}` as Parameters<typeof t>[0])}
                  </span>
                  {(alert.status === 'failed' || alert.status === 'played') && (
                    <button onClick={() => handleReplay(alert.id)} disabled={replaying === alert.id} style={{ background: S.primaryBg, border: `1px solid ${S.borderP}`, color: S.primary, borderRadius: '7px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: replaying === alert.id ? 0.6 : 1 }}>
                      ▶ {t('alertas_replay')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
