'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

type ToastType = 'error' | 'success' | 'info'
type Toast = { id: number; message: string; type: ToastType }

const ToastCtx = createContext<{ show: (msg: string, type?: ToastType) => void }>({
  show: () => {},
})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let nextId = 0

  const show = useCallback((message: string, type: ToastType = 'error') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail
      show(message, type)
    }
    window.addEventListener('sk-toast', handler)
    return () => window.removeEventListener('sk-toast', handler)
  }, [show])

  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    error:   { bg: '#1e0a0a', border: '#7f1d1d', icon: '✕' },
    success: { bg: '#0a1e0a', border: '#14532d', icon: '✓' },
    info:    { bg: '#0a0e1e', border: '#1e3a5f', icon: 'ℹ' },
  }

  const iconColor: Record<ToastType, string> = {
    error: '#ef4444',
    success: '#22c55e',
    info: '#60a5fa',
  }

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const c = colors[t.type]
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: '12px 16px',
                minWidth: 260,
                maxWidth: 380,
                animation: 'slideIn 0.2s ease',
                pointerEvents: 'auto',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: iconColor[t.type],
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </span>
              <span style={{ fontSize: 13, color: '#f1f5f9', lineHeight: 1.4 }}>{t.message}</span>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastCtx.Provider>
  )
}
