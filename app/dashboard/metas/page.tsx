'use client'
import { useEffect, useState, useCallback } from 'react'
import { useLang } from '@/lib/i18n'

const C = {
  bg: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)', primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}
const inp: React.CSSProperties = { width: '100%', padding: '0.6rem 0.9rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: '0.73rem', fontWeight: 600, color: 'rgba(232,230,248,0.5)', marginBottom: '0.3rem', display: 'block' }

type Meta = { id: string; title: string; type: string; current_value: number; target_value: number; status: string }

const TIPOS = [
  { value: 'subs',        label: 'Subs Twitch' },
  { value: 'gifted_subs', label: 'Gift Subs' },
  { value: 'follows',     label: 'Seguidores' },
  { value: 'bits',        label: 'Bits' },
  { value: 'value',       label: 'Valor (R$)' },
]

export default function MetasPage() {
  const { t } = useLang()
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Meta | null>(null)
  const [form, setForm] = useState({ title: '', type: 'subs', current_value: '0', target_value: '' })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadMetas = useCallback(async () => {
    const res = await fetch('/api/metas')
    const data = await res.json()
    setMetas(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadMetas() }, [loadMetas])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.target_value) return
    setSaving(true)
    const res = await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, type: form.type, current_value: Number(form.current_value), target_value: Number(form.target_value) }),
    })
    if (res.ok) {
      setForm({ title: '', type: 'subs', current_value: '0', target_value: '' })
      setCreating(false)
      await loadMetas()
    }
    setSaving(false)
  }

  async function update(id: string, body: object) {
    setSaving(true)
    const res = await fetch(`/api/metas/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) await loadMetas()
    setSaving(false)
    setEditing(null)
  }

  async function deleteMeta(id: string) {
    if (!confirm('Excluir esta meta?')) return
    await fetch(`/api/metas/${id}`, { method: 'DELETE' })
    await loadMetas()
  }

  function copyOverlayUrl(meta: Meta) {
    const uid = '' // broadcaster ID is not exposed client-side — using meta id
    const url = `${window.location.origin}/overlay/meta?meta_id=${meta.id}&uid=_`
    fetch('/api/me').then(r => r.json()).then(user => {
      const realUrl = `${window.location.origin}/overlay/meta?uid=${user.id}&meta_id=${meta.id}`
      navigator.clipboard.writeText(realUrl).catch(() => {})
      setCopiedId(meta.id)
      setTimeout(() => setCopiedId(null), 1500)
    }).catch(() => {
      navigator.clipboard.writeText(url).catch(() => {})
    })
    void uid
  }

  if (loading) return <div style={{ background: C.bg, minHeight: '100vh' }} />

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{t('pt_goals')}</h2>
          <span style={{ fontSize: '0.62rem', color: C.muted }}>{t('metas_realtime')}</span>
        </div>
        <button onClick={() => setCreating(v => !v)} style={{ padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          {t('meta_new_btn')}
        </button>
      </div>

      {creating && (
        <div style={{ background: C.card, border: '1px solid rgba(155,48,255,0.25)', borderRadius: '12px', padding: '1.3rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>{t('meta_form_title')}</div>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <label style={lbl}>Título *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Meta de Subs" style={inp} required />
              </div>
              <div>
                <label style={lbl}>Tipo</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  {TIPOS.map(ti => <option key={ti.value} value={ti.value}>{ti.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Valor atual</label>
                <input type="number" value={form.current_value} onChange={e => setForm(p => ({ ...p, current_value: e.target.value }))} placeholder="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Valor alvo *</label>
                <input type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="Ex: 100" style={inp} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer' }}>{t('action_cancel')}</button>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.3rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer' }}>{t('meta_create_btn')}</button>
            </div>
          </form>
        </div>
      )}

      {metas.length === 0 && !creating ? (
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.15 }}>🎯</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.text, marginBottom: '0.4rem' }}>{t('meta_empty_title')}</div>
          <div style={{ fontSize: '0.82rem', color: C.dim }}>{t('meta_empty_desc')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {metas.map(m => {
            const atual = Number(m.current_value) || 0
            const alvo = Number(m.target_value) || 1
            const pct = Math.min(100, Math.round((atual / alvo) * 100))
            const typeLabel = TIPOS.find(ti => ti.value === m.type)?.label ?? m.type
            const isEdit = editing?.id === m.id

            return (
              <div key={m.id} style={{ background: C.card, border: `1px solid ${m.status === 'active' ? 'rgba(155,48,255,0.15)' : C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', opacity: m.status === 'completed' ? 0.6 : 1 }}>
                {isEdit ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
                    <div>
                      <label style={lbl}>Título</label>
                      <input value={editing.title} onChange={e => setEditing(p => p ? { ...p, title: e.target.value } : p)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Atual</label>
                      <input type="number" value={editing.current_value} onChange={e => setEditing(p => p ? { ...p, current_value: Number(e.target.value) } : p)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Alvo</label>
                      <input type="number" value={editing.target_value} onChange={e => setEditing(p => p ? { ...p, target_value: Number(e.target.value) } : p)} style={inp} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => update(m.id, { title: editing.title, current_value: editing.current_value, target_value: editing.target_value })} disabled={saving} style={{ padding: '0.6rem 0.9rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✓</button>
                      <button onClick={() => setEditing(null)} style={{ padding: '0.6rem 0.8rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{m.title}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.68rem', color: C.primary, background: C.primaryBg, padding: '1px 6px', borderRadius: '999px' }}>{typeLabel}</span>
                          {m.status === 'completed' && <span style={{ fontSize: '0.68rem', color: C.accent }}>✓ Concluída</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>{atual.toLocaleString('pt-BR')} <span style={{ fontSize: '0.72rem', color: C.dim, fontWeight: 400 }}>/ {alvo.toLocaleString('pt-BR')}</span></div>
                          <div style={{ fontSize: '0.7rem', color: C.dim }}>{pct}% concluído</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button onClick={() => copyOverlayUrl(m)} title="URL OBS" style={{ padding: '0.3rem 0.6rem', background: copiedId === m.id ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${copiedId === m.id ? 'rgba(57,255,20,0.2)' : C.cardB}`, color: copiedId === m.id ? C.accent : C.dim, borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                            {copiedId === m.id ? '✓' : 'OBS'}
                          </button>
                          <button onClick={() => setEditing(m)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>✎</button>
                          {m.status === 'active'
                            ? <button onClick={() => update(m.id, { status: 'completed' })} style={{ padding: '0.3rem 0.6rem', background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.15)', color: C.accent, borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>✓</button>
                            : <button onClick={() => update(m.id, { status: 'active' })} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>↺</button>
                          }
                          <button onClick={() => deleteMeta(m.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,68,68,0.04)', border: '1px solid rgba(255,68,68,0.1)', color: '#ff6b6b55', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ height: '7px', background: 'rgba(255,255,255,0.05)', borderRadius: '3.5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? C.accent : `linear-gradient(90deg,${C.primary},${C.accent})`, borderRadius: '3.5px', transition: 'width 0.4s' }} />
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
