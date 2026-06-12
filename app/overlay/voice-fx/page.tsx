'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type EffectId = 'normal' | 'robot' | 'chipmunk' | 'deep' | 'echo' | 'reverb' | 'demon' | 'alien'
type EffectChain = { input: AudioNode; output: AudioNode; cleanup: () => void }

const EFFECTS: { id: EffectId; label: string; icon: string; color: string }[] = [
  { id: 'normal',   label: 'Normal',     icon: '🎙️', color: '#9b30ff' },
  { id: 'robot',    label: 'Robô',       icon: '🤖', color: '#10b981' },
  { id: 'chipmunk', label: 'Esquilo',    icon: '🐿️', color: '#f59e0b' },
  { id: 'deep',     label: 'Grave',      icon: '🦾', color: '#3b82f6' },
  { id: 'echo',     label: 'Eco',        icon: '🌊', color: '#6366f1' },
  { id: 'reverb',   label: 'Caverna',    icon: '🏔️', color: '#8b5cf6' },
  { id: 'demon',    label: 'Demônio',    icon: '😈', color: '#ef4444' },
  { id: 'alien',    label: 'Alienígena', icon: '👽', color: '#34d399' },
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
    case 'normal': { const g = reg(ctx.createGain()); return { input: g, output: g, cleanup } }
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
      const pre = reg(ctx.createGain()); const conv = reg(ctx.createConvolver())
      const wet = reg(ctx.createGain()); wet.gain.value = 0.65; const out = reg(ctx.createGain())
      const len = ctx.sampleRate * 2.5; const ir = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5) }
      conv.buffer = ir; pre.connect(out); pre.connect(conv); conv.connect(wet); wet.connect(out)
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
      o1.connect(r1.gain); o2.connect(r2.gain); inp.connect(r1); inp.connect(r2); r1.connect(mix); r2.connect(mix)
      return { input: inp, output: mix, cleanup }
    }
  }
}

