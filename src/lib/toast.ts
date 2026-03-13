'use client'

export type ToastPayload = {
  title: string
  description?: string
  tone?: 'success' | 'error' | 'info'
}

const TOAST_EVENT = 'nomiya-toast'

export function toast(payload: ToastPayload) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }))
}

export { TOAST_EVENT }
