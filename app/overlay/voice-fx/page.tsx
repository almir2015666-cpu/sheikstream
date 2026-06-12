'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type EffectId = 'normal' | 'robot' | 'chipmunk' | 'deep' | 'echo' | 'reverb' | 'demon' | 'alien'
type EffectChain = { input: AudioNode; output: AudioNode; cleanup: () => void }

function buildChain(ctx: AudioContext, id: EffectId): EffectChain {
  const nodes: AudioNode[] = []
  const oscs: OscillatorNode[] = []
  const reg = <T extends AudioNode>(n: T): T => { nodes.push(n); return n }
  const osc = (freq: number, type: OscillatorType = 'sine') => {
    const o = ctx.createOscillator(); o.frequency.value = freq; o.type = type; o.start(); oscs.push(o); return o
  }
  const cleanup = () => {
    oscs.forEach(o => { try { o.stop() } catch {} })
    ;[...nodes, ...oscs].forEach(n => { try { n.disconnect() } catch {} })
  }
  switch (id) {
    case 'normal': { const g = reg(ctx.createGain()); return { input: g, output: g, cleanup } }
    case 'robot': { const g = reg(ctx.createGain()); g.gain.value = 0; osc(50).connect(g.gain); return { input: g, output: g, cleanup } }
    case 'chipmunk': { const g = reg(ctx.createGain()); g.gain.value = 0; const f = reg(ctx.createBiquadFilter()); f.type = 'highpass'; f.frequency.value = 400; osc(220).connect(g.gain); g.connect(f); return { input: g, output: f, cleanup } }
    case 'deep': { const g = reg(ctx.createGain()); g.gain.value = 0; const lp = reg(ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 2200; const sh = reg(ctx.createBiquadFilter()); sh.type = 'lowshelf'; sh.frequency.value = 250; sh.gain.value = 12; osc(22).connect(g.gain); g.connect(lp); lp.connect(sh); return { input: g, output: sh, cleanup } }
    case 'echo': { const pre = reg(ctx.createGain()); const d = reg(ctx.createDelay(1.5)); d.delayTime.value = 0.3; const fb = reg(ctx.createGain()); fb.gain.value = 0.55; const out = reg(ctx.createGain()); pre.connect(out); pre.connect(d); d.connect(fb); fb.connect(d); d.connect(out); return { input: pre, output: out, cleanup } }
    case 'reverb': { const pre = reg(ctx.createGain()); const conv = reg(ctx.createConvolver()); const wet = reg(ctx.createGain()); wet.gain.value = 0.65; const out = reg(ctx.createGain()); const len = ctx.sampleRate * 2.5; const ir = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5) } conv.buffer = ir; pre.connect(out); pre.connect(conv); conv.connect(wet); wet.connect(out); return { input: pre, output: out, cleanup } }
    case 'demon': { const g = reg(ctx.createGain()); g.gain.value = 0; const dist = reg(ctx.createWaveShaper()); const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = (i * 2) / 256 - 1; curve[i] = (Math.PI + 150) * x / (Math.PI + 150 * Math.abs(x)) } dist.curve = curve; dist.oversample = '4x'; const lp = reg(ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 1400; osc(16, 'sawtooth').connect(g.gain); g.connect(dist); dist.connect(lp); return { input: g, output: lp, cleanup } }
    case 'alien': { const inp = reg(ctx.createGain()); const r1 = reg(ctx.createGain()); r1.gain.value = 0; const r2 = reg(ctx.createGain()); r2.gain.value = 0; const mix = reg(ctx.createGain()); mix.gain.value = 0.5; const o1 = osc(155); const o2 = osc(248); const lfo = osc(4); const lfoG = reg(ctx.createGain()); lfoG.gain.value = 70; lfo.connect(lfoG); lfoG.connect(o1.frequency); lfoG.connect(o2.frequency); o1.connect(r1.gain); o2.connect(r2.gain); inp.connect(r1); inp.connect(r2); r1.connect(mix); r2.connect(mix); return { input: inp, output: mix, cleanup } }
  }
}

// Reads effect from URL: /overlay/voice-fx?effect=robot&vol=0.9
function getParams(): { effect: EffectId; vol: number } {
  if (typeof window === 'undefined') return { effect: 'normal', vol: 0.85 }
  const p = new URLSearchParams(window.location.search)
  const effect = (p.get('effect') ?? 'normal') as EffectId
  const vol = parseFloat(p.get('vol') ?? '0.85')
  return { effect, vol: isNaN(vol) ? 0.85 : Math.min(2, Math.max(0, vol)) }
}

