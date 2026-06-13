'use client'
import { useEffect, useState, useCallback } from 'react'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  vdim: 'rgba(232,230,248,0.18)', primary: '#9b30ff',
  primaryBg: 'rgba(155,48,255,0.12)', border: 'rgba(255,255,255,0.07)',
  accent: '#39ff14', red: '#ef4444', green: '#22c55e',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: '#08090d', border: `1px solid ${S.border}`,
  borderRadius: 8, color: S.text, fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

type Raid = {
  id: string; raid_type: 'incoming' | 'outgoing'; partner_name: string
  partner_image: string | null; viewer_count: number; notes: string | null; occurred_at: string
}

type RaidType = 'incoming' | 'outgoing'
type FormState = { raid_type: RaidType; partner_name: string; viewer_count: string; notes: string }
const EMPTY: FormState = { raid_type: 'incoming', partner_name: '', viewer_count: '', notes: '' }

export default function RaidsPage() {
  const [raids, setRaids] = useState<Raid[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const data = await fetch('/api/raids').then(r => r.ok ? r.json() : []).catch(() => [])
    setRaids(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const r = await fetch('/api/raids', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, viewer_count: Number(form.viewer_count) || 0 }),
      })
      const d = await r.json()
      if (r.ok) { setForm(EMPTY); setShowForm(false); load() }
      else setErr(d.error ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm('Remover este registro de raid?')) return
    await fetch(`/api/raids?id=${id}`, { method: 'DELETE' })
    setRaids(r => r.filter(x => x.id !== id))
  }

  const incoming = raids.filter(r => r.raid_type === 'incoming')
  const outgoing = raids.filter(r => r.raid_type === 'outgoing')
  const totalViewersIn = incoming.reduce((s, r) => s + r.viewer_count, 0)
  const totalViewersOut = outgoing.reduce((s, r) => s + r.viewer_count, 0)

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: S.text, fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>Histórico de Raids</h1>
          <p style={{ color: S.muted, fontSize: '0.875rem', margin: 0 }}>Registro de raids recebidos e enviados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 20px', background: S.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          + Registrar raid
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Raids recebidos', value: incoming.length, color: S.accent },
          { label: 'Viewers recebidos', value: totalViewersIn.toLocaleString('pt-BR'), color: S.accent },
          { label: 'Raids enviados', value: outgoing.length, color: S.primary },
          { label: 'Viewers enviados', value: totalViewersOut.toLocaleString('pt-BR'), color: S.primary },
        ].map(c => (
          <div key={c.label} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: S.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} style={{ background: S.card, border: `1px solid rgba(155,48,255,0.25)`, borderRadius: 14, padding: 22, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: S.text, marginBottom: 18 }}>Registrar raid</div>

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['incoming', 'outgoing'] as const).map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, raid_type: t }))}
                style={{
                  padding: '7px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  border: `1px solid ${form.raid_type === t ? S.primary : S.border}`,
                  background: form.raid_type === t ? S.primaryBg : 'transparent',
                  color: form.raid_type === t ? S.primary : S.muted,
                }}
              >
                {t === 'incoming' ? '⬇ Recebido' : '⬆ Enviado'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: S.dim, marginBottom: 5, textTransform: 'uppercase' }}>
                {form.raid_type === 'incoming' ? 'Quem nos raideou' : 'Canal que raideamos'}
              </div>
              <input style={inp} required placeholder="NomeDoStreamer" value={form.partner_name}
                onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: S.dim, marginBottom: 5, textTransform: 'uppercase' }}>Viewers</div>
              <input style={inp} type="number" min="0" placeholder="0" value={form.viewer_count}
                onChange={e => setForm(f => ({ ...f, viewer_count: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: S.dim, marginBottom: 5, textTransform: 'uppercase' }}>Observações (opcional)</div>
            <input style={inp} placeholder="Ex: collab incrível, voltamos a fazer!" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 22px', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setErr('') }} style={{ padding: '8px 18px', background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
          {err && <div style={{ marginTop: 10, fontSize: '0.82rem', color: S.red }}>{err}</div>}
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color: S.dim, textAlign: 'center', padding: 40 }}>Carregando...</div>
      ) : raids.length === 0 ? (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚔️</div>
          <div style={{ color: S.text, fontWeight: 700, marginBottom: 8 }}>Nenhum raid registrado</div>
          <div style={{ color: S.dim, fontSize: '0.875rem' }}>Clique em "+ Registrar raid" para adicionar</div>
        </div>
      ) : (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                {['Tipo', 'Canal', 'Viewers', 'Data', 'Notas', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: S.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raids.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${S.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                      background: r.raid_type === 'incoming' ? 'rgba(57,255,20,0.1)' : S.primaryBg,
                      color: r.raid_type === 'incoming' ? S.accent : S.primary,
                      border: `1px solid ${r.raid_type === 'incoming' ? 'rgba(57,255,20,0.2)' : 'rgba(155,48,255,0.2)'}`,
                    }}>
                      {r.raid_type === 'incoming' ? '⬇ Recebido' : '⬆ Enviado'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: S.text, fontSize: '0.88rem' }}>{r.partner_name}</td>
                  <td style={{ padding: '12px 16px', color: S.muted, fontSize: '0.88rem' }}>{r.viewer_count.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px', color: S.dim, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmtDate(r.occurred_at)}</td>
                  <td style={{ padding: '12px 16px', color: S.dim, fontSize: '0.82rem', maxWidth: 200 }}>
                    {r.notes ? <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.notes}</span> : <span style={{ color: S.vdim }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => remove(r.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
