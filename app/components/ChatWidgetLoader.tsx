'use client'
import { useEffect, useState } from 'react'
import { ChatWidget } from './ChatWidget'

export function ChatWidgetLoader() {
  const [userId,    setUserId]    = useState<string | null>(null)
  const [userName,  setUserName]  = useState<string | null>(null)
  const [userImage, setUserImage] = useState<string | null>(null)
  const [ready,     setReady]     = useState(false)

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.id) {
          setUserId(d.id)
          setUserName(d.name  ?? null)
          setUserImage(d.image ?? null)
        }
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  if (!ready || !userId) return null
  return (
    <ChatWidget
      currentUserId={userId}
      currentUserName={userName}
      currentUserImage={userImage}
    />
  )
}
