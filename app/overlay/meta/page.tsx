'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Meta = { id: string; title: string; type: string; current_value: number; target_value: number }

function MetaOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const metaId = sp.get('meta_id') ?? ''
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    if (!uid) return
    const query = metaId ? `uid=${uid}&meta_id=${metaId}` : `uid=${uid}`
    const load = () => fetch(`/api/overlay/meta?${query}`).then(r => r.json()).then(d => setMeta(d)).catch(() => {})
    load()
    const iv = setInterval(load, 4000)
    return () => clearInterval(iv)
  }, [uid, metaId])

  if (!meta) return null

  const pct = Math.min(100, meta.target_value > 0 ? Math.round((meta.current_value / meta.target_value) * 100) : 0)
  const typeLabel: Record<string, string> = { subs: 'Subs', follows: 'Seguidores', bits: 'Bits', gifted_subs: 'Gift Subs', value: 'R$' }

  return (
    <div style={{
      fontFamily: "-apple-system,'Inter',system-ui,sans-serif",
      padding: '18px 32px',
      background: 'rgba(11,12,23,0.92)',
      borderRadius: '14px',
      border: '1px solid rgba(155,48,255,0.3)',
      backdropFilter: 'blur(12px)',
      minWidth: '480px',
      maxWidth: '800px',
      boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e6f8', letterSpacing: '0.2px' }}>{meta.title}</span>
          {meta.type in typeLabel && <span style={{ fontSize: '0.7rem', color: '#9b30ff', background: 'rgba(155,48,255,0.15)', padding: '2px 8px', borderRadius: '999px' }}>{typeLabel[meta.type]}</span>}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#39ff14', letterSpacing: '-0.5px' }}>
          {meta.current_value.toLocaleString('pt-BR')} <span style={{ fontSize: '0.75rem', color: 'rgba(232,230,248,0.4)', fontWeight: 400 }}>/ {meta.target_value.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.07)', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg,#9b30ff,#39ff14)',
          borderRadius: '5px',
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 0 10px rgba(155,48,255,0.5)',
        }} />
      </div>

      <div style={{ marginTop: '6px', textAlign: 'right', fontSize: '0.72rem', color: 'rgba(232,230,248,0.45)', fontWeight: 600 }}>
        {pct}% concluído
      </div>
    </div>
  )
}

export default function MetaOverlayPage() {
  return (
    <>
      <style>{`
        html,body{margin:0;padding:0;background:transparent!important;}
        @keyframes sk-keep-awake{from{opacity:0.001}to{opacity:0.002}}
      `}</style>
      {/* keep-awake: keeps GPU compositor active in OBS */}
      <div style={{ position: 'fixed', width: 1, height: 1, opacity: 0.001, pointerEvents: 'none', animation: 'sk-keep-awake 1s linear infinite' }} />
      <div style={{ padding: '12px' }}>
        <Suspense fallback={null}>
          <MetaOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
