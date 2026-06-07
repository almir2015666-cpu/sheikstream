'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type TimerLog = {
  id: string
  plataforma: string
  status: 'success' | 'error' | 'pending'
  erro: string | null
  created_at: string
}

type Timer = {
  id: string
  nome: string
  mensagem: string
  intervalo_minutos: number
  min_mensagens: number
  plataformas: string[]
  tipo_saida: 'chat' | 'overlay' | 'both'
  ativo: boolean
  ultimo_disparo: string | null
  created_at: string
  timer_logs: TimerLog[]
}

type FormState = {
  nome: string
  mensagem: string
  intervalo_minutos: number
  min_mensagens: number
  plataformas: string[]
  tipo_saida: 'chat' | 'overlay' | 'both'
  ativo: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  nome: '',
  mensagem: '',
  intervalo_minutos: 30,
  min_mensagens: 0,
  plataformas: [],
  tipo_saida: 'chat',
  ativo: true,
}

const PLAT_OPTIONS = [
  {
    key: 'twitch',
    label: 'Twitch',
    color: '#9146FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
        <path d="M2.149 0L.537 4.119v16.836h5.731V24h3.224l3.045-3.045h4.657l6.269-6.269V0H2.149zm19.164 13.612l-3.582 3.582H12.87l-3.045 3.045v-3.045H5.094V2.149h16.22v11.463zm-3.582-7.343v6.27h-2.149V6.269h2.149zm-5.731 0v6.27h-2.149V6.269h2.149z" />
      </svg>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: 'kick',
    label: 'Kick',
    color: '#53FC18',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
        <path d="M2 2h4v8l6-8h5l-7 9 7 11h-5L6 14v8H2V2z" />
      </svg>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: '#fe2c55',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.15a8.16 8.16 0 0 0 4.77 1.52V7.23a4.85 4.85 0 0 1-1-.54z" />
      </svg>
    ),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function platStatus(timer: Timer, platKey: string): 'success' | 'error' | 'none' {
  const recentLogs = [...timer.timer_logs]
    .filter(l => l.plataforma === platKey)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  if (recentLogs.length === 0) return 'none'
  return recentLogs[0].status === 'success' ? 'success' : 'error'
}

function formatInterval(mins: number) {
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

function overlayUrl(userId: string) {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'https://sheikstream.com.br'
  return `${base}/overlay/timer/${userId}`
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        cursor: 'pointer',
        background: checked ? '#4ade80' : '#374151',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

// ─── Slider ──────────────────────────────────────────────────────────────────

function Slider({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: '#6366f1' }}
    />
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TimersPage() {
  const [timers, setTimers] = useState<Timer[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const fetchTimers = useCallback(async () => {
    try {
      const res = await fetch('/api/timers')
      if (res.ok) setTimers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTimers()
    fetch('/api/me')
      .then(r => r.json())
      .then((u: { id?: string }) => { if (u?.id) setUserId(u.id) })
      .catch(() => {})
  }, [fetchTimers])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setView('form')
  }

  function openEdit(t: Timer) {
    setEditingId(t.id)
    setForm({
      nome: t.nome,
      mensagem: t.mensagem,
      intervalo_minutos: t.intervalo_minutos,
      min_mensagens: t.min_mensagens,
      plataformas: t.plataformas,
      tipo_saida: t.tipo_saida,
      ativo: t.ativo,
    })
    setView('form')
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.mensagem.trim()) return
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/timers/${editingId}` : '/api/timers'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await fetchTimers()
        setView('list')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/timers/${id}`, { method: 'DELETE' })
      setTimers(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggle(id: string, ativo: boolean) {
    setTimers(prev => prev.map(t => (t.id === id ? { ...t, ativo } : t)))
    await fetch(`/api/timers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    })
  }

  function togglePlat(key: string) {
    setForm(f => ({
      ...f,
      plataformas: f.plataformas.includes(key)
        ? f.plataformas.filter(p => p !== key)
        : [...f.plataformas, key],
    }))
  }

  async function copyOverlayUrl() {
    if (!userId) return
    await navigator.clipboard.writeText(overlayUrl(userId))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 920, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
              ⏱ Timers
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#94a3b8' }}>
              Mensagens automáticas no chat durante a live
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Novo timer
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: timers.length, color: '#94a3b8' },
            { label: 'Ativos', value: timers.filter(t => t.ativo).length, color: '#4ade80' },
            { label: 'Inativos', value: timers.filter(t => !t.ativo).length, color: '#f87171' },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Overlay URL card */}
        {userId && (
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>URL do Overlay OBS:</span>
            <code
              style={{
                flex: 1,
                background: '#0f172a',
                color: '#818cf8',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {overlayUrl(userId)}
            </code>
            <button
              onClick={copyOverlayUrl}
              style={{
                background: copied ? '#22c55e' : '#334155',
                color: '#f1f5f9',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        {/* Timer list */}
        {loading ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Carregando...</div>
        ) : timers.length === 0 ? (
          <div
            style={{
              background: '#1e293b',
              border: '1px dashed #334155',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏱</div>
            <p style={{ margin: 0, fontSize: 15 }}>Nenhum timer criado ainda.</p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>Crie seu primeiro timer para enviar mensagens automáticas durante a live.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {timers.map(t => (
              <div
                key={t.id}
                style={{
                  background: '#1e293b',
                  border: `1px solid ${t.ativo ? '#334155' : '#1e293b'}`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 16,
                  alignItems: 'center',
                  opacity: t.ativo ? 1 : 0.6,
                }}
              >
                {/* Left */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9' }}>{t.nome}</span>
                    <span
                      style={{
                        background: t.ativo ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        color: t.ativo ? '#4ade80' : '#f87171',
                        border: `1px solid ${t.ativo ? '#4ade80' : '#f87171'}`,
                        borderRadius: 20,
                        padding: '1px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {t.ativo ? 'ativo' : 'inativo'}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 10px',
                      fontSize: 13,
                      color: '#94a3b8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 500,
                    }}
                  >
                    {t.mensagem}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      🕐 a cada {formatInterval(t.intervalo_minutos)}
                    </span>
                    {t.min_mensagens > 0 && (
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        💬 mín {t.min_mensagens} msgs
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      📤 {t.tipo_saida === 'chat' ? 'Chat' : t.tipo_saida === 'overlay' ? 'Overlay' : 'Chat + Overlay'}
                    </span>

                    {/* Platform status dots */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {PLAT_OPTIONS.filter(p => t.plataformas.includes(p.key)).map(p => {
                        const st = platStatus(t, p.key)
                        const dotColor = st === 'success' ? '#4ade80' : st === 'error' ? '#f87171' : '#64748b'
                        return (
                          <div
                            key={p.key}
                            title={`${p.label}: ${st === 'none' ? 'sem disparo' : st}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#0f172a',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: 11,
                              color: p.color,
                            }}
                          >
                            {p.icon}
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                          </div>
                        )
                      })}
                    </div>

                    {t.ultimo_disparo && (
                      <span style={{ fontSize: 11, color: '#475569' }}>
                        último: {new Date(t.ultimo_disparo).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Toggle checked={t.ativo} onChange={v => handleToggle(t.id, v)} />
                  <button
                    onClick={() => openEdit(t)}
                    title="Editar"
                    style={{
                      background: 'none',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      fontSize: 14,
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    title="Excluir"
                    style={{
                      background: 'none',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#f87171',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      fontSize: 14,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '32px 24px', maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => setView('list')}
          style={{
            background: 'none',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px 12px',
            fontSize: 13,
          }}
        >
          ← Voltar
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
          {editingId ? 'Editar timer' : 'Novo timer'}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Nome */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Nome do timer</label>
          <input
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Ex: Redes sociais, Discord, Sorteio..."
            style={{
              width: '100%',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#f1f5f9',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Mensagem */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Mensagem</label>
          <textarea
            value={form.mensagem}
            onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
            placeholder="Mensagem que será enviada no chat..."
            rows={3}
            style={{
              width: '100%',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#f1f5f9',
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Interval */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: '#94a3b8' }}>Intervalo</label>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6366f1' }}>
              {formatInterval(form.intervalo_minutos)}
            </span>
          </div>
          <Slider
            value={form.intervalo_minutos}
            min={1}
            max={120}
            onChange={v => setForm(f => ({ ...f, intervalo_minutos: v }))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 4 }}>
            <span>1 min</span>
            <span>2 horas</span>
          </div>
        </div>

        {/* Min messages */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: '#94a3b8' }}>Mínimo de mensagens no chat</label>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6366f1' }}>{form.min_mensagens}</span>
          </div>
          <Slider
            value={form.min_mensagens}
            min={0}
            max={100}
            onChange={v => setForm(f => ({ ...f, min_mensagens: v }))}
          />
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>
            O timer só dispara se houver pelo menos este número de mensagens desde o último disparo.
          </p>
        </div>

        {/* Platforms */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Plataformas</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PLAT_OPTIONS.map(p => {
              const active = form.plataformas.includes(p.key)
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePlat(p.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    background: active ? `${p.color}18` : '#0f172a',
                    border: `1.5px solid ${active ? p.color : '#334155'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    color: active ? p.color : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.icon}
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tipo de saída */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Enviar como</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'chat', label: 'Chat' },
              { value: 'overlay', label: 'Overlay OBS' },
              { value: 'both', label: 'Chat + Overlay' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, tipo_saida: opt.value as FormState['tipo_saida'] }))}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: form.tipo_saida === opt.value ? '#6366f1' : '#0f172a',
                  border: `1px solid ${form.tipo_saida === opt.value ? '#6366f1' : '#334155'}`,
                  borderRadius: 8,
                  color: form.tipo_saida === opt.value ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: form.tipo_saida === opt.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {(form.tipo_saida === 'overlay' || form.tipo_saida === 'both') && userId && (
            <div style={{ marginTop: 12, background: '#0f172a', borderRadius: 8, padding: 10 }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8' }}>Adicione esta URL como Browser Source no OBS:</p>
              <code style={{ fontSize: 11, color: '#818cf8', wordBreak: 'break-all' }}>
                {overlayUrl(userId)}
              </code>
            </div>
          )}
        </div>

        {/* Ativo */}
        <div
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Timer ativo</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Desative para pausar sem excluir
            </p>
          </div>
          <Toggle checked={form.ativo} onChange={v => setForm(f => ({ ...f, ativo: v }))} />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !form.nome.trim() || !form.mensagem.trim()}
          style={{
            background: saving ? '#4338ca' : '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: !form.nome.trim() || !form.mensagem.trim() ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar timer'}
        </button>
      </div>
    </div>
  )
}
