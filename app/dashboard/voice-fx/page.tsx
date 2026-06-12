'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'

type EffectId = 'normal' | 'robot' | 'chipmunk' | 'deep' | 'echo' | 'reverb' | 'demon' | 'alien'
type EffectChain = { input: AudioNode; output: AudioNode; cleanup: () => void }

const EFFECTS: { id: EffectId; label: string; desc: string; icon: string; color: string }[] = [
  { id: 'normal',   label: 'Normal',      desc: 'Voz original sem efeito',  icon: '🎙️', color: '#9b30ff' },
  { id: 'robot',    label: 'Robô',        desc: 'Voz mecânica e metálica',  icon: '🤖', color: '#10b981' },
  { id: 'chipmunk', label: 'Esquilo',     desc: 'Tom agudo e modulado',     icon: '🐿️', color: '#f59e0b' },
  { id: 'deep',     label: 'Grave',       desc: 'Tom profundo e pesado',    icon: '🦾', color: '#3b82f6' },
  { id: 'echo',     label: 'Eco',         desc: 'Delay e eco',              icon: '🌊', color: '#6366f1' },
  { id: 'reverb',   label: 'Caverna',     desc: 'Reverberação espaçosa',    icon: '🏔️', color: '#8b5cf6' },
  { id: 'demon',    label: 'Demônio',     desc: 'Grave distorcido',         icon: '😈', color: '#ef4444' },
  { id: 'alien',    label: 'Alienígena',  desc: 'Efeito espacial duplo',    icon: '👽', color: '#34d399' },
]

function buildChain(ctx: AudioContext, id: EffectId): EffectChain {
  const nodes: AudioNode[] = []
  const oscs: OscillatorNode[] = []
  const reg = <T extends AudioNode>(n: T): T => { nodes.push(n); return n }
  const osc = (freq: number, type: OscillatorType = 'sine'): OscillatorNode => {
    const o = ctx.createOscillator(); o.frequency.value = freq; o.type = type; o.start(); oscs.push(o); return o
  }
  const cleanup = () => {
    oscs.forEach(o => { try { o.stop() } catch {} })
    ;[...nodes, ...oscs].forEach(n => { try { n.disconnect() } catch {} })
  }

  switch (id) {
    case 'normal': {
      const g = reg(ctx.createGain()); return { input: g, output: g, cleanup }
    }
    case 'robot': {
      const g = reg(ctx.createGain()); g.gain.value = 0
      osc(50).connect(g.gain)
      return { input: g, output: g, cleanup }
    }
    case 'chipmunk': {
      const g = reg(ctx.createGain()); g.gain.value = 0
      const flt = reg(ctx.createBiquadFilter()); flt.type = 'highpass'; flt.frequency.value = 400
      osc(220).connect(g.gain); g.connect(flt)
      return { input: g, output: flt, cleanup }
    }
    case 'deep': {
      const g = reg(ctx.createGain()); g.gain.value = 0
      const lp = reg(ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 2200
      const shelf = reg(ctx.createBiquadFilter()); shelf.type = 'lowshelf'; shelf.frequency.value = 250; shelf.gain.value = 12
      osc(22).connect(g.gain); g.connect(lp); lp.connect(shelf)
      return { input: g, output: shelf, cleanup }
    }
    case 'echo': {
      const pre = reg(ctx.createGain())
      const delay = reg(ctx.createDelay(1.5)); delay.delayTime.value = 0.3
      const fb = reg(ctx.createGain()); fb.gain.value = 0.55
      const out = reg(ctx.createGain())
      pre.connect(out); pre.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(out)
      return { input: pre, output: out, cleanup }
    }
    case 'reverb': {
      const pre = reg(ctx.createGain())
      const conv = reg(ctx.createConvolver())
      const wet = reg(ctx.createGain()); wet.gain.value = 0.65
      const out = reg(ctx.createGain())
      const len = ctx.sampleRate * 2.5
      const ir = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c)
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5)
      }
      conv.buffer = ir
      pre.connect(out); pre.connect(conv); conv.connect(wet); wet.connect(out)
      return { input: pre, output: out, cleanup }
    }
    case 'demon': {
      const g = reg(ctx.createGain()); g.gain.value = 0
      const dist = reg(ctx.createWaveShaper())
      const curve = new Float32Array(256)
      for (let i = 0; i < 256; i++) { const x = (i * 2) / 256 - 1; curve[i] = (Math.PI + 150) * x / (Math.PI + 150 * Math.abs(x)) }
      dist.curve = curve; dist.oversample = '4x'
      const lp = reg(ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 1400
      osc(16, 'sawtooth').connect(g.gain); g.connect(dist); dist.connect(lp)
      return { input: g, output: lp, cleanup }
    }
    case 'alien': {
      const inp = reg(ctx.createGain())
      const r1 = reg(ctx.createGain()); r1.gain.value = 0
      const r2 = reg(ctx.createGain()); r2.gain.value = 0
      const mix = reg(ctx.createGain()); mix.gain.value = 0.5
      const o1 = osc(155); const o2 = osc(248)
      const lfo = osc(4); const lfoG = reg(ctx.createGain()); lfoG.gain.value = 70
      lfo.connect(lfoG); lfoG.connect(o1.frequency); lfoG.connect(o2.frequency)
      o1.connect(r1.gain); o2.connect(r2.gain)
      inp.connect(r1); inp.connect(r2); r1.connect(mix); r2.connect(mix)
      return { input: inp, output: mix, cleanup }
    }
  }
}

