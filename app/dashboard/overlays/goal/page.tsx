'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#0f1018', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.3)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)', primaryB: 'rgba(155,48,255,0.35)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.1)', greenB: 'rgba(34,197,94,0.3)',
  accent: '#39ff14',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', background: '#08090d',
  border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 8, color: S.text,
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const COLORS = [
  '#9b30ff', '#22c55e', '#3b82f6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#ffffff',
]

const GOAL_TYPES = [
  { value: 'custom',    label: 'Personalizada',  desc: 'Valor manual', icon: '✏️' },
  { value: 'subs',      label: 'Inscrições',     desc: 'Subs Twitch',  icon: '⭐' },
  { value: 'bits',      label: 'Bits',           desc: 'Bits Twitch',  icon: '💎' },
  { value: 'donations', label: 'Doações',        desc: 'Livepix R$',   icon: '💜' },
]

export default function GoalConfigPage() {
  const router = useRouter()
  const [uid,           setUid]          = useState('')
  const [title,         setTitle]        = useState('Meta')
  const [goalTypes,     setGoalTypes]    = useState<string[]>(['custom'])
  const [target,        setTarget]       = useState('100')
  const [customCurrent, setCustomCurrent]= useState('0')
  const [label,         setLabel]        = useState('')
  const [color,         setColor]        = useState('#9b30ff')
  const [showNumbers,   setShowNumbers]  = useState(true)
  const [showPct,       setShowPct]      = useState(true)
  const [bg,            setBg]           = useState(true)
  const [saving,        setSaving]       = useState(false)
  const [saveMsg,       setSaveMsg]      = useState('')
  const [copied,        setCopied]       = useState(false)
  const [loading,       setLoading]      = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => { if (u?.id) setUid(u.id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!uid) return
    fetch(`/api/overlay/goal?uid=${uid}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.title         !== undefined) setTitle(d.title)
        if (d.goalTypes     !== undefined) setGoalTypes(Array.isArray(d.goalTypes) ? d.goalTypes : [d.goalType ?? 'custom'])
        else if (d.goalType !== undefined) setGoalTypes([d.goalType])
        if (d.target        !== undefined) setTarget(String(d.target))
        if (d.customCurrent !== undefined) setCustomCurrent(String(d.customCurrent))
        if (d.label         !== undefined) setLabel(d.label ?? '')
        if (d.color         !== undefined) setColor(d.color)
        if (d.showNumbers   !== undefined) setShowNumbers(d.showNumbers)
        if (d.showPct       !== undefined) setShowPct(d.showPct)
        if (d.bg            !== undefined) setBg(d.bg)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid])

  const toggleType = (val: string) => {
    setGoalTypes(prev =>
      prev.includes(val) ? (prev.length > 1 ? prev.filter(t => t !== val) : prev) : [...prev, val]
    )
  }

  async function save() {
    setSaving(true)
    const r = await fetch('/api/overlay/goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, goalTypes, target: Number(target), customCurrent: Number(customCurrent), label, color, showNumbers, showPct, bg }),
    })
    setSaving(false)
    setSaveMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const overlayUrl = uid ? `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/goal?uid=${uid}` : ''
  const copy = () => { navigator.clipboard.writeText(overlayUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const tgt = Number(target) || 100
  const cur = goalTypes.includes('custom') ? Number(customCurrent) || 0 : 0
  const pct = Math.min(100, Math.round((cur / tgt) * 100))

  const lbl = (text: string) => (
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: S.dim, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{text}</div>
  )

  if (loading && !uid) return <div style={{ padding: 40, color: S.dim, background: S.bg, minHeight: '100vh' }}>Carregando...</div>

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '24px', fontFamily: "'Inter',system-ui,sans-serif", color: S.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: `1px solid ${S.cardB}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
          Overlays
        </button>
        <h1 style={{ flex: 1, fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Meta / Goal Overlay</h1>
        {saveMsg && <span style={{ fontSize: '0.82rem', color: saveMsg === 'Salvo!' ? S.green : '#ef4444', fontWeight: 700 }}>{saveMsg}</span>}
        <button onClick={save} disabled={saving}
          style={{ padding: '8px 22px', background: saving ? S.primaryBg : S.primary, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

        {/* Left: Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Basic */}
          <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 16, color: S.text }}>Configuração</div>

            <div style={{ marginBottom: 14 }}>
              {lbl('Título')}
              <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Meta" />
            </div>

            {lbl('Tipo de meta (selecione um ou mais)')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {GOAL_TYPES.map(gt => {
                const active = goalTypes.includes(gt.value)
                return (
                  <button key={gt.value} onClick={() => toggleType(gt.value)}
                    style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${active ? S.primaryB : S.cardB}`,
                      background: active ? S.primaryBg : 'transparent', color: active ? S.primary : S.muted,
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{gt.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.83rem', color: active ? S.primary : S.text }}>{gt.label}</div>
                        <div style={{ fontSize: '0.7rem', color: S.dim, marginTop: 1 }}>{gt.desc}</div>
                      </div>
                      {active && <span style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: goalTypes.includes('custom') ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
              <div>
                {lbl('Valor alvo')}
                <input style={inp} type="number" min={1} value={target} onChange={e => setTarget(e.target.value)} placeholder="100" />
              </div>
              {goalTypes.includes('custom') && (
                <div>
                  {lbl('Valor atual (manual)')}
                  <input style={inp} type="number" min={0} value={customCurrent} onChange={e => setCustomCurrent(e.target.value)} placeholder="0" />
                </div>
              )}
              <div>
                {lbl('Unidade / sufixo')}
                <input style={inp} value={label} onChange={e => setLabel(e.target.value)} placeholder="subs, R$, bits..." />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 16 }}>Aparência</div>

            <div style={{ marginBottom: 14 }}>
              {lbl('Cor da barra')}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} title={c}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, flexShrink: 0 }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Fundo', val: bg, set: setBg, on: 'Com fundo', off: 'Sem fundo' },
                { label: 'Números', val: showNumbers, set: setShowNumbers, on: 'Mostrar', off: 'Ocultar' },
                { label: 'Porcentagem', val: showPct, set: setShowPct, on: 'Mostrar', off: 'Ocultar' },
              ].map(opt => (
                <div key={opt.label}>
                  {lbl(opt.label)}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[true, false].map(v => (
                      <button key={String(v)} onClick={() => opt.set(v)}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: `1px solid ${opt.val === v ? S.primaryB : S.cardB}`,
                          background: opt.val === v ? S.primaryBg : 'transparent', color: opt.val === v ? S.primary : S.muted,
                          fontWeight: opt.val === v ? 700 : 400, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {v ? opt.on : opt.off}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview + URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Preview */}
          <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 14 }}>Preview</div>
            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: '16px 18px', border: `1px solid ${color}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{title || 'Meta'}</span>
                {showPct && <span style={{ fontSize: '1.15rem', fontWeight: 900, color, textShadow: `0 0 16px ${color}88` }}>{pct}%</span>}
              </div>
              <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${color},${color}cc)`, width: `${pct}%`, boxShadow: `0 0 10px ${color}99`, transition: 'width 0.4s' }} />
              </div>
              {showNumbers && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem' }}>
                  <span style={{ color, fontWeight: 700 }}>{cur.toLocaleString('pt-BR')}{label ? ` ${label}` : ''}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>/ {Number(target).toLocaleString('pt-BR')}{label ? ` ${label}` : ''}</span>
                </div>
              )}
            </div>
            {goalTypes.some(t => t !== 'custom') && (
              <div style={{ marginTop: 10, fontSize: '0.72rem', color: S.dim, lineHeight: 1.5 }}>
                O valor atual é calculado automaticamente. O preview mostra apenas o valor manual.
              </div>
            )}
          </div>

          {/* URL */}
          <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>URL para OBS</div>
            <div style={{ background: '#08090d', border: `1px solid ${S.cardB}`, borderRadius: 8, padding: '10px 12px', fontSize: '0.72rem', color: S.muted, wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 10 }}>
              {overlayUrl || '— faça login para gerar —'}
            </div>
            {overlayUrl && (
              <button onClick={copy}
                style={{ width: '100%', padding: '9px 0', background: copied ? S.greenBg : S.primaryBg, color: copied ? S.green : S.primary, border: `1px solid ${copied ? S.greenB : S.primaryB}`, borderRadius: 8, fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                {copied ? '✓ Copiado!' : 'Copiar URL'}
              </button>
            )}
            <div style={{ marginTop: 10, fontSize: '0.7rem', color: S.dim, lineHeight: 1.6 }}>
              Tamanho recomendado: <strong style={{ color: S.muted }}>400 × 80</strong> px · Ative "fundo transparente" no Browser Source
            </div>
          </div>

          {/* Tips */}
          <div style={{ background: S.primaryBg, border: `1px solid ${S.primaryB}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.83rem', marginBottom: 8, color: S.primary }}>Como usar</div>
            <ol style={{ color: S.muted, fontSize: '0.76rem', margin: 0, paddingLeft: 16, lineHeight: 2 }}>
              <li>Selecione um ou mais tipos de meta</li>
              <li>Configure o alvo e a aparência</li>
              <li>Clique em <strong style={{ color: S.text }}>Salvar</strong></li>
              <li>Cole a URL em um Browser Source no OBS</li>
              <li>Atualiza automaticamente a cada 30s</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
