'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/lib/toast'

type SimpleDeleteButtonProps = {
  url: string
  label: string
  method?: 'DELETE' | 'POST'
}

export default function SimpleDeleteButton({
  url,
  label,
  method = 'DELETE',
}: SimpleDeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    setLoading(true)

    const res = await fetch(url, {
      method,
    })

    const data = await res.json().catch(() => null)

    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || `${label} 失敗`, tone: 'error' })
      return
    }

    toast({ title: data?.message || `${label} 成功`, tone: 'success' })
    router.refresh()
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setConfirming((prev) => !prev)}
        disabled={loading}
        className="w-full rounded-full border border-[rgba(187,118,109,0.22)] bg-[rgba(244,226,221,0.72)] px-4 py-3 text-sm text-[var(--danger)]"
      >
        {loading ? '處理中...' : confirming ? '收起確認' : '刪除'}
      </button>

      {confirming ? (
        <div className="nomiya-panel-soft mt-3 rounded-[1.3rem] p-4">
          <div className="text-[0.7rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
            Delete Check
          </div>
          <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">真的要處理這筆嗎？</div>
          <div className="mt-2 text-xs leading-6 text-[var(--muted)]">
            刪掉之後就會直接送出，像這種事還是再看一眼比較好。
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="nomiya-button-primary flex-1 rounded-xl px-3 py-3 text-sm font-semibold"
            >
              {loading ? '處理中...' : '確認處理'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="nomiya-button-secondary flex-1 rounded-xl px-3 py-3 text-sm"
            >
              先不要
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
