'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/lib/toast'

type VariantFormProps = {
  productId: string
  productName: string
}

export default function VariantForm({
  productId,
  productName,
}: VariantFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [volumeMl, setVolumeMl] = useState('')
  const [weightG, setWeightG] = useState('')
  const [useRecipeDeduction, setUseRecipeDeduction] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        name,
        price: Number(price),
        volumeMl: volumeMl ? Number(volumeMl) : null,
        weightG: weightG ? Number(weightG) : null,
        useRecipeDeduction,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '建立規格失敗', tone: 'error' })
      return
    }

    toast({ title: `${productName} 規格建立成功`, tone: 'success' })
    setName('')
    setPrice('')
    setVolumeMl('')
    setWeightG('')
    setUseRecipeDeduction(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="規格名稱，例如 30ml / 1份 / 加大"
        className="nomiya-input rounded-[1.1rem] px-4 py-3"
        required
      />

      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="這個規格的售價"
        type="number"
        className="nomiya-input rounded-[1.1rem] px-4 py-3"
        required
      />

      <input
        value={volumeMl}
        onChange={(e) => setVolumeMl(e.target.value)}
        placeholder="容量 ml，沒有就留空"
        type="number"
        className="nomiya-input rounded-[1.1rem] px-4 py-3"
      />

      <input
        value={weightG}
        onChange={(e) => setWeightG(e.target.value)}
        placeholder="重量 g，食物才比較會用到"
        type="number"
        className="nomiya-input rounded-[1.1rem] px-4 py-3"
      />

      <label className="nomiya-input flex items-center gap-3 rounded-[1.1rem] px-4 py-3">
        <input
          type="checkbox"
          checked={useRecipeDeduction}
          onChange={(e) => setUseRecipeDeduction(e.target.checked)}
        />
        <span>配方扣庫</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="nomiya-button-secondary rounded-[1.1rem] px-4 py-3 font-semibold md:col-span-2 xl:col-span-5"
      >
        {loading ? '建立中...' : '建立規格'}
      </button>
    </form>
  )
}
