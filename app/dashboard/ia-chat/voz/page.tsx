'use client'
import { useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'processing' | 'sent' | 'error'
type Entry  = { id: string; spoken: string; reply: string }

const CSS = `
@keyframes voz-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.5)} 70%{box-shadow:0 0 0 28px rgba(57,255,20,0)} }
@keyframes voz-spin { to{transform:rotate(360deg)} }
@keyframes voz-bar { 0%,100%{height:5px;opacity:.4} 50%{height:24px;opacity:1} }
.voz-bar{animation:voz-bar .6s ease-in-out infinite;width:4px;background:#39ff14;border-radius:2px;display:inline-block}
.voz-scroll::-webkit-scrollbar{width:3px}.voz-scroll::-webkit-scrollbar-thumb{background:rgba(155,48,255,.3);border-radius:3px}
input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#9b30ff;cursor:pointer}
`

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  const P = '#9b30ff'
  return (
    <button onClick={onChange} style={{ flexShrink:0, width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', background: on ? P : 'rgba(255,255,255,.1)', transition:'background .2s', position:'relative' }}>
      <span style={{ position:'absolute', top:3, left: on ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block' }} />
    </button>
  )
}

function Row({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: () => void }) {
  const TXT = '#e8e6f8', DIM = 'rgba(232,230,248,.35)'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
      <div>
        <div style={{ fontSize:'.78rem', fontWeight:700, color: TXT }}>{label}</div>
        {desc && <div style={{ fontSize:'.7rem', color: DIM, marginTop:'.1rem' }}>{desc}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

export default function IaVozPage() {
  const [status, setStatus]         = useState<Status>('idle')
  const [on, setOn]                 = useState(false)
  const [transcript, setTranscript] = useState('')
  const [history, setHistory]       = useState<Entry[]>([])
  const [apiErr, setApiErr]         = useState('')
  const [log, setLog]               = useState<string[]>([])
  const [noSupport, setNoSupport]   = useState(false)

  // Settings
  const [lang, setLang]             = useState('pt-BR')
  const [wakeEnabled, setWakeEnabled] = useState(false)
  const [wakeWord, setWakeWord]     = useState('')
  const [cooldown, setCooldown]     = useState(5)
  const [minWords, setMinWords]     = useState(1)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [sendChat, setSendChat]     = useState(true)
  const [ignoreWords, setIgnoreWords] = useState('')

  // Refs — always fresh inside closures
  const onRef          = useRef(false)
  const busyRef        = useRef(false)
  const recRef         = useRef<any>(null)
  const langRef        = useRef('pt-BR')
  const wakeEnabledRef = useRef(false)
  const wakeWordRef    = useRef('')
  const cooldownRef    = useRef(5)
  const minWordsRef    = useRef(1)
  const ttsRef         = useRef(false)
  const sendChatRef    = useRef(true)
  const ignoreWordsRef = useRef('')
  const lastSentRef    = useRef(0)
  const histRef        = useRef<HTMLDivElement>(null)

  // Sync refs
  useEffect(() => { langRef.current = lang }, [lang])
  useEffect(() => { wakeEnabledRef.current = wakeEnabled }, [wakeEnabled])
  useEffect(() => { wakeWordRef.current = wakeWord }, [wakeWord])
  useEffect(() => { cooldownRef.current = cooldown }, [cooldown])
  useEffect(() => { minWordsRef.current = minWords }, [minWords])
  useEffect(() => { ttsRef.current = ttsEnabled }, [ttsEnabled])
  useEffect(() => { sendChatRef.current = sendChat }, [sendChat])
  useEffect(() => { ignoreWordsRef.current = ignoreWords }, [ignoreWords])

  const lg = (msg: string) => {
    const ts = new Date().toLocaleTimeString('pt-BR')
    setLog(l => [`${ts} — ${msg}`, ...l.slice(0, 19)])
    console.log('[ia-voz]', msg)
  }

  const speak = (text: string) => {
    if (!ttsRef.current || !text) return
    try {
      window.speechSynthesis?.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = langRef.current
      window.speechSynthesis.speak(u)
    } catch { /* ignore */ }
  }

  const sendText = async (text: string) => {
    const t = text.trim()
    if (!t) { lg('Sem texto'); return }
    if (busyRef.current) { lg('Aguarde...'); return }

    // Cooldown check
    const elapsed = (Date.now() - lastSentRef.current) / 1000
    if (elapsed < cooldownRef.current) {
      lg(`Cooldown: aguarde ${(cooldownRef.current - elapsed).toFixed(0)}s`)
      return
    }

    // Ignored words filter
    const ignored = ignoreWordsRef.current.split(',').map(w => w.trim().toLowerCase()).filter(Boolean)
    if (ignored.some(w => t.toLowerCase().includes(w))) {
      lg(`Ignorado (palavra filtrada)`)
      return
    }

    busyRef.current = true
    lastSentRef.current = Date.now()
    setStatus('processing')
    lg(`→ Enviando: "${t.slice(0, 60)}"`)

    try {
      const r = await fetch('/api/ia-chat/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, sendToChat: sendChatRef.current }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(`${r.status}: ${d.error ?? 'erro'}`)
      if (d.warn) { setApiErr(d.warn); lg(`Aviso: ${d.warn}`) }
      else setApiErr('')
      const reply = d.reply ?? '(vazio)'
      lg(`← Resposta: "${reply.slice(0, 60)}"`)
      setHistory(h => [{ id: crypto.randomUUID(), spoken: t, reply }, ...h])
      setStatus('sent')
      speak(reply)
      setTimeout(() => setStatus(onRef.current ? 'listening' : 'idle'), 1500)
    } catch (e: any) {
      setApiErr(e.message)
      lg(`Erro API: ${e.message}`)
      setStatus('error')
      setTimeout(() => setStatus(onRef.current ? 'listening' : 'idle'), 2000)
    }
    busyRef.current = false
  }

  const startCycle = () => {
    if (!onRef.current || busyRef.current) return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setNoSupport(true); return }

    const rec = new SR()
    rec.continuous     = false
    rec.interimResults = true
    rec.lang           = langRef.current
    recRef.current     = rec

    let captured = ''

    rec.onstart  = () => { lg('Mic ativo'); setStatus('listening') }

    rec.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t; else interim += t
      }
      if (final) captured = final
      setTranscript(final || interim)
      if (final) lg(`Detectado: "${final.slice(0, 60)}"`)
    }

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') lg('Silêncio — reiniciando...')
      else if (e.error === 'not-allowed') { lg('Permissão negada!'); onRef.current = false; setOn(false); setStatus('error') }
      else lg(`Erro mic: ${e.error}`)
    }

    rec.onend = () => {
      lg('Ciclo encerrado')
      if (captured) {
        // Min words filter
        const wordCount = captured.trim().split(/\s+/).length
        if (wordCount < minWordsRef.current) {
          lg(`Muito curto (${wordCount} palavra${wordCount>1?'s':''}) — ignorando`)
          if (onRef.current && !busyRef.current) setTimeout(startCycle, 200)
          return
        }
        // Wake word filter
        const word = wakeWordRef.current.trim().toLowerCase()
        if (wakeEnabledRef.current && word && !captured.toLowerCase().includes(word)) {
          lg(`Apelido não mencionado — ignorando`)
          if (onRef.current && !busyRef.current) setTimeout(startCycle, 200)
          return
        }
        sendText(captured).then(() => {
          if (onRef.current) setTimeout(startCycle, 400)
        })
      } else {
        if (onRef.current && !busyRef.current) setTimeout(startCycle, 200)
      }
    }

    try { rec.start() }
    catch (e) { lg(`Falha ao iniciar: ${e}`); setTimeout(startCycle, 1000) }
  }

  const toggle = () => {
    if (on) {
      onRef.current = false; setOn(false); setStatus('idle'); setTranscript('')
      try { recRef.current?.stop() } catch { /* ignore */ }
      window.speechSynthesis?.cancel()
      lg('Desativado')
    } else {
      onRef.current = true; setOn(true); busyRef.current = false
      lg('Ativando...')
      startCycle()
    }
  }

  // Restart when lang changes while active
  useEffect(() => {
    if (on && !busyRef.current) { try { recRef.current?.stop() } catch { /* ignore */ } }
  }, [lang, on])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) setNoSupport(true)
  }, [])

  useEffect(() => { if (histRef.current) histRef.current.scrollTop = 0 }, [history])

  const P = '#9b30ff', TXT = '#e8e6f8', DIM = 'rgba(232,230,248,.35)', G = '#39ff14'
  const CARD = { background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'.9rem 1rem', marginBottom:'1rem' }
  const SEP  = { borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:'.75rem', marginTop:'.75rem' }

  if (noSupport) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', color: DIM, textAlign:'center' }}>
      <style>{CSS}</style>
      <div style={{ fontSize:'.9rem', color:'rgba(239,68,68,.8)' }}>Não suportado — use Chrome ou Edge</div>
    </div>
  )

  return (
    <div style={{ maxWidth:620, margin:'0 auto', padding:'1.5rem 1.25rem 3rem', fontFamily:"-apple-system,'Inter',system-ui,sans-serif", color: TXT }}>
      <style>{CSS}</style>

      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:900 }}>IA por Voz</h1>
        <p style={{ margin:'.2rem 0 0', fontSize:'.76rem', color: DIM }}>Fale e a IA responde automaticamente no chat do Twitch</p>
      </div>

      {/* Main toggle card */}
      <div style={{ background: on ? 'rgba(57,255,20,.05)' : '#0d0f18', border:`1.5px solid ${on ? 'rgba(57,255,20,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius:16, padding:'1.5rem', marginBottom:'1.25rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'1.25rem', transition:'all .25s' }}>
        <div style={{ height:28, display:'flex', alignItems:'center', gap:4, opacity: status === 'listening' ? 1 : 0, transition:'opacity .3s' }}>
          {[...Array(11)].map((_,i) => <div key={i} className="voz-bar" style={{ animationDelay:`${i*.07}s`, animationPlayState: status==='listening'?'running':'paused' }} />)}
        </div>

        <button onClick={toggle} disabled={status === 'processing'} style={{ width:100, height:100, borderRadius:'50%', background: on ? 'rgba(57,255,20,.1)' : 'rgba(155,48,255,.1)', border:`2px solid ${on ? G : P}`, cursor: status==='processing'?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', animation: on && status==='listening' ? 'voz-pulse 2s ease-in-out infinite' : 'none', transition:'all .2s', outline:'none' }}>
          {status === 'processing'
            ? <svg style={{animation:'voz-spin .75s linear infinite'}} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            : status === 'sent'
              ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={on ? G : P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
        </button>

        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'.95rem', fontWeight:700, color: on ? G : status==='sent'?'#22c55e':status==='error'?'#ef4444':DIM }}>
            {!on && 'Desativado'}
            {on && status==='idle' && 'Aguardando...'}
            {on && status==='listening' && 'Ouvindo...'}
            {status==='processing' && 'Processando...'}
            {status==='sent' && 'Enviado no chat!'}
            {status==='error' && 'Erro'}
          </div>
          <div style={{ fontSize:'.72rem', color: DIM, marginTop:'.3rem' }}>{on ? 'Clique para desativar' : 'Clique para ativar'}</div>
        </div>
      </div>

      {transcript && <div style={{ background:'rgba(57,255,20,.04)', border:'1px solid rgba(57,255,20,.15)', borderRadius:10, padding:'.65rem 1rem', marginBottom:'1rem', fontSize:'.88rem', color:'rgba(232,230,248,.75)', fontStyle:'italic' }}>&ldquo;{transcript}&rdquo;</div>}
      {apiErr && <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'.6rem 1rem', marginBottom:'1rem', fontSize:'.8rem', color:'#ef4444' }}>⚠ {apiErr}</div>}

      {/* ── Configurações ── */}
      <div style={{ fontSize:'.65rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem' }}>Configurações</div>

      {/* Idioma */}
      <div style={CARD}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <label style={{ fontSize:'.78rem', color: DIM, fontWeight:600 }}>Idioma do reconhecimento:</label>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, color: TXT, fontSize:'.78rem', padding:'.3rem .6rem', outline:'none', cursor:'pointer' }}>
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
      </div>

      {/* Filtros de ativação */}
      <div style={CARD}>
        <div style={{ fontSize:'.65rem', fontWeight:800, color: P, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>Filtros de ativação</div>

        {/* Wake word */}
        <Row label="Responder só quando chamar pelo apelido" desc="Ignora falas que não mencionem o apelido definido" on={wakeEnabled} onChange={() => setWakeEnabled(v => !v)} />
        {wakeEnabled && (
          <input type="text" value={wakeWord} onChange={e => setWakeWord(e.target.value)} placeholder="Ex: Sheik, Bot, IA..." style={{ marginTop:'.55rem', width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,.35)', border:`1px solid ${wakeWord.trim() ? 'rgba(155,48,255,.4)' : 'rgba(255,255,255,.1)'}`, borderRadius:8, color: TXT, fontSize:'.82rem', padding:'.45rem .7rem', outline:'none' }} />
        )}

        {/* Min words */}
        <div style={SEP}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem' }}>
            <div>
              <div style={{ fontSize:'.78rem', fontWeight:700, color: TXT }}>Mínimo de palavras para responder</div>
              <div style={{ fontSize:'.7rem', color: DIM }}>Ignora frases muito curtas ou ruídos</div>
            </div>
            <span style={{ fontSize:'.85rem', fontWeight:800, color: P, minWidth:28, textAlign:'right' }}>{minWords}</span>
          </div>
          <input type="range" min={1} max={10} value={minWords} onChange={e => setMinWords(+e.target.value)} style={{ width:'100%', accentColor: P, background:`linear-gradient(to right, ${P} ${(minWords-1)/9*100}%, rgba(255,255,255,.1) ${(minWords-1)/9*100}%)` }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.65rem', color: DIM, marginTop:'.2rem' }}><span>1 palavra</span><span>10 palavras</span></div>
        </div>

        {/* Ignored words */}
        <div style={SEP}>
          <div style={{ fontSize:'.78rem', fontWeight:700, color: TXT, marginBottom:'.25rem' }}>Palavras/frases a ignorar</div>
          <div style={{ fontSize:'.7rem', color: DIM, marginBottom:'.4rem' }}>Separadas por vírgula — se a fala contiver qualquer uma, não responde</div>
          <input type="text" value={ignoreWords} onChange={e => setIgnoreWords(e.target.value)} placeholder="Ex: teste, ok, sim, não..." style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,.35)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, color: TXT, fontSize:'.82rem', padding:'.45rem .7rem', outline:'none' }} />
        </div>
      </div>

      {/* Cooldown e saída */}
      <div style={CARD}>
        <div style={{ fontSize:'.65rem', fontWeight:800, color: P, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>Cooldown e saída</div>

        {/* Cooldown */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem' }}>
            <div>
              <div style={{ fontSize:'.78rem', fontWeight:700, color: TXT }}>Cooldown entre respostas</div>
              <div style={{ fontSize:'.7rem', color: DIM }}>Tempo mínimo antes de responder novamente</div>
            </div>
            <span style={{ fontSize:'.85rem', fontWeight:800, color: P, minWidth:44, textAlign:'right' }}>{cooldown}s</span>
          </div>
          <input type="range" min={0} max={60} value={cooldown} onChange={e => setCooldown(+e.target.value)} style={{ width:'100%', accentColor: P, background:`linear-gradient(to right, ${P} ${cooldown/60*100}%, rgba(255,255,255,.1) ${cooldown/60*100}%)` }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.65rem', color: DIM, marginTop:'.2rem' }}><span>Sem cooldown</span><span>60s</span></div>
        </div>

        {/* Send to chat */}
        <div style={SEP}>
          <Row label="Enviar resposta no chat do Twitch" desc="Desative para ver a resposta apenas aqui sem postar no chat" on={sendChat} onChange={() => setSendChat(v => !v)} />
        </div>

        {/* TTS */}
        <div style={SEP}>
          <Row label="Ler resposta em voz alta (TTS)" desc="O navegador fala a resposta da IA em voz alta" on={ttsEnabled} onChange={() => setTtsEnabled(v => !v)} />
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ background:'#0a0b12', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'.7rem .9rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.65rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.4rem' }}>Log</div>
          {log.map((l,i) => <div key={i} style={{ fontSize:'.72rem', color:'rgba(232,230,248,.45)', fontFamily:'monospace', lineHeight:1.65 }}>{l}</div>)}
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
