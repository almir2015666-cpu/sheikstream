'use client'
import { useEffect, useRef, useState } from 'react'

const S = {
  bg: '#08090d', card: '#0f1018', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)', primaryB: 'rgba(155,48,255,0.35)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.1)', greenB: 'rgba(34,197,94,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.1)', redB: 'rgba(239,68,68,0.3)',
  yellow: '#f59e0b', yellowBg: 'rgba(245,158,11,0.1)', yellowB: 'rgba(245,158,11,0.3)',
  border: 'rgba(255,255,255,0.07)',
}

const ACTIONS = [
  { value: 'navigate',      label: 'Abrir página',     icon: '🔗', desc: 'Navega para uma URL do dashboard' },
  { value: 'discord-live',  label: 'Notificar Discord', icon: '💬', desc: 'Envia notificação de live no Discord' },
  { value: 'alert',         label: 'Mostrar alerta',   icon: '📢', desc: 'Exibe texto na tela por alguns segundos' },
  { value: 'timer-start',   label: 'Iniciar timer',    icon: '⏱️', desc: 'Inicia um timer com minutos definidos' },
]

type Cmd = { id: string; keyword: string; action: string; param: string; enabled: boolean }

function newCmd(): Cmd {
  return { id: crypto.randomUUID(), keyword: '', action: 'navigate', param: '', enabled: true }
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export default function ComandosVozPage() {
  const [cmds,      setCmds]      = useState<Cmd[]>([])
  const [listening, setListening] = useState(false)
  const [transcript,setTranscript]= useState('')
  const [matched,   setMatched]   = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [supported, setSupported] = useState(true)
  const [lang,      setLang]      = useState('pt-BR')
  const [alert,     setAlert]     = useState('')
  const recogRef = useRef<SpeechRecognition | null>(null)
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) { setSupported(false); return }
    fetch('/api/voice-commands')
      .then(r => r.ok ? r.json() : { commands: [] })
      .then(d => { if (Array.isArray(d.commands) && d.commands.length > 0) setCmds(d.commands) })
      .catch(() => {})
  }, [])

  function startListening() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    recogRef.current = r
    r.onstart = () => setListening(true)
    r.onend   = () => setListening(false)
    r.onerror = () => setListening(false)
    r.onresult = (e: SpeechRecognitionEvent) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
      }
      const text = final.toLowerCase().trim()
      if (!text) return
      setTranscript(text)
      const enabledCmds = cmds.filter(c => c.enabled && c.keyword)
      for (const cmd of enabledCmds) {
        if (text.includes(cmd.keyword.toLowerCase())) {
          setMatched(cmd.keyword)
          setTimeout(() => setMatched(null), 2500)
          execAction(cmd)
          break
        }
      }
    }
    r.start()
  }

  function stopListening() {
    recogRef.current?.stop()
    recogRef.current = null
  }

  function execAction(cmd: Cmd) {
    if (cmd.action === 'navigate' && cmd.param) {
      window.open(cmd.param, '_blank')
    } else if (cmd.action === 'discord-live') {
      fetch('/api/discord/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).catch(() => {})
    } else if (cmd.action === 'alert') {
      if (alertTimer.current) clearTimeout(alertTimer.current)
      setAlert(cmd.param || cmd.keyword)
      alertTimer.current = setTimeout(() => setAlert(''), 4000)
    } else if (cmd.action === 'timer-start') {
      const mins = parseInt(cmd.param) || 5
      window.open(`/dashboard/timers?start=${mins}`, '_blank')
    }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/voice-commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commands: cmds }) })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = { padding: '0.45rem 0.6rem', background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 7, color: S.text, fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '1.75rem 2rem', fontFamily: "-apple-system,'Inter',sans-serif", color: S.text, position: 'relative' }}>

      {/* Alert overlay */}
      {alert && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(155,48,255,0.95)', border: `1px solid ${S.primaryB}`, borderRadius: 12, padding: '0.75rem 1.5rem', zIndex: 999, fontSize: '1rem', fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(155,48,255,0.4)', animation: 'alertIn 0.3s ease' }}>
          📢 {alert}
        </div>
      )}
      <style>{`@keyframes alertIn { from { opacity:0; transform:translateX(-50%) translateY(-8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>

      <div style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S.dim} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Comandos de Voz</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: S.muted }}>
            Acione ações do dashboard falando palavras-chave durante a live.
          </p>
        </div>

        {!supported && (
          <div style={{ background: S.redBg, border: `1px solid ${S.redB}`, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.83rem', color: S.red, marginBottom: '1rem' }}>
            ⚠️ Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.
          </div>
        )}

        {/* Mic control */}
        <div style={{ background: S.card, border: `1px solid ${listening ? S.primaryB : S.cardB}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={listening ? stopListening : startListening}
            disabled={!supported}
            style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: listening ? 'rgba(239,68,68,0.15)' : S.primaryBg,
              border: `2px solid ${listening ? S.red : S.primary}`,
              color: listening ? S.red : S.primary,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: listening ? 'pulse 1.5s ease infinite' : 'none',
            }}
          >
            {listening
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            }
          </button>
          <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }`}</style>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: listening ? S.red : S.muted, marginBottom: '0.25rem' }}>
              {listening ? '🔴 Ouvindo…' : 'Microfone desligado'}
            </div>
            {transcript && (
              <div style={{ fontSize: '0.8rem', color: matched ? S.green : S.dim, fontStyle: 'italic' }}>
                {matched ? `✓ Comando reconhecido: "${matched}"` : `"${transcript}"`}
              </div>
            )}
            {!transcript && !listening && <div style={{ fontSize: '0.78rem', color: S.dim }}>Clique no botão para ativar</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.65rem', color: S.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Idioma</span>
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ ...inp, paddingRight: '0.6rem', colorScheme: 'dark' }}>
              <option value="pt-BR">Português (BR)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </div>

        {/* Commands list */}
        <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Comandos ({cmds.length})</span>
            <button onClick={() => setCmds(prev => [...prev, newCmd()])} style={{ padding: '0.3rem 0.7rem', background: S.primaryBg, border: `1px solid ${S.primaryB}`, color: S.primary, borderRadius: 7, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              + Adicionar
            </button>
          </div>

          {cmds.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: S.dim, fontSize: '0.82rem' }}>
              Nenhum comando. Clique em &quot;+ Adicionar&quot; para criar.
            </div>
          )}

          {cmds.map((cmd, i) => {
            const act = ACTIONS.find(a => a.value === cmd.action)
            const needsParam = cmd.action !== 'discord-live'
            const paramLabel = cmd.action === 'navigate' ? 'URL (ex: /dashboard/sorteios)' : cmd.action === 'timer-start' ? 'Minutos (ex: 5)' : 'Texto do alerta'
            return (
              <div key={cmd.id} style={{ padding: '0.85rem 1rem', borderBottom: i < cmds.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', background: cmd.enabled ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    value={cmd.keyword}
                    onChange={e => setCmds(prev => prev.map(c => c.id === cmd.id ? { ...c, keyword: e.target.value } : c))}
                    placeholder="Palavra-chave (ex: iniciar sorteio)"
                    style={{ ...inp, flex: 1 }}
                  />
                  <select
                    value={cmd.action}
                    onChange={e => setCmds(prev => prev.map(c => c.id === cmd.id ? { ...c, action: e.target.value, param: '' } : c))}
                    style={{ ...inp, colorScheme: 'dark' }}
                  >
                    {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                  </select>
                  <button onClick={() => setCmds(prev => prev.map(c => c.id === cmd.id ? { ...c, enabled: !c.enabled } : c))}
                    style={{ width: 34, height: 34, borderRadius: 8, background: cmd.enabled ? S.greenBg : 'transparent', border: `1px solid ${cmd.enabled ? S.greenB : S.border}`, color: cmd.enabled ? S.green : S.dim, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>
                    {cmd.enabled ? '✓' : '○'}
                  </button>
                  <button onClick={() => setCmds(prev => prev.filter(c => c.id !== cmd.id))}
                    style={{ width: 34, height: 34, borderRadius: 8, background: S.redBg, border: `1px solid ${S.redB}`, color: S.red, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
                {needsParam && (
                  <input
                    value={cmd.param}
                    onChange={e => setCmds(prev => prev.map(c => c.id === cmd.id ? { ...c, param: e.target.value } : c))}
                    placeholder={paramLabel}
                    style={{ ...inp, fontSize: '0.78rem', color: S.muted }}
                  />
                )}
                {act && <span style={{ fontSize: '0.7rem', color: S.dim }}>{act.desc}</span>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} disabled={saving} style={{
            padding: '0.6rem 1.5rem', background: saved ? S.greenBg : S.primaryBg, border: `1px solid ${saved ? S.greenB : S.primaryB}`,
            color: saved ? S.green : S.primary, borderRadius: 9, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
          }}>
            {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar comandos'}
          </button>
        </div>
      </div>
    </div>
  )
}