export default function VoiceFxOverlay() {
  const [active, setActive]     = useState(false)
  const [effectId, setEffectId] = useState<EffectId>('normal')
  const [vol, setVol]           = useState(0.85)
  const [error, setError]       = useState('')

  const ctxRef      = useRef<AudioContext | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const chainRef    = useRef<EffectChain | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const inGainRef   = useRef<GainNode | null>(null)
  const outGainRef  = useRef<GainNode | null>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const animRef     = useRef(0)
  const effIdRef    = useRef<EffectId>('normal')

  useEffect(() => { effIdRef.current = effectId }, [effectId])
  useEffect(() => { if (outGainRef.current && ctxRef.current) outGainRef.current.gain.setTargetAtTime(vol, ctxRef.current.currentTime, 0.01) }, [vol])
  useEffect(() => () => { stopAudio() }, [])

  const drawViz = useCallback(() => {
    const canvas = canvasRef.current; const analyser = analyserRef.current
    if (!canvas || !analyser) { animRef.current = 0; return }
    const c = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    c.clearRect(0, 0, W, H)
    const bars = 48, bw = Math.floor(W / bars) - 1, step = Math.floor(data.length / bars)
    const eff = EFFECTS.find(e => e.id === effIdRef.current)!
    for (let i = 0; i < bars; i++) {
      let sum = 0; for (let j = 0; j < step; j++) sum += data[i * step + j]
      const avg = sum / step / 255; const h = Math.max(2, avg * H * 0.92)
      const alpha = Math.floor((0.35 + avg * 0.65) * 255).toString(16).padStart(2, '0')
      c.fillStyle = eff.color + alpha
      c.beginPath(); try { c.roundRect(i * (bw + 1), H - h, bw, h, 2) } catch { c.rect(i * (bw + 1), H - h, bw, h) }
      c.fill()
    }
    animRef.current = requestAnimationFrame(drawViz)
  }, [])

  const switchEffect = useCallback((id: EffectId) => {
    setEffectId(id); effIdRef.current = id
    const ctx = ctxRef.current; const inG = inGainRef.current; const an = analyserRef.current
    if (!ctx || !inG || !an) return
    if (chainRef.current) { try { inG.disconnect(chainRef.current.input) } catch {}; try { chainRef.current.output.disconnect(an) } catch {}; chainRef.current.cleanup() }
    const chain = buildChain(ctx, id); inG.connect(chain.input); chain.output.connect(an); chainRef.current = chain
  }, [])

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    chainRef.current?.cleanup(); chainRef.current = null
    try { ctxRef.current?.close() } catch {}; ctxRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    inGainRef.current = null; outGainRef.current = null; analyserRef.current = null
    setActive(false)
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startAudio = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false })
      streamRef.current = stream
      const ctx = new AudioContext({ latencyHint: 'interactive' }); ctxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const inGain = ctx.createGain(); inGain.gain.value = 1.0
      const outGain = ctx.createGain(); outGain.gain.value = vol
      const analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.8
      const chain = buildChain(ctx, effIdRef.current)
      source.connect(inGain); inGain.connect(chain.input); chain.output.connect(analyser)
      analyser.connect(outGain); outGain.connect(ctx.destination)
      inGainRef.current = inGain; outGainRef.current = outGain; analyserRef.current = analyser; chainRef.current = chain
      setActive(true); drawViz()
    } catch (e: any) {
      setError(e.name === 'NotAllowedError' ? 'Permissão de microfone negada' : `Erro: ${e.message}`)
    }
  }, [vol, drawViz])

  const activeEff = EFFECTS.find(e => e.id === effectId)!

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#08090d', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", padding: '1rem', boxSizing: 'border-box', color: '#e8e6f8' }}>
      <style>{`
        *{box-sizing:border-box}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#9b30ff;cursor:pointer}
        @keyframes vfx-pulse{0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.4)}70%{box-shadow:0 0 0 16px rgba(57,255,20,0)}}
        @media(max-width:500px){.vfx-grid{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      {/* Power row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', background: active ? 'rgba(57,255,20,.04)' : 'rgba(255,255,255,.02)', border: `1.5px solid ${active ? 'rgba(57,255,20,.22)' : 'rgba(255,255,255,.07)'}`, borderRadius: 14, padding: '.9rem 1.1rem', transition: 'all .25s' }}>
        <button onClick={active ? stopAudio : startAudio} style={{ width: 48, height: 48, borderRadius: '50%', background: active ? 'rgba(57,255,20,.1)' : 'rgba(155,48,255,.1)', border: `2px solid ${active ? '#39ff14' : '#9b30ff'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, outline: 'none', animation: active ? 'vfx-pulse 2.5s ease-in-out infinite' : 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#39ff14' : '#9b30ff'} strokeWidth="2.2" strokeLinecap="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.9rem', fontWeight: 800, color: active ? '#39ff14' : 'rgba(232,230,248,.35)' }}>
            {active ? `${activeEff.icon} ${activeEff.label} — ativo` : 'Clique para ativar'}
          </div>
          {error && <div style={{ fontSize: '.72rem', color: '#ef4444', marginTop: '.2rem' }}>⚠ {error}</div>}
        </div>
        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(232,230,248,.4)" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <input type="range" min={0} max={1} step={0.01} value={vol} onChange={e => setVol(+e.target.value)} style={{ width: 72, accentColor: '#9b30ff', background: `linear-gradient(to right,#9b30ff ${vol * 100}%,rgba(255,255,255,.1) ${vol * 100}%)` }} />
        </div>
      </div>

      {/* Visualizer */}
      <canvas ref={canvasRef} width={760} height={56} style={{ width: '100%', height: 56, borderRadius: 8, background: 'rgba(0,0,0,.3)', display: 'block', marginBottom: '1rem' }} />

      {/* Effects grid */}
      <div className="vfx-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem' }}>
        {EFFECTS.map(eff => {
          const isOn = effectId === eff.id
          return (
            <button key={eff.id} onClick={() => switchEffect(eff.id)} style={{ padding: '.7rem .5rem', borderRadius: 11, border: `1.5px solid ${isOn ? eff.color + '55' : 'rgba(255,255,255,.06)'}`, background: isOn ? eff.color + '14' : 'rgba(255,255,255,.02)', cursor: 'pointer', textAlign: 'center', transition: 'all .15s', outline: 'none', boxShadow: isOn ? `0 0 14px ${eff.color}20` : 'none' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '.2rem', lineHeight: 1 }}>{eff.icon}</div>
              <div style={{ fontSize: '.75rem', fontWeight: 800, color: isOn ? eff.color : '#e8e6f8' }}>{eff.label}</div>
              {isOn && <div style={{ width: 5, height: 5, borderRadius: '50%', background: eff.color, margin: '.3rem auto 0', boxShadow: `0 0 6px ${eff.color}` }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
