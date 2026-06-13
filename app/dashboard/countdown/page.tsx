'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.07)', accent: '#39ff14',
  green: '#22c55e',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: '#08090d', border: `1px solid ${S.border}`,
  borderRadius: 8, color: S.text, fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const COLORS = [
  { label: 'Roxo (padrão)', value: '#9b30ff' },
  { label: 'Verde neon',    value: '#39ff14' },
  { label: 'Azul',          value: '#3b82f6' },
  { label: 'Rosa',          value: '#ec4899' },
  { label: 'Laranja',       value: '#f97316' },
  { label: 'Branco',        value: '#ffffff' },
]

export default function CountdownPage() {
  const router = useRouter()
  const [title,    setTitle]    = useState('AO VIVO EM')
  const [subtitle, setSubtitle] = useState('')
  const [endDate,  setEndDate]  = useState('')
  const [endTime,  setEndTime]  = useState('20:00')
  const [color,    setColor]    = useState('#9b30ff')
  const [showBox,  setShowBox]  = useState(true)
  const [active,   setActive]   = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState('')
  const [loading,  setLoading]  = useState(true)

  // Load saved config on mount
  useEffect(() => {
    fetch('/api/countdown-config')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          if (d.title     !== undefined) setTitle(d.title)
          if (d.subtitle  !== undefined) setSubtitle(d.subtitle)
          if (d.endDate   !== undefined) setEndDate(d.endDate)
          if (d.endTime   !== undefined) setEndTime(d.endTime)
          if (d.color     !== undefined) setColor(d.color)
          if (d.showBox   !== undefined) setShowBox(d.showBox)
          if (d.active    !== undefined) setActive(d.active)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const buildUrl = () => {
    if (!endDate) return null
    const end = new Date(`${endDate}T${endTime}:00`)
    if (isNaN(end.getTime())) return null
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const p = new URLSearchParams()
    if (title !== 'AO VIVO EM') p.set('title', title)
    if (subtitle) p.set('subtitle', subtitle)
    p.set('end', end.toISOString())
    if (color !== '#9b30ff') p.set('color', color)
    if (!showBox) p.set('box', 'false')
    return `${base}/overlay/countdown?${p.toString()}`
  }

  const url = buildUrl()

  const copy = () => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function save(newActive?: boolean) {
    setSaving(true); setSaveMsg('')
    const cfg = {
      title, subtitle, endDate, endTime, color, showBox,
      active: newActive !== undefined ? newActive : active,
    }
    try {
      const r = await fetch('/api/countdown-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const d = await r.json()
      if (d.ok) {
        if (newActive !== undefined) setActive(newActive)
        setSaveMsg('Salvo!')
        setTimeout(() => setSaveMsg(''), 2500)
      } else {
        setSaveMsg(d.error ?? 'Erro ao salvar')
      }
    } finally { setSaving(false) }
  }

  const label = (t: string) => (
    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {t}
    </div>
  )

  if (loading) return <div style={{ padding: 40, color: S.dim }}>Carregando...</div>

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto' }}>

      {/* Header com botões */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ color: S.text, fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Countdown para OBS</h1>
        </div>

        {/* Ativar / Desativar */}
        <button
          onClick={() => save(!active)}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px',
            background: active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${active ? 'rgba(34,197,94,0.35)' : S.border}`,
            borderRadius: 8, color: active ? S.green : S.muted,
            fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? S.green : 'rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
          {active ? 'Ativo' : 'Inativo'}
        </button>

        {/* Salvar */}
        <button
          onClick={() => save()}
          disabled={saving}
          style={{
            padding: '8px 22px', background: S.primary, color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700,
            fontSize: '0.875rem', cursor: 'pointer', opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Salvando...' : saveMsg || 'Salvar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Título')}
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="AO VIVO EM" />
        </div>
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Subtítulo (opcional)')}
          <input style={inp} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Prepare-se!" />
        </div>
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Data da live')}
          <input style={inp} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Hora de início')}
          <input style={inp} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>

      {/* Cor + caixa */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        {label('Cor de destaque')}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c.value} onClick={() => setColor(c.value)} style={{
              padding: '6px 14px', borderRadius: 20, border: `2px solid ${color === c.value ? c.value : 'transparent'}`,
              background: color === c.value ? `${c.value}22` : 'rgba(255,255,255,0.05)',
              color: S.text, fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.value, display: 'inline-block' }} />
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <input
            id="showbox" type="checkbox" checked={showBox} onChange={e => setShowBox(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: S.primary, cursor: 'pointer' }}
          />
          <label htmlFor="showbox" style={{ color: S.muted, fontSize: '0.875rem', cursor: 'pointer' }}>
            Mostrar fundo escuro (desmarque para fundo 100% transparente)
          </label>
        </div>
      </div>

      {/* URL gerada */}
      <div style={{ background: S.card, border: `1px solid ${url ? 'rgba(155,48,255,0.25)' : S.border}`, borderRadius: 12, padding: 20 }}>
        {label('URL para o OBS (Browser Source)')}
        {url ? (
          <>
            <div style={{
              background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8,
              padding: '10px 14px', fontSize: '0.8rem', color: S.muted,
              wordBreak: 'break-all', marginBottom: 12, lineHeight: 1.6,
            }}>
              {url}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={copy} style={{
                padding: '9px 22px', background: copied ? S.green : S.primary,
                color: '#fff', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                transition: 'background 0.2s',
              }}>
                {copied ? '✓ Copiado!' : 'Copiar URL'}
              </button>
              <a href={url} target="_blank" rel="noopener" style={{
                padding: '9px 22px', background: 'rgba(255,255,255,0.06)',
                color: S.text, border: `1px solid ${S.border}`, borderRadius: 8,
                fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}>
                Pré-visualizar ↗
              </a>
            </div>
          </>
        ) : (
          <p style={{ color: S.dim, fontSize: '0.875rem', margin: 0 }}>
            Preencha a data e hora para gerar a URL.
          </p>
        )}
      </div>

      {/* Instruções OBS */}
      <div style={{ background: 'rgba(155,48,255,0.06)', border: `1px solid rgba(155,48,255,0.15)`, borderRadius: 12, padding: 20, marginTop: 20 }}>
        <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem', marginBottom: 10 }}>Como usar no OBS</div>
        <ol style={{ color: S.muted, fontSize: '0.82rem', margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>No OBS, adicione uma nova fonte <strong style={{ color: S.text }}>Browser Source</strong></li>
          <li>Cole a URL gerada acima no campo &quot;URL&quot;</li>
          <li>Defina a largura e altura conforme sua cena (ex: 1920×1080)</li>
          <li>Marque <strong style={{ color: S.text }}>&quot;Transparent background&quot;</strong> para fundo transparente</li>
          <li>Quando o timer chegar a zero, exibe <strong style={{ color }}>AO VIVO!</strong> animado</li>
        </ol>
      </div>
    </div>
  )
}
