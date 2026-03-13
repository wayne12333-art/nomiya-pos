'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/lib/toast'

type VoidOrderButtonProps = {
  orderId: string
}

const reasonOptions = ['遺棄', '測試', '按錯', '其他']

export default function VoidOrderButton({ orderId }: VoidOrderButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('遺棄')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const finalReason =
      reason === '其他'
        ? note.trim()
        : note.trim()
        ? `${reason}：${note.trim()}`
        : reason

    if (!finalReason) {
      toast({ title: '請填寫作廢原因', tone: 'error' })
      return
    }

    setLoading(true)

    const res = await fetch(`/api/orders/${orderId}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: finalReason,
      }),
    })

    const data = await res.json().catch(() => null)

    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '作廢失敗', tone: 'error' })
      return
    }

    toast({ title: data?.message || '訂單已作廢', tone: 'success' })
    setOpen(false)
    setReason('遺棄')
    setNote('')
    router.refresh()
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-full border border-[rgba(187,118,109,0.22)] bg-[rgba(244,226,221,0.72)] px-4 py-3 text-sm text-[var(--danger)]"
      >
        {open ? '收起作廢表單' : '作廢訂單'}
      </button>

      {open ? (
        <div className="nomiya-panel-soft mt-3 rounded-[1.5rem] p-4">
          <div className="text-[0.7rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
            Void Reason
          </div>
          <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">作廢原因</div>
          <div className="mt-1 text-[0.62rem] tracking-[0.22em] text-[var(--accent)]/72">
            取り消し理由
          </div>
          <div className="mt-2 text-xs leading-6 text-[var(--muted)]">
            這張單如果真的不算，就在這裡把原因留一下，之後回頭看比較不會忘記。
          </div>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="nomiya-input mt-3 w-full rounded-xl p-3 text-sm"
          >
            {reasonOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={reason === '其他' ? '請輸入原因' : '可補一句當時發生了什麼'}
            className="nomiya-input mt-3 min-h-24 w-full rounded-xl p-3 text-sm"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="nomiya-button-primary mt-3 w-full rounded-xl p-3 text-sm font-semibold"
          >
            {loading ? '處理中...' : '確認作廢'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
