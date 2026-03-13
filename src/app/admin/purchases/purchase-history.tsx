'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

type PurchaseItem = {
  id: string
  qty: number
  unitCost: number
  totalCost: number
  volumeMl: number | null
  product: {
    name: string
    category: string
  }
}

type Purchase = {
  id: string
  supplierName: string | null
  totalAmount: number
  note: string | null
  purchaseDate: string
  items: PurchaseItem[]
}

export default function PurchaseHistory() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function loadPurchases() {
    const res = await fetch('/api/purchases')
    const data = await res.json().catch(() => [])
    if (Array.isArray(data)) setPurchases(data)
  }

  useEffect(() => {
    async function bootstrap() {
      await loadPurchases()
    }

    void bootstrap()
  }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)

    const res = await fetch(`/api/purchases/${id}`, {
      method: 'DELETE',
    })

    const data = await res.json().catch(() => null)
    setDeletingId(null)

    if (!res.ok) {
      toast({ title: data?.error || '刪除進貨紀錄失敗', tone: 'error' })
      return
    }

    toast({ title: '進貨紀錄已刪除', tone: 'success' })
    await loadPurchases()
    router.refresh()
  }

  return (
    <section className="nomiya-panel rounded-[2rem] p-6">
      <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
        Purchase History
      </div>
      <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
        進貨紀錄
      </h2>
      <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
        これまでの仕入れ
      </div>
      <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
        補過什麼、多少錢、那次是不是買得漂亮，之後都從這裡回頭看。
      </div>

      <div className="mt-6 grid gap-4">
        {purchases.length === 0 ? (
          <div className="nomiya-panel-soft rounded-2xl p-4 text-[var(--muted)]">
            目前還沒有進貨紀錄，等第一批酒或食材補進來後，這裡就會開始長東西。
          </div>
        ) : (
          purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="nomiya-panel-soft rounded-[1.5rem] p-5"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-lg font-semibold text-[var(--foreground)]">
                    {purchase.supplierName || '未填供應商'}
                  </div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {new Date(purchase.purchaseDate).toLocaleString('zh-TW')}
                  </div>
                  {purchase.note ? (
                    <div className="mt-1 text-sm text-[var(--muted)]">備註：{purchase.note}</div>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    ${purchase.totalAmount}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      confirmingId === purchase.id
                        ? handleDelete(purchase.id)
                        : setConfirmingId(purchase.id)
                    }
                    disabled={deletingId === purchase.id}
                    className="rounded-xl border border-[rgba(187,118,109,0.28)] bg-[rgba(187,118,109,0.14)] px-4 py-2 text-sm text-[var(--danger)] disabled:opacity-50"
                  >
                    {deletingId === purchase.id
                      ? '刪除中...'
                      : confirmingId === purchase.id
                        ? '再按一次確認'
                        : '刪除'}
                  </button>
                </div>
              </div>

              {confirmingId === purchase.id && deletingId !== purchase.id ? (
                <div className="mt-3 rounded-[1rem] border border-[rgba(187,118,109,0.2)] bg-[rgba(244,226,221,0.4)] p-3 text-sm leading-6 text-[var(--muted)]">
                  這筆進貨刪掉後，庫存也會一起回退。確認沒記錯再按一次。
                </div>
              ) : null}

              <div className="mt-4 grid gap-3">
                {purchase.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--border)] bg-[rgba(255,248,238,0.52)] p-4"
                  >
                    <div className="font-semibold text-[var(--foreground)]">
                      {item.product.category} / {item.product.name}
                    </div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      數量：{item.qty} / 單價：${item.unitCost} / 小計：${item.totalCost}
                    </div>
                    {item.volumeMl ? (
                      <div className="mt-1 text-sm text-[var(--muted)]">
                        單件 ml：{item.volumeMl}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