const CSS = `
input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#9b30ff;cursor:pointer;box-shadow:0 0 6px rgba(155,48,255,.5)}
@keyframes vfx-pulse{0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.4)}70%{box-shadow:0 0 0 20px rgba(57,255,20,0)}}
@media(max-width:640px){.vfx-grid{grid-template-columns:repeat(2,1fr)!important}}
`

const P = '#9b30ff', TXT = '#e8e6f8', DIM = 'rgba(232,230,248,.38)', CARD = { background:'#0d0f18', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'1rem 1.1rem' }

export default function VoiceFxPage() {
  const { t } = useLang()
  const [active, setActive]       = useState(false)
  const [effectId, setEffectId]   = useState<EffectId>('normal')
  const [inputVol, setInputVol]   = useState(1.0)
  const [outputVol, setOutputVol] = useState(0.85)
  const [monitor, setMonitor]     = useState(true)
  const [error, setError]         = useState('')
  const [obsOpen, setObsOpen]     = useState(false)

  const ctxRef       = useRef<AudioContext | null>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const chainRef     = useRef<EffectChain | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const inGainRef    = useRef<GainNode | null>(null)
  const outGainRef   = useRef<GainNode | null>(null)
  const monGainRef   = useRef<GainNode | null>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const animRef      = useRef(0)
  const effIdRef     = useRef<EffectId>('normal')

  useEffect(() => { effIdRef.current = effectId }, [effectId])

  useEffect(() => {
    try { const s = localStorage.getItem('sk-voice-fx') as EffectId; if (s) setEffectId(s) } catch {}
    return () => stopAudio()
  }, [])

  useEffect(() => { if (inGainRef.current && ctxRef.current)  inGainRef.current.gain.setTargetAtTime(inputVol,  ctxRef.current.currentTime, 0.01) }, [inputVol])
  useEffect(() => { if (outGainRef.current && ctxRef.current) outGainRef.current.gain.setTargetAtTime(outputVol, ctxRef.current.currentTime, 0.01) }, [outputVol])
  useEffect(() => { if (monGainRef.current && ctxRef.current) monGainRef.current.gain.setTargetAtTime(monitor ? 1 : 0, ctxRef.current.currentTime, 0.01) }, [monitor])

  const drawViz = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) { animRef.current = 0; return }
    const c = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    c.clearRect(0, 0, W, H)
    const bars = 60
    const bw = Math.floor(W / bars) - 1
    const step = Math.floor(data.length / bars)
    const eff = EFFECTS.find(e => e.id === effIdRef.current)!
    for (let i = 0; i < bars; i++) {
      let sum = 0
      for (let j = 0; j < step; j++) sum += data[i * step + j]
      const avg = sum / step / 255
      const h = Math.max(2, avg * H * 0.92)
      const x = i * (bw + 1)
      const alpha = Math.floor((0.35 + avg * 0.65) * 255).toString(16).padStart(2, '0')
      c.fillStyle = eff.color + alpha
      c.beginPath()
      try { c.roundRect(x, H - h, bw, h, 2) } catch { c.rect(x, H - h, bw, h) }
      c.fill()
    }
    animRef.current = requestAnimationFrame(drawViz)
  }, [])

  const switchEffect = useCallback((id: EffectId) => {
    setEffectId(id); effIdRef.current = id
    try { localStorage.setItem('sk-voice-fx', id) } catch {}
    const ctx = ctxRef.current; const inG = inGainRef.current; const an = analyserRef.current
    if (!ctx || !inG || !an) return
    if (chainRef.current) {
      try { inG.disconnect(chainRef.current.input) } catch {}
      try { chainRef.current.output.disconnect(an) } catch {}
      chainRef.current.cleanup()
    }
    const chain = buildChain(ctx, id)
    inG.connect(chain.input); chain.output.connect(an)
    chainRef.current = chain
  }, [])

  const startAudio = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      })
      streamRef.current = stream
      const ctx = new AudioContext({ latencyHint: 'interactive' })
      ctxRef.current = ctx
      const source  = ctx.createMediaStreamSource(stream)
      const inGain  = ctx.createGain(); inGain.gain.value = inputVol
      const outGain = ctx.createGain(); outGain.gain.value = outputVol
      const monGain = ctx.createGain(); monGain.gain.value = monitor ? 1 : 0
      const analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.8
      const chain = buildChain(ctx, effIdRef.current)
      source.connect(inGain)
      inGain.connect(chain.input)
      chain.output.connect(analyser)
      analyser.connect(outGain)
      outGain.connect(monGain)
      monGain.connect(ctx.destination)
      inGainRef.current = inGain; outGainRef.current = outGain; monGainRef.current = monGain
      analyserRef.current = analyser; chainRef.current = chain
      setActive(true)
      drawViz()
    } catch (e: any) {
      if (e.name === 'NotAllowedError') setError('Permissão de microfone negada. Clique no cadeado e permita o microfone.')
      else setError(`Erro ao acessar microfone: ${e.message}`)
    }
  }, [inputVol, outputVol, monitor, drawViz])

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    chainRef.current?.cleanup(); chainRef.current = null
    try { ctxRef.current?.close() } catch {}
    ctxRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    inGainRef.current = null; outGainRef.current = null; monGainRef.current = null; analyserRef.current = null
    setActive(false)
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const activeEff = EFFECTS.find(e => e.id === effectId)!

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem 1.25rem 3rem', fontFamily:"-apple-system,'Inter',system-ui,sans-serif", color: TXT }}>
      <style>{CSS}</style>

      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:900 }}>Voice FX</h1>
        <p style={{ margin:'.2rem 0 0', fontSize:'.76rem', color: DIM }}>{t('voice_fx_subtitle')}</p>
      </div>

      {/* Power card */}
      <div style={{ background: active ? 'rgba(57,255,20,.04)' : '#0d0f18', border:`1.5px solid ${active ? 'rgba(57,255,20,.25)' : 'rgba(255,255,255,.08)'}`, borderRadius:16, padding:'1.25rem 1.5rem', marginBottom:'1.25rem', transition:'all .25s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {/* Power button */}
          <button onClick={active ? stopAudio : startAudio} style={{ width:56, height:56, borderRadius:'50%', background: active ? 'rgba(57,255,20,.12)' : 'rgba(155,48,255,.12)', border:`2px solid ${active ? '#39ff14' : P}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, outline:'none', transition:'all .2s', boxShadow: active ? '0 0 22px rgba(57,255,20,.22)' : 'none', animation: active ? 'vfx-pulse 2.5s ease-in-out infinite' : 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#39ff14' : P} strokeWidth="2.2" strokeLinecap="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </button>
          {/* Status */}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'.95rem', fontWeight:800, color: active ? '#39ff14' : DIM }}>{active ? `${activeEff.icon} ${activeEff.label} — ativo` : t('voice_fx_deactivated')}</div>
            <div style={{ fontSize:'.72rem', color: DIM, marginTop:'.15rem' }}>{active ? t('voice_fx_mic_capture') : t('voice_fx_click_activate')}</div>
          </div>
          {/* Toggles */}
          <div style={{ display:'flex', gap:'.5rem', flexShrink:0 }}>
            <button onClick={() => setMonitor(v => !v)} title={monitor ? 'Monitor ativo (você ouve)' : 'Monitor mudo'} style={{ padding:'.4rem .7rem', borderRadius:8, border:`1px solid ${monitor ? 'rgba(57,255,20,.3)' : 'rgba(255,255,255,.1)'}`, background: monitor ? 'rgba(57,255,20,.08)' : 'transparent', color: monitor ? '#39ff14' : DIM, fontSize:'.72rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'.35rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">{monitor ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></> : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}</svg>
              {t('voice_fx_monitor')}
            </button>
            <button onClick={() => setObsOpen(v => !v)} style={{ padding:'.4rem .7rem', borderRadius:8, border:`1px solid ${obsOpen ? 'rgba(155,48,255,.35)' : 'rgba(255,255,255,.1)'}`, background: obsOpen ? 'rgba(155,48,255,.12)' : 'transparent', color: obsOpen ? P : DIM, fontSize:'.72rem', fontWeight:700, cursor:'pointer' }}>
              OBS
            </button>
          </div>
        </div>

        {/* Visualizer */}
        <canvas ref={canvasRef} width={860} height={72} style={{ width:'100%', height:72, borderRadius:8, background:'rgba(0,0,0,.3)', display:'block', marginTop:'1.1rem' }} />
      </div>

      {error && <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'.6rem 1rem', marginBottom:'1rem', fontSize:'.8rem', color:'#ef4444' }}>⚠ {error}</div>}

      {/* OBS guide */}
      {obsOpen && (
        <div style={{ background:'rgba(155,48,255,.05)', border:'1px solid rgba(155,48,255,.18)', borderRadius:12, padding:'1rem 1.15rem', marginBottom:'1.25rem' }}>
          <div style={{ fontSize:'.82rem', fontWeight:800, color: P, marginBottom:'.7rem' }}>{t('voice_fx_obs_guide_title')}</div>
          <ol style={{ margin:0, padding:'0 0 0 1.1rem', fontSize:'.78rem', color: DIM, lineHeight:2 }}>
            <li>No OBS: Fontes → <strong style={{color:TXT}}>+</strong> → <strong style={{color:TXT}}>Navegador</strong></li>
            <li>Cole a URL: <code style={{ background:'rgba(155,48,255,.15)', padding:'.15rem .45rem', borderRadius:5, color: P, fontSize:'.75rem' }}>sheikstream.com.br/overlay/voice-fx</code></li>
            <li>Dimensões: <strong style={{color:TXT}}>800 × 300</strong> px</li>
            <li>Marque <strong style={{color:TXT}}>"Controlar áudio via OBS"</strong></li>
            <li>Clique direito na fonte → <strong style={{color:TXT}}>Propriedades de áudio</strong> → <strong style={{color:TXT}}>Monitor e Saída</strong></li>
            <li>Ative o efeito, <strong style={{color:TXT}}>desative o Monitor</strong> aqui na página (o OBS capta direto)</li>
          </ol>
          <div style={{ fontSize:'.71rem', color:'rgba(155,48,255,.5)', marginTop:'.65rem', borderTop:'1px solid rgba(155,48,255,.12)', paddingTop:'.55rem' }}>
            Use fones de ouvido para evitar feedback de áudio ao monitorar.
          </div>
        </div>
      )}

      {/* Effects grid */}
      <div style={{ fontSize:'.65rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>{t('voice_fx_effect_label')}</div>
      <div className="vfx-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.65rem', marginBottom:'1.5rem' }}>
        {EFFECTS.map(eff => {
          const isOn = effectId === eff.id
          return (
            <button key={eff.id} onClick={() => switchEffect(eff.id)} style={{ padding:'.9rem .75rem', borderRadius:12, border:`1.5px solid ${isOn ? eff.color + '55' : 'rgba(255,255,255,.06)'}`, background: isOn ? eff.color + '14' : 'rgba(255,255,255,.02)', cursor:'pointer', textAlign:'center', transition:'all .15s', outline:'none', boxShadow: isOn ? `0 0 18px ${eff.color}20` : 'none' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:'.3rem', lineHeight:1 }}>{eff.icon}</div>
              <div style={{ fontSize:'.82rem', fontWeight:800, color: isOn ? eff.color : TXT, marginBottom:'.18rem' }}>{eff.label}</div>
              <div style={{ fontSize:'.68rem', color: DIM, lineHeight:1.3 }}>{eff.desc}</div>
              {isOn && <div style={{ marginTop:'.4rem', width:6, height:6, borderRadius:'50%', background: eff.color, margin:'.4rem auto 0', boxShadow:`0 0 8px ${eff.color}` }} />}
            </button>
          )
        })}
      </div>

      {/* Volume controls */}
      <div style={CARD}>
        <div style={{ fontSize:'.65rem', fontWeight:700, color: DIM, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.85rem' }}>{t('voice_fx_volume_section')}</div>

        <div style={{ marginBottom:'.9rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.35rem' }}>
            <span style={{ fontSize:'.78rem', fontWeight:600, color: TXT }}>{t('voice_fx_volume_mic')}</span>
            <span style={{ fontSize:'.78rem', fontWeight:800, color: P }}>{Math.round(inputVol * 100)}%</span>
          </div>
          <input type="range" min={0} max={2} step={0.01} value={inputVol} onChange={e => setInputVol(+e.target.value)} style={{ width:'100%', accentColor: P, background:`linear-gradient(to right,${P} ${inputVol/2*100}%,rgba(255,255,255,.1) ${inputVol/2*100}%)` }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.63rem', color: DIM, marginTop:'.2rem' }}><span>0%</span><span>100%</span><span>200%</span></div>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.35rem' }}>
            <span style={{ fontSize:'.78rem', fontWeight:600, color: TXT }}>{t('voice_fx_volume_out')}</span>
            <span style={{ fontSize:'.78rem', fontWeight:800, color: P }}>{Math.round(outputVol * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={outputVol} onChange={e => setOutputVol(+e.target.value)} style={{ width:'100%', accentColor: P, background:`linear-gradient(to right,${P} ${outputVol*100}%,rgba(255,255,255,.1) ${outputVol*100}%)` }} />
        </div>
      </div>

      {/* Info box */}
      <div style={{ marginTop:'1rem', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', borderRadius:10, padding:'.7rem 1rem', fontSize:'.72rem', color: DIM, lineHeight:1.7 }}>
        <strong style={{ color:'rgba(232,230,248,.5)' }}>Como funciona:</strong> o áudio do microfone é processado em tempo real pelo navegador com efeitos de modulação de amplitude, filtros e delays. Para transmissão, adicione como Browser Source no OBS e capture o áudio diretamente da fonte.
      </div>
    </div>
  )
}
