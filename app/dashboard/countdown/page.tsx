'use client'
import { useState } from 'react'

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
  { label: 'Verde neon', value: '#39ff14' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Branco', value: '#ffffff' },
]

export default function CountdownPage() {
  const [title,    setTitle]    = useState('AO VIVO EM')
  const [subtitle, setSubtitle] = useState('')
  const [endDate,  setEndDate]  = useState('')
  const [endTime,  setEndTime]  = useState('20:00')
  const [color,    setColor]    = useState('#9b30ff')
  const [showBox,  setShowBox]  = useState(true)
  const [copied,   setCopied]   = useState(false)

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

  const label = (t: string) => (
    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {t}
    </div>
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: S.text, fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>
        Countdown para OBS
      </h1>
      <p style={{ color: S.muted, fontSize: '0.875rem', margin: '0 0 28px' }}>
        Configure o timer de contagem regressiva e copie a URL para usar como Browser Source no OBS.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Título */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Título')}
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="AO VIVO EM" />
        </div>

        {/* Subtítulo */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Subtítulo (opcional)')}
          <input style={inp} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Prepare-se!" />
        </div>

        {/* Data */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
          {label('Data da live')}
          <input style={inp} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        {/* Hora */}
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
        <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem', marginBottom: 10 }}>
          Como usar no OBS
        </div>
        <ol style={{ color: S.muted, fontSize: '0.82rem', margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>No OBS, adicione uma nova fonte <strong style={{ color: S.text }}>Browser Source</strong></li>
          <li>Cole a URL gerada acima no campo "URL"</li>
          <li>Defina a largura e altura conforme sua cena (ex: 1920×1080)</li>
          <li>Marque <strong style={{ color: S.text }}>"Transparent background"</strong> para fundo transparente</li>
          <li>Quando o timer chegar a zero, exibe <strong style={{ color: color }}>AO VIVO!</strong> animado</li>
        </ol>
      </div>
    </div>
  )
}
