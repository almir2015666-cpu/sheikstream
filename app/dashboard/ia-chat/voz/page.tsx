'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'processing' | 'sent' | 'error'
type Entry  = { id: string; spoken: string; reply: string }

const CSS = `
@keyframes voz-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.5)} 70%{box-shadow:0 0 0 28px rgba(57,255,20,0)} }
@keyframes voz-spin { to{transform:rotate(360deg)} }
@keyframes voz-bar { 0%,100%{height:5px;opacity:.4} 50%{height:24px;opacity:1} }
.voz-bar { animation: voz-bar .6s ease-in-out infinite; width: 4px; background: #39ff14; border-radius: 2px; display:inline-block; }
.voz-scroll::-webkit-scrollbar{width:3px}.voz-scroll::-webkit-scrollbar-thumb{background:rgba(155,48,255,.3);border-radius:3px}
`

export default function IaVozPage() {
  const [alwaysOn, setAlwaysOn]   = useState(false)
  const [status, setStatus]       = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const [history, setHistory]     = useState<Entry[]>([])
  const [lang, setLang]           = useState('pt-BR')
  const [supported, setSupported] = useState(true)
  const [apiError, setApiError]   = useState('')
  const [log, setLog]             = useState<string[]>([])

  const alwaysRef     = useRef(false)
  const processingRef = useRef(false)
  const histRef       = useRef<HTMLDivElement>(null)
  const sendRef       = useRef<(t: string) => Promise<void>>(async () => {})

  const addLog = (msg: string) => setLog(l => [`${new Date().toLocaleTimeString('pt-BR')} — ${msg}`, ...l.slice(0, 9)])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.split(/\s+/).length < 2) {
      addLog(`Ignorado (poucas palavras): "${trimmed}"`)
      return
    }
    if (processingRef.current) return
    processingRef.current = true
    setTranscript(trimmed)
    setStatus('processing')
    addLog(`Enviando: "${trimmed}"`)

    try {
      const r = await fetch('/api/ia-chat/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await r.json()
      if (!r.ok) {
        const msg = `Erro ${r.status}: ${data.error ?? 'desconhecido'}`
        setApiError(msg); addLog(msg)
        throw new Error(msg)
      }
      if (data.warn) { setApiError(data.warn); addLog(`Aviso: ${data.warn}`) }
      else setApiError('')
      const reply = data.reply ?? '(sem resposta)'
      addLog(`Resposta: "${reply.slice(0, 60)}"`)
      setHistory(h => [{ id: crypto.randomUUID(), spoken: trimmed, reply }, ...h])
      setStatus('sent')
      setTimeout(() => {
        setStatus(alwaysRef.current ? 'listening' : 'idle')
      }, 1500)
    } catch (e: any) {
      if (!apiError) addLog(`Erro: ${e.message}`)
      setStatus('error')
      setTimeout(() => setStatus(alwaysRef.current ? 'listening' : 'idle'), 2000)
    }
    processingRef.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep sendRef in sync so recognition callbacks always call latest version
  useEffect(() => { sendRef.current = send }, [send])

  // Recognition — recreated when lang changes
  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSupported(false); return }

    const r = new SR()
    r.continuous     = false   // one utterance at a time — most reliable
    r.interimResults = true
    r.lang           = lang
    r.maxAlternatives = 1

    r.onstart = () => { addLog('Microfone ativo'); setStatus('listening') }

    r.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setTranscript(final || interim)
    }

    r.onend = () => {
      addLog('Reconhecimento terminou')
      if (!processingRef.current && alwaysRef.current) {
        // grab whatever was the last transcript via DOM trick — use a closure captured ref
        const lastText = (r as any)._lastTranscript ?? ''
        if (lastText.trim()) {
          sendRef.current(lastText)
        }
        // auto-restart
        setTimeout(() => {
          if (alwaysRef.current && !processingRef.current) {
            startRecognition()
          }
        }, 300)
      }
    }

    r.onerror = (e: any) => {
      addLog(`Erro mic: ${e.error}`)
      if (e.error === 'not-allowed') {
        alwaysRef.current = false; setAlwaysOn(false); setStatus('error')
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setStatus('error')
        setTimeout(() => {
          if (alwaysRef.current) startRecognition()
          else setStatus('idle')
        }, 1000)
      }
    }

    // Track final transcript inside the recognition object
    const origOnResult = r.onresult
    r.onresult = (e: any) => {
      origOnResult(e)
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
      }
      if (final) (r as any)._lastTranscript = final
      else (r as any)._lastTranscript = (r as any)._lastTranscript ?? ''
    }

    try {
      r.start()
      addLog('Iniciando reconhecimento...')
    } catch (err) {
      addLog(`Erro ao iniciar: ${err}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const toggleAlwaysOn = useCallback(() => {
    if (alwaysOn) {
      alwaysRef.current = false
      setAlwaysOn(false)
      setStatus('idle')
      setTranscript('')
      addLog('Desativado')
    } else {
      alwaysRef.current = true
      setAlwaysOn(true)
      processingRef.current = false
      startRecognition()
    }
  }, [alwaysOn, startRecognition])

  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = 0
  }, [history])

  const P = '#9b30ff', TXT = '#e8e6f8', DIM = 'rgba(232,230,248,.35)', GREEN = '#39ff14'

  if (!supported) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'1rem', color: DIM, textAlign:'center' }}>
      <style>{CSS}</style>
      <div style={{ fontSize:'.95rem', color:'rgba(239,68,68,.8)' }}>Reconhecimento de voz não suportado</div>
      <div style={{ fontSize:'.8rem', maxWidth:320 }}>Use Chrome ou Edge.</div>
    </div>
  )

  return (
    <div style={{ maxWidth:620, margin:'0 auto', padding:'1.5rem 1.25rem 3rem', fontFamily:"-apple-system,'Inter',system-ui,sans-serif", color: TXT }}>
      <style>{CSS}</style>

      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:900 }}>IA por Voz</h1>
        <p style={{ margin:'.2rem 0 0', fontSize:'.76rem', color: DIM }}>Fale e a IA responde automaticamente no chat do Twitch</p>
      </div>

      {/* Main card */}
      <div style={{
        background: alwaysOn ? 'rgba(57,255,20,.05)' : '#0d0f18',
        border: `1.5px solid ${alwaysOn ? 'rgba(57,255,20,.3)' : 'rgba(255,255,255,.08)'}`,
        borderRadius:16, padding:'1.5rem', marginBottom:'1.25rem',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'1.25rem',
        transition:'all .25s',
      }}>
        {/* Waveform */}
        <div style={{ height:28, display:'flex', alignItems:'center', gap:4, opacity: status === 'listening' ? 1 : 0, transition:'opacity .3s' }}>
          {[...Array(11)].map((_, i) => (
            <div key={i} className="voz-bar" style={{ animationDelay:`${i * 0.07}s`, animationPlayState: status === 'listening' ? 'running' : 'paused' }} />
          ))}
        </div>

        {/* Mic button */}
        <button onClick={toggleAlwaysOn} disabled={status === 'processing'}
          style={{
            width:100, height:100, borderRadius:'50%',
            background: alwaysOn ? 'rgba(57,255,20,.1)' : 'rgba(155,48,255,.1)',
            border:`2px solid ${alwaysOn ? GREEN : P}`,
            cursor: status === 'processing' ? 'default' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: alwaysOn && status === 'listening' ? 'voz-pulse 2s ease-in-out infinite' : 'none',
            transition:'all .2s', outline:'none',
          }}>
          {status === 'processing'
            ? <svg style={{ animation:'voz-spin .75s linear infinite' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            : status === 'sent'
              ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={alwaysOn ? GREEN : P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>

        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'.95rem', fontWeight:700, color: alwaysOn ? GREEN : status === 'sent' ? '#22c55e' : status === 'error' ? '#ef4444' : DIM }}>
            {status === 'idle'       && (alwaysOn ? 'Ativo — aguardando...' : 'Desativado')}
            {status === 'listening'  && 'Ouvindo...'}
            {status === 'processing' && 'Processando...'}
            {status === 'sent'       && 'Enviado no chat!'}
            {status === 'error'      && 'Erro'}
          </div>
          <div style={{ fontSize:'.72rem', color: DIM, marginTop:'.3rem' }}>
            {alwaysOn ? 'Clique para desativar' : 'Clique para ativar'}
          </div>
        </div>
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{ background:'rgba(57,255,20,.04)', border:'1px solid rgba(57,255,20,.15)', borderRadius:10, padding:'.65rem 1rem', marginBottom:'1rem', fontSize:'.88rem', color:'rgba(232,230,248,.75)', fontStyle:'italic' }}>
          &ldquo;{transcript}&rdquo;
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'.6rem 1rem', marginBottom:'1rem', fontSize:'.8rem', color:'#ef4444' }}>
          ⚠ {apiError}
        </div>
      )}

      {/* Settings */}
      <div style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.8rem 1rem', marginBottom:'1.25rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <label style={{ fontSize:'.78rem', color: DIM, fontWeight:600 }}>Idioma:</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            style={{ background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, color: TXT, fontSize:'.78rem', padding:'.3rem .6rem', outline:'none', cursor:'pointer' }}>
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
      </div>

      {/* Debug log */}
      {log.length > 0 && (
        <div style={{ background:'#0a0b12', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'.7rem .9rem', marginBottom:'1.25rem' }}>
          <div style={{ fontSize:'.65rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.4rem' }}>Log</div>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize:'.72rem', color: 'rgba(232,230,248,.45)', fontFamily:'monospace', lineHeight:1.6 }}>{l}</div>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize:'.7rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>Histórico</div>
          <div ref={histRef} className="voz-scroll" style={{ display:'flex', flexDirection:'column', gap:'.6rem', maxHeight:360, overflowY:'auto' }}>
            {history.map(e => (
              <div key={e.id} style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.8rem 1rem', display:'flex', flexDirection:'column', gap:'.45rem' }}>
                <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'.62rem', fontWeight:800, color: DIM, background:'rgba(255,255,255,.06)', padding:'.1rem .4rem', borderRadius:4, flexShrink:0 }}>VOZ</span>
                  <span style={{ fontSize:'.84rem', color:'rgba(232,230,248,.65)', fontStyle:'italic' }}>&ldquo;{e.spoken}&rdquo;</span>
                </div>
                <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'.62rem', fontWeight:800, color: P, background:'rgba(155,48,255,.12)', padding:'.1rem .4rem', borderRadius:4, flexShrink:0 }}>IA</span>
                  <span style={{ fontSize:'.84rem', color: TXT }}>{e.reply}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
