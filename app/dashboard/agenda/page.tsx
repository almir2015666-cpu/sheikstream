'use client'
import { useEffect, useState, useCallback } from 'react'
import { useLang } from '@/lib/i18n'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(155,48,255,0.2)',
  accent: '#39ff14', red: '#ef4444', green: '#22c55e',
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PLATFORMS = ['Twitch', 'Kick', 'YouTube', 'TikTok']
const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9b30ff', Kick: '#22c55e', YouTube: '#ef4444', TikTok: '#e8e6f8',
}

type AgendaItem = {
  id: string
  title: string
  day_of_week: number
  start_time: string
  duration_min: number
  platforms: string[]
  is_recurring: boolean
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = {
  title: '', day_of_week: 1, start_time: '20:00', duration_min: 120,
  platforms: ['Twitch'], is_recurring: true,
}

export default function AgendaPage() {
  const { t } = useLang()
  const [items, setItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AgendaItem | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/agenda')
      if (r.ok) setItems(await r.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(item: AgendaItem) {
    setEditing(item)
    setForm({
      title: item.title,
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      duration_min: item.duration_min,
      platforms: item.platforms,
      is_recurring: item.is_recurring,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const r = await fetch('/api/agenda', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (r.ok) {
        await load()
        setShowModal(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' })
      await load()
    } finally {
      setDeleting(null)
    }
  }

  function togglePlatform(p: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }))
  }

  // Group by day
  const byDay: Record<number, AgendaItem[]> = {}
  for (const item of items) {
    if (!byDay[item.day_of_week]) byDay[item.day_of_week] = []
    byDay[item.day_of_week].push(item)
  }

  // Next stream calculation (rough)
  const today = new Date().getDay()
  let nextItem: AgendaItem | null = null
  let minDiff = 8
  for (const item of items) {
    if (!item.is_active) continue
    let diff = item.day_of_week - today
    if (diff < 0) diff += 7
    if (diff === 0) diff = 7
    if (diff < minDiff) { minDiff = diff; nextItem = item }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: S.text, fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>{t('pt_agenda')}</h1>
          <p style={{ color: S.muted, fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
            {items.length} {t('agenda_weekly')}
          </p>
        </div>
        <button onClick={openAdd} style={{
          background: S.primary, color: '#fff', border: 'none', borderRadius: '10px',
          padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
          {t('agenda_add_btn')}
        </button>
      </div>

      {/* Stats */}
      {nextItem && (
        <div style={{
          background: S.primaryBg, border: `1px solid ${S.borderP}`, borderRadius: '12px',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: S.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('agenda_next')}</div>
            <div style={{ color: S.text, fontWeight: 700, fontSize: '1rem' }}>{nextItem.title}</div>
            <div style={{ color: S.muted, fontSize: '0.78rem' }}>
              {DAY_LABELS[nextItem.day_of_week]} — {nextItem.start_time} ({nextItem.duration_min}min)
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: S.dim, padding: '3rem', fontSize: '0.9rem' }}>Carregando...</div>
      ) : items.length === 0 ? (
        <div style={{ background: S.card, borderRadius: '14px', border: `1px solid ${S.border}`, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
          <div style={{ color: S.muted, fontSize: '0.9rem' }}>{t('agenda_empty')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {DAY_LABELS.map((day, idx) => {
            const dayItems = byDay[idx] ?? []
            if (dayItems.length === 0) return null
            return (
              <div key={idx} style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '0.6rem 1rem', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: S.primary, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day}</span>
                  <span style={{ color: S.dim, fontSize: '0.72rem' }}>({DAY_LABELS_EN[idx]})</span>
                </div>
                {dayItems.map(item => (
                  <div key={item.id} style={{
                    padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    borderBottom: `1px solid ${S.border}`, opacity: item.is_active ? 1 : 0.5,
                  }}>
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ color: S.text, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>{item.start_time}</div>
                      <div style={{ color: S.dim, fontSize: '0.68rem', marginTop: '0.1rem' }}>{item.duration_min}min</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: S.text, fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                        {item.is_recurring && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: S.primary, background: S.primaryBg, padding: '0.1rem 0.4rem', borderRadius: '99px' }}>🔄</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {(item.platforms ?? []).map(p => (
                          <span key={p} style={{ fontSize: '0.68rem', color: PLATFORM_COLORS[p] ?? S.muted, background: `${PLATFORM_COLORS[p] ?? S.primary}18`, border: `1px solid ${PLATFORM_COLORS[p] ?? S.primary}33`, padding: '0.1rem 0.45rem', borderRadius: '99px', fontWeight: 600 }}>{p}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button onClick={() => openEdit(item)} style={{ background: 'rgba(155,48,255,0.12)', border: `1px solid ${S.borderP}`, color: S.primary, borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', opacity: deleting === item.id ? 0.6 : 1 }}>
                        {t('agenda_delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#16182a', border: `1px solid ${S.borderP}`, borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ color: S.text, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                {editing ? t('agenda_modal_edit') : t('agenda_modal_add')}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <FieldLabel>{t('agenda_field_title')}</FieldLabel>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Live de Segunda" style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <FieldLabel>{t('agenda_field_day')}</FieldLabel>
                <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))} style={inputStyle}>
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>{t('agenda_field_time')}</FieldLabel>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <FieldLabel>{t('agenda_field_duration')}</FieldLabel>
            <input type="number" min={15} step={15} value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: Number(e.target.value) }))} style={inputStyle} />

            <FieldLabel>{t('agenda_field_platforms')}</FieldLabel>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {PLATFORMS.map(p => {
                const active = form.platforms.includes(p)
                return (
                  <button key={p} onClick={() => togglePlatform(p)} style={{
                    padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: active ? `${PLATFORM_COLORS[p]}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? PLATFORM_COLORS[p] + '66' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? PLATFORM_COLORS[p] : S.dim,
                  }}>{p}</button>
                )
              })}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                style={{ accentColor: S.primary, width: 16, height: 16 }} />
              <span style={{ color: S.muted, fontSize: '0.83rem' }}>{t('agenda_field_recurring')}</span>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, color: S.muted, borderRadius: '10px', padding: '0.65rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                {t('agenda_cancel')}
              </button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ flex: 1, background: S.primary, border: 'none', color: '#fff', borderRadius: '10px', padding: '0.65rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
                {saving ? '...' : t('agenda_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'rgba(232,230,248,0.55)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '9px', padding: '0.55rem 0.85rem', color: '#e8e6f8', fontSize: '0.85rem',
  marginBottom: '1rem', outline: 'none', boxSizing: 'border-box',
}
