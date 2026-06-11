'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'processing' | 'sent' | 'error'
type Entry  = { id: string; spoken: string; reply: string }

const CSS = `
@keyframes voz-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(155,48,255,.5)} 70%{box-shadow:0 0 0 22px rgba(155,48,255,0)} }
@keyframes voz-pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 70%{box-shadow:0 0 0 22px rgba(239,68,68,0)} }
@keyframes voz-spin { to{transform:rotate(360deg)} }
@keyframes voz-bar { 0%,100%{height:4px} 50%{height:20px} }
.voz-bar { animation: voz-bar .7s ease-in-out infinite; width: 4px; background: #9b30ff; border-radius: 2px; }
.voz-entry::-webkit-scrollbar { width:3px } .voz-entry::-webkit-scrollbar-thumb { background:rgba(155,48,255,.3); border-radius:3px }
`

export default function IaVozPage() {
  const [status, setStatus]   = useState<Status>('idle')
  const [interim, setInterim] = useState('')
  const [history, setHistory] = useState<Entry[]>([])
  const [supported, setSupported] = useState(true)
  const [lang, setLang]       = useState('pt-BR')
  const [autoSend, setAutoSend] = useState(true)

  const recogRef  = useRef<any>(null)
  const finalRef  = useRef('')
  const activeRef = useRef(false)
  const histRef   = useRef<HTMLDivElement>(null)

  const send = useCallback(async (text: string) => {
    if (!text.trim()) { setStatus('idle'); return }
    setStatus('processing')
    try {
      const r = await fetch('/api/ia-chat/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erro')
      setHistory(h => [{ id: crypto.randomUUID(), spoken: text, reply: data.reply }, ...h])
      setStatus('sent')
      setTimeout(() => { if (!activeRef.current) setStatus('idle') }, 2000)
    } catch (e) {
      console.error(e)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
    finalRef.current = ''
    setInterim('')
  }, [])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSupported(false); return }

    const r = new SR()
    r.continuous   = false
    r.interimResults = true
    r.lang = lang

    r.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setInterim(interim || final)
      if (final) finalRef.current = final
    }

    r.onend = () => {
      activeRef.current = false
      if (finalRef.current && autoSend) {
        send(finalRef.current)
      } else if (finalRef.current && !autoSend) {
        setStatus('idle')
      } else {
        setStatus('idle')
        setInterim('')
      }
    }

    r.onerror = (e: any) => {
      activeRef.current = false
      if (e.error !== 'no-speech') {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setStatus('idle')
      }
      setInterim('')
    }

    recogRef.current = r
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, autoSend, send])

  const startListen = () => {
    if (!recogRef.current || status === 'processing') return
    finalRef.current = ''
    setInterim('')
    setStatus('listening')
    activeRef.current = true
    try { recogRef.current.start() } catch { /* already running */ }
  }

  const stopListen = () => {
    activeRef.current = false
    try { recogRef.current?.stop() } catch { /* ignore */ }
  }

  const sendManual = async () => {
    if (!finalRef.current && !interim) return
    const text = finalRef.current || interim
    finalRef.current = text
    stopListen()
    if (status !== 'listening') await send(text)
  }

  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = 0
  }, [history])

  const P = '#9b30ff', TXT = '#e8e6f8', DIM = 'rgba(232,230,248,.35)'

  if (!supported) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'1rem', color: DIM, textAlign:'center' }}>
      <style>{CSS}</style>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.6)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      <div style={{ fontSize: '.95rem', color: 'rgba(239,68,68,.8)' }}>Reconhecimento de voz não suportado</div>
      <div style={{ fontSize: '.8rem', maxWidth: 320 }}>Use Chrome ou Edge para esta funcionalidade.</div>
    </div>
  )

  const micColor = status === 'listening' ? '#ef4444' : status === 'processing' ? P : status === 'sent' ? '#22c55e' : P
  const micAnim  = status === 'listening' ? 'voz-pulse-red 1.5s ease-in-out infinite' : status === 'idle' ? 'voz-pulse 2.5s ease-in-out infinite' : 'none'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem 1.25rem 3rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: TXT }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>IA por Voz</h1>
        <p style={{ margin: '.2rem 0 0', fontSize: '.76rem', color: DIM }}>Fale e a IA responde no chat do Twitch</p>
      </div>

      {/* Mic area */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1.5rem', marginBottom:'2rem' }}>

        {/* Waveform */}
        <div style={{ height:28, display:'flex', alignItems:'center', gap:3, opacity: status === 'listening' ? 1 : 0, transition:'opacity .2s' }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} className="voz-bar" style={{ animationDelay: `${i * 0.08}s`, animationPlayState: status === 'listening' ? 'running' : 'paused' }} />
          ))}
        </div>

        {/* Big mic button */}
        <button
          onMouseDown={startListen}
          onMouseUp={stopListen}
          onTouchStart={startListen}
          onTouchEnd={stopListen}
          disabled={status === 'processing'}
          style={{
            width: 96, height: 96, borderRadius: '50%',
            background: status === 'listening' ? 'rgba(239,68,68,.15)' : status === 'sent' ? 'rgba(34,197,94,.12)' : 'rgba(155,48,255,.12)',
            border: `2px solid ${micColor}`,
            cursor: status === 'processing' ? 'default' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: micAnim,
            transition: 'all .2s',
            outline: 'none',
          }}
        >
          {status === 'processing'
            ? <svg style={{ animation:'voz-spin .75s linear infinite' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            : status === 'sent'
              ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={micColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>

        {/* Status text */}
        <div style={{ fontSize: '.82rem', color: status === 'listening' ? '#ef4444' : status === 'sent' ? '#22c55e' : status === 'error' ? '#ef4444' : DIM, fontWeight: 600, textAlign:'center', minHeight:'1.2em' }}>
          {status === 'idle'       && 'Segure para falar'}
          {status === 'listening'  && 'Ouvindo... solte para enviar'}
          {status === 'processing' && 'Processando...'}
          {status === 'sent'       && 'Enviado no chat!'}
          {status === 'error'      && 'Erro — tente novamente'}
        </div>

        {/* Transcript */}
        {interim && (
          <div style={{ background:'rgba(155,48,255,.07)', border:'1px solid rgba(155,48,255,.2)', borderRadius:10, padding:'.65rem 1rem', fontSize:'.88rem', color: TXT, width:'100%', textAlign:'center', fontStyle:'italic' }}>
            &ldquo;{interim}&rdquo;
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.85rem 1.1rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          <label style={{ fontSize:'.78rem', color: DIM, fontWeight:600 }}>Idioma:</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            style={{ background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, color: TXT, fontSize:'.78rem', padding:'.3rem .6rem', outline:'none', cursor:'pointer' }}>
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <label style={{ fontSize:'.78rem', color: DIM, fontWeight:600 }}>Enviar automático:</label>
          <button type="button" onClick={() => setAutoSend(v => !v)} style={{
            width:38, height:22, borderRadius:11, background: autoSend ? P : 'rgba(255,255,255,.1)',
            border:'none', cursor:'pointer', position:'relative', transition:'background .18s', flexShrink:0,
          }}>
            <span style={{ position:'absolute', top:3, left: autoSend ? 19 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .18s', display:'block' }} />
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize:'.7rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>Histórico</div>
          <div ref={histRef} style={{ display:'flex', flexDirection:'column', gap:'.65rem', maxHeight:380, overflowY:'auto' }} className="voz-entry">
            {history.map(e => (
              <div key={e.id} style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.8rem 1rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'.5rem' }}>
                  <span style={{ fontSize:'.65rem', fontWeight:700, color: DIM, background:'rgba(255,255,255,.06)', padding:'.15rem .45rem', borderRadius:4, flexShrink:0, marginTop:'.1rem' }}>VOCÊ</span>
                  <span style={{ fontSize:'.85rem', color:'rgba(232,230,248,.7)', fontStyle:'italic' }}>&ldquo;{e.spoken}&rdquo;</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'.5rem' }}>
                  <span style={{ fontSize:'.65rem', fontWeight:700, color: P, background:'rgba(155,48,255,.12)', padding:'.15rem .45rem', borderRadius:4, flexShrink:0, marginTop:'.1rem' }}>IA</span>
                  <span style={{ fontSize:'.85rem', color: TXT }}>{e.reply}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
