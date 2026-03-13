'use client'

import { useEffect, useState } from 'react'
import { TOAST_EVENT, type ToastPayload } from '@/lib/toast'

type ToastItem = ToastPayload & {
  id: number
}

export default function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([])
  const [lastSignature, setLastSignature] = useState('')

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>
      const payload = customEvent.detail
      const signature = `${payload.tone || 'info'}::${payload.title}::${payload.description || ''}`

      if (signature === lastSignature) return
      setLastSignature(signature)

      setItems((current) => [
        ...current,
        {
          id: Date.now() + Math.random(),
          title: payload.title,
          description: payload.description,
          tone: payload.tone || 'info',
        },
      ])
    }

    window.addEventListener(TOAST_EVENT, handleToast)
    return () => window.removeEventListener(TOAST_EVENT, handleToast)
  }, [lastSignature])

  useEffect(() => {
    if (!lastSignature) return

    const timer = window.setTimeout(() => {
      setLastSignature('')
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [lastSignature])

  useEffect(() => {
    if (items.length === 0) return

    const timer = window.setTimeout(() => {
      setItems((current) => current.slice(1))
    }, 2800)

    return () => window.clearTimeout(timer)
  }, [items])

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {items.map((item) => {
        const toneClass =
          item.tone === 'success'
            ? 'border-[rgba(110,134,113,0.25)] bg-[rgba(235,244,234,0.96)]'
            : item.tone === 'error'
              ? 'border-[rgba(187,118,109,0.25)] bg-[rgba(249,236,233,0.96)]'
              : 'border-[rgba(189,125,70,0.25)] bg-[rgba(249,242,233,0.96)]'

        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-[1.4rem] border p-4 shadow-[0_18px_34px_rgba(91,64,36,0.14)] backdrop-blur ${toneClass}`}
          >
            <div className="text-sm font-semibold text-[var(--foreground)]">{item.title}</div>
            {item.description ? (
              <div className="mt-1 text-sm text-[var(--muted)]">{item.description}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
