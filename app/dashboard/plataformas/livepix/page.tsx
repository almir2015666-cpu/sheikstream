'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { notify } from '@/app/lib/notify'

const C = {
  bg: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.35)', vdim: 'rgba(232,230,248,0.18)',
  primary: '#ff69b4', primaryBg: 'rgba(255,105,180,0.1)', primaryB: 'rgba(255,105,180,0.3)',
  accent: '#39ff14', blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.1)', blueB: 'rgba(59,130,246,0.25)',
  red: '#ff6b6b', redBg: 'rgba(255,68,68,0.08)',
}

const inp: React.CSSProperties = { width: '100%', padding: '0.55rem 0.75rem', background: '#0b0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'block' }

type Donor = { id: string; broadcaster_id: string; username: string; amount: number; message: string | null; is_manual: boolean; sorteio_id: string | null; tickets: number; date: string; created_at: string }
type Sorteio = { id: string; title: string; status: string }

function fmt(v: number) { return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function today() { return new Date().toISOString().split('T')[0] }
function fmtDate(d: string) { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` }

const BLANK = { username: '', amount: '', message: '', tickets: 1, sorteio_id: '', date: today() }

export default function LivepixDonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [sorteios, setSorteios] = useState<Sorteio[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'tickets' | 'amount' | 'newest'>('tickets')
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
  const [form, setForm] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [donorsRes, sorteiosRes] = await Promise.all([
      fetch('/api/livepix/donors').then(r => r.json()).catch(() => []),
      fetch('/api/sorteios').then(r => r.json()).catch(() => []),
    ])
    setDonors(Array.isArray(donorsRes) ? donorsRes : [])
    setSorteios(Array.isArray(sorteiosRes) ? sorteiosRes.filter((s: Sorteio) => s.status === 'active') : [])
    setLoading(false)
  }, [])

  async function syncLivepix() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/livepix/sync', { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setSyncMsg(d.synced > 0 ? `${d.synced} doação(ões) importada(s)!` : 'Já atualizado.')
        await load()
      } else {
        setSyncMsg(`Erro: ${d.error ?? 'falha ao sincronizar'}`)
      }
    } catch {
      setSyncMsg('Erro de conexão')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }

  useEffect(() => { load() }, [load])

  const filtered = donors
    .filter(d => !search || d.username.toLowerCase().includes(search.toLowerCase()) || (d.message || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'amount') return Number(b.amount) - Number(a.amount)
      if (sort === 'newest') return b.created_at.localeCompare(a.created_at)
      return b.tickets - a.tickets
    })

  const totalAmount = donors.reduce((acc, d) => acc + Number(d.amount), 0)
  const totalTickets = donors.reduce((acc, d) => acc + d.tickets, 0)
  const taxa = totalAmount * 0.05
  const liquid = totalAmount - taxa
  const maxDonor = donors.length > 0 ? donors.reduce((a, b) => Number(a.amount) > Number(b.amount) ? a : b) : null

  async function addDonor() {
    if (!form.username.trim() || !form.amount) return
    setSaving(true)
    const res = await fetch('/api/livepix/donors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), sorteio_id: form.sorteio_id || null }),
    })
    setSaving(false)
    if (res.ok) {
      setForm({ ...BLANK })
      setActiveTab('list')
      notify(`Doador ${form.username} adicionado!`, 'success')
      load()
    } else {
      const d = await res.json()
      notify(d.error || 'Erro ao adicionar', 'error')
    }
  }

  async function removeDonor(id: string, username: string) {
    if (!confirm(`Remover ${username}?`)) return
    const res = await fetch(`/api/livepix/donors/${id}`, { method: 'DELETE' })
    if (res.ok) { notify('Doador removido', 'success'); setDonors(prev => prev.filter(d => d.id !== id)) }
    else notify('Erro ao remover', 'error')
  }

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
          <div style={{ width: 26, height: 26, borderRadius: '6px', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          </div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Livepix</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
          <button onClick={syncLivepix} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: syncing ? 'default' : 'pointer', opacity: syncing ? 0.6 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {syncing ? 'Sincronizando...' : 'Sync Livepix'}
          </button>
          {syncMsg && <span style={{ fontSize: '0.7rem', color: syncMsg.startsWith('Erro') ? C.red : C.accent }}>{syncMsg}</span>}
        </div>
        <button onClick={() => setActiveTab('add')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          + Adicionar Doador
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.cardB}`, marginBottom: '1rem' }}>
        {(['list', 'add'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '0.6rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? C.text : C.dim, borderBottom: activeTab === t ? `2px solid ${C.primary}` : '2px solid transparent' }}>
            {t === 'list' ? 'Doadores' : 'Adicionar Doador'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Total participantes', value: String(donors.length) },
          { label: 'Total tickets', value: String(totalTickets) },
          { label: 'Arrecadado', value: fmt(totalAmount) },
          { label: 'Maior doador', value: maxDonor ? `${maxDonor.username}` : '—' },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.dim, marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text }}>{s.value}</div>
            {s.label === 'Maior doador' && maxDonor && (
              <div style={{ fontSize: '0.68rem', color: C.primary, marginTop: '0.15rem' }}>{fmt(Number(maxDonor.amount))}</div>
            )}
          </div>
        ))}
      </div>

      {/* Estimativa de Receita */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <span style={{ color: C.primary }}>$</span>
            Estimativa de Receita Livepix
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', background: 'rgba(255,68,68,0.12)', color: C.red, border: '1px solid rgba(255,68,68,0.25)', borderRadius: 99, fontWeight: 700 }}>API desconectada</span>
            <span style={{ fontSize: '0.68rem', color: C.dim }}>estimativa</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {[
            { label: 'Total arrecadado', value: fmt(totalAmount), sub: 'valor bruto doações', color: C.text },
            { label: 'Taxa Livepix (5%)', value: `– ${fmt(taxa)}`, sub: 'comissão retida', color: C.red },
            { label: 'Líquido (95%)', value: fmt(liquid), sub: 'repasse ao streamer', color: C.primary },
          ].map(r => (
            <div key={r.label} style={{ background: '#0b0d1a', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', color: C.dim, marginBottom: '0.25rem' }}>{r.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: r.color }}>{r.value}</div>
              <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.15rem' }}>{r.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {[
            { label: 'Saldo disponível (carteira)', sub: 'via API Livepix' },
            { label: 'A receber (pendente)', sub: 'via API Livepix' },
          ].map(r => (
            <div key={r.label} style={{ background: '#0b0d1a', border: `1px dashed rgba(255,255,255,0.08)`, borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: C.dim, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                {r.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: C.vdim }}>API Livepix não conectada</div>
              <div style={{ fontSize: '0.68rem', color: C.vdim }}>{r.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: C.dim }}>
          <span>Taxa: 5% · Primeiros 3 saques/mês grátis · Saques adicionais R$0,50</span>
          <a href="https://app.livepix.gg" target="_blank" rel="noopener noreferrer" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Ver no Dashboard Livepix ↗</a>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Search + sort */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar doador..." style={{ ...inp, paddingLeft: '2rem' }} />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{ ...inp, width: 'auto', minWidth: 150, appearance: 'auto' }}>
              <option value="tickets">Mais tickets</option>
              <option value="amount">Maior valor</option>
              <option value="newest">Mais recente</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.dim, marginBottom: '0.5rem' }}>
            <span>Mostrando {filtered.length} doador{filtered.length !== 1 ? 'es' : ''}</span>
            <span style={{ padding: '0.12rem 0.5rem', background: C.primaryBg, color: C.primary, borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, border: `1px solid ${C.primaryB}` }}>Livepix e manual</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: C.dim }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '14px', padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>Nenhum doador encontrado</div>
              <div style={{ fontSize: '0.82rem', color: C.dim, marginBottom: '1.5rem' }}>Os doadores aparecem automaticamente após doações via Livepix</div>
              <button onClick={() => setActiveTab('add')} style={{ padding: '0.65rem 1.4rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
                + Adicionar Doador
              </button>
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden' }}>
              {filtered.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.2rem', borderBottom: i < filtered.length - 1 ? `1px solid ${C.cardB}` : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.primary, flexShrink: 0, fontSize: '0.9rem' }}>
                    {d.username[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {d.username}
                      {d.is_manual && <span style={{ fontSize: '0.6rem', padding: '0.08rem 0.4rem', background: 'rgba(255,255,255,0.06)', color: C.vdim, borderRadius: 99, border: `1px solid rgba(255,255,255,0.08)` }}>manual</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.1rem' }}>
                      {d.message ? `"${d.message}" · ` : ''}{fmtDate(d.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.primary }}>{fmt(Number(d.amount))}</div>
                    <div style={{ fontSize: '0.7rem', color: C.dim }}>+{d.tickets} ticket{d.tickets !== 1 ? 's' : ''}</div>
                  </div>
                  <button onClick={() => removeDonor(d.id, d.username)} style={{ background: 'transparent', border: `1px solid rgba(255,68,68,0.2)`, color: C.red, borderRadius: '7px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'add' && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '14px', padding: '1.4rem' }}>
            <h3 style={{ margin: '0 0 1.1rem', fontSize: '0.95rem', fontWeight: 700 }}>Adicionar Doador</h3>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              <div>
                <label style={lbl}>Username *</label>
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Nome do doador" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Valor doado (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Tickets gerados</label>
                  <input type="number" min={1} value={form.tickets} onChange={e => setForm(p => ({ ...p, tickets: Number(e.target.value) || 1 }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Mensagem (opcional)</label>
                <input value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Mensagem da doação" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Data</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Sorteio vinculado</label>
                  <select value={form.sorteio_id} onChange={e => setForm(p => ({ ...p, sorteio_id: e.target.value }))} style={{ ...inp, appearance: 'auto' }}>
                    <option value="">— Nenhum —</option>
                    {sorteios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={addDonor} disabled={saving || !form.username.trim() || !form.amount} style={{ flex: 1, padding: '0.75rem', background: form.username.trim() && form.amount ? C.blue : 'rgba(59,130,246,0.3)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: form.username.trim() && form.amount ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Adicionando...' : '+ Adicionar Doador'}
                </button>
                <button onClick={() => setActiveTab('list')} style={{ padding: '0.75rem 1.2rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
