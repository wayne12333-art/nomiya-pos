'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { brandCopy } from '@/lib/brand-copy'
import { toast } from '@/lib/toast'

const presetCategories = [
  '威士忌',
  '清酒',
  '啤酒',
  '生啤',
  '沙瓦',
  '調酒',
  '下酒菜',
  '當日限定',
  '原料',
  '備品',
]

type ProductEditFormProps = {
  product: {
    id: string
    name: string
    category: string
    imageUrl: string | null
    saleStatus: boolean
    portionMl: number | null
    estimatedServings: number | null
    salePrice: number | null
    strongSurcharge: number | null
    specialSurcharge: number | null
    purchasePrice: number | null
    productType?: string
  }
}

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter()

  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const [name, setName] = useState(product.name)
  const [category, setCategory] = useState(product.category)
  const [customCategory, setCustomCategory] = useState('')

  const [imageUrl, setImageUrl] = useState(product.imageUrl || '')
  const [saleStatus, setSaleStatus] = useState(product.saleStatus)
  const [portionMl, setPortionMl] = useState(
    product.portionMl ? String(product.portionMl) : ''
  )
  const [estimatedServings, setEstimatedServings] = useState(
    product.estimatedServings ? String(product.estimatedServings) : ''
  )
  const [salePrice, setSalePrice] = useState(
    product.salePrice ? String(product.salePrice) : ''
  )
  const [strongSurcharge, setStrongSurcharge] = useState(
    product.strongSurcharge ? String(product.strongSurcharge) : ''
  )
  const [specialSurcharge, setSpecialSurcharge] = useState(
    product.specialSurcharge ? String(product.specialSurcharge) : ''
  )
  const [purchasePrice, setPurchasePrice] = useState(
    product.purchasePrice ? String(product.purchasePrice) : ''
  )

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/product-categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbCategories(data)
        }
      })
      .catch((error) => {
        console.error('Fetch categories error:', error)
      })
  }, [])

  const categoryOptions = useMemo(() => {
    return Array.from(new Set([...presetCategories, ...dbCategories]))
  }, [dbCategories])

  const finalCategory = useMemo(() => {
    if (category === '__custom__') return customCategory.trim()
    return category
  }, [category, customCategory])

  async function handleSave() {
    setLoading(true)

    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category: finalCategory,
        imageUrl,
        saleStatus,
        portionMl: portionMl ? Number(portionMl) : null,
        estimatedServings: estimatedServings ? Number(estimatedServings) : null,
        salePrice: salePrice ? Number(salePrice) : null,
        strongSurcharge: strongSurcharge ? Number(strongSurcharge) : null,
        specialSurcharge: specialSurcharge ? Number(specialSurcharge) : null,
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '更新商品失敗', tone: 'error' })
      return
    }

    toast({ title: '商品已更新', tone: 'success' })
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
        {open ? '收起編輯' : '編輯商品'}
      </button>

      {open ? (
        <div className="nomiya-panel-soft mt-3 rounded-[1.6rem] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">商品編輯</div>
          <div className="mt-2 text-xs leading-6 text-[var(--muted)]">
            {brandCopy.products.form}
          </div>

          <div className="mt-4 grid gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名稱，像是角 High / 炙燒明太子山藥"
              className="nomiya-input w-full rounded-xl px-3 py-3"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="nomiya-input w-full rounded-xl px-3 py-3"
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="__custom__">＋ 新增類別</option>
            </select>

            {category === '__custom__' ? (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="輸入新類別名稱"
                className="nomiya-input w-full rounded-xl px-3 py-3"
              />
            ) : null}

            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="圖片網址，有想放再放就好"
              className="nomiya-input w-full rounded-xl px-3 py-3"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                value={portionMl}
                onChange={(e) => setPortionMl(e.target.value)}
                placeholder="單份 ml"
                type="number"
                className="nomiya-input rounded-xl px-3 py-3"
              />
              <input
                value={estimatedServings}
                onChange={(e) => setEstimatedServings(e.target.value)}
                placeholder="預計能出幾份"
                type="number"
                className="nomiya-input rounded-xl px-3 py-3"
              />
              <input
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="客人會看到的售價"
                type="number"
                className="nomiya-input rounded-xl px-3 py-3"
              />
              <input
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="目前抓的成本"
                type="number"
                className="nomiya-input rounded-xl px-3 py-3"
              />
              <input
                value={strongSurcharge}
                onChange={(e) => setStrongSurcharge(e.target.value)}
                placeholder="加厚加價"
                type="number"
                className="nomiya-input rounded-xl px-3 py-3"
              />
              <input
                value={specialSurcharge}
                onChange={(e) => setSpecialSurcharge(e.target.value)}
                placeholder="特調加價"
                type="number"
                className="nomiya-input rounded-xl px-3 py-3"
              />
            </div>

            <label className="nomiya-input flex items-center gap-3 rounded-xl px-3 py-3">
              <input
                type="checkbox"
                checked={saleStatus}
                onChange={(e) => setSaleStatus(e.target.checked)}
              />
              <span>是否上架</span>
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="nomiya-button-primary w-full rounded-xl px-3 py-3 font-semibold"
            >
              {loading ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
