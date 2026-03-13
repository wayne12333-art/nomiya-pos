import { prisma } from '@/lib/prisma'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'
import StocktakeForm from './stocktake-form'
import SimpleDeleteButton from '../simple-delete-button'

export const dynamic = 'force-dynamic'

function categoryTone(category: string | null) {
  switch (category) {
    case '招待 Shot':
      return 'bg-[rgba(184,127,58,0.14)] text-[var(--accent-strong)] border-[rgba(184,127,58,0.18)]'
    case '老闆自飲':
      return 'bg-[rgba(143,111,79,0.12)] text-[var(--foreground)] border-[rgba(143,111,79,0.18)]'
    case '試飲':
      return 'bg-[rgba(110,132,93,0.12)] text-[var(--foreground)] border-[rgba(110,132,93,0.18)]'
    case '損耗':
      return 'bg-[rgba(184,127,58,0.1)] text-[var(--muted)] border-[rgba(184,127,58,0.14)]'
    case '報廢':
      return 'bg-[rgba(187,118,109,0.14)] text-[var(--danger)] border-[rgba(187,118,109,0.18)]'
    default:
      return 'bg-[rgba(255,252,247,0.9)] text-[var(--muted)] border-[var(--border)]'
  }
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
      <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{helper}</div>
    </div>
  )
}

