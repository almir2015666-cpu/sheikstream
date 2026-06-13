'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CountdownContent() {
  const sp = useSearchParams()
  const title    = sp.get('title')    || 'AO VIVO EM'
  const subtitle = sp.get('subtitle') || ''
  const endStr   = sp.get('end')      || ''
  const color    = sp.get('color')    || '#9b30ff'
  const showBox  = sp.get('box')      !== 'false'

  const [tl, setTl] = useState<{ h: number; m: number; s: number } | null>(null)
  const [ended, setEnded] = useState(false)
  const endRef = useRef<Date | null>(endStr ? new Date(endStr) : null)

  useEffect(() => {
    const tick = () => {
      if (!endRef.current) return
      const diff = endRef.current.getTime() - Date.now()
      if (diff <= 0) { setEnded(true); setTl({ h: 0, m: 0, s: 0 }); return }
      const total = Math.floor(diff / 1000)
      setTl({ h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  const boxStyle: React.CSSProperties = showBox ? {
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${color}44`,
    borderRadius: '16px',
    padding: '28px 48px',
  } : {}

  return (
    <>
      <style>{`
        html,body,#__next,[data-nextjs-scroll-focus-boundary]{
          background:transparent!important;background-color:transparent!important;
          margin:0!important;padding:0!important;overflow:hidden!important;
        }
        @keyframes liveGlow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(1.04)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{
        position:'fixed',inset:0,background:'transparent',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontFamily:"'Inter',system-ui,sans-serif",pointerEvents:'none',
      }}>
        {!endStr ? (
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>?end= não configurado</div>
        ) : ended ? (
          <div style={{ ...boxStyle, textAlign:'center', animation:'liveGlow 1.2s ease-in-out infinite' }}>
            <div style={{ fontSize:'3.8rem', fontWeight:900, color, textShadow:`0 0 40px ${color}` }}>
              AO VIVO!
            </div>
            {subtitle && (
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:'1.1rem', marginTop:10 }}>
                {subtitle}
              </div>
            )}
          </div>
        ) : tl ? (
          <div style={{ ...boxStyle, textAlign:'center', animation:'fadeUp .5s ease' }}>
            <div style={{
              fontSize:'0.8rem', fontWeight:700, letterSpacing:'0.22em',
              color:'rgba(255,255,255,0.5)', marginBottom:10, textTransform:'uppercase',
            }}>
              {title}
            </div>
            <div style={{
              fontSize:'4.8rem', fontWeight:900, color:'#fff',
              textShadow:`0 0 50px ${color}55`,
              letterSpacing:'0.06em', fontVariantNumeric:'tabular-nums',
              lineHeight:1,
            }}>
              {tl.h > 0 && `${pad(tl.h)}:`}{pad(tl.m)}:{pad(tl.s)}
            </div>
            {subtitle && (
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.95rem', marginTop:12 }}>
                {subtitle}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}

export default function CountdownOverlay() {
  return (
    <Suspense>
      <CountdownContent />
    </Suspense>
  )
}
