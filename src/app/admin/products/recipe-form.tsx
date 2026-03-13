'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

type ProductOption = {
  id: string
  name: string
  inventoryMode: string
}

type RecipeFormProps = {
  saleProductId: string
  saleProductName: string
  allProducts: ProductOption[]
}

export default function RecipeForm({
  saleProductId,
  saleProductName,
  allProducts,
}: RecipeFormProps) {
  const router = useRouter()
  const [ingredientProductId, setIngredientProductId] = useState('')
  const [amount, setAmount] = useState('')
  const [unitType, setUnitType] = useState('ml')
  const [loading, setLoading] = useState(false)

  const ingredientOptions = useMemo(() => {
    return allProducts.filter((p) => p.id !== saleProductId)
  }, [allProducts, saleProductId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleProductId,
        ingredientProductId,
        amount: Number(amount),
        unitType,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '建立配方失敗', tone: 'error' })
      return
    }

    toast({ title: `${saleProductName} 配方建立成功`, tone: 'success' })
    setIngredientProductId('')
    setAmount('')
    setUnitType('ml')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <select
        value={ingredientProductId}
        onChange={(e) => setIngredientProductId(e.target.value)}
        className="nomiya-input rounded-2xl p-4 outline-none"
        required
      >
        <option value="">選擇原料商品</option>
        {ingredientOptions.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} ({product.inventoryMode})
          </option>
        ))}
      </select>

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="用量"
        type="number"
        step="0.01"
        className="nomiya-input rounded-2xl p-4 outline-none"
        required
      />

      <select
        value={unitType}
        onChange={(e) => setUnitType(e.target.value)}
        className="nomiya-input rounded-2xl p-4 outline-none"
      >
        <option value="ml">ml</option>
        <option value="g">g</option>
        <option value="qty">qty</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        className="nomiya-button-primary rounded-2xl p-4 font-semibold"
      >
        {loading ? '建立中...' : '建立配方'}
      </button>
    </form>
  )
}
