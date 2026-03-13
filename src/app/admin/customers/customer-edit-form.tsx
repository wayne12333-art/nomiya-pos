'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { brandCopy } from '@/lib/brand-copy'
import { toast } from '@/lib/toast'

type CustomerEditFormProps = {
  id: string
  initialName: string
  initialNote: string | null
}

const tagOptions = ['常客', '新客', '朋友', '注意']

function extractTagAndMemo(note: string | null) {
  const raw = note || ''
  const lines = raw.split('\n')
  const tagLine = lines.find((line) => line.startsWith('[標籤] '))
  const tag = tagLine ? tagLine.replace('[標籤] ', '').trim() : ''
  const memo = lines
    .filter((line) => !line.startsWith('[標籤] '))
    .join('\n')
    .trim()

  return { tag, memo }
}

export default function CustomerEditForm({
  id,
  initialName,
  initialNote,
}: CustomerEditFormProps) {
  const router = useRouter()
  const parsed = useMemo(() => extractTagAndMemo(initialNote), [initialNote])

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [tag, setTag] = useState(parsed.tag || '常客')
  const [memo, setMemo] = useState(parsed.memo)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)

    const finalNote = [`[標籤] ${tag}`, memo.trim()].filter(Boolean).join('\n')

    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        note: finalNote,
      }),
    })

    const data = await res.json().catch(() => null)

    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '更新客人失敗', tone: 'error' })
      return
    }

    toast({ title: '客人資料已更新', tone: 'success' })
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="nomiya-button-secondary w-full rounded-full px-4 py-3 text-sm"
      >
        {open ? '收起編輯' : '編輯台帳'}
      </button>

      {open ? (
        <div className="nomiya-panel-soft mt-3 rounded-[1.5rem] p-4">
          <div className="text-[0.7rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
            Customer Note
          </div>
          <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">常客台帳編輯</div>
          <div className="mt-1 text-[0.62rem] tracking-[0.22em] text-[var(--accent)]/72">
            お客さまメモ
          </div>
          <div className="mt-2 text-xs leading-6 text-[var(--muted)]">
            {brandCopy.customers.note}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="客人名稱"
            className="nomiya-input mt-3 w-full rounded-xl p-3 text-sm"
          />

          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="nomiya-input mt-3 w-full rounded-xl p-3 text-sm"
          >
            {tagOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例如：都坐吧台、highball 比較順、朋友帶來的、今天看起來心情不太好"
            className="nomiya-input mt-3 min-h-28 w-full rounded-xl p-3 text-sm"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="nomiya-button-primary mt-3 w-full rounded-xl p-3 text-sm font-semibold"
          >
            {loading ? '儲存中...' : '儲存台帳'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