export default function VoiceFxAudioOnly() {
  const [active, setActive]   = useState(false)
  const [effect, setEffect]   = useState<EffectId>('normal')
  const [status, setStatus]   = useState<'idle' | 'running' | 'error'>('idle')
  const [errMsg, setErrMsg]   = useState('')

  const ctxRef    = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chainRef  = useRef<EffectChain | null>(null)

  const stopAudio = useCallback(() => {
    chainRef.current?.cleanup(); chainRef.current = null
    try { ctxRef.current?.close() } catch {}; ctxRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    setActive(false); setStatus('idle')
  }, [])

  const startAudio = useCallback(async (effectId: EffectId, vol: number) => {
    setErrMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false })
      streamRef.current = stream
      const ctx = new AudioContext({ latencyHint: 'interactive' }); ctxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const inGain = ctx.createGain(); inGain.gain.value = 1.0
      const outGain = ctx.createGain(); outGain.gain.value = vol
      const chain = buildChain(ctx, effectId); chainRef.current = chain
      source.connect(inGain); inGain.connect(chain.input); chain.output.connect(outGain); outGain.connect(ctx.destination)
      setActive(true); setStatus('running')
    } catch (e: any) {
      setErrMsg(e.name === 'NotAllowedError' ? 'obs-permission' : e.message)
      setStatus('error')
    }
  }, [])

  // Init from URL params
  useEffect(() => {
    const { effect: e, vol } = getParams()
    setEffect(e)
    // Try auto-start (works in OBS browser source)
    startAudio(e, vol)
    return () => stopAudio()
  }, [])

  const toggle = () => {
    if (active) { stopAudio() }
    else { const { effect: e, vol } = getParams(); startAudio(e, vol) }
  }

  const colors: Record<string, string> = { normal:'#9b30ff', robot:'#10b981', chipmunk:'#f59e0b', deep:'#3b82f6', echo:'#6366f1', reverb:'#8b5cf6', demon:'#ef4444', alien:'#34d399' }
  const c = colors[effect] ?? '#9b30ff'

  return (
    <>
      <style>{`
        html,body{margin:0;padding:0;background:transparent!important;overflow:hidden}
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
      `}</style>

      {/* Invisible full-area click target — click via OBS "Interagir" to toggle */}
      <div onClick={toggle} style={{ position: 'fixed', inset: 0, cursor: 'pointer', background: 'transparent' }} />

      {/* Tiny status indicator — bottom-left corner, 28×28px */}
      <div style={{ position: 'fixed', bottom: 8, left: 8, width: 28, height: 28, borderRadius: '50%', background: status === 'running' ? `${c}22` : status === 'error' ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${status === 'running' ? c : status === 'error' ? '#ef4444' : 'rgba(255,255,255,.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: status === 'running' ? 'pulse 2s ease-in-out infinite' : 'none', pointerEvents: 'none' }}>
        {status === 'running' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />}
        {status === 'idle'    && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />}
        {status === 'error'   && <span style={{ fontSize: 12, color: '#ef4444' }}>!</span>}
      </div>

      {/* Permission error — full instruction screen */}
      {errMsg === 'obs-permission' && (
        <div style={{ position: 'fixed', inset: 0, background: '#0d0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'system-ui,sans-serif', color: '#e8e6f8', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🎙️</div>
          <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#ef4444', marginBottom: '.5rem' }}>Microfone bloqueado no OBS</div>
          <div style={{ fontSize: '.78rem', color: 'rgba(232,230,248,.5)', lineHeight: 1.8, maxWidth: 380, marginBottom: '1.25rem' }}>
            O OBS não concede acesso ao microfone para Browser Sources por padrão.
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '1rem 1.25rem', textAlign: 'left', maxWidth: 420 }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#9b30ff', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.65rem' }}>Solução recomendada</div>
            <div style={{ fontSize: '.8rem', color: 'rgba(232,230,248,.7)', lineHeight: 2 }}>
              <div>1. Abra o <strong style={{color:'#e8e6f8'}}>Chrome</strong> ou <strong style={{color:'#e8e6f8'}}>Edge</strong></div>
              <div>2. Acesse <code style={{color:'#9b30ff',fontSize:'.75rem'}}>sheikstream.com.br/overlay/voice-fx</code></div>
              <div>3. Permita o microfone quando solicitado</div>
              <div>4. No OBS, adicione o áudio do Chrome como fonte de <strong style={{color:'#e8e6f8'}}>Captura de Áudio</strong></div>
            </div>
          </div>
          <div onClick={toggle} style={{ marginTop: '1rem', padding: '.5rem 1.25rem', borderRadius: 8, border: '1px solid rgba(155,48,255,.4)', color: '#9b30ff', fontSize: '.78rem', cursor: 'pointer' }}>
            Tentar novamente
          </div>
        </div>
      )}
      {errMsg && errMsg !== 'obs-permission' && (
        <div style={{ position: 'fixed', bottom: 44, left: 8, background: 'rgba(239,68,68,.9)', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{errMsg}</div>
      )}
    </>
  )
}
