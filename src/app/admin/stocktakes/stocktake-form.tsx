'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

type ProductOption = {
  id: string
  name: string
  inventoryMode: string
  theoreticalRemainingMl: number
  theoreticalQty: number
}

type StocktakeFormProps = {
  products: ProductOption[]
  initialProductId?: string
}

const varianceCategories = [
  { value: '招待 Shot', hint: '送客人 shot 或招待酒飲' },
  { value: '老闆自飲', hint: '老闆自己喝或內部使用' },
  { value: '試飲', hint: '試新酒、試配方、試味道' },
  { value: '損耗', hint: '蒸發、溢出、倒灑等自然耗損' },
  { value: '報廢', hint: '過期、變質、無法使用' },
  { value: '其他', hint: '其他原因，自行補充備註' },
] as const

export default function StocktakeForm({
  products,
  initialProductId = '',
}: StocktakeFormProps) {
  const router = useRouter()

  const [productId, setProductId] = useState(initialProductId)
  const [countedOpenedRemainingMl, setCountedOpenedRemainingMl] = useState('')
  const [countedQty, setCountedQty] = useState('')
  const [varianceCategory, setVarianceCategory] = useState('')
  const [varianceReason, setVarianceReason] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/stocktakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        countedOpenedRemainingMl,
        countedQty,
        varianceCategory,
        varianceReason,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      toast({ title: '建立盤點失敗', tone: 'error' })
      return
    }

    toast({ title: '建立盤點成功', tone: 'success' })
    setProductId('')
    setCountedOpenedRemainingMl('')
    setCountedQty('')
    setVarianceCategory('')
    setVarianceReason('')
    router.refresh()
  }

  const selectedCategory = varianceCategories.find((item) => item.value === varianceCategory)

  return (
    <section className="nomiya-panel-soft rounded-[1.8rem] p-6">
      <h2 className="nomiya-display text-3xl font-semibold text-[var(--foreground)]">新增盤點</h2>
      <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
        有送酒、有自飲、有倒灑，就順手補一筆。之後回頭看，才知道那晚到底發生了什麼。
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="nomiya-input rounded-xl p-3"
          required
        >
          <option value="">選一個今天有動到的商品</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.inventoryMode})
            </option>
          ))}
        </select>

        <div className="md:col-span-2">
          <div className="text-sm text-[var(--muted)]">差異類型</div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {varianceCategories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setVarianceCategory(item.value)}
                className={`rounded-[1rem] px-3 py-3 text-left text-sm ${
                  varianceCategory === item.value
                    ? 'nomiya-button-primary font-semibold'
                    : 'nomiya-button-secondary'
                }`}
              >
                <div>{item.value}</div>
                <div className="mt-1 text-xs opacity-80">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <input
          value={varianceReason}
          onChange={(e) => setVarianceReason(e.target.value)}
          placeholder={
            selectedCategory
              ? `${selectedCategory.value}備註，例如 客人生日招待 / 老闆試新酒`
              : '補一句原因，例如 客人生日招待 / 老闆自己喝 / 倒灑'
          }
          className="nomiya-input rounded-xl p-3 md:col-span-2"
        />

        {selectedProduct?.inventoryMode === 'ml' ? (
          <input
            value={countedOpenedRemainingMl}
            onChange={(e) => setCountedOpenedRemainingMl(e.target.value)}
            placeholder={`實際剩餘 ml（理論 ${selectedProduct.theoreticalRemainingMl}）`}
            className="nomiya-input rounded-xl p-3 md:col-span-2"
            required
          />
        ) : selectedProduct?.inventoryMode === 'quantity' ? (
          <input
            value={countedQty}
            onChange={(e) => setCountedQty(e.target.value)}
            placeholder={`實際數量（理論 ${selectedProduct.theoreticalQty}）`}
            className="nomiya-input rounded-xl p-3 md:col-span-2"
            required
          />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="nomiya-button-primary rounded-xl p-3 font-semibold md:col-span-2"
        >
          {loading ? '建立中...' : '建立盤點'}
        </button>
      </form>
    </section>
  )
}
