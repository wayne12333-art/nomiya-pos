import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'
import ResetInventoryButton from './reset-inventory-button'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  q?: string
  category?: string
  status?: string
}>

type InventoryWithProduct = {
  id: string
  productId: string
  unopenedBottleQty: number | null
  openedBottleQty: number | null
  theoreticalRemainingMl: number | null
  actualRemainingMl: number | null
  theoreticalRemainingG: number | null
  actualRemainingG: number | null
  theoreticalQty: number | null
  actualQty: number | null
  lowStockThresholdMl: number | null
  lowStockThresholdG: number | null
  lowStockThresholdQty: number | null
  avgCostPerMl: number | null
  avgCostPerG: number | null
  avgCostPerQty: number | null
  product: {
    name: string
    category: string
    inventoryMode: string
  }
}

function formatCurrency(value: number) {
  return Number(value.toFixed(2))
}

function getInventoryMetrics(item: InventoryWithProduct) {
  if (item.product.inventoryMode === 'ml') {
    const actual = item.actualRemainingMl ?? 0
    const theoretical = item.theoreticalRemainingMl ?? 0
    const threshold = item.lowStockThresholdMl ?? 0
    const avgCost = item.avgCostPerMl ?? 0

    return {
      unit: 'ml',
      actual,
      theoretical,
      threshold,
      variance: actual - theoretical,
      avgCost,
      estimatedValue: formatCurrency(actual * avgCost),
    }
  }

  if (item.product.inventoryMode === 'g') {
    const actual = item.actualRemainingG ?? 0
    const theoretical = item.theoreticalRemainingG ?? 0
    const threshold = item.lowStockThresholdG ?? 0
    const avgCost = item.avgCostPerG ?? 0

    return {
      unit: 'g',
      actual,
      theoretical,
      threshold,
      variance: actual - theoretical,
      avgCost,
      estimatedValue: formatCurrency(actual * avgCost),
    }
  }

  const actual = item.actualQty ?? 0
  const theoretical = item.theoreticalQty ?? 0
  const threshold = item.lowStockThresholdQty ?? 0
  const avgCost = item.avgCostPerQty ?? 0

  return {
    unit: '件',
    actual,
    theoretical,
    threshold,
    variance: actual - theoretical,
    avgCost,
    estimatedValue: formatCurrency(actual * avgCost),
  }
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone?: 'default' | 'sage' | 'clay'
}) {
  const toneClass =
    tone === 'sage'
      ? 'nomiya-accent-sage'
      : tone === 'clay'
        ? 'nomiya-accent-clay'
        : 'nomiya-panel-soft'

  return (
    <div className={`${toneClass} rounded-[1.4rem] p-4`}>
      <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{helper}</div>
    </div>
  )
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) || {}
  const q = (params.q || '').trim()
  const category = (params.category || '').trim()
  const status = (params.status || 'all').trim()

  const where: {
    product?: {
      name?: { contains: string; mode: 'insensitive' }
      category?: string
    }
  } = {}

  if (q || category) {
    where.product = {}

    if (q) {
      where.product.name = {
        contains: q,
        mode: 'insensitive',
      }
    }

    if (category) {
      where.product.category = category
    }
  }

  const inventory = (await prisma.inventoryItem.findMany({
    where,
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  })) as InventoryWithProduct[]

  const categoryOptions = await prisma.product.findMany({
    select: {
      category: true,
    },
    distinct: ['category'],
    orderBy: {
      category: 'asc',
    },
  })

  const enrichedInventory = inventory
    .map((item) => {
      const metrics = getInventoryMetrics(item)
      const isLowStock = metrics.actual <= metrics.threshold
      const hasVariance = metrics.variance !== 0

      return {
        ...item,
        metrics,
        isLowStock,
        hasVariance,
      }
    })
    .sort((a, b) => {
      const scoreA = Number(a.isLowStock) * 2 + Number(a.hasVariance)
      const scoreB = Number(b.isLowStock) * 2 + Number(b.hasVariance)
      if (scoreA !== scoreB) return scoreB - scoreA
      return a.product.name.localeCompare(b.product.name, 'zh-Hant')
    })
    .filter((item) => {
      if (status === 'low') return item.isLowStock
      if (status === 'variance') return item.hasVariance
      if (status === 'stable') return !item.isLowStock && !item.hasVariance
      return true
    })

  const lowStockItems = enrichedInventory.filter((item) => item.isLowStock)
  const varianceItems = enrichedInventory.filter((item) => item.hasVariance)
  const inventoryValue = formatCurrency(
    enrichedInventory.reduce((sum, item) => sum + item.metrics.estimatedValue, 0)
  )
  const stableItems = enrichedInventory.length - lowStockItems.length - varianceItems.length

  return (
    <main className="nomiya-shell p-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminNav />

        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament rounded-[2.4rem] p-6 md:p-8"
          data-reveal="hero"
        >
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Inventory Overview
              </div>
              <h1 className="nomiya-display nomiya-kinetic-title mt-3 text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                <span>庫存總覽</span>
              </h1>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                在庫の見通し
              </div>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {brandCopy.inventory.title}
              </div>
            </div>

            <div
              className="nomiya-sheet rounded-[1.8rem] p-5"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">
                QUICK ACTION
              </div>
              <div className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                先補貨，再盤點
              </div>
              <div className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {brandCopy.inventory.action}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin/stocktakes"
                  className="nomiya-button-primary rounded-full px-4 py-3 text-sm font-semibold"
                >
                  前往盤點管理
                </Link>
                <Link
                  href="/admin/purchases"
                  className="nomiya-button-secondary rounded-full px-4 py-3 text-sm"
                >
                  前往進貨管理
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          data-reveal="scale"
          style={{ ['--reveal-delay' as string]: '120ms' }}
        >
          <StatCard
            label="低庫存品項"
            value={`${lowStockItems.length}`}
            helper="優先看哪些快沒貨"
            tone="clay"
          />
          <StatCard
            label="帳實差異"
            value={`${varianceItems.length}`}
            helper="應安排盤點校正"
            tone="clay"
          />
          <StatCard
            label="庫存成本估值"
            value={`$${inventoryValue}`}
            helper="依目前平均成本估算"
          />
          <StatCard
            label="穩定追蹤"
            value={`${Math.max(stableItems, 0)}`}
            helper="目前無低庫存且無差異"
            tone="sage"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
          <div
            className="nomiya-route nomiya-panel rounded-[2rem] p-6 2xl:sticky 2xl:top-28 2xl:self-start"
            data-reveal="left"
            style={{ ['--reveal-delay' as string]: '140ms' }}
          >
            <div className="nomiya-route-item">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 01</div>
              <div className="nomiya-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
                今晚快沒的是什麼
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
              <div className="text-sm leading-7 text-[var(--muted)]">{brandCopy.inventory.story}</div>
            </div>
          </div>

          <div
            className="nomiya-panel nomiya-ornament rounded-[2rem] p-6"
            data-reveal="right"
            style={{ ['--reveal-delay' as string]: '180ms' }}
          >
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
            <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
              低庫存、差異、估值，先看哪個今天就要處理
            </h3>
            <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
              今夜の優先順位を決める
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              這頁不是要你把所有品項都看一遍，而是先把快沒貨、帳實對不起來、該補該盤的東西挑出來，剩下的明天再慢慢管。
            </p>
          </div>
        </section>

        <section
          className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
          data-reveal="scale"
          style={{ ['--reveal-delay' as string]: '160ms' }}
        >
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-[1fr_240px_240px_140px]">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜尋商品名稱"
              className="nomiya-input rounded-2xl p-4"
            />

            <select
              name="category"
              defaultValue={category}
              className="nomiya-input rounded-2xl p-4"
            >
              <option value="">全部類別</option>
              {categoryOptions.map((item) => (
                <option key={item.category} value={item.category}>
                  {item.category}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status}
              className="nomiya-input rounded-2xl p-4"
            >
              <option value="all">全部狀態</option>
              <option value="low">只看低庫存</option>
              <option value="variance">只看有差異</option>
              <option value="stable">只看穩定</option>
            </select>

            <button
              type="submit"
              className="nomiya-button-primary rounded-2xl p-4 font-semibold"
            >
              篩選
            </button>
          </form>
          <div className="mt-3 flex justify-end">
            <a
              href="/admin/inventory"
              className="nomiya-button-secondary rounded-full px-4 py-2 text-sm"
            >
              重設條件
            </a>
          </div>
        </section>

        {inventory.length === 0 ? (
          <div
            className="nomiya-empty rounded-[2rem] p-6 text-[var(--muted)]"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '180ms' }}
          >
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
              No Inventory Found
            </div>
            <div className="mt-3 text-lg font-semibold text-[var(--foreground)]">目前沒有符合條件的庫存資料</div>
            <div className="mt-2 text-sm leading-7">
              可以先重設條件查看全部品項；如果是新商品尚未建立庫存，下一步先到進貨頁或商品設定補齊資料。
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {enrichedInventory.map((item, index) => (
              <div
                key={item.id}
                className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
                data-reveal={index % 2 === 0 ? 'left' : 'right'}
                style={{ ['--reveal-delay' as string]: `${120 + (index % 4) * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-2xl font-bold text-[var(--foreground)]">
                        {item.product.name}
                      </div>
                      <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,238,0.5)] px-3 py-1 text-xs text-[var(--muted)]">
                        {item.product.category}
                      </div>
                      <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,238,0.5)] px-3 py-1 text-xs text-[var(--muted)]">
                        {item.product.inventoryMode}
                      </div>
                      {item.isLowStock ? (
                        <div className="rounded-full border border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.14)] px-3 py-1 text-xs text-[var(--danger)]">
                          低庫存
                        </div>
                      ) : null}
                      {item.hasVariance ? (
                        <div className="rounded-full border border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.14)] px-3 py-1 text-xs text-[var(--danger)]">
                          帳實差異
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <StatCard
                        label={`實際剩餘 ${item.metrics.unit}`}
                        value={`${item.metrics.actual}`}
                        helper={`理論 ${item.metrics.theoretical}`}
                        tone={item.isLowStock ? 'clay' : 'default'}
                      />
                      <StatCard
                        label={`差異 ${item.metrics.unit}`}
                        value={`${item.metrics.variance}`}
                        helper="正數代表現場比帳面多"
                        tone={item.hasVariance ? 'clay' : 'sage'}
                      />
                      <StatCard
                        label={`低庫存門檻 ${item.metrics.unit}`}
                        value={`${item.metrics.threshold}`}
                        helper="低於此數值就提醒"
                      />
                      <StatCard
                        label={`平均每 ${item.metrics.unit} 成本`}
                        value={`$${formatCurrency(item.metrics.avgCost)}`}
                        helper={`估值 $${item.metrics.estimatedValue}`}
                      />
                      <StatCard
                        label="建議"
                        value={
                          item.isLowStock ? '優先補貨' : item.hasVariance ? '安排盤點' : '維持追蹤'
                        }
                        helper="依目前狀態排序"
                        tone={item.isLowStock || item.hasVariance ? 'clay' : 'sage'}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {item.product.inventoryMode === 'ml' ? (
                        <>
                          <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
                            <div className="text-sm text-[var(--muted)]">未開瓶數</div>
                            <div className="mt-2 font-medium text-[var(--foreground)]">
                              {item.unopenedBottleQty ?? 0}
                            </div>
                          </div>
                          <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
                            <div className="text-sm text-[var(--muted)]">已開瓶數</div>
                            <div className="mt-2 font-medium text-[var(--foreground)]">
                              {item.openedBottleQty ?? 0}
                            </div>
                          </div>
                        </>
                      ) : null}

                      <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
                        <div className="text-sm text-[var(--muted)]">追蹤重點</div>
                        <div className="mt-2 font-medium text-[var(--foreground)]">
                          {item.isLowStock
                            ? '先補貨'
                            : item.hasVariance
                              ? '先盤點'
                              : '正常追蹤'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <ResetInventoryButton
                    productId={item.productId}
                    productName={item.product.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
