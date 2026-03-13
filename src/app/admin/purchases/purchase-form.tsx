'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { brandCopy } from '@/lib/brand-copy'
import { toast } from '@/lib/toast'

type PurchaseProduct = {
  id: string
  name: string
  category: string
  productType: string
  inventoryMode: string
  totalVolumeMl: number | null
}

export default function PurchaseForm() {
  const router = useRouter()

  const [products, setProducts] = useState<PurchaseProduct[]>([])
  const [productId, setProductId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [note, setNote] = useState('')
  const [qty, setQty] = useState('1')
  const [unitCost, setUnitCost] = useState('')
  const [volumeMl, setVolumeMl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/purchase-products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data)
          if (data.length > 0) setProductId(data[0].id)
        }
      })
      .catch((error) => {
        console.error('Fetch purchase products error:', error)
      })
  }, [])

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === productId),
    [products, productId]
  )

  const totalCost = useMemo(() => {
    const nextQty = Number(qty || 0)
    const nextUnitCost = Number(unitCost || 0)
    if (!Number.isFinite(nextQty) || !Number.isFinite(nextUnitCost)) return 0
    return nextQty * nextUnitCost
  }, [qty, unitCost])

  const totalIncomingMl = useMemo(() => {
    if (selectedProduct?.inventoryMode !== 'ml') return null
    const nextQty = Number(qty || 0)
    const singleVolume = volumeMl ? Number(volumeMl) : selectedProduct?.totalVolumeMl ?? 0
    if (!Number.isFinite(nextQty) || !Number.isFinite(singleVolume)) return 0
    return nextQty * singleVolume
  }, [qty, volumeMl, selectedProduct])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        supplierName,
        note,
        qty: Number(qty),
        unitCost: Number(unitCost),
        volumeMl:
          selectedProduct?.inventoryMode === 'ml'
            ? volumeMl
              ? Number(volumeMl)
              : selectedProduct?.totalVolumeMl ?? null
            : null,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '建立進貨失敗', tone: 'error' })
      return
    }

    toast({ title: '進貨建立成功', tone: 'success' })
    setSupplierName('')
    setNote('')
    setQty('1')
    setUnitCost('')
    setVolumeMl('')
    router.refresh()
  }

  return (
    <section className="nomiya-panel nomiya-panel-ornate rounded-[2rem] p-6">
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <div>
          <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
            New Purchase
          </div>
          <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
            新增進貨
          </h2>
          <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
            あたらしい仕入れ
          </div>
          <div className="mt-3 text-sm text-[var(--muted)]">
            {brandCopy.purchases.form}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
            <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">THIS PURCHASE</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">${totalCost || 0}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">本次總成本</div>
          </div>
          <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
            <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">QTY</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{qty || 0}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">本次進貨數量</div>
          </div>
          <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
            <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">INCOMING</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {selectedProduct?.inventoryMode === 'ml' ? `${totalIncomingMl || 0} ml` : `${qty || 0} 件`}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">進貨後增加量</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="nomiya-input rounded-2xl p-4"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.category} / {product.name}
              </option>
            ))}
          </select>

          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="供應商"
            className="nomiya-input rounded-2xl p-4"
          />

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="備註"
            className="nomiya-input rounded-2xl p-4"
          />

          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="進貨數量"
            type="number"
            min="1"
            className="nomiya-input rounded-2xl p-4"
          />

          <input
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="每件進貨金額"
            type="number"
            min="1"
            className="nomiya-input rounded-2xl p-4"
          />

          {selectedProduct?.inventoryMode === 'ml' ? (
            <input
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
              placeholder={`單件總 ml（預設 ${selectedProduct.totalVolumeMl ?? 0}）`}
              type="number"
              min="1"
              className="nomiya-input rounded-2xl p-4"
            />
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="nomiya-button-primary rounded-2xl p-4 font-semibold"
        >
          {loading ? '建立中...' : '建立進貨'}
        </button>
      </form>
    </section>
  )
}
