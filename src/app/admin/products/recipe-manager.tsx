'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { brandCopy } from '@/lib/brand-copy'
import { toast } from '@/lib/toast'

type IngredientProduct = {
  id: string
  name: string
  category: string
  inventoryMode: string
}

type RecipeItem = {
  id: string
  amount: number | null
  unitType: string | null
  ingredientProduct: IngredientProduct
}

type Props = {
  saleProductId: string
  saleProductName: string
  recipes: RecipeItem[]
  ingredientProducts: IngredientProduct[]
}

export default function RecipeManager({
  saleProductId,
  saleProductName,
  recipes,
  ingredientProducts,
}: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [ingredientProductId, setIngredientProductId] = useState(
    ingredientProducts[0]?.id || ''
  )
  const [amount, setAmount] = useState('')
  const [unitType, setUnitType] = useState('ml')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const selectedIngredient = useMemo(
    () => ingredientProducts.find((item) => item.id === ingredientProductId),
    [ingredientProducts, ingredientProductId]
  )

  async function handleCreate() {
    setLoading(true)

    const res = await fetch(`/api/products/${saleProductId}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredientProductId,
        amount: amount ? Number(amount) : null,
        unitType,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '建立配置失敗', tone: 'error' })
      return
    }

    setAmount('')
    toast({ title: '原料配置已建立', tone: 'success' })
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)

    const res = await fetch(`/api/recipes/${id}`, {
      method: 'DELETE',
    })

    const data = await res.json().catch(() => null)
    setDeletingId(null)

    if (!res.ok) {
      toast({ title: data?.error || '刪除配置失敗', tone: 'error' })
      return
    }

    toast({ title: '原料配置已刪除', tone: 'success' })
    router.refresh()
  }

  return (
    <div className="nomiya-panel-soft mt-5 rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">原料配置</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{saleProductName}</div>
          <div className="mt-2 text-xs leading-6 text-[var(--muted)]">
            {brandCopy.products.recipe}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="nomiya-button-secondary rounded-xl px-3 py-2 text-sm"
        >
          {open ? '收起' : '管理配置'}
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        {recipes.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">
            這個品項還沒綁原料，之後扣庫就只會剩感覺，不會剩紀錄。
          </div>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,248,238,0.48)] px-4 py-3"
            >
              <div className="text-sm text-[var(--foreground)]">
                {recipe.ingredientProduct.category} / {recipe.ingredientProduct.name} /{' '}
                {recipe.amount ?? 0}
                {recipe.unitType || ''}
              </div>

              <button
                type="button"
                onClick={() =>
                  confirmingDeleteId === recipe.id
                    ? handleDelete(recipe.id)
                    : setConfirmingDeleteId(recipe.id)
                }
                disabled={deletingId === recipe.id}
                className="rounded-lg border border-[rgba(187,118,109,0.28)] bg-[rgba(187,118,109,0.14)] px-3 py-1 text-xs text-[var(--danger)]"
              >
                {deletingId === recipe.id
                  ? '刪除中'
                  : confirmingDeleteId === recipe.id
                    ? '再按一次確認'
                    : '刪除'}
              </button>
            </div>
          ))
        )}
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            value={ingredientProductId}
            onChange={(e) => {
              const nextId = e.target.value
              setIngredientProductId(nextId)
              const next = ingredientProducts.find((item) => item.id === nextId)
              if (next?.inventoryMode === 'ml') setUnitType('ml')
              if (next?.inventoryMode === 'quantity') setUnitType('qty')
            }}
            className="nomiya-input rounded-xl p-3"
          >
            {ingredientProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.category} / {item.name}
              </option>
            ))}
          </select>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="數量"
            type="number"
            className="nomiya-input rounded-xl p-3"
          />

          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            className="nomiya-input rounded-xl p-3"
          >
            <option value="ml">ml</option>
            <option value="qty">qty</option>
            <option value="g">g</option>
          </select>

          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !selectedIngredient}
            className="nomiya-button-primary rounded-xl p-3 font-semibold"
          >
            {loading ? '建立中...' : '新增配置'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
