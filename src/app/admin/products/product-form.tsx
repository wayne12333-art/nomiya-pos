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

function FieldLabel({
  title,
  hint,
}: {
  title: string
  hint?: string
}) {
  return (
    <div className="mb-2">
      <div className="text-sm font-medium text-[var(--foreground)]">{title}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  )
}

export default function ProductForm() {
  const router = useRouter()

  const [dbCategories, setDbCategories] = useState<string[]>([])

  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('威士忌')
  const [customCategory, setCustomCategory] = useState('')
  const [productType, setProductType] = useState('bottle')

  const [salePrice, setSalePrice] = useState('')
  const [portionMl, setPortionMl] = useState('')
  const [estimatedServings, setEstimatedServings] = useState('')
  const [strongSurcharge, setStrongSurcharge] = useState('')
  const [specialSurcharge, setSpecialSurcharge] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [saleStatus, setSaleStatus] = useState(true)

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

  const typeOptions = [
    {
      id: 'bottle',
      label: '酒類',
      hint: '像常久平常賣的酒，會以杯數和 ml 去慢慢扣。',
    },
    {
      id: 'draft',
      label: '生啤',
      hint: '桶裝、生啤這類現場一直出的酒，照 ml 去記最準。',
    },
    {
      id: 'food',
      label: '食物',
      hint: '下酒菜和限定料理放這裡，之後補貨和毛利會比較好看。',
    },
    {
      id: 'merchandise',
      label: '備品 / 周邊',
      hint: '打火機、熄菸袋或店裡的小東西，都放這邊一起管。',
    },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let inventoryMode = 'quantity'
    let isAlcohol = false
    let isMerchandise = false

    if (productType === 'bottle') {
      inventoryMode = 'ml'
      isAlcohol = true
    }

    if (productType === 'draft') {
      inventoryMode = 'ml'
      isAlcohol = true
    }

    if (productType === 'food') {
      inventoryMode = 'quantity'
    }

    if (productType === 'merchandise') {
      inventoryMode = 'quantity'
      isMerchandise = true
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        imageUrl,
        category: finalCategory,
        productType,
        inventoryMode,
        isAlcohol,
        isRecipe: false,
        isMerchandise,
        isWholeBottleSale: productType === 'bottle',
        saleStatus,
        salePrice: salePrice ? Number(salePrice) : null,
        portionMl: portionMl ? Number(portionMl) : null,
        estimatedServings: estimatedServings ? Number(estimatedServings) : null,
        strongSurcharge: strongSurcharge ? Number(strongSurcharge) : null,
        specialSurcharge: specialSurcharge ? Number(specialSurcharge) : null,
        purchasePrice:
          productType === 'food' || productType === 'merchandise'
            ? purchasePrice
              ? Number(purchasePrice)
              : null
            : null,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast({ title: data?.error || '建立商品失敗', tone: 'error' })
      return
    }

    toast({ title: '商品建立成功', tone: 'success' })

    setName('')
    setImageUrl('')
    setCategory('威士忌')
    setCustomCategory('')
    setProductType('bottle')
    setSalePrice('')
    setPortionMl('')
    setEstimatedServings('')
    setStrongSurcharge('')
    setSpecialSurcharge('')
    setPurchasePrice('')
    setSaleStatus(true)

    if (finalCategory && !categoryOptions.includes(finalCategory)) {
      setDbCategories((prev) => [...prev, finalCategory])
    }

    router.refresh()
  }

  return (
    <section className="nomiya-panel nomiya-panel-ornate rounded-[2.2rem] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
            New Product
          </div>
          <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
            新增商品
          </h2>
          <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
            あたらしい品目
          </div>
          <div className="mt-3 text-sm text-[var(--muted)]">
            {brandCopy.products.form}
          </div>
        </div>

        <label className="nomiya-panel-soft flex items-center gap-3 rounded-full px-4 py-3 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={saleStatus}
            onChange={(e) => setSaleStatus(e.target.checked)}
          />
          立即上架
        </label>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {typeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setProductType(option.id)}
              className={`rounded-[1.5rem] border p-4 text-left ${
                productType === option.id
                  ? 'border-[var(--border-strong)] bg-[rgba(189,125,70,0.12)]'
                  : 'border-[var(--border)] bg-[rgba(255,249,241,0.36)]'
              }`}
            >
              <div className="text-base font-semibold text-[var(--foreground)]">
                {option.label}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">{option.hint}</div>
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="nomiya-panel-soft rounded-[1.8rem] p-5">
            <div className="text-sm tracking-[0.24em] text-[var(--muted-soft)]">
              基本資料
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel title="商品名稱" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：角瓶 highball"
                  className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                  required
                />
              </div>

              <div>
                <FieldLabel title="圖片網址" hint="目前先保留外部圖片連結" />
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                />
              </div>

              <div>
                <FieldLabel title="商品類別" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                >
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="__custom__">＋ 新增類別</option>
                </select>
              </div>

              <div>
                <FieldLabel
                  title={category === '__custom__' ? '新類別名稱' : '目前販售狀態'}
                />
                {category === '__custom__' ? (
                  <input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="輸入新類別名稱"
                    className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                    required
                  />
                ) : (
                  <div className="nomiya-input flex min-h-[56px] items-center rounded-[1.2rem] px-4 py-4">
                    {saleStatus ? '上架中，可在 POS 顯示' : '未上架，暫不販售'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="nomiya-panel-soft rounded-[1.8rem] p-5">
            <div className="text-sm tracking-[0.24em] text-[var(--muted-soft)]">
              售價與扣庫
            </div>

            {(productType === 'bottle' || productType === 'draft') && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel title="售價" hint={productType === 'draft' ? '基本售價' : '單份售價'} />
                  <input
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    type="number"
                    className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                  />
                </div>

                <div>
                  <FieldLabel title="單份 ml" hint="每份扣庫容量" />
                  <input
                    value={portionMl}
                    onChange={(e) => setPortionMl(e.target.value)}
                    type="number"
                    className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                  />
                </div>

                <div>
                  <FieldLabel title="預計份數" hint="用來估計一瓶可售幾份" />
                  <input
                    value={estimatedServings}
                    onChange={(e) => setEstimatedServings(e.target.value)}
                    type="number"
                    className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                  />
                </div>

                <div>
                  <FieldLabel title="加價設定" hint="高濃度或特調額外加價" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={strongSurcharge}
                      onChange={(e) => setStrongSurcharge(e.target.value)}
                      placeholder="加厚加價"
                      type="number"
                      className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                    />
                    <input
                      value={specialSurcharge}
                      onChange={(e) => setSpecialSurcharge(e.target.value)}
                      placeholder="特調加價"
                      type="number"
                      className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                    />
                  </div>
                </div>
              </div>
            )}

            {(productType === 'food' || productType === 'merchandise') && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel title="售價" />
                  <input
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    type="number"
                    className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                  />
                </div>

                <div>
                  <FieldLabel title="成本價" hint="直接用來算毛利" />
                  <input
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    type="number"
                    className="nomiya-input w-full rounded-[1.2rem] px-4 py-4"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,248,238,0.4)] p-4 text-sm leading-7 text-[var(--muted)]">
              {productType === 'bottle' || productType === 'draft'
                ? '酒類 / 生啤建立後會自動建立 ml 庫存，之後可以再補規格與配方。'
                : '食物 / 備品建立後會以數量扣庫，適合下酒菜、耗材或周邊。'}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="nomiya-button-primary rounded-full px-6 py-3 text-sm font-semibold"
          >
            {loading ? '建立中...' : '建立商品'}
          </button>
        </div>
      </form>
    </section>
  )
}
