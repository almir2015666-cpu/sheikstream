'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function TimerOverlay() {
  const params = useParams()
  const userId = params?.userId as string

  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const lastMessage = useRef<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!userId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/timers/overlay-state/${userId}`)
        const data = (await res.json()) as { message: string | null }
        if (data.message && data.message !== lastMessage.current) {
          lastMessage.current = data.message
          setMessage(data.message)
          setVisible(true)
          if (hideTimer.current) clearTimeout(hideTimer.current)
          hideTimer.current = setTimeout(() => {
            setVisible(false)
            lastMessage.current = null
          }, 10_000)
        }
      } catch { /* silent */ }
    }
    poll()
    const interval = setInterval(poll, 3_000)
    return () => { clearInterval(interval); if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [userId])

  return (
    <>
      {/* Garante fundo transparente mesmo com globals.css do Next.js — funciona no OBS sem config extra */}
      <style>{`
        html, body, #__next, [data-nextjs-scroll-focus-boundary] {
          background: transparent !important;
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '60px',
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(99,102,241,0.6)',
            borderRadius: '12px',
            padding: '14px 24px',
            maxWidth: '640px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: '#f1f5f9', fontSize: '18px', fontWeight: 500, lineHeight: 1.4 }}>
            {message}
          </p>
        </div>
      </div>
    </>
  )
}
