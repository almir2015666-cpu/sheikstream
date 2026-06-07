'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

const C = {
  bg: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)', primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.9rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.73rem', fontWeight: 600, color: 'rgba(232,230,248,0.5)', marginBottom: '0.32rem', display: 'block' }
const btn = (bg: string, col = '#fff'): React.CSSProperties => ({ padding: '0.55rem 1.2rem', background: bg, color: col, border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' })

type State = {
  broadcaster_id: string
  title: string
  end_time: string | null
  paused_remaining: number | null
  seconds_per_sub: number
  seconds_per_bits100: number
  is_active: boolean
  is_paused: boolean
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SubathonPage() {
  const [state, setState] = useState<State | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initSecs, setInitSecs] = useState('3600')
  const [addSecs, setAddSecs] = useState('60')
  const [config, setConfig] = useState({ title: '', seconds_per_sub: '60', seconds_per_bits100: '30' })
  const [copied, setCopied] = useState(false)
  const [recentEvents, setRecentEvents] = useState<{ type: string; ts: string }[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/subathon')
    const data = await res.json()
    setState(data)
    setLoading(false)
    if (data && !config.title) {
      setConfig({ title: data.title ?? 'Subathon', seconds_per_sub: String(data.seconds_per_sub), seconds_per_bits100: String(data.seconds_per_bits100) })
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Polling when active
  useEffect(() => {
    if (!state?.is_active) return
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [state?.is_active, load])

  // Client-side countdown
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!state?.is_active) { setRemaining(0); return }
    if (state.is_paused) { setRemaining(state.paused_remaining ?? 0); return }
    if (!state.end_time) { setRemaining(0); return }

    const calc = () => setRemaining(Math.max(0, Math.floor((new Date(state.end_time!).getTime() - Date.now()) / 1000)))
    calc()
    tickRef.current = setInterval(calc, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [state])

  async function action(body: object) {
    setSaving(true)
    const res = await fetch('/api/subathon', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setState(data)
    setSaving(false)
    if ((body as { action?: string }).action) {
      setRecentEvents(p => [{ type: String((body as { action: string }).action), ts: new Date().toLocaleTimeString('pt-BR') }, ...p.slice(0, 19)])
    }
  }

  async function saveConfig() {
    await action({ title: config.title, seconds_per_sub: Number(config.seconds_per_sub), seconds_per_bits100: Number(config.seconds_per_bits100) })
  }

  function copyOverlay() {
    if (!state) return
    const url = `${window.location.origin}/overlay/subathon?uid=${state.broadcaster_id}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  const warningColor = remaining < 300 ? '#ff4444' : remaining < 1800 ? '#ffaa00' : C.accent

  if (loading) return <div style={{ background: C.bg, minHeight: '100vh' }} />

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Subathon</h2>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.5px' }}>NOVO</span>
          <span style={{ fontSize: '0.72rem', color: C.muted }}>Timer que aumenta com subs e bits</span>
        </div>
        <button onClick={copyOverlay} style={btn(copied ? 'rgba(57,255,20,0.15)' : 'rgba(155,48,255,0.12)', copied ? C.accent : C.primary)}>
          {copied ? '✓ Copiado' : 'URL OBS'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Timer display */}
        <div style={{ background: C.card, border: `1px solid ${state?.is_active ? warningColor + '44' : C.cardB}`, borderRadius: '14px', padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
            {state?.is_active ? (state.is_paused ? 'PAUSADO' : 'AO VIVO') : 'INATIVO'}
          </div>
          <div style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-2px', color: state?.is_active ? warningColor : C.vdim, lineHeight: 1, textShadow: state?.is_active ? `0 0 30px ${warningColor}44` : 'none', transition: 'color 0.3s' }}>
            {fmt(state?.is_active ? remaining : 0)}
          </div>
          {state?.is_active && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: C.dim }}>
              +{state.seconds_per_sub}s por sub · +{state.seconds_per_bits100}s por 100 bits
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {!state?.is_active && (
              <>
                <input value={initSecs} onChange={e => setInitSecs(e.target.value)} placeholder="Segundos iniciais" style={{ ...inputStyle, width: '160px' }} />
                <button onClick={() => action({ action: 'start', initial_seconds: Number(initSecs) })} disabled={saving} style={btn('rgba(57,255,20,0.15)', C.accent)}>▶ Iniciar</button>
              </>
            )}
            {state?.is_active && !state.is_paused && (
              <button onClick={() => action({ action: 'pause' })} disabled={saving} style={btn('rgba(255,170,0,0.1)', '#ffaa00')}>⏸ Pausar</button>
            )}
            {state?.is_active && state.is_paused && (
              <button onClick={() => action({ action: 'resume' })} disabled={saving} style={btn('rgba(57,255,20,0.12)', C.accent)}>▶ Retomar</button>
            )}
            {state?.is_active && (
              <>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input value={addSecs} onChange={e => setAddSecs(e.target.value)} placeholder="Segundos" style={{ ...inputStyle, width: '100px' }} />
                  <button onClick={() => action({ action: 'add_time', seconds: Number(addSecs) })} disabled={saving} style={btn(C.primaryBg, C.primary)}>+ Tempo</button>
                </div>
                <button onClick={() => action({ action: 'stop' })} disabled={saving} style={btn('rgba(255,68,68,0.1)', '#ff6b6b')}>■ Parar</button>
              </>
            )}
          </div>
        </div>

        {/* Config */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Configurações</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Nome do subathon</label>
              <input value={config.title} onChange={e => setConfig(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Segundos por sub</label>
              <input type="number" value={config.seconds_per_sub} onChange={e => setConfig(p => ({ ...p, seconds_per_sub: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Segundos por 100 bits</label>
              <input type="number" value={config.seconds_per_bits100} onChange={e => setConfig(p => ({ ...p, seconds_per_bits100: e.target.value }))} style={inputStyle} />
            </div>
            <button onClick={saveConfig} disabled={saving} style={btn(C.primaryBg, C.primary)}>Salvar config</button>
          </div>
        </div>

        {/* Recent events */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Ações recentes</div>
          {recentEvents.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: C.vdim, textAlign: 'center', padding: '2rem 0' }}>Nenhuma ação ainda</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {recentEvents.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: C.text }}>{e.type}</span>
                  <span style={{ color: C.vdim, fontSize: '0.7rem' }}>{e.ts}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OBS URL hint */}
      <div style={{ background: 'rgba(155,48,255,0.06)', border: '1px solid rgba(155,48,255,0.15)', borderRadius: '10px', padding: '0.9rem 1.2rem', fontSize: '0.8rem', color: C.dim }}>
        <strong style={{ color: C.text }}>OBS Browser Source:</strong> Clique em &quot;URL OBS&quot; acima para copiar o link. No OBS: Adicionar Fonte → Browser → colar a URL. Tamanho recomendado: 400×100px.
      </div>
    </div>
  )
}
