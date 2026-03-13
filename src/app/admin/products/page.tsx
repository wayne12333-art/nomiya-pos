import { prisma } from '@/lib/prisma'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'
import ProductForm from './product-form'
import ProductEditForm from './product-edit-form'
import DeleteButton from './delete-button'
import RecipeManager from './recipe-manager'
import VariantForm from './variant-form'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  q?: string
  category?: string
  status?: string
}>

function calcUnitCost(product: {
  productType: string
  purchasePrice: number | null
  portionMl: number | null
  inventoryItems: {
    avgCostPerMl: number | null
    avgCostPerQty: number | null
  } | null
  recipesAsSale?: {
    amount: number | null
    unitType: string | null
    ingredientProduct: {
      inventoryItems: {
        avgCostPerMl: number | null
        avgCostPerQty: number | null
      } | null
    }
  }[]
}) {
  if (product.recipesAsSale && product.recipesAsSale.length > 0) {
    let total = 0

    for (const recipe of product.recipesAsSale) {
      const amount = recipe.amount ?? 0

      if (recipe.unitType === 'ml') {
        total += (recipe.ingredientProduct.inventoryItems?.avgCostPerMl ?? 0) * amount
      } else if (recipe.unitType === 'qty') {
        total += (recipe.ingredientProduct.inventoryItems?.avgCostPerQty ?? 0) * amount
      }
    }

    return Math.round(total)
  }

  if (product.productType === 'food') {
    return product.purchasePrice ?? 0
  }

  if (
    product.inventoryItems?.avgCostPerMl &&
    product.portionMl &&
    product.portionMl > 0
  ) {
    return Math.round(product.inventoryItems.avgCostPerMl * product.portionMl)
  }

  return 0
}

function getStockSummary(product: {
  inventoryMode: string
  inventoryItems: {
    actualRemainingMl: number | null
    theoreticalRemainingMl: number | null
    actualQty: number | null
    theoreticalQty: number | null
    avgCostPerMl: number | null
    latestCostPerMl: number | null
    avgCostPerQty: number | null
    latestCostPerQty: number | null
    lowStockThresholdMl: number | null
    lowStockThresholdQty: number | null
  } | null
}) {
  const inventory = product.inventoryItems

  if (!inventory) {
    return {
      actual: 0,
      theoretical: 0,
      avgCost: 0,
      latestCost: 0,
      lowStock: false,
      unit: product.inventoryMode === 'ml' ? 'ml' : '份',
    }
  }

  if (product.inventoryMode === 'ml') {
    const actual = inventory.actualRemainingMl ?? 0
    const theoretical = inventory.theoreticalRemainingMl ?? 0
    const avgCost = inventory.avgCostPerMl ?? 0
    const latestCost = inventory.latestCostPerMl ?? 0
    const lowStock = actual <= (inventory.lowStockThresholdMl ?? 0)

    return {
      actual,
      theoretical,
      avgCost: Number(avgCost.toFixed(2)),
      latestCost: Number(latestCost.toFixed(2)),
      lowStock,
      unit: 'ml',
    }
  }

  const actual = inventory.actualQty ?? 0
  const theoretical = inventory.theoreticalQty ?? 0
  const avgCost = inventory.avgCostPerQty ?? 0
  const latestCost = inventory.latestCostPerQty ?? 0
  const lowStock = actual <= (inventory.lowStockThresholdQty ?? 0)

  return {
    actual,
    theoretical,
    avgCost: Number(avgCost.toFixed(2)),
    latestCost: Number(latestCost.toFixed(2)),
    lowStock,
    unit: '份',
  }
}

