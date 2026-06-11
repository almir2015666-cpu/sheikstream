'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'processing' | 'sent' | 'error'
type Entry  = { id: string; spoken: string; reply: string }

const CSS = `
@keyframes voz-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.4)} 70%{box-shadow:0 0 0 24px rgba(57,255,20,0)} }
@keyframes voz-spin { to{transform:rotate(360deg)} }
@keyframes voz-bar { 0%,100%{height:4px;opacity:.5} 50%{height:22px;opacity:1} }
.voz-bar { animation: voz-bar .65s ease-in-out infinite; width: 4px; background: #39ff14; border-radius: 2px; display:inline-block; }
.voz-scroll::-webkit-scrollbar{width:3px}.voz-scroll::-webkit-scrollbar-thumb{background:rgba(155,48,255,.3);border-radius:3px}
`

export default function IaVozPage() {
  const [alwaysOn, setAlwaysOn] = useState(false)
  const [status, setStatus]     = useState<Status>('idle')
  const [interim, setInterim]   = useState('')
  const [history, setHistory]   = useState<Entry[]>([])
  const [lang, setLang]         = useState('pt-BR')
  const [supported, setSupported] = useState(true)
  const [minWords, setMinWords]  = useState(2)
  const [apiError, setApiError]   = useState('')

  const recogRef    = useRef<any>(null)
  const alwaysRef   = useRef(false)
  const processingRef = useRef(false)
  const silenceTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accFinal    = useRef('')
  const histRef     = useRef<HTMLDivElement>(null)

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.split(/\s+/).length < minWords) return
    if (processingRef.current) return
    processingRef.current = true
    accFinal.current = ''
    setInterim('')
    setStatus('processing')
    try {
      const r = await fetch('/api/ia-chat/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await r.json()
      if (!r.ok) {
        setApiError(`Erro ${r.status}: ${data.error ?? 'desconhecido'}`)
        throw new Error(data.error ?? 'Erro')
      }
      if (data.warn) setApiError(`Aviso: ${data.warn}`)
      else setApiError('')
      setHistory(h => [{ id: crypto.randomUUID(), spoken: trimmed, reply: data.reply ?? '(sem resposta)' }, ...h])
      setStatus('sent')
      setTimeout(() => { if (alwaysRef.current) setStatus('listening'); else setStatus('idle') }, 1800)
    } catch (e) {
      console.error('[ia-voz]', e)
      setStatus('error')
      setTimeout(() => { if (alwaysRef.current) setStatus('listening'); else setStatus('idle') }, 2000)
    }
    processingRef.current = false
  }, [minWords])

  // Build recognition instance
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSupported(false); return }

    const r = new SR()
    r.continuous     = true
    r.interimResults = true
    r.lang           = lang

    r.onresult = (e: any) => {
      if (processingRef.current) return
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          accFinal.current += (accFinal.current ? ' ' : '') + t
        } else {
          interim += t
        }
      }
      setInterim(accFinal.current + (interim ? ' ' + interim : ''))

      // Silence timer — send after 1.8s of no new speech
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      silenceTimer.current = setTimeout(() => {
        if (accFinal.current && !processingRef.current) {
          send(accFinal.current)
        }
      }, 1800)
    }

    r.onend = () => {
      if (alwaysRef.current && !processingRef.current) {
        // Auto-restart in always-on mode
        setTimeout(() => {
          if (alwaysRef.current) {
            try { r.start() } catch { /* ignore */ }
          }
        }, 200)
      }
    }

    r.onerror = (e: any) => {
      if (e.error === 'no-speech') return // normal timeout, will restart via onend
      if (e.error === 'not-allowed') {
        setAlwaysOn(false)
        alwaysRef.current = false
        setStatus('error')
      }
    }

    recogRef.current = r
    return () => { try { r.stop() } catch { /* ignore */ } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const startAlwaysOn = useCallback(() => {
    alwaysRef.current = true
    accFinal.current = ''
    setInterim('')
    setStatus('listening')
    try { recogRef.current?.start() } catch { /* ignore */ }
  }, [])

  const stopAlwaysOn = useCallback(() => {
    alwaysRef.current = false
    processingRef.current = false
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    accFinal.current = ''
    setInterim('')
    setStatus('idle')
    try { recogRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const toggleAlwaysOn = useCallback(() => {
    if (alwaysOn) {
      setAlwaysOn(false)
      stopAlwaysOn()
    } else {
      setAlwaysOn(true)
      startAlwaysOn()
    }
  }, [alwaysOn, startAlwaysOn, stopAlwaysOn])

  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = 0
  }, [history])

  const P = '#9b30ff', TXT = '#e8e6f8', DIM = 'rgba(232,230,248,.35)'
  const GREEN = '#39ff14'

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

      {/* Header */}
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:900 }}>IA por Voz</h1>
        <p style={{ margin:'.2rem 0 0', fontSize:'.76rem', color: DIM }}>Fale e a IA responde automaticamente no chat do Twitch</p>
      </div>

      {/* Main toggle card */}
      <div style={{
        background: alwaysOn ? 'rgba(57,255,20,.05)' : '#0d0f18',
        border: `1.5px solid ${alwaysOn ? 'rgba(57,255,20,.3)' : 'rgba(255,255,255,.08)'}`,
        borderRadius: 16, padding:'1.5rem', marginBottom:'1.25rem',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'1.25rem',
        transition: 'all .25s',
      }}>

        {/* Waveform */}
        <div style={{ height:28, display:'flex', alignItems:'center', gap:4, opacity: status === 'listening' ? 1 : 0, transition:'opacity .3s' }}>
          {[...Array(11)].map((_, i) => (
            <div key={i} className="voz-bar" style={{ animationDelay:`${i * 0.07}s`, animationPlayState: status === 'listening' ? 'running' : 'paused' }} />
          ))}
        </div>

        {/* Big mic button */}
        <button
          onClick={toggleAlwaysOn}
          disabled={status === 'processing'}
          style={{
            width:100, height:100, borderRadius:'50%',
            background: alwaysOn ? 'rgba(57,255,20,.1)' : 'rgba(155,48,255,.1)',
            border: `2px solid ${alwaysOn ? GREEN : P}`,
            cursor: status === 'processing' ? 'default' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: alwaysOn && status === 'listening' ? 'voz-pulse 2s ease-in-out infinite' : 'none',
            transition:'all .2s', outline:'none', flexShrink:0,
          }}
        >
          {status === 'processing'
            ? <svg style={{ animation:'voz-spin .75s linear infinite' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            : status === 'sent'
              ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={alwaysOn ? GREEN : P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>

        {/* Status */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'.95rem', fontWeight:700, color: alwaysOn ? GREEN : status === 'sent' ? '#22c55e' : status === 'error' ? '#ef4444' : DIM }}>
            {status === 'idle'       && (alwaysOn ? 'Ativo — ouvindo...' : 'Desativado')}
            {status === 'listening'  && 'Ouvindo...'}
            {status === 'processing' && 'Processando...'}
            {status === 'sent'       && 'Enviado no chat!'}
            {status === 'error'      && 'Erro — verifique permissão do microfone'}
          </div>
          <div style={{ fontSize:'.72rem', color: DIM, marginTop:'.3rem' }}>
            {alwaysOn ? 'Clique para desativar' : 'Clique para ativar o microfone permanente'}
          </div>
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'.65rem 1rem', marginBottom:'1rem', fontSize:'.82rem', color:'#ef4444' }}>
          ⚠ {apiError}
        </div>
      )}

      {/* Transcript live */}
      {interim && (
        <div style={{ background:'rgba(57,255,20,.04)', border:'1px solid rgba(57,255,20,.15)', borderRadius:10, padding:'.7rem 1rem', marginBottom:'1.25rem', fontSize:'.88rem', color:'rgba(232,230,248,.7)', fontStyle:'italic' }}>
          &ldquo;{interim}&rdquo;
        </div>
      )}

      {/* Settings */}
      <div style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.85rem 1.1rem', marginBottom:'1.5rem', display:'flex', gap:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <label style={{ fontSize:'.78rem', color: DIM, fontWeight:600 }}>Idioma:</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            style={{ background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, color: TXT, fontSize:'.78rem', padding:'.3rem .6rem', outline:'none', cursor:'pointer' }}>
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <label style={{ fontSize:'.78rem', color: DIM, fontWeight:600 }}>Mín. palavras:</label>
          <input type="number" min={1} max={10} value={minWords} onChange={e => setMinWords(Math.max(1, Number(e.target.value)))}
            style={{ width:52, background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, color: TXT, fontSize:'.78rem', padding:'.3rem .5rem', outline:'none', textAlign:'center' }} />
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize:'.7rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>Histórico</div>
          <div ref={histRef} className="voz-scroll" style={{ display:'flex', flexDirection:'column', gap:'.6rem', maxHeight:360, overflowY:'auto' }}>
            {history.map(e => (
              <div key={e.id} style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.8rem 1rem', display:'flex', flexDirection:'column', gap:'.45rem' }}>
                <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'.62rem', fontWeight:800, color: DIM, background:'rgba(255,255,255,.06)', padding:'.1rem .4rem', borderRadius:4, flexShrink:0, marginTop:'.15rem' }}>VOZ</span>
                  <span style={{ fontSize:'.84rem', color:'rgba(232,230,248,.65)', fontStyle:'italic' }}>&ldquo;{e.spoken}&rdquo;</span>
                </div>
                <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'.62rem', fontWeight:800, color: P, background:'rgba(155,48,255,.12)', padding:'.1rem .4rem', borderRadius:4, flexShrink:0, marginTop:'.15rem' }}>IA</span>
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
