'use client'
import { useEffect, useState, useCallback } from 'react'

const C = {
  bg: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)', primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}
const inp: React.CSSProperties = { width: '100%', padding: '0.6rem 0.9rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: '0.73rem', fontWeight: 600, color: 'rgba(232,230,248,0.5)', marginBottom: '0.3rem', display: 'block' }

type Sorteio = {
  id: string; title: string; type: string; keyword: string | null; status: string
  winner_username: string | null; created_at: string; started_at: string | null; ended_at: string | null
}
type Participant = { username: string; tickets: number; joined_at: string }
type DetailedSorteio = Sorteio & { participants: Participant[]; count: number }

const TYPES = [
  { value: 'all',     label: 'Todos (subs + follows + bits)' },
  { value: 'subs',    label: 'Apenas Subs (2 tickets cada)' },
  { value: 'follows', label: 'Apenas Seguidores' },
  { value: 'keyword', label: 'Palavra-chave no chat' },
]

const statusLabel: Record<string, { text: string; color: string }> = {
  pending:  { text: 'Aguardando', color: '#60a5fa' },
  active:   { text: '● AO VIVO',  color: '#39ff14' },
  finished: { text: 'Encerrado',  color: '#9b30ff' },
}

export default function SorteiosPage() {
  const [sorteios, setSorteios] = useState<Sorteio[]>([])
  const [selected, setSelected] = useState<DetailedSorteio | null>(null)
  const [tab, setTab] = useState<'all' | 'active' | 'finished'>('all')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'all', keyword: '' })
  const [manualUser, setManualUser] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [winner, setWinner] = useState<{ username: string; total: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadList = useCallback(async () => {
    const res = await fetch('/api/sorteios')
    const data = await res.json()
    setSorteios(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  const loadSelected = useCallback(async (id: string) => {
    const res = await fetch(`/api/sorteios/${id}`)
    const data = await res.json()
    setSelected(data)
  }, [])

  useEffect(() => { loadList() }, [loadList])

  // Auto-refresh active sorteio participants
  useEffect(() => {
    if (!selected?.id || selected.status !== 'active') return
    const iv = setInterval(() => loadSelected(selected.id), 5000)
    return () => clearInterval(iv)
  }, [selected?.id, selected?.status, loadSelected])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    const res = await fetch('/api/sorteios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, type: form.type, keyword: form.keyword || null }),
    })
    if (res.ok) {
      setForm({ title: '', type: 'all', keyword: '' })
      setCreating(false)
      await loadList()
    }
    setSaving(false)
  }

  async function patch(id: string, body: object) {
    setSaving(true)
    const res = await fetch(`/api/sorteios/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { await loadList(); if (selected?.id === id) await loadSelected(id) }
    setSaving(false)
  }

  async function draw(id: string) {
    setDrawing(true)
    const res = await fetch(`/api/sorteios/${id}/draw`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setWinner({ username: data.winner, total: data.total_participants })
      await loadList()
      await loadSelected(id)
    } else {
      const err = await res.json()
      alert(err.error ?? 'Erro ao sortear')
    }
    setDrawing(false)
  }

  async function deleteSorteio(id: string) {
    if (!confirm('Excluir este sorteio?')) return
    await fetch(`/api/sorteios/${id}`, { method: 'DELETE' })
    if (selected?.id === id) setSelected(null)
    await loadList()
  }

  async function addManual() {
    if (!selected || !manualUser.trim()) return
    setSaving(true)
    await fetch('/api/sorteios/' + selected.id + '/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: manualUser.trim() }),
    }).catch(() => {})
    setManualUser('')
    await loadSelected(selected.id)
    setSaving(false)
  }

  function copyOverlayUrl() {
    const url = `${window.location.origin}/overlay/sorteio?uid=${encodeURIComponent(selected?.id ?? '')}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  const filtered = sorteios.filter(s =>
    tab === 'all' ? true : tab === 'active' ? s.status === 'active' : s.status === 'finished'
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Sorteios</h2>
        <button onClick={() => setCreating(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          + Novo sorteio
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ background: C.card, border: '1px solid rgba(155,48,255,0.25)', borderRadius: '12px', padding: '1.3rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Novo Sorteio</div>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={lbl}>Título *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Sorteio de Sub" style={inp} required />
              </div>
              <div>
                <label style={lbl}>Tipo de entrada</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.type === 'keyword' && (
                <div>
                  <label style={lbl}>Palavra-chave</label>
                  <input value={form.keyword} onChange={e => setForm(p => ({ ...p, keyword: e.target.value }))} placeholder="!sorteio" style={inp} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.3rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer' }}>Criar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: '1rem' }}>

        {/* List */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
            {(['all', 'active', 'finished'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '0.3rem 0.9rem', borderRadius: '6px', border: 'none', background: tab === t ? C.primaryBg : 'transparent', color: tab === t ? C.primary : C.dim, fontSize: '0.78rem', fontWeight: tab === t ? 700 : 400, cursor: 'pointer', outline: tab === t ? '1px solid rgba(155,48,255,0.3)' : 'none', outlineOffset: '-1px' }}>
                {t === 'all' ? 'Todos' : t === 'active' ? 'Ativos' : 'Encerrados'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '3rem', textAlign: 'center', color: C.vdim, fontSize: '0.85rem' }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.15, marginBottom: '0.75rem' }}>🎰</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.text, marginBottom: '0.4rem' }}>Nenhum sorteio</div>
              <div style={{ fontSize: '0.8rem', color: C.dim }}>Crie seu primeiro sorteio acima</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map(s => {
                const sl = statusLabel[s.status] ?? { text: s.status, color: C.dim }
                const isSelected = selected?.id === s.id
                return (
                  <div key={s.id} onClick={() => { setSelected(null); setWinner(null); loadSelected(s.id) }}
                    style={{ background: isSelected ? 'rgba(155,48,255,0.08)' : C.card, border: `1px solid ${isSelected ? 'rgba(155,48,255,0.3)' : C.cardB}`, borderRadius: '10px', padding: '0.9rem 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                      <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.15rem' }}>{TYPES.find(t => t.value === s.type)?.label ?? s.type}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: sl.color }}>{sl.text}</div>
                      {s.winner_username && <div style={{ fontSize: '0.7rem', color: C.accent, marginTop: '2px' }}>🏆 {s.winner_username}</div>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteSorteio(s.id) }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,68,68,0.35)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem', flexShrink: 0 }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: C.card, border: '1px solid rgba(155,48,255,0.2)', borderRadius: '12px', padding: '1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text }}>{selected.title}</div>
                <div style={{ fontSize: '0.72rem', color: statusLabel[selected.status]?.color ?? C.dim, marginTop: '2px' }}>
                  {statusLabel[selected.status]?.text ?? selected.status}
                  {selected.count > 0 && <span style={{ color: C.dim }}> · {selected.count} participantes</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>

            {/* Winner banner */}
            {winner && (
              <div style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, marginBottom: '0.3rem' }}>VENCEDOR DO SORTEIO</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: C.accent }}>🏆 {winner.username}</div>
                <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.25rem' }}>entre {winner.total} participantes</div>
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {selected.status === 'pending' && (
                <button onClick={() => patch(selected.id, { status: 'active' })} disabled={saving} style={{ padding: '0.45rem 1rem', background: 'rgba(57,255,20,0.1)', color: C.accent, border: '1px solid rgba(57,255,20,0.2)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                  ▶ Iniciar sorteio
                </button>
              )}
              {selected.status === 'active' && (
                <>
                  <button onClick={() => { setWinner(null); draw(selected.id) }} disabled={drawing || saving} style={{ padding: '0.45rem 1rem', background: C.primaryBg, color: C.primary, border: `1px solid rgba(155,48,255,0.3)`, borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                    {drawing ? 'Sorteando...' : '🎰 Sortear vencedor'}
                  </button>
                  <button onClick={() => patch(selected.id, { status: 'finished' })} disabled={saving} style={{ padding: '0.45rem 1rem', background: 'rgba(255,68,68,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    Encerrar
                  </button>
                </>
              )}
              {selected.status === 'finished' && (
                <button onClick={() => { setWinner(null); patch(selected.id, { status: 'pending' }) }} disabled={saving} style={{ padding: '0.45rem 1rem', background: 'rgba(255,255,255,0.04)', color: C.muted, border: `1px solid ${C.cardB}`, borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  ↺ Resetar
                </button>
              )}
              <button onClick={copyOverlayUrl} style={{ padding: '0.45rem 1rem', background: 'rgba(255,255,255,0.03)', color: copied ? C.accent : C.dim, border: `1px solid ${C.cardB}`, borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                {copied ? '✓ URL copiada' : 'URL OBS'}
              </button>
            </div>

            {/* Manual add participant (for keyword type) */}
            {selected.status === 'active' && selected.type === 'keyword' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input value={manualUser} onChange={e => setManualUser(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManual()} placeholder="Adicionar participante manualmente" style={{ ...inp }} />
                <button onClick={addManual} disabled={saving} style={{ padding: '0.6rem 1rem', background: C.primaryBg, color: C.primary, border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>+ Add</button>
              </div>
            )}

            {/* Participants list */}
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
              Participantes {selected.count > 0 && `(${selected.count})`}
            </div>
            {selected.participants.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: C.vdim, textAlign: 'center', padding: '1.5rem 0' }}>
                {selected.status === 'active'
                  ? selected.type === 'subs' ? 'Aguardando novos subs...'
                  : selected.type === 'follows' ? 'Aguardando novos seguidores...'
                  : selected.type === 'keyword' ? 'Adicione participantes manualmente'
                  : 'Aguardando subs, follows e bits...'
                  : 'Nenhum participante'}
              </div>
            ) : (
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {selected.participants.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: selected.winner_username === p.username ? C.accent : C.text, fontWeight: selected.winner_username === p.username ? 700 : 400 }}>
                      {selected.winner_username === p.username && '🏆 '}{p.username}
                    </span>
                    {p.tickets > 1 && <span style={{ fontSize: '0.68rem', color: C.primary, background: C.primaryBg, padding: '1px 6px', borderRadius: '999px' }}>{p.tickets}x</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