export default async function AdminStocktakesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    productId?: string
  }>
}) {
  const params = (await searchParams) || {}

  const inventory = await prisma.inventoryItem.findMany({
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  })

  const stocktakes = await prisma.stocktake.findMany({
    orderBy: { countedAt: 'desc' },
    include: {
      product: true,
    },
  })

  const productOptions = inventory.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    inventoryMode: item.product.inventoryMode,
    theoreticalRemainingMl: item.theoreticalRemainingMl ?? 0,
    theoreticalQty: item.theoreticalQty ?? 0,
  }))

  const varianceCount = stocktakes.filter(
    (item) => (item.varianceMl ?? 0) !== 0 || (item.varianceQty ?? 0) !== 0
  ).length
  const compedCount = stocktakes.filter((item) => item.varianceCategory === '招待 Shot').length
  const ownerDrinkCount = stocktakes.filter((item) => item.varianceCategory === '老闆自飲').length

  return (
    <main className="nomiya-shell p-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminNav />

        <section className="nomiya-panel rounded-[2.4rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Stocktake Ledger
              </div>
              <h1 className="nomiya-display mt-3 text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                盤點管理
              </h1>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                棚卸しの記録
              </div>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {brandCopy.stocktakes.title}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="可盤點品項" value={`${inventory.length}`} helper="目前有庫存紀錄的商品" />
              <StatCard label="盤點紀錄" value={`${stocktakes.length}`} helper="累積盤點次數" />
              <StatCard label="有差異紀錄" value={`${varianceCount}`} helper="最近曾有盤點差異" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <StatCard label="招待 / Shot" value={`${compedCount}`} helper="可回看送客人酒飲的盤點原因" />
              <StatCard label="老闆自飲" value={`${ownerDrinkCount}`} helper="記錄內部飲用或自用扣帳" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
          <div
            className="nomiya-route nomiya-panel rounded-[2rem] p-6 2xl:sticky 2xl:top-28 2xl:self-start"
            data-reveal="left"
            style={{ ['--reveal-delay' as string]: '120ms' }}
          >
            <div className="nomiya-route-item">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 01</div>
              <div className="nomiya-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
                把模糊的地方重新記清楚
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
              <div className="text-sm leading-7 text-[var(--muted)]">{brandCopy.stocktakes.story}</div>
            </div>
          </div>

          <div
            className="nomiya-panel nomiya-ornament rounded-[2rem] p-6"
            data-reveal="right"
            style={{ ['--reveal-delay' as string]: '180ms' }}
          >
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
            <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
              招待、自飲、損耗，先留痕跡再回頭看
            </h3>
            <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
              あとで迷わないために
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              盤點最怕的不是有差異，而是差異一直出現卻沒有留下原因。這裡先把每次發生的事記住，之後補貨、查庫存、看報表都會更準。
            </p>
          </div>
        </section>

        <section className="nomiya-panel rounded-[2rem] p-6">
          <div className="text-sm text-[var(--muted)]">新增盤點</div>
          <div className="mt-2 text-sm leading-7 text-[var(--muted)]">{brandCopy.stocktakes.create}</div>
          <div className="mt-6">
            <StocktakeForm
              products={productOptions}
              initialProductId={params.productId}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="nomiya-panel rounded-[2rem] p-6">
            <h2 className="nomiya-display text-3xl font-semibold text-[var(--foreground)]">
              目前理論 / 實際庫存
            </h2>
          </div>

          <div className="grid gap-5">
            {inventory.map((item) => {
              const isMl = item.product.inventoryMode === 'ml'
              const theoretical = isMl ? item.theoreticalRemainingMl ?? 0 : item.theoreticalQty ?? 0
              const actual = isMl ? item.actualRemainingMl ?? 0 : item.actualQty ?? 0
              const variance = actual - theoretical

              return (
                <div key={item.id} className="nomiya-panel rounded-[2rem] p-6">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {item.product.name}
                  </div>
                  <div className="mt-2 text-sm text-[var(--muted)]">
                    模式：{item.product.inventoryMode}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <StatCard
                      label={isMl ? '理論 ml' : '理論數量'}
                      value={`${theoretical}`}
                      helper="目前帳面數量"
                    />
                    <StatCard
                      label={isMl ? '實際 ml' : '實際數量'}
                      value={`${actual}`}
                      helper="最近確認的現場數量"
                    />
                    <StatCard
                      label={isMl ? '差異 ml' : '差異數量'}
                      value={`${variance}`}
                      helper={variance === 0 ? '目前無差異' : '建議補寫原因'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="nomiya-panel rounded-[2rem] p-6">
            <h2 className="nomiya-display text-3xl font-semibold text-[var(--foreground)]">
              盤點紀錄
            </h2>
          </div>

          {stocktakes.length === 0 ? (
            <div className="nomiya-panel rounded-[2rem] p-6 text-[var(--muted)]">
              目前沒有盤點紀錄
            </div>
          ) : (
            <div className="grid gap-5">
              {stocktakes.map((stocktake) => (
                <div key={stocktake.id} className="nomiya-panel rounded-[2rem] p-6">
                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <div className="text-2xl font-bold text-[var(--foreground)]">
                        {stocktake.product.name}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                        <span>{new Date(stocktake.countedAt).toLocaleString('zh-TW')}</span>
                        {stocktake.varianceCategory ? (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${categoryTone(
                              stocktake.varianceCategory
                            )}`}
                          >
                            {stocktake.varianceCategory}
                          </span>
                        ) : null}
                      </div>

                      {stocktake.actualMl !== null || stocktake.theoreticalMl !== null ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <StatCard label="理論 ml" value={`${stocktake.theoreticalMl ?? 0}`} helper="盤點前帳面" />
                          <StatCard label="實際 ml" value={`${stocktake.actualMl ?? 0}`} helper="實際量測" />
                          <StatCard label="差異 ml" value={`${stocktake.varianceMl ?? 0}`} helper="可回推耗損或招待" />
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <StatCard label="理論數量" value={`${stocktake.theoreticalQty ?? 0}`} helper="盤點前帳面" />
                          <StatCard label="實際數量" value={`${stocktake.actualQty ?? 0}`} helper="實際點算" />
                          <StatCard label="差異數量" value={`${stocktake.varianceQty ?? 0}`} helper="可回推耗損或報廢" />
                        </div>
                      )}

                      {stocktake.varianceReason ? (
                        <div className="nomiya-panel-soft mt-4 rounded-[1.5rem] p-4">
                          <div className="text-sm font-semibold text-[var(--foreground)]">原因</div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                            {stocktake.varianceReason}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <SimpleDeleteButton
                        url={`/api/stocktakes/${stocktake.id}`}
                        label={`盤點紀錄 ${stocktake.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
