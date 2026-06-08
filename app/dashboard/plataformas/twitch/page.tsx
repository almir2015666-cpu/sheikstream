'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { notify } from '@/app/lib/notify'

const C = {
  bg: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.35)', vdim: 'rgba(232,230,248,0.18)',
  primary: '#9147ff', primaryBg: 'rgba(145,71,255,0.12)', primaryB: 'rgba(145,71,255,0.3)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.08)',
  blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.1)', blueB: 'rgba(59,130,246,0.25)',
}

const inp: React.CSSProperties = { width: '100%', padding: '0.55rem 0.75rem', background: '#0b0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'block' }

type TierConfig = { tier1_name: string; tier1_value: number; tier2_name: string; tier2_value: number; tier3_name: string; tier3_value: number }
type Sub = { id: string; broadcaster_id: string; username: string; tier: string; is_gift: boolean; gifted_by: string | null; sorteio_id: string | null; tickets: number; date: string; created_at: string }
type Cheer = { id: string; broadcaster_id: string; username: string | null; bits: number; message: string | null; is_anonymous: boolean; date: string; created_at: string }
type Sorteio = { id: string; title: string; type: string; status: string }
type TwitchVideo = { id: string; title: string; url: string; created_at: string; duration: string; view_count: number; thumbnail_url: string }

const TIER_LABELS: Record<string, string> = { tier1: 'Tier 1', tier2: 'Tier 2', tier3: 'Tier 3', prime: 'Prime' }
const PERIOD_OPTIONS = [7, 30, 90]

function daysAgoStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function tierValue(tier: string, cfg: TierConfig): number {
  if (tier === 'tier1') return cfg.tier1_value
  if (tier === 'tier2') return cfg.tier2_value
  if (tier === 'tier3') return cfg.tier3_value
  return cfg.tier1_value // prime counts same as tier1
}

const EXCHANGE = 5.70
const PAYOUT_THRESHOLD = 50

function fmt(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtUSD(v: number) { return `U$ ${v.toFixed(2)}` }
function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function today() { return new Date().toISOString().split('T')[0] }

const BLANK_FORM = { username: '', tier: 'tier1', is_gift: false, gifted_by: '', sorteio_id: '', tickets: 1, date: today() }

export default function TwitchSubsPage() {
  const [days, setDays] = useState(30)
  const [useCustom, setUseCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(daysAgoStr(30))
  const [customTo, setCustomTo] = useState(today())
  const [subs, setSubs] = useState<Sub[]>([])
  const [cheers, setCheers] = useState<Cheer[]>([])
  const [tiers, setTiers] = useState<TierConfig>({ tier1_name: 'Tier 1', tier1_value: 9.9, tier2_name: 'Tier 2', tier2_value: 25.9, tier3_name: 'Tier 3', tier3_value: 49.9 })
  const [tiersEdit, setTiersEdit] = useState<TierConfig>(tiers)
  const [sorteios, setSorteios] = useState<Sorteio[]>([])
  const [user, setUser] = useState<{ name: string; image: string; id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'value'>('newest')
  const [activeTab, setActiveTab] = useState<'subs' | 'transmissoes'>('subs')
  const [showNiveis, setShowNiveis] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editSub, setEditSub] = useState<Sub | null>(null)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [savingTiers, setSavingTiers] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [channelStats, setChannelStats] = useState<{ follower_count: number | null; view_count: number | null; bits_total_historical?: number; bits_leaderboard?: Array<{ username: string; bits: number }> } | null>(null)
  const [videos, setVideos] = useState<TwitchVideo[]>([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [videosError, setVideosError] = useState('')
  const [showDiag, setShowDiag] = useState(false)
  const [diagData, setDiagData] = useState<Record<string, unknown> | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [resyncing, setResyncing] = useState(false)
  const [resyncResult, setResyncResult] = useState<Record<string, string> | null>(null)

  async function runDiag() {
    setDiagLoading(true)
    try {
      const res = await fetch('/api/twitch/debug')
      const data = await res.json()
      setDiagData(data)
    } catch { setDiagData({ error: 'Falha de conexão' }) }
    finally { setDiagLoading(false) }
  }

  async function runResync() {
    setResyncing(true)
    setResyncResult(null)
    try {
      const res = await fetch('/api/twitch/resync', { method: 'POST' })
      const data = await res.json()
      if (data.subscriptions) setResyncResult(data.subscriptions as Record<string, string>)
      notify(data.ok ? `Resync OK — ${data.deletedStuck ?? 0} inscrições removidas e recriadas` : (data.error || 'Erro no resync'), data.ok ? 'success' : 'error')
      setTimeout(runDiag, 3000)
    } catch { notify('Falha de conexão no resync', 'error') }
    finally { setResyncing(false) }
  }

  async function syncSubs() {
    setSyncing(true)
    try {
      const res = await fetch('/api/twitch/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        notify(data.error || 'Erro ao sincronizar', 'error')
      } else {
        if (data.inserted > 0) {
          notify(data.message || 'Sincronizado com sucesso!', 'success')
        } else if (data.total === 0) {
          notify('Nenhum inscrito encontrado na Twitch.', 'info')
        }
        loadSubs()
      }
    } catch {
      notify('Falha de conexão ao sincronizar', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const loadSubs = useCallback(async () => {
    setLoading(true)
    const subsUrl = useCustom
      ? `/api/twitch/subs?from=${customFrom}&to=${customTo}`
      : `/api/twitch/subs?days=${days}`
    const cheersUrl = useCustom
      ? `/api/twitch/cheers?from=${customFrom}&to=${customTo}`
      : `/api/twitch/cheers?days=${days}`
    const [subsRes, cheersRes, tiersRes, sorteiosRes, meRes, statsRes] = await Promise.all([
      fetch(subsUrl).then(r => r.json()).catch(() => []),
      fetch(cheersUrl).then(r => r.json()).catch(() => []),
      fetch('/api/twitch/tier-config').then(r => r.json()).catch(() => ({})),
      fetch('/api/sorteios').then(r => r.json()).catch(() => []),
      fetch('/api/me').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/twitch/channel-stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    setSubs(Array.isArray(subsRes) ? subsRes : [])
    setCheers(Array.isArray(cheersRes) ? cheersRes : [])
    if (tiersRes && !tiersRes.error) { setTiers(tiersRes); setTiersEdit(tiersRes) }
    setSorteios(Array.isArray(sorteiosRes) ? sorteiosRes.filter((s: Sorteio) => s.status === 'active') : [])
    setUser(meRes)
    if (statsRes && !statsRes.error) setChannelStats({
      follower_count: statsRes.follower_count ?? null,
      view_count: statsRes.view_count ?? null,
      bits_total_historical: statsRes.bits_total_historical ?? undefined,
      bits_leaderboard: statsRes.bits_leaderboard ?? undefined,
    })
    setLoading(false)
  }, [days, useCustom, customFrom, customTo])

  useEffect(() => { loadSubs() }, [loadSubs])

  const fetchVideos = useCallback(async () => {
    setVideosLoading(true)
    setVideosError('')
    try {
      const from = useCustom ? customFrom : daysAgoStr(days)
      const to = useCustom ? customTo : today()
      const res = await fetch(`/api/twitch/videos?from=${from}&to=${to}`)
      const data = await res.json()
      if (!res.ok) {
        setVideosError(data.error || 'Erro ao carregar transmissões')
      } else {
        setVideos(Array.isArray(data) ? data : [])
      }
    } catch {
      setVideosError('Falha de conexão')
    } finally {
      setVideosLoading(false)
    }
  }, [days, useCustom, customFrom, customTo])

  useEffect(() => {
    if (activeTab === 'transmissoes') fetchVideos()
  }, [activeTab, fetchVideos])

  const filtered = subs.filter(s => !search || s.username.toLowerCase().includes(search.toLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'oldest') return a.created_at.localeCompare(b.created_at)
    if (sort === 'value') return tierValue(b.tier, tiers) - tierValue(a.tier, tiers)
    return b.created_at.localeCompare(a.created_at)
  })

  const totalSubs = subs.filter(s => !s.is_gift).length
  const giftSubs = subs.filter(s => s.is_gift).length
  const totalTickets = subs.reduce((acc, s) => acc + s.tickets, 0)
  const totalBruto = subs.reduce((acc, s) => acc + tierValue(s.tier, tiers), 0)
  const totalLiquid = totalBruto * 0.5

  const totalBits = cheers.reduce((acc, c) => acc + c.bits, 0)  // respects period filter
  const bitsHistorical = channelStats?.bits_total_historical ?? 0  // all-time from Twitch API
  const bitsUSD = totalBits * 0.01
  const bitsBRL = bitsUSD * EXCHANGE
  const bitsHistoricalUSD = bitsHistorical * 0.01
  const bitsHistoricalBRL = bitsHistoricalUSD * EXCHANGE

  // Repasse uses historical bits (all-time) for payout threshold calculation
  const effectiveBitsUSD = bitsHistorical > 0 ? bitsHistoricalUSD : bitsUSD
  const totalUSD = totalLiquid / EXCHANGE + effectiveBitsUSD
  const totalLiquidAll = totalUSD * EXCHANGE
  const pctPayout = Math.min(100, (totalUSD / PAYOUT_THRESHOLD) * 100)
  const uniqueCheerers = new Set(cheers.filter(c => !c.is_anonymous && c.username).map(c => c.username)).size
  const cheersByUser = cheers.filter(c => c.username).reduce<Record<string, number>>((acc, c) => {
    acc[c.username!] = (acc[c.username!] ?? 0) + c.bits
    return acc
  }, {})
  const topCheerers = Object.entries(cheersByUser).sort((a, b) => b[1] - a[1]).slice(0, 3)

  async function saveTiers() {
    setSavingTiers(true)
    const res = await fetch('/api/twitch/tier-config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tiersEdit) })
    setSavingTiers(false)
    if (res.ok) { const d = await res.json(); setTiers(d); setTiersEdit(d); setShowNiveis(false); notify('Níveis salvos!', 'success') }
    else notify('Erro ao salvar níveis', 'error')
  }

  function openAdd() { setEditSub(null); setForm({ ...BLANK_FORM }); setShowModal(true) }
  function openEdit(s: Sub) {
    setEditSub(s)
    setForm({ username: s.username, tier: s.tier, is_gift: s.is_gift, gifted_by: s.gifted_by || '', sorteio_id: s.sorteio_id || '', tickets: s.tickets, date: s.date })
    setShowModal(true)
  }

  async function submitSub() {
    if (!form.username.trim()) { notify('Nome de usuário é obrigatório', 'error'); return }
    if (!form.date) { notify('Data é obrigatória', 'error'); return }
    if (form.is_gift && !form.gifted_by.trim()) { notify('Informe quem enviou o gift sub', 'error'); return }
    setSaving(true)
    const body = { ...form, sorteio_id: form.sorteio_id || null, gifted_by: form.gifted_by || null }
    let res: Response
    if (editSub) {
      res = await fetch(`/api/twitch/subs/${editSub.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      res = await fetch('/api/twitch/subs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    if (res.ok) {
      setShowModal(false)
      notify(editSub ? 'Sub atualizado!' : 'Sub adicionado!', 'success')
      loadSubs()
    } else {
      const d = await res.json()
      notify(d.error || 'Erro ao salvar', 'error')
    }
  }

  async function removeSub(id: string) {
    if (!confirm('Remover este sub?')) return
    const res = await fetch(`/api/twitch/subs/${id}`, { method: 'DELETE' })
    if (res.ok) { notify('Sub removido', 'success'); setSubs(prev => prev.filter(s => s.id !== id)) }
    else notify('Erro ao remover', 'error')
  }

  // Next payout date (15th of each month)
  const now = new Date()
  const nextPayDate = now.getDate() >= 15
    ? new Date(now.getFullYear(), now.getMonth() + 1, 15)
    : new Date(now.getFullYear(), now.getMonth(), 15)
  const nextPayStr = nextPayDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Link href="/dashboard/plataformas" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Plataformas
        </Link>
        <span style={{ color: C.vdim }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: '7px', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 28" fill={C.primary}><path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/></svg>
          </div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Subs da Twitch</h2>
        </div>
        {/* Period tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.35rem', background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '8px', padding: '3px' }}>
            {PERIOD_OPTIONS.map(d => (
              <button key={d} onClick={() => { setDays(d); setUseCustom(false) }} style={{ padding: '0.28rem 0.7rem', background: !useCustom && days === d ? C.primary : 'transparent', color: !useCustom && days === d ? '#fff' : C.dim, border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: !useCustom && days === d ? 700 : 400, cursor: 'pointer' }}>
                {d} dias
              </button>
            ))}
            <button onClick={() => setUseCustom(true)} style={{ padding: '0.28rem 0.7rem', background: useCustom ? C.primary : 'transparent', color: useCustom ? '#fff' : C.dim, border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: useCustom ? 700 : 400, cursor: 'pointer' }}>Personalizado</button>
          </div>
          {useCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.primaryB}`, borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }} />
              <span style={{ fontSize: '0.72rem', color: C.dim }}>até</span>
              <input type="date" value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.primaryB}`, borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }} />
            </div>
          )}
        </div>
        <button onClick={() => { setShowNiveis(v => !v); setTiersEdit(tiers) }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          Ajustar níveis
        </button>
        <button onClick={syncSubs} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: syncing ? C.vdim : C.dim, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {syncing ? 'Sincronizando...' : 'Sync Meus Subs'}
        </button>
        <button onClick={() => { setShowDiag(v => !v); if (!diagData) runDiag() }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: showDiag ? 'rgba(239,68,68,0.12)' : 'transparent', border: `1px solid ${showDiag ? 'rgba(239,68,68,0.3)' : C.cardB}`, color: showDiag ? '#ef4444' : C.dim, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Diagnóstico
        </button>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          + Adicionar Sub
        </button>
      </div>

      {/* Ajustar níveis panel */}
      {showNiveis && (
        <div style={{ background: C.card, border: `1px solid ${C.primaryB}`, borderRadius: '12px', padding: '1.3rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: C.text }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              Ajustar níveis — Twitch
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setTiersEdit({ tier1_name: 'Tier 1', tier1_value: 9.9, tier2_name: 'Tier 2', tier2_value: 25.9, tier3_name: 'Tier 3', tier3_value: 49.9 })} style={{ padding: '0.35rem 0.8rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer' }}>Padrões</button>
              <button onClick={() => setShowNiveis(false)} style={{ padding: '0.35rem 0.8rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveTiers} disabled={savingTiers} style={{ padding: '0.35rem 0.8rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                {savingTiers ? '...' : 'Salvar'}
              </button>
            </div>
          </div>
          {(['tier1', 'tier2', 'tier3'] as const).map((t, i) => {
            const nameKey = `${t}_name` as keyof TierConfig
            const valKey = `${t}_value` as keyof TierConfig
            return (
              <div key={t} style={{ background: '#0b0d1a', borderRadius: '10px', padding: '1rem', marginBottom: i < 2 ? '0.75rem' : 0 }}>
                <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>Tier {i + 1}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={lbl}>Nome</label>
                    <input value={String(tiersEdit[nameKey])} onChange={e => setTiersEdit(p => ({ ...p, [nameKey]: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Valor (R$)</label>
                    <input type="number" step="0.01" value={Number(tiersEdit[valKey])} onChange={e => setTiersEdit(p => ({ ...p, [valKey]: Number(e.target.value) }))} style={inp} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Diagnóstico EventSub */}
      {showDiag && (
        <div style={{ background: C.card, border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '1.3rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Diagnóstico de Integração
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={runDiag} disabled={diagLoading} style={{ padding: '0.3rem 0.75rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '7px', fontSize: '0.75rem', cursor: 'pointer' }}>
                {diagLoading ? '...' : '↻ Atualizar'}
              </button>
              <button onClick={runResync} disabled={resyncing} style={{ padding: '0.3rem 0.9rem', background: resyncing ? 'rgba(145,71,255,0.2)' : C.primary, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700, cursor: resyncing ? 'not-allowed' : 'pointer' }}>
                {resyncing ? '⏳ Ativando...' : '⚡ Forçar Resync'}
              </button>
            </div>
          </div>
          {resyncing && <div style={{ color: C.dim, fontSize: '0.82rem', marginBottom: '0.75rem' }}>⏳ Removendo inscrições com problemas e recriando... aguarde ~5s</div>}
          {resyncResult && (
            <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Resultado do último resync</div>
              {Object.entries(resyncResult).map(([type, result]) => {
                const ok = result === 'registered' || result === 'already_exists'
                return (
                  <div key={type} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.74rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: ok ? '#22c55e' : '#ef4444', fontWeight: 700, flexShrink: 0 }}>{ok ? '✓' : '✗'}</span>
                    <span style={{ color: ok ? C.text : '#ef4444' }}>{type}: <span style={{ color: ok ? C.dim : '#ef4444' }}>{result}</span></span>
                  </div>
                )
              })}
            </div>
          )}
          {diagLoading && <div style={{ color: C.dim, fontSize: '0.82rem' }}>Verificando...</div>}
          {!diagLoading && diagData && (() => {
            const d = diagData as Record<string, unknown>
            const tv = d.tokenValidation as Record<string, unknown> | undefined
            const tok = d.token as Record<string, unknown> | undefined
            const subs = (d.eventsubSubscriptions as Array<Record<string, string>> | undefined) ?? []
            const cmds = (d.eventCommands as Array<{ trigger: string; habilitado: boolean }> | undefined) ?? []
            const EXPECTED = ['channel.follow', 'channel.subscribe', 'channel.subscription.gift', 'channel.subscription.message', 'channel.cheer', 'channel.chat.message']
            const activeTypes = subs.filter(s => s.status === 'enabled').map(s => s.type)
            const eventsubError = d.eventsubError as string | undefined
            const cheersTableExists = Boolean(d.cheersTableExists)
            const cheersTableError = d.cheersTableError as string | null
            const eventsTableError = d.eventsTableError as string | undefined
            const recentEvents = (d.recentEvents as unknown[]) ?? []
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Token status */}
                <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Token Twitch</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: tok?.hasToken ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{tok?.hasToken ? '✓' : '✗'}</span>
                      <span style={{ color: C.text }}>Token armazenado</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: tok?.hasRefreshToken ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{tok?.hasRefreshToken ? '✓' : '!'}</span>
                      <span style={{ color: C.text }}>Refresh token {tok?.hasRefreshToken ? 'presente' : 'ausente — reconecte a Twitch'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: tv?.valid ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{tv?.valid ? '✓' : '✗'}</span>
                      <span style={{ color: C.text }}>Token válido {tv?.valid ? `(${String(tv.login)})` : `— ${String(tv?.error ?? 'expirado')}`}</span>
                    </div>
                    {tv?.valid === true && (
                      <div style={{ fontSize: '0.7rem', color: C.dim, marginTop: '0.2rem' }}>
                        Escopos: {(tv.scopes as string[] | undefined)?.join(', ') ?? '?'}
                      </div>
                    )}
                    {tv?.valid !== true && (
                      <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.71rem', color: '#ef4444' }}>
                        Reconecte a Twitch em Conexões para renovar o token.
                      </div>
                    )}
                  </div>
                </div>

                {/* EventSub subscriptions */}
                <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                    EventSub ({subs.length} inscrições)
                  </div>
                  {eventsubError && <div style={{ fontSize: '0.72rem', color: '#ef4444' }}>Erro: {eventsubError}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {EXPECTED.map(type => {
                      const found = subs.find(s => s.type === type)
                      const active = activeTypes.includes(type)
                      return (
                        <div key={type} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem' }}>
                          <span style={{ color: active ? '#22c55e' : found ? '#f59e0b' : '#ef4444', fontWeight: 700, flexShrink: 0 }}>
                            {active ? '✓' : found ? '!' : '✗'}
                          </span>
                          <span style={{ color: active ? C.text : C.dim }}>{type}</span>
                          {found && !active && <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>({found.status})</span>}
                        </div>
                      )
                    })}
                    {subs.length === 0 && !eventsubError && (
                      <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Nenhuma inscrição ativa — clique em "Forçar Resync"</div>
                    )}
                  </div>
                </div>

                {/* Event commands */}
                <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Comandos de evento no banco</div>
                  {cmds.length === 0
                    ? <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Nenhum comando encontrado — clique em "Forçar Resync"</div>
                    : cmds.map(c => (
                      <div key={c.trigger} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: c.habilitado ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{c.habilitado ? '✓' : '!'}</span>
                        <span style={{ color: c.habilitado ? C.text : C.dim }}>{c.trigger} {!c.habilitado && '(desativado)'}</span>
                      </div>
                    ))
                  }
                </div>

                {/* DB tables + webhook log */}
                <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Tabelas do banco</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: cheersTableExists ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{cheersTableExists ? '✓' : '✗'}</span>
                      <span style={{ color: C.text }}>twitch_cheers {!cheersTableExists && `— ${cheersTableError ?? ''}`}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: !eventsTableError ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{!eventsTableError ? '✓' : '!'}</span>
                      <span style={{ color: C.text }}>twitch_events {eventsTableError ? `— ${eventsTableError}` : `(${recentEvents.length} entradas)`}</span>
                    </div>
                    {!cheersTableExists && (
                      <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.71rem', color: '#ef4444' }}>
                        Execute o SQL do supabase-schema.sql no Supabase SQL Editor para criar a tabela twitch_cheers.
                      </div>
                    )}
                    <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', color: C.dim }}>
                      URL webhook: <span style={{ color: C.vdim, wordBreak: 'break-all' }}>{String(d.webhookUrl ?? '?')}</span>
                    </div>
                    {recentEvents.length > 0 && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <div style={{ fontSize: '0.67rem', color: C.dim, marginBottom: '0.3rem' }}>Últimas entradas:</div>
                        {(recentEvents as Array<{ broadcaster_id: string; event_type: string }>).map((e, i) => (
                          <div key={i} style={{ fontSize: '0.68rem', color: e.broadcaster_id === '_webhook' ? '#f59e0b' : C.dim, marginBottom: '0.15rem' }}>
                            {e.broadcaster_id === '_webhook' ? '⚡ ' : ''}{e.event_type}
                          </div>
                        ))}
                      </div>
                    )}
                    {recentEvents.length === 0 && !eventsTableError && activeTypes.length === 0 && (
                      <div style={{ marginTop: '0.3rem', fontSize: '0.71rem', color: '#ef4444' }}>
                        Nenhuma entrada — a Twitch não está chegando no webhook (URL errada ou rota inacessível)
                      </div>
                    )}
                    {recentEvents.length === 0 && !eventsTableError && activeTypes.length > 0 && (
                      <div style={{ marginTop: '0.3rem', fontSize: '0.71rem', color: '#22c55e' }}>
                        Webhook funcionando — entradas aparecerão quando ocorrerem eventos reais (follows, subs, bits...)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {[
          { label: 'Total subs', value: String(totalSubs), sub: null },
          { label: 'Gift subs', value: String(giftSubs), sub: 'total geral' },
          { label: 'Tickets gerados', value: String(totalTickets), sub: 'total geral' },
          { label: 'Total bruto', value: fmt(totalBruto), sub: 'pago pelos subs' },
          { label: 'Total líquido', value: fmt(totalLiquid), sub: null, extra: true },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.dim, marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: C.text, marginBottom: s.sub ? '0.2rem' : 0 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: '0.7rem', color: C.vdim }}>{s.sub}</div>}
            {s.extra && (
              <>
                <div style={{ fontSize: '0.7rem', color: C.primary, marginTop: '0.3rem' }}>{fmtUSD(totalUSD)} de {fmtUSD(PAYOUT_THRESHOLD)} <span style={{ color: C.primary, fontWeight: 700 }}>{pctPayout.toFixed(1)}%</span></div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginTop: '0.4rem' }}>
                  <div style={{ height: '100%', background: C.primary, width: `${pctPayout}%`, borderRadius: 99 }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Bits */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Bits recebidos
          </div>
          <span style={{ fontSize: '0.7rem', color: C.dim }}>período selecionado</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Total bits</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b' }}>{totalBits.toLocaleString('pt-BR')}</div>
          </div>
          <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Valor estimado</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: C.accent }}>{fmt(bitsBRL)}</div>
            <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.15rem' }}>{fmtUSD(bitsUSD)} aprox.</div>
          </div>
          <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Cheers</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: C.text }}>{cheers.length}</div>
            <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.15rem' }}>{uniqueCheerers} únicos</div>
          </div>
          <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.35rem' }}>Top cheerers</div>
            {topCheerers.length === 0
              ? <div style={{ fontSize: '0.8rem', color: C.vdim }}>Nenhum ainda</div>
              : topCheerers.map(([name, bits], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < topCheerers.length - 1 ? '0.3rem' : 0 }}>
                  <span style={{ fontSize: '0.78rem', color: C.text, fontWeight: i === 0 ? 700 : 400 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>{bits.toLocaleString('pt-BR')}</span>
                </div>
              ))
            }
          </div>
        </div>
        {bitsHistorical > totalBits && (
          <div style={{ marginTop: '0.6rem', fontSize: '0.71rem', color: C.dim }}>
            Total histórico (todos os tempos): <span style={{ color: '#f59e0b', fontWeight: 700 }}>{bitsHistorical.toLocaleString('pt-BR')} bits</span>
            {' '}≈ <span style={{ color: C.accent }}>{fmt(bitsHistoricalBRL)}</span>
          </div>
        )}
      </div>

      {/* Streamer + Repasse */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        {/* Streamer card */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
            {user?.image
              ? <img src={user.image} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${C.primaryB}` }} />
              : <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.primaryBg, border: `2px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: C.primary }}>{(user?.name || 'S')[0]}</div>
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.name || '...'}</div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: C.primaryBg, color: C.primary, borderRadius: 999, border: `1px solid ${C.primaryB}` }}>Afiliado</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ background: '#0b0d1a', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.2rem' }}>Seguidores</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {channelStats ? (channelStats.follower_count !== null ? channelStats.follower_count.toLocaleString('pt-BR') : <span style={{ color: C.dim, fontSize: '0.8rem' }}>Reconecte</span>) : '…'}
              </div>
            </div>
            <div style={{ background: '#0b0d1a', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.2rem' }}>Views totais</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {channelStats ? (channelStats.view_count !== null ? channelStats.view_count.toLocaleString('pt-BR') : '—') : '…'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', background: '#0b0d1a', borderRadius: '8px', padding: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span style={{ fontSize: '0.78rem', color: C.dim }}>Canal offline no momento</span>
          </div>
        </div>

        {/* Repasse card */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem' }}>
              <span style={{ color: C.accent }}>$</span>
              Estimativa de Repasse Twitch
            </div>
            <span style={{ fontSize: '0.7rem', color: C.dim }}>estimativa</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {[
              { label: 'Arrecadado bruto', value: fmt(totalBruto + (bitsHistorical > 0 ? bitsHistoricalBRL : bitsBRL)), sub: `subs + ${(bitsHistorical > 0 ? bitsHistorical : totalBits).toLocaleString('pt-BR')} bits`, color: C.text },
              { label: 'Repasse líquido', value: fmt(totalLiquidAll), sub: '50% subs + bits diretos', color: C.accent },
              { label: 'Equivalente em U$', value: fmtUSD(totalUSD), sub: `cotação R$${EXCHANGE.toFixed(2)}`, color: C.text },
            ].map(r => (
              <div key={r.label} style={{ background: '#0b0d1a', borderRadius: '8px', padding: '0.65rem' }}>
                <div style={{ fontSize: '0.65rem', color: C.dim, marginBottom: '0.2rem' }}>{r.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: r.color }}>{r.value}</div>
                <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.15rem' }}>{r.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.3rem' }}>
            <span style={{ color: C.dim }}>Meta de repasse Twitch · {fmtUSD(PAYOUT_THRESHOLD)} · {fmt(PAYOUT_THRESHOLD * EXCHANGE)}</span>
            <span style={{ color: C.dim }}>faltam <span style={{ color: C.primary, fontWeight: 700 }}>{fmtUSD(Math.max(0, PAYOUT_THRESHOLD - totalUSD))} ({fmt(Math.max(0, PAYOUT_THRESHOLD - totalUSD) * EXCHANGE)})</span> {pctPayout.toFixed(1)}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginBottom: '0.5rem' }}>
            <div style={{ height: '100%', background: C.accent, width: `${pctPayout}%`, borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: C.accent, fontWeight: 700 }}>{fmtUSD(totalUSD)}</span>
            <span style={{ color: C.vdim }}>{fmtUSD(PAYOUT_THRESHOLD)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem', fontSize: '0.72rem' }}>
            <span style={{ color: C.dim }}>📅 Próximo pagamento estimado: <span style={{ color: C.text, fontWeight: 600 }}>{nextPayStr}</span> — se meta for atingida</span>
            <a href="https://dashboard.twitch.tv" target="_blank" rel="noopener noreferrer" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Ver no Dashboard Twitch ↗</a>
          </div>
        </div>
      </div>

      {/* Tabs + list */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.cardB}` }}>
          {(['subs', 'transmissoes'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '0.85rem 1.3rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? C.text : C.dim, borderBottom: activeTab === t ? `2px solid ${C.primary}` : '2px solid transparent' }}>
              {t === 'subs' ? 'Subs cadastrados' : 'Transmissões'}
            </button>
          ))}
        </div>

        {activeTab === 'subs' && (
          <>
            <div style={{ padding: '0.85rem 1.2rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: `1px solid ${C.cardB}` }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por username..." style={{ ...inp, paddingLeft: '2rem', maxWidth: 400 }} />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{ ...inp, width: 'auto', minWidth: 140 }}>
                <option value="newest">Mais recente</option>
                <option value="oldest">Mais antigo</option>
                <option value="value">Maior valor</option>
              </select>
            </div>
            <div style={{ padding: '0.6rem 1.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.dim, borderBottom: `1px solid ${C.cardB}` }}>
              <span>Mostrando {sorted.length} de {subs.length} sub{subs.length !== 1 ? 's' : ''}</span>
              <span style={{ padding: '0.12rem 0.5rem', background: C.primaryBg, color: C.primary, borderRadius: 99, fontWeight: 700, fontSize: '0.68rem', border: `1px solid ${C.primaryB}` }}>Twitch</span>
            </div>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: C.dim }}>Carregando...</div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: C.dim, fontSize: '0.85rem' }}>
                {subs.length === 0 ? 'Nenhum sub cadastrado. Clique em "+ Adicionar Sub" para começar.' : 'Nenhum resultado para a busca.'}
              </div>
            ) : sorted.map(s => {
              const bruto = tierValue(s.tier, tiers)
              const repasse = bruto * 0.5
              return (
                <div key={s.id} style={{ borderBottom: `1px solid ${C.cardB}` }}>
                  <div style={{ padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.primary, flexShrink: 0, fontSize: '0.9rem' }}>
                      {s.username[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.username}</div>
                      <div style={{ fontSize: '0.72rem', color: C.dim }}>{s.username} · {TIER_LABELS[s.tier] || s.tier} · {fmtDate(s.date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: C.primary }}>{fmt(bruto)}</div>
                      <div style={{ fontSize: '0.7rem', color: C.dim }}>↳ {fmt(repasse)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(s)} style={{ padding: '0.35rem 0.75rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '7px', fontSize: '0.75rem', cursor: 'pointer' }}>✏ Editar</button>
                      <button onClick={() => removeSub(s.id)} style={{ padding: '0.35rem 0.75rem', background: 'transparent', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', borderRadius: '7px', fontSize: '0.75rem', cursor: 'pointer' }}>🗑 Remover</button>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem 1.2rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: C.dim }}>
                    <span>Ticket owner: <span style={{ color: s.is_gift && s.gifted_by ? C.text : C.text }}>{s.is_gift && s.gifted_by ? s.gifted_by : s.username}</span></span>
                    {s.is_gift && <span style={{ padding: '0.1rem 0.45rem', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 99, border: '1px solid rgba(251,191,36,0.25)', fontSize: '0.65rem', fontWeight: 700 }}>GIFT</span>}
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: C.dim }}>{s.tickets} ticket{s.tickets !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'transmissoes' && (
          <div style={{ padding: '0.85rem 1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.78rem', color: C.dim }}>
                {videosLoading ? 'Carregando...' : `${videos.length} transmissão${videos.length !== 1 ? 'ões' : ''} encontrada${videos.length !== 1 ? 's' : ''} no período`}
              </span>
              <button onClick={fetchVideos} disabled={videosLoading} style={{ background: 'none', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: 7, padding: '0.28rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer' }}>↻ Atualizar</button>
            </div>
            {videosLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: C.dim }}>Carregando transmissões...</div>
            ) : videosError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b', fontSize: '0.85rem' }}>{videosError}</div>
            ) : videos.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: C.dim, fontSize: '0.85rem' }}>Nenhuma transmissão encontrada no período selecionado.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {videos.map(v => (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', textDecoration: 'none', padding: '0.75rem', borderRadius: 10, border: `1px solid ${C.cardB}`, background: 'rgba(255,255,255,0.02)' }}>
                    <img
                      src={v.thumbnail_url.replace('%{width}', '160').replace('%{height}', '90').replace('{width}', '160').replace('{height}', '90')}
                      alt=""
                      style={{ width: 112, height: 63, borderRadius: 7, objectFit: 'cover', flexShrink: 0, background: C.cardB }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.35rem' }}>{v.title || '(sem título)'}</div>
                      <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', fontSize: '0.71rem', color: C.dim }}>
                        <span>📅 {fmtDate(v.created_at.slice(0, 10))}</span>
                        <span>⏱ {v.duration}</span>
                        <span>👁 {v.view_count.toLocaleString('pt-BR')} views</span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '0.2rem' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0f1120', border: `1px solid ${C.primaryB}`, borderRadius: '16px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.2rem 1.4rem', borderBottom: `1px solid ${C.cardB}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{editSub ? 'Editar Sub' : 'Adicionar Sub'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div style={{ padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Info */}
              <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Informações do sub
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={lbl}>Username do sub *</label>
                    <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Nome na Twitch" style={inp} />
                    <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.3rem' }}>Quem realizou o sub</div>
                  </div>
                  <div>
                    <label style={lbl}>Tipo de sub</label>
                    <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} style={{ ...inp, appearance: 'auto' }}>
                      <option value="tier1">Tier 1</option>
                      <option value="tier2">Tier 2</option>
                      <option value="tier3">Tier 3</option>
                      <option value="prime">Prime</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={lbl}>Data do sub</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Tickets gerados</label>
                    <input type="number" min={1} value={form.tickets} onChange={e => setForm(p => ({ ...p, tickets: Number(e.target.value) || 1 }))} style={inp} />
                  </div>
                </div>
              </div>

              {/* Gift sub */}
              <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.is_gift ? '0.75rem' : 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Gift sub</div>
                    <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.15rem' }}>O ticket vai para quem enviou o gift</div>
                  </div>
                  <div onClick={() => setForm(p => ({ ...p, is_gift: !p.is_gift }))} style={{ width: 38, height: 22, borderRadius: 999, background: form.is_gift ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}>
                    <div style={{ position: 'absolute', top: 3, left: form.is_gift ? 19 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.15s' }} />
                  </div>
                </div>
                {form.is_gift && (
                  <div>
                    <label style={lbl}>Gifted por</label>
                    <input value={form.gifted_by} onChange={e => setForm(p => ({ ...p, gifted_by: e.target.value }))} placeholder="Username de quem enviou o gift" style={inp} />
                    <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.3rem' }}>Este usuário receberá o ticket</div>
                  </div>
                )}
              </div>

              {/* Sorteio */}
              <div style={{ background: '#0b0d1a', borderRadius: '10px', padding: '1rem' }}>
                <label style={lbl}>Sorteio vinculado</label>
                <select value={form.sorteio_id} onChange={e => setForm(p => ({ ...p, sorteio_id: e.target.value }))} style={{ ...inp, appearance: 'auto' }}>
                  <option value="">— Nenhum sorteio —</option>
                  {sorteios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                {sorteios.length === 0 && (
                  <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.3rem' }}>Sorteios abertos tipo Sub ou Unificado com fonte Twitch — nenhum encontrado</div>
                )}
              </div>

              <button onClick={submitSub} disabled={saving || !form.username.trim()} style={{ padding: '0.85rem', background: form.username.trim() ? C.blue : 'rgba(59,130,246,0.3)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: form.username.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : editSub ? 'Salvar alterações' : 'Adicionar Sub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
