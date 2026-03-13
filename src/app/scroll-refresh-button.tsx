'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ScrollRefreshButton() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 280)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleClick() {
    setRefreshing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => {
      router.refresh()
      setRefreshing(false)
    }, 260)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fixed right-4 bottom-4 z-[90] rounded-full border border-[var(--border-strong)] bg-[rgba(255,251,245,0.94)] px-4 py-3 text-sm text-[var(--foreground)] shadow-[0_12px_28px_rgba(62,43,26,0.12)] backdrop-blur-sm ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      aria-label="回到上方並重新整理"
    >
      <span className="block text-[0.64rem] tracking-[0.22em] text-[var(--muted-soft)]">PAGE TOP</span>
      <span className="mt-1 block font-medium">
        {refreshing ? '更新中...' : '回頂並更新'}
      </span>
    </button>
  )
}
