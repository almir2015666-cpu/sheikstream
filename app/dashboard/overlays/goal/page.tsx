'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.07)', green: '#22c55e',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', background: '#08090d',
  border: `1px solid ${S.border}`, borderRadius: 8, color: S.text,
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
const COLORS = [
  { label: 'Roxo', value: '#9b30ff' }, { label: 'Verde', value: '#22c55e' },
  { label: 'Azul',  value: '#3b82f6' }, { label: 'Rosa',  value: '#ec4899' },
  { label: 'Ouro',  value: '#f59e0b' }, { label: 'Branco', value: '#ffffff' },
]
const GOAL_TYPES = [
  { value: 'custom',    label: 'Personalizada',  desc: 'Defina manualmente o valor atual' },
  { value: 'subs',      label: 'Inscrições',     desc: 'Conta inscrições da Twitch automaticamente' },
  { value: 'bits',      label: 'Bits',            desc: 'Soma de bits recebidos' },
  { value: 'donations', label: 'Doações',         desc: 'Soma de doações do Livepix' },
]

export default function GoalConfigPage() {
  const router = useRouter()
  const [uid,          setUid]          = useState('')
  const [title,        setTitle]        = useState('Meta')
  const [goalType,     setGoalType]     = useState('custom')
  const [target,       setTarget]       = useState('100')
  const [customCurrent,setCustomCurrent]= useState('0')
  const [label,        setLabel]        = useState('')
  const [color,        setColor]        = useState('#9b30ff')
  const [showNumbers,  setShowNumbers]  = useState(true)
  const [showPct,      setShowPct]      = useState(true)
  const [bg,           setBg]           = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [copied,       setCopied]       = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => { if (u?.id) setUid(u.id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!uid) return
    fetch(`/api/overlay/goal?uid=${uid}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.title        !== undefined) setTitle(d.title)
        if (d.goalType     !== undefined) setGoalType(d.goalType)
        if (d.target       !== undefined) setTarget(String(d.target))
        if (d.customCurrent!== undefined) setCustomCurrent(String(d.customCurrent))
        if (d.label        !== undefined) setLabel(d.label ?? '')
        if (d.color        !== undefined) setColor(d.color)
        if (d.showNumbers  !== undefined) setShowNumbers(d.showNumbers)
        if (d.showPct      !== undefined) setShowPct(d.showPct)
        if (d.bg           !== undefined) setBg(d.bg)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid])

  async function save() {
    setSaving(true)
    const r = await fetch('/api/overlay/goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, goalType, target: Number(target), customCurrent: Number(customCurrent), label, color, showNumbers, showPct, bg }),
    })
    setSaving(false)
    setSaveMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const overlayUrl = uid ? `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/goal?uid=${uid}` : ''
  const copy = () => { navigator.clipboard.writeText(overlayUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const tgt = Number(target) || 100
  const cur = Number(customCurrent) || 0
  const pct = Math.min(100, Math.round((cur / tgt) * 100))

  const lbl = (t: string) => (
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t}</div>
  )
  const toggle = (val: boolean, set: (v: boolean) => void, on: string, off: string) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {[true, false].map(v => (
        <button key={String(v)} onClick={() => set(v)}
          style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${val === v ? `rgba(155,48,255,0.5)` : S.border}`,
            background: val === v ? S.primaryBg : 'transparent', color: val === v ? S.primary : S.muted,
            fontWeight: val === v ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer' }}>
          {v ? on : off}
        </button>
      ))}
    </div>
  )

  if (loading && !uid) return <div style={{ padding: 40, color: S.dim }}>Carregando...</div>

  return (
    <div style={{ padding: '28px 24px', maxWidth: 680, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif", color: S.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <h1 style={{ flex: 1, color: S.text, fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Meta / Goal Overlay</h1>
        {saveMsg && <span style={{ fontSize: '0.82rem', color: saveMsg === 'Salvo!' ? S.green : '#ef4444', fontWeight: 600 }}>{saveMsg}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Configuração</div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Título')}
              <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Meta" />
            </div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Tipo de meta')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {GOAL_TYPES.map(gt => (
                  <button key={gt.value} onClick={() => setGoalType(gt.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${goalType === gt.value ? 'rgba(155,48,255,0.5)' : S.border}`,
                      background: goalType === gt.value ? S.primaryBg : 'transparent', color: goalType === gt.value ? S.primary : S.muted,
                      fontWeight: goalType === gt.value ? 700 : 400, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontWeight: 700 }}>{gt.label}</span>
                    <span style={{ marginLeft: 6, opacity: 0.6, fontSize: '0.76rem' }}>{gt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Valor alvo')}
              <input style={inp} type="number" min={1} value={target} onChange={e => setTarget(e.target.value)} placeholder="100" />
            </div>

            {goalType === 'custom' && (
              <div style={{ marginBottom: 12 }}>
                {lbl('Valor atual (manual)')}
                <input style={inp} type="number" min={0} value={customCurrent} onChange={e => setCustomCurrent(e.target.value)} placeholder="0" />
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              {lbl('Unidade / sufixo (ex: subs, bits, R$)')}
              <input style={inp} value={label} onChange={e => setLabel(e.target.value)} placeholder="(opcional)" />
            </div>
          </div>

          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Aparência</div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Cor')}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: color === c.value ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', outline: color === c.value ? `2px solid ${c.value}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              {lbl('Fundo semi-transparente')}
              {toggle(bg, setBg, 'Com fundo', 'Sem fundo')}
            </div>
            <div style={{ marginBottom: 10 }}>
              {lbl('Mostrar números (atual / meta)')}
              {toggle(showNumbers, setShowNumbers, 'Sim', 'Não')}
            </div>
            <div>
              {lbl('Mostrar porcentagem')}
              {toggle(showPct, setShowPct, 'Sim', 'Não')}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            style={{ padding: '12px 0', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </div>

        {/* Preview + URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Preview</div>
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${color}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{title || 'Meta'}</span>
                {showPct && <span style={{ fontSize: '1.1rem', fontWeight: 900, color, textShadow: `0 0 16px ${color}88` }}>{pct}%</span>}
              </div>
              <div style={{ height: 9, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${color},${color}cc)`, width: `${pct}%`, boxShadow: `0 0 10px ${color}99` }} />
              </div>
              {showNumbers && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color, fontWeight: 700 }}>{goalType === 'custom' ? cur.toLocaleString('pt-BR') : '—'}{label ? ` ${label}` : ''}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>/ {Number(target).toLocaleString('pt-BR')}{label ? ` ${label}` : ''}</span>
                </div>
              )}
            </div>
            {goalType !== 'custom' && (
              <div style={{ marginTop: 10, fontSize: '0.75rem', color: S.dim }}>
                O valor atual será calculado automaticamente a partir dos dados da plataforma.
              </div>
            )}
          </div>

          <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: 12, padding: 18 }}>
            {lbl('URL do overlay para OBS (Browser Source)')}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', color: S.muted, wordBreak: 'break-all', lineHeight: 1.5 }}>
                {overlayUrl || '— faça login para gerar —'}
              </div>
              {overlayUrl && (
                <button onClick={copy}
                  style={{ padding: '8px 14px', background: copied ? S.green : S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', transition: 'background 0.2s' }}>
                  {copied ? '✓' : 'Copiar'}
                </button>
              )}
            </div>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: S.dim, lineHeight: 1.5 }}>
              Tamanho recomendado: <strong style={{ color: S.muted }}>400 × 80</strong> px no OBS. Ative "fundo transparente" no Browser Source.
            </div>
          </div>

          <div style={{ background: 'rgba(155,48,255,0.06)', border: `1px solid rgba(155,48,255,0.15)`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, color: S.text, fontSize: '0.85rem', marginBottom: 8 }}>Como usar</div>
            <ol style={{ color: S.muted, fontSize: '0.78rem', margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li>Configure o tipo, alvo e aparência</li>
              <li>Clique em <strong style={{ color: S.text }}>Salvar configuração</strong></li>
              <li>Cole a URL em um Browser Source no OBS</li>
              <li>A barra atualiza a cada 30s automaticamente</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