function getProductTypeLabel(type: string) {
  if (type === 'bottle') return '酒類'
  if (type === 'draft') return '生啤'
  if (type === 'food') return '食物'
  if (type === 'merchandise') return '備品 / 周邊'
  return type
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

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) || {}
  const q = (params.q || '').trim()
  const category = (params.category || '').trim()
  const status = (params.status || 'all').trim()

  const where: {
    name?: { contains: string; mode: 'insensitive' }
    category?: string
    saleStatus?: boolean
  } = {}

  if (q) {
    where.name = {
      contains: q,
      mode: 'insensitive',
    }
  }

  if (category) {
    where.category = category
  }

  if (status === 'live') {
    where.saleStatus = true
  }

  if (status === 'hidden') {
    where.saleStatus = false
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      inventoryItems: true,
      variants: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      recipesAsSale: {
        include: {
          ingredientProduct: {
            include: {
              inventoryItems: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  const ingredientProducts = await prisma.product.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
      inventoryMode: true,
    },
  })

  const categoryOptions = await prisma.product.findMany({
    select: {
      category: true,
    },
    distinct: ['category'],
    orderBy: {
      category: 'asc',
    },
  })

  const liveProducts = products.filter((product) => product.saleStatus).length
  const lowStockProducts = products.filter((product) => getStockSummary(product).lowStock).length
  const recipeProducts = products.filter((product) => product.recipesAsSale.length > 0).length

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
              <div className="nomiya-section-no">08 Products</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="nomiya-ribbon">Product Studio</div>
                <div className="nomiya-stamp">品目</div>
              </div>
              <h1 className="nomiya-display nomiya-kinetic-title mt-5 text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                <span>商品與扣庫設定</span>
              </h1>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                品目と引き落とし設定
              </div>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {brandCopy.products.title}
              </div>
            </div>

            <div
              className="grid gap-4 md:grid-cols-3"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <StatCard
                label="商品總數"
                value={`${products.length}`}
                helper="所有商品與原料"
              />
              <StatCard
                label="上架中"
                value={`${liveProducts}`}
                helper="目前在 POS 顯示"
                tone="sage"
              />
              <StatCard
                label="低庫存"
                value={`${lowStockProducts}`}
                helper={`已配置配方 ${recipeProducts} 項`}
                tone="clay"
              />
            </div>
          </div>

          <div
            className="nomiya-story-band mt-8 text-center text-xs tracking-[0.34em] text-[var(--muted-soft)]"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '240ms' }}
          >
            PRODUCT · VARIANT · RECIPE · INVENTORY COST
          </div>
        </section>

        <div data-reveal="scale" style={{ ['--reveal-delay' as string]: '100ms' }}>
          <ProductForm />
        </div>

        <section className="space-y-4">
          <div
            className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '140ms' }}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="nomiya-display text-3xl font-semibold text-[var(--foreground)]">
                  商品列表
                </h2>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  {brandCopy.products.list}
                </div>
              </div>

              <form className="grid gap-3 md:grid-cols-3 xl:min-w-[760px]">
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

                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="status"
                    defaultValue={status}
                    className="nomiya-input rounded-2xl p-4"
                  >
                    <option value="all">全部狀態</option>
                    <option value="live">上架中</option>
                    <option value="hidden">未上架</option>
                  </select>

                  <button
                    type="submit"
                    className="nomiya-button-primary rounded-2xl p-4 font-semibold"
                  >
                    篩選
                  </button>
                </div>
              </form>
              <div className="mt-3 flex justify-end">
                <a
                  href="/admin/products"
                  className="nomiya-button-secondary rounded-full px-4 py-2 text-sm"
                >
                  重設條件
                </a>
              </div>
            </div>
          </div>

          <div
            className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '160ms' }}
          >
            <div className="nomiya-route nomiya-panel rounded-[2rem] p-6">
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 01</div>
                <div className="nomiya-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  酒、肴、配方、扣庫
                </div>
              </div>
              <div className="nomiya-route-item mt-5">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
                <div className="text-sm leading-7 text-[var(--muted)]">{brandCopy.products.story}</div>
              </div>
            </div>

            <div className="nomiya-panel nomiya-ornament rounded-[2rem] p-6">
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
              <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                先看能不能賣，再看值不值得留
              </h3>
              <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                並べる前に、ちゃんと見る
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                這裡不是只是把商品一項一項堆上去，而是把現場真的會遇到的售價、規格、配方、毛利和庫存一起放進同一個閱讀順序裡。
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div
              className="nomiya-empty rounded-[2rem] p-6 text-[var(--muted)]"
              data-reveal="scale"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                No Products Found
              </div>
              <div className="mt-3 text-lg font-semibold text-[var(--foreground)]">目前沒有符合條件的商品</div>
              <div className="mt-2 text-sm leading-7">
                可以先重設篩選，或直接用上方表單建立新商品。商品一建立好，就能接著設定規格、配方與扣庫。
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {products.map((product, index) => {
                const unitCost = calcUnitCost(product)
                const salePrice = product.salePrice ?? 0
                const grossProfit = salePrice - unitCost
                const marginRate =
                  salePrice > 0 ? Math.round((grossProfit / salePrice) * 100) : 0
                const estimatedRevenue = (product.estimatedServings ?? 0) * salePrice
                const stock = getStockSummary(product)

                return (
                  <div
                    key={product.id}
                    className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
                    data-reveal={index % 2 === 0 ? 'left' : 'right'}
                    style={{ ['--reveal-delay' as string]: `${120 + (index % 4) * 60}ms` }}
                  >
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-2xl font-bold text-[var(--foreground)]">
                            {product.name}
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-sm ${
                              product.saleStatus
                                ? 'border-[rgba(110,134,113,0.3)] bg-[rgba(110,134,113,0.14)] text-[var(--success)]'
                                : 'border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.14)] text-[var(--danger)]'
                            }`}
                          >
                            {product.saleStatus ? '上架中' : '未上架'}
                          </span>

                          {product.recipesAsSale.length > 0 ? (
                            <span className="rounded-full border border-[var(--border)] bg-[rgba(255,248,238,0.45)] px-3 py-1 text-sm text-[var(--foreground)]">
                              已配置配方
                            </span>
                          ) : null}

                          {product.variants.length > 0 ? (
                            <span className="rounded-full border border-[var(--border)] bg-[rgba(255,248,238,0.45)] px-3 py-1 text-sm text-[var(--foreground)]">
                              {product.variants.length} 個規格
                            </span>
                          ) : null}

                          {stock.lowStock ? (
                            <span className="rounded-full border border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.14)] px-3 py-1 text-sm text-[var(--danger)]">
                              低庫存
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 text-sm text-[var(--muted)]">
                          類別：{product.category} / 類型：{getProductTypeLabel(product.productType)}
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <StatCard
                            label="實際庫存"
                            value={`${stock.actual} ${stock.unit}`}
                            helper={`理論 ${stock.theoretical} ${stock.unit}`}
                            tone={stock.lowStock ? 'clay' : 'default'}
                          />
                          <StatCard
                            label="平均成本"
                            value={`$${stock.avgCost}/${stock.unit}`}
                            helper={`最近成本 $${stock.latestCost}/${stock.unit}`}
                          />
                          <StatCard
                            label="售價 / 成本"
                            value={`$${salePrice} / $${unitCost}`}
                            helper={`單份毛利 $${grossProfit}，毛利率 ${marginRate}%`}
                            tone={marginRate < 50 ? 'clay' : 'sage'}
                          />
                          <StatCard
                            label="單份 ml"
                            value={`${product.portionMl ?? 0}`}
                            helper={`預計份數 ${product.estimatedServings ?? 0}`}
                          />
                          <StatCard
                            label="總 ml"
                            value={`${product.totalVolumeMl ?? 0}`}
                            helper={`預估營業額 $${estimatedRevenue}`}
                          />
                          <StatCard
                            label="加價設定"
                            value={`+${product.strongSurcharge ?? 0} / +${product.specialSurcharge ?? 0}`}
                            helper="加厚 / 特調"
                          />
                        </div>

                        {product.variants.length > 0 ? (
                          <div className="nomiya-panel-soft mt-5 rounded-[1.6rem] p-4">
                            <div className="text-sm font-semibold text-[var(--foreground)]">
                              已建立規格
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {product.variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,238,0.48)] p-3"
                                >
                                  <div className="font-medium text-[var(--foreground)]">
                                    {variant.name}
                                  </div>
                                  <div className="mt-1 text-sm text-[var(--muted)]">
                                    售價 ${variant.price}
                                    {variant.volumeMl ? ` / ${variant.volumeMl}ml` : ''}
                                    {variant.weightG ? ` / ${variant.weightG}g` : ''}
                                  </div>
                                  {variant.useRecipeDeduction ? (
                                    <div className="mt-2 text-xs text-[var(--accent-strong)]">
                                      使用配方扣庫
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="nomiya-panel-soft mt-5 rounded-[1.6rem] p-4">
                          <div className="text-sm font-semibold text-[var(--foreground)]">
                            新增規格
                          </div>
                          <VariantForm
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>

                        <RecipeManager
                          saleProductId={product.id}
                          saleProductName={product.name}
                          recipes={product.recipesAsSale.map((recipe) => ({
                            id: recipe.id,
                            amount: recipe.amount,
                            unitType: recipe.unitType,
                            ingredientProduct: {
                              id: recipe.ingredientProduct.id,
                              name: recipe.ingredientProduct.name,
                              category: recipe.ingredientProduct.category,
                              inventoryMode: recipe.ingredientProduct.inventoryMode,
                            },
                          }))}
                          ingredientProducts={ingredientProducts}
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                        <ProductEditForm product={product} />
                        <DeleteButton
                          url={`/api/products/${product.id}`}
                          label={`商品 ${product.name}`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
