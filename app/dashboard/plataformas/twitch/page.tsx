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
type Sorteio = { id: string; title: string; type: string; status: string }

const TIER_LABELS: Record<string, string> = { tier1: 'Tier 1', tier2: 'Tier 2', tier3: 'Tier 3', prime: 'Prime' }
const PERIOD_OPTIONS = [7, 30, 90]

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
  const [subs, setSubs] = useState<Sub[]>([])
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

  const loadSubs = useCallback(async () => {
    setLoading(true)
    const [subsRes, tiersRes, sorteiosRes, meRes] = await Promise.all([
      fetch(`/api/twitch/subs?days=${days}`).then(r => r.json()).catch(() => []),
      fetch('/api/twitch/tier-config').then(r => r.json()).catch(() => ({})),
      fetch('/api/sorteios').then(r => r.json()).catch(() => []),
      fetch('/api/me').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    setSubs(Array.isArray(subsRes) ? subsRes : [])
    if (tiersRes && !tiersRes.error) { setTiers(tiersRes); setTiersEdit(tiersRes) }
    setSorteios(Array.isArray(sorteiosRes) ? sorteiosRes.filter((s: Sorteio) => s.status === 'active') : [])
    setUser(meRes)
    setLoading(false)
  }, [days])

  useEffect(() => { loadSubs() }, [loadSubs])

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
  const totalUSD = totalLiquid / EXCHANGE
  const pctPayout = Math.min(100, (totalUSD / PAYOUT_THRESHOLD) * 100)

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
    if (!form.username.trim()) return
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
          <div style={{ width: 28, height: 28, borderRadius: '7px', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: C.primary }}>T</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Subs da Twitch</h2>
        </div>
        {/* Period tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '8px', padding: '3px' }}>
          {PERIOD_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: '0.28rem 0.7rem', background: days === d ? C.primary : 'transparent', color: days === d ? '#fff' : C.dim, border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: days === d ? 700 : 400, cursor: 'pointer' }}>
              {d} dias
            </button>
          ))}
          <button style={{ padding: '0.28rem 0.7rem', background: 'transparent', color: C.dim, border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>Personalizado</button>
        </div>
        <button onClick={() => { setShowNiveis(v => !v); setTiersEdit(tiers) }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          Ajustar níveis
        </button>
        <button onClick={loadSubs} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Sync Meus Subs
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
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
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>—</div>
            </div>
            <div style={{ background: '#0b0d1a', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.2rem' }}>Views (30d)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>—</div>
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
              { label: 'Arrecadado bruto', value: fmt(totalBruto), sub: 'pago pelos subs', color: C.text },
              { label: 'Repasse líquido', value: fmt(totalLiquid), sub: '50% do bruto', color: C.accent },
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
                    <span style={{ marginLeft: 'auto', background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryB}`, borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 700 }}>+{s.tickets} ticket{s.tickets !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'transmissoes' && (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.dim, fontSize: '0.85rem' }}>
            Histórico de transmissões — em breve
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
