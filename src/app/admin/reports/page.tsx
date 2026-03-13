import { prisma } from '@/lib/prisma'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'

export const dynamic = 'force-dynamic'

type OrderWithItems = {
  id: string
  customerName: string | null
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  createdAt: Date
  closedAt: Date | null
  items: Array<{
    id: string
    itemNameSnapshot: string
    variantNameSnapshot: string | null
    qty: number
    unitPrice: number
    lineTotal: number
    recipeCostSnapshot: number | null
    product: {
      category: string
    }
  }>
}

type ChartPoint = {
  label: string
  revenue: number
}

type Summary = {
  visitors: number
  orderCount: number
  salesQty: number
  revenue: number
  cost: number
  profit: number
  marginRate: number
  avgOrderValue: number
}

type RankedMetric = {
  label: string
  qty: number
  revenue: number
  cost: number
  profit: number
  marginRate: number
}

function formatCurrency(value: number) {
  return Number(value.toFixed(2))
}

function formatPercent(value: number) {
  return `${formatCurrency(value)}%`
}

function formatDateKey(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getReportDate(order: Pick<OrderWithItems, 'paymentStatus' | 'closedAt' | 'createdAt'>) {
  if (order.closedAt) return order.closedAt
  if (order.paymentStatus === 'paid') return order.createdAt
  return null
}

function getDayRange(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function getWeekStart(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function getWeekEnd(date: Date) {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

function getYearRange(year: number) {
  const start = new Date(year, 0, 1, 0, 0, 0, 0)
  const end = new Date(year, 11, 31, 23, 59, 59, 999)
  return { start, end }
}

function calcSummary(orders: OrderWithItems[]): Summary {
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const cost = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + (item.recipeCostSnapshot ?? 0),
        0
      ),
    0
  )
  const salesQty = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0),
    0
  )

  const namedCustomers = new Set(
    orders
      .map((order) => (order.customerName || '').trim())
      .filter((name) => name.length > 0)
  )

  const anonymousCount = orders.filter(
    (order) => !(order.customerName || '').trim()
  ).length

  const profit = revenue - cost
  const orderCount = orders.length

  return {
    visitors: namedCustomers.size + anonymousCount,
    orderCount,
    salesQty,
    revenue: formatCurrency(revenue),
    cost: formatCurrency(cost),
    profit: formatCurrency(profit),
    marginRate: revenue > 0 ? formatCurrency((profit / revenue) * 100) : 0,
    avgOrderValue: orderCount > 0 ? formatCurrency(revenue / orderCount) : 0,
  }
}

function aggregateItems(orders: OrderWithItems[]): RankedMetric[] {
  const itemsMap = new Map<string, RankedMetric>()

  for (const order of orders) {
    for (const item of order.items) {
      const label = item.variantNameSnapshot
        ? `${item.itemNameSnapshot} / ${item.variantNameSnapshot}`
        : item.itemNameSnapshot

      const current = itemsMap.get(label) || {
        label,
        qty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        marginRate: 0,
      }

      current.qty += item.qty
      current.revenue += item.lineTotal
      current.cost += item.recipeCostSnapshot ?? 0
      current.profit = current.revenue - current.cost
      current.marginRate =
        current.revenue > 0 ? (current.profit / current.revenue) * 100 : 0

      itemsMap.set(label, current)
    }
  }

  return Array.from(itemsMap.values()).map((item) => ({
    ...item,
    revenue: formatCurrency(item.revenue),
    cost: formatCurrency(item.cost),
    profit: formatCurrency(item.profit),
    marginRate: formatCurrency(item.marginRate),
  }))
}

function aggregateCategories(orders: OrderWithItems[]) {
  const categories = new Map<string, number>()

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.product.category || '未分類'
      categories.set(key, (categories.get(key) || 0) + item.lineTotal)
    }
  }

  return Array.from(categories.entries())
    .map(([label, value]) => ({ label, value: formatCurrency(value) }))
    .sort((a, b) => b.value - a.value)
}

function QuickPulseCards({
  items,
}: {
  items: Array<{
    label: string
    value: string
    helper: string
    tone?: 'amber' | 'emerald' | 'sky' | 'rose'
  }>
}) {
  const toneClass = {
    amber: 'border-[var(--border)] bg-[rgba(247,236,221,0.82)] text-[var(--accent-strong)]',
    emerald: 'border-[rgba(110,134,113,0.2)] bg-[rgba(110,134,113,0.1)] text-[var(--success)]',
    sky: 'border-[rgba(119,149,175,0.2)] bg-[rgba(119,149,175,0.1)] text-[#5d7991]',
    rose: 'border-[rgba(187,118,109,0.22)] bg-[rgba(187,118,109,0.1)] text-[var(--danger)]',
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`nomiya-worktile rounded-[1.75rem] p-5 ${toneClass[item.tone || 'amber']}`}
        >
          <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
            {item.label}
          </div>
          <div className="mt-4 text-5xl font-semibold leading-none">{item.value}</div>
          <div className="mt-3 text-[0.82rem] tracking-[0.03em] text-[var(--muted)]/80">
            {item.helper}
          </div>
        </div>
      ))}
    </section>
  )
}

function PeriodComparisonChart({
  items,
}: {
  items: Array<{ label: string; revenue: number; profit: number }>
}) {
  const maxValue = Math.max(
    ...items.flatMap((item) => [item.revenue, item.profit]),
    1
  )

  return (
    <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
            Comparison
          </div>
          <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
            期間比較
          </h2>
          <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">
            先看不同期間的營收和毛利落點
          </div>
        </div>
        <div className="flex gap-3 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            營收
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
            毛利
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <div key={item.label} className="nomiya-worktile rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-lg font-semibold text-[var(--foreground)]">{item.label}</div>
              <div className="text-sm text-[var(--muted)]">
                營收 ${item.revenue} / 毛利 ${item.profit}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>營收</span>
                  <span>{Math.round((item.revenue / maxValue) * 100)}%</span>
                </div>
                <div className="h-3 rounded-full bg-[rgba(150,109,70,0.18)]">
                  <div
                    className="h-3 rounded-full bg-[var(--accent)]"
                    style={{ width: `${(item.revenue / maxValue) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>毛利</span>
                  <span>{Math.round((item.profit / maxValue) * 100)}%</span>
                </div>
                <div className="h-3 rounded-full bg-[rgba(150,109,70,0.18)]">
                  <div
                    className="h-3 rounded-full bg-[var(--success)]"
                    style={{ width: `${(item.profit / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PeriodPanel({
  title,
  subtitle,
  summary,
  accent,
}: {
  title: string
  subtitle: string
  summary: Summary
  accent: string
}) {
  const profitWidth = summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0
  const costWidth = summary.revenue > 0 ? (summary.cost / summary.revenue) * 100 : 0

  return (
    <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
            Period
          </div>
          <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">{subtitle}</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-[0.7rem] tracking-[0.18em] font-semibold ${accent}`}>
          毛利率 {formatPercent(summary.marginRate)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="nomiya-worktile rounded-[1.5rem] p-5">
          <div className="text-sm text-[var(--muted)]">營收結構</div>
          <div className="mt-3 text-3xl font-bold text-[var(--foreground)]">${summary.revenue}</div>

          <div className="mt-5 grid gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-[var(--muted)]">
                <span>毛利</span>
                <span>${summary.profit}</span>
              </div>
              <div className="h-3 rounded-full bg-[rgba(150,109,70,0.18)]">
                <div
                  className="h-3 rounded-full bg-[var(--success)]"
                  style={{ width: `${Math.max(profitWidth, 4)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-[var(--muted)]">
                <span>成本</span>
                <span>${summary.cost}</span>
              </div>
              <div className="h-3 rounded-full bg-[rgba(150,109,70,0.18)]">
                <div
                  className="h-3 rounded-full bg-[var(--danger)]"
                  style={{ width: `${Math.max(costWidth, 4)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="nomiya-worktile rounded-[1.5rem] p-4">
            <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">ORDERS</div>
            <div className="mt-2 text-3xl font-bold text-[var(--accent-strong)]">
              {summary.orderCount}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              來客 {summary.visitors} / 銷量 {summary.salesQty}
            </div>
          </div>

          <div className="nomiya-worktile rounded-[1.5rem] p-4">
            <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">AVG CHECK</div>
            <div className="mt-2 text-3xl font-bold text-[var(--accent-strong)]">
              ${summary.avgOrderValue}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">每張單平均貢獻</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DonutChart({
  total,
  categories,
}: {
  total: number
  categories: Array<{ label: string; value: number }>
}) {
  const size = 220
  const strokeWidth = 24
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const colors = ['#8c4f2b', '#66735d', '#b98957', '#9f6258', '#7c8571', '#c09073']
  const segments = categories.map((item) => {
    const valueRatio = total > 0 ? item.value / total : 0
    return circumference * valueRatio
  })

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(76,58,43,0.14)"
          strokeWidth={strokeWidth}
        />
        {categories.map((item, index) => {
          const ratio = total > 0 ? item.value / total : 0
          const dash = circumference * ratio
          const gap = circumference - dash
          const offset =
            -segments.slice(0, index).reduce((sum, value) => sum + value, 0)

          return (
            <circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </svg>

      <div className="-mt-32 text-center">
        <div className="text-sm text-[var(--muted)]">本日已結帳營收</div>
        <div className="mt-2 text-3xl font-bold text-[var(--accent-strong)]">
          ${formatCurrency(total)}
        </div>
      </div>
    </div>
  )
}

function CategoryBreakdownList({
  total,
  categories,
}: {
  total: number
  categories: Array<{ label: string; value: number }>
}) {
  return (
    <div className="grid gap-3">
      {categories.length === 0 ? (
        <div className="nomiya-sheet rounded-2xl p-4 text-[var(--muted)]">
          今天還沒有已結帳資料
        </div>
      ) : (
        categories.map((item) => {
          const ratio = total > 0 ? (item.value / total) * 100 : 0

          return (
            <div
              key={item.label}
              className="nomiya-worktile rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-[var(--foreground)]">{item.label}</div>
                <div className="font-semibold text-[var(--accent-strong)]">${item.value}</div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[rgba(150,109,70,0.18)]">
                <div
                  className="h-2 rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(ratio, 6)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-[var(--muted-soft)]">
                佔今日營收 {formatPercent(ratio)}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function RankedList({
  title,
  subtitle,
  items,
  mode,
}: {
  title: string
  subtitle: string
  items: RankedMetric[]
  mode: 'revenue' | 'profit' | 'watch'
}) {
  return (
    <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6">
      <div>
        <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
          Ranking
        </div>
        <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">{title}</h2>
        <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">{subtitle}</div>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <div className="nomiya-sheet rounded-2xl p-4 text-[var(--muted)]">
            目前沒有資料
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${mode}-${item.label}`}
              className="nomiya-worktile rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-[var(--muted-soft)]">第 {index + 1} 名</div>
                  <div className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm text-[var(--muted)]">
                    售出 {item.qty} 份
                  </div>
                </div>

                <div className="text-right">
                  {mode === 'revenue' ? (
                    <>
                      <div className="text-sm text-[var(--muted-soft)]">營收</div>
                      <div className="mt-2 text-2xl font-semibold leading-none text-[var(--accent-strong)]">
                        ${item.revenue}
                      </div>
                    </>
                  ) : null}

                  {mode === 'profit' ? (
                    <>
                      <div className="text-sm text-[var(--muted-soft)]">毛利</div>
                      <div className="mt-2 text-2xl font-semibold leading-none text-[var(--success)]">
                        ${item.profit}
                      </div>
                    </>
                  ) : null}

                  {mode === 'watch' ? (
                    <>
                      <div className="text-sm text-[var(--muted-soft)]">毛利率</div>
                      <div className="mt-2 text-2xl font-semibold leading-none text-[var(--danger)]">
                        {formatPercent(item.marginRate)}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-3">
                <div>營收 ${item.revenue}</div>
                <div>成本 ${item.cost}</div>
                <div>毛利 ${item.profit}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function CompactChart({
  title,
  points,
}: {
  title: string
  points: ChartPoint[]
}) {
  const maxRevenue = Math.max(...points.map((p) => p.revenue), 1)

  return (
    <details className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
              Trend
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{title}</div>
            <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">點開查看詳細紀錄</div>
          </div>
          <div className="text-sm text-[var(--muted)]/72">{points.length} 筆</div>
        </div>
      </summary>

      <div className="mt-5 overflow-x-auto">
        <div
          className="flex h-64 items-end gap-2 rounded-3xl bg-[rgba(247,236,221,0.58)] p-4"
          style={{ minWidth: `${Math.max(points.length * 52, 520)}px` }}
        >
          {points.map((point) => {
            const height = `${Math.max(
              (point.revenue / maxRevenue) * 100,
              point.revenue > 0 ? 6 : 0
            )}%`

            return (
              <div
                key={point.label}
                className="flex h-full min-w-[40px] flex-1 flex-col items-center justify-end"
              >
                <div className="mb-2 text-[10px] text-[var(--muted)]/78">
                  ${formatCurrency(point.revenue)}
                </div>

                <div
                  className="w-full rounded-t-xl bg-[var(--accent)]"
                  style={{ height }}
                />

                <div className="mt-2 text-center text-[10px] text-[var(--muted)]/78">
                  {point.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </details>
  )
}

function buildDailyRevenueSeries(
  endDate: Date,
  orders: OrderWithItems[],
  days: number
): ChartPoint[] {
  const points: ChartPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(endDate)
    day.setDate(endDate.getDate() - i)
    const key = formatDateKey(day)

    const revenue = orders
      .filter((order) => {
        const reportDate = getReportDate(order)
        return reportDate && formatDateKey(reportDate) === key
      })
      .reduce((sum, order) => sum + order.totalAmount, 0)

    points.push({
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      revenue: formatCurrency(revenue),
    })
  }

  return points
}

function buildMonthlyRevenueSeries(
  endDate: Date,
  orders: OrderWithItems[],
  months: number
): ChartPoint[] {
  const points: ChartPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()

    const revenue = orders
      .filter((order) => {
        const reportDate = getReportDate(order)
        if (!reportDate) return false
        return (
          reportDate.getFullYear() === year &&
          reportDate.getMonth() === month
        )
      })
      .reduce((sum, order) => sum + order.totalAmount, 0)

    points.push({
      label: `${date.getFullYear()}/${date.getMonth() + 1}`,
      revenue: formatCurrency(revenue),
    })
  }

  return points
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    year?: string
    month?: string
    day?: string
    reportYear?: string
    reportMonth?: string
  }>
}) {
  const params = (await searchParams) || {}

  const now = new Date()

  const selectedYear = Number(params.year || now.getFullYear())
  const selectedMonth = Number(params.month || now.getMonth() + 1)
  const selectedDay = Number(params.day || now.getDate())
  const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay)
  selectedDate.setHours(12, 0, 0, 0)

  const reportYear = Number(params.reportYear || now.getFullYear())
  const reportMonth = Number(params.reportMonth || now.getMonth() + 1)

  const { start: dayStart, end: dayEnd } = getDayRange(selectedDate)
  const weekStart = getWeekStart(selectedDate)
  const weekEnd = getWeekEnd(selectedDate)
  const { start: monthStart, end: monthEnd } = getMonthRange(reportYear, reportMonth)
  const { start: yearStart, end: yearEnd } = getYearRange(reportYear)

  const earliestStart = new Date(
    Math.min(
      dayStart.getTime(),
      weekStart.getTime(),
      monthStart.getTime(),
      yearStart.getTime()
    )
  )
  const latestEnd = new Date(
    Math.max(
      dayEnd.getTime(),
      weekEnd.getTime(),
      monthEnd.getTime(),
      yearEnd.getTime()
    )
  )

  const orders = (await prisma.order.findMany({
    where: {
      paymentStatus: 'paid',
      OR: [
        {
          closedAt: {
            gte: earliestStart,
            lte: latestEnd,
          },
        },
        {
          closedAt: null,
          createdAt: {
            gte: earliestStart,
            lte: latestEnd,
          },
        },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { closedAt: 'desc' },
  })) as OrderWithItems[]

  const dayOrders = orders.filter((order) => {
    const reportDate = getReportDate(order)
    if (!reportDate) return false
    return reportDate >= dayStart && reportDate <= dayEnd
  })

  const weekOrders = orders.filter((order) => {
    const reportDate = getReportDate(order)
    if (!reportDate) return false
    return reportDate >= weekStart && reportDate <= weekEnd
  })

  const monthOrders = orders.filter((order) => {
    const reportDate = getReportDate(order)
    if (!reportDate) return false
    return reportDate >= monthStart && reportDate <= monthEnd
  })

  const yearOrders = orders.filter((order) => {
    const reportDate = getReportDate(order)
    if (!reportDate) return false
    return reportDate >= yearStart && reportDate <= yearEnd
  })

  const daySummary = calcSummary(dayOrders)
  const weekSummary = calcSummary(weekOrders)
  const monthSummary = calcSummary(monthOrders)
  const yearSummary = calcSummary(yearOrders)

  const monthItemMetrics = aggregateItems(monthOrders)
  const topRevenueItems = [...monthItemMetrics]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
  const topProfitItems = [...monthItemMetrics]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
  const watchItems = monthItemMetrics
    .filter((item) => item.revenue > 0)
    .sort((a, b) => {
      if (a.marginRate !== b.marginRate) return a.marginRate - b.marginRate
      return b.revenue - a.revenue
    })
    .slice(0, 5)

  const dayCategoryMetrics = aggregateCategories(dayOrders).slice(0, 6)
  const dayRevenueTotal = dayCategoryMetrics.reduce(
    (sum, item) => sum + item.value,
    0
  )
  const quickPulse = [
    {
      label: 'TODAY REVENUE',
      value: `$${daySummary.revenue}`,
      helper: `今天 ${daySummary.orderCount} 張單，均單 $${daySummary.avgOrderValue}`,
      tone: 'amber' as const,
    },
    {
      label: 'MONTH PROFIT',
      value: `$${monthSummary.profit}`,
      helper: `本月毛利率 ${formatPercent(monthSummary.marginRate)}`,
      tone: 'emerald' as const,
    },
    {
      label: 'YEAR REVENUE',
      value: `$${yearSummary.revenue}`,
      helper: `今年累積 ${yearSummary.orderCount} 張已結帳訂單`,
      tone: 'sky' as const,
    },
    {
      label: 'LOW MARGIN WATCH',
      value: watchItems[0] ? `${formatPercent(watchItems[0].marginRate)}` : '—',
      helper: watchItems[0] ? watchItems[0].label : '目前沒有低毛利警示',
      tone: 'rose' as const,
    },
  ]
  const periodComparison = [
    { label: '本日', revenue: daySummary.revenue, profit: daySummary.profit },
    { label: '本週', revenue: weekSummary.revenue, profit: weekSummary.profit },
    { label: '本月', revenue: monthSummary.revenue, profit: monthSummary.profit },
    { label: '今年', revenue: yearSummary.revenue, profit: yearSummary.profit },
  ]

  return (
    <main className="nomiya-shell min-h-screen p-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminNav />

        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament overflow-hidden rounded-[2rem]"
          data-reveal="hero"
        >
          <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8" data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="nomiya-section-no">05 Reports</div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="text-sm tracking-[0.35em] text-[var(--muted-soft)]">
                  営業記録
                </div>
                <div className="nomiya-pill-soft">DAILY TO YEARLY</div>
              </div>
              <h1 className="nomiya-display nomiya-kinetic-title mt-4 text-5xl font-semibold tracking-[0.18em] text-[var(--foreground)]">
                <span>常久</span>
              </h1>
              <div className="mt-4 text-lg text-[var(--foreground)]/92">
                小店真正需要看的，是已結帳營收與毛利，不是漂亮但用不到的熱鬧數字
              </div>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {brandCopy.story.reports} {brandCopy.story.reportsSecondary}
              </p>
            </div>

            <div
              className="border-l border-[var(--border)] bg-[linear-gradient(135deg,_rgba(233,220,204,0.7),_rgba(246,240,232,0.88))] p-8"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="nomiya-kpi rounded-[1.5rem] p-6">
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                  THIS MONTH
                </div>
                <div className="mt-4 text-5xl font-semibold leading-none text-[var(--foreground)]">
                  ${monthSummary.profit}
                </div>
                <div className="mt-3 text-[0.84rem] leading-7 text-[var(--muted)]/82">
                  本月毛利，毛利率 {formatPercent(monthSummary.marginRate)}。
                  先守住這兩個數字，小酒吧的經營判斷會清楚很多，也比較不會被一時熱鬧騙走。
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
          data-reveal="scale"
          style={{ ['--reveal-delay' as string]: '80ms' }}
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Date Review
              </div>
              <h2 className="nomiya-display mt-2 text-3xl font-semibold text-[var(--foreground)]">日期回顧</h2>
              <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">
                今日與本週以結帳日為準
              </div>

              <form method="GET" className="mt-4 grid gap-3 md:grid-cols-4">
                <input
                  type="number"
                  name="year"
                  defaultValue={selectedDate.getFullYear()}
                  className="nomiya-input rounded-2xl p-3"
                  placeholder="年"
                />
                <input
                  type="number"
                  name="month"
                  defaultValue={selectedDate.getMonth() + 1}
                  className="nomiya-input rounded-2xl p-3"
                  placeholder="月"
                />
                <input
                  type="number"
                  name="day"
                  defaultValue={selectedDate.getDate()}
                  className="nomiya-input rounded-2xl p-3"
                  placeholder="日"
                />
                <button
                  type="submit"
                  className="nomiya-button-primary rounded-2xl px-4 py-3 font-semibold"
                >
                  更新日期
                </button>
              </form>
            </div>

            <div>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Report Month
              </div>
              <h2 className="nomiya-display mt-2 text-3xl font-semibold text-[var(--foreground)]">報表月份</h2>
              <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">
                本月與全年報表基準
              </div>

              <form method="GET" className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="year" defaultValue={selectedYear} />
                <input type="hidden" name="month" defaultValue={selectedMonth} />
                <input type="hidden" name="day" defaultValue={selectedDay} />
                <input
                  type="number"
                  name="reportYear"
                  defaultValue={reportYear}
                  className="nomiya-input rounded-2xl p-3"
                  placeholder="年"
                />
                <input
                  type="number"
                  name="reportMonth"
                  defaultValue={reportMonth}
                  className="nomiya-input rounded-2xl p-3"
                  placeholder="月"
                />
                <button
                  type="submit"
                  className="nomiya-button-secondary rounded-2xl px-4 py-3 font-semibold"
                >
                  更新報表
                </button>
              </form>
            </div>
          </div>
        </section>

        <div data-reveal="scale" style={{ ['--reveal-delay' as string]: '120ms' }}>
          <QuickPulseCards items={quickPulse} />
        </div>

        <section className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
          <div
            className="nomiya-route nomiya-panel rounded-[2rem] p-6 2xl:sticky 2xl:top-28 2xl:self-start"
            data-reveal="left"
            style={{ ['--reveal-delay' as string]: '120ms' }}
          >
            <div className="nomiya-route-item">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 01</div>
              <div className="nomiya-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
                今日から今年まで
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
              <div className="text-sm leading-7 text-[var(--muted)]">
                先看不同期間的營收與毛利，再看今天靠哪些類別撐住現場節奏，哪些只是熱鬧卻沒真的賺到。這樣比較像回想昨晚發生了什麼，不像被報表追著跑。
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 03</div>
              <div className="text-sm leading-7 text-[var(--muted)]">
                往下會接趨勢和排行，讓你像回頭想一整晚發生了什麼，不只是盯著表格堆疊，還能知道下一步要不要補酒、調價或再推一次。
              </div>
            </div>
          </div>

          <div className="grid gap-6">
          <div data-reveal="left" style={{ ['--reveal-delay' as string]: '140ms' }}>
            <PeriodComparisonChart items={periodComparison} />
          </div>

          <div
            className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
            data-reveal="right"
            style={{ ['--reveal-delay' as string]: '200ms' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                  Day Structure
                </div>
                <h2 className="nomiya-display mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  本日營收結構
                </h2>
                <div className="mt-1 text-[0.84rem] text-[var(--muted)]/82">
                  看今天主要靠哪些類別撐營收
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
              {dayRevenueTotal <= 0 ? (
                <div className="xl:col-span-2">
                  <div className="nomiya-sheet rounded-[1.6rem] p-6 text-center">
                    <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                      No Paid Orders Yet
                    </div>
                    <div className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                      今天還沒有已結帳資料
                    </div>
                    <div className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      等今天第一批結帳進來後，這裡會再顯示類別結構與營收占比。
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <DonutChart total={dayRevenueTotal} categories={dayCategoryMetrics} />
                  <CategoryBreakdownList
                    total={dayRevenueTotal}
                    categories={dayCategoryMetrics}
                  />
                </>
              )}
            </div>
          </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <div
            className="nomiya-panel nomiya-panel-ornate rounded-[2rem] p-6 2xl:sticky 2xl:top-28 2xl:self-start"
            data-reveal="left"
            style={{ ['--reveal-delay' as string]: '120ms' }}
          >
            <div className="nomiya-section-no">06 Reading</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="nomiya-ribbon">Report Story</div>
              <div className="nomiya-stamp">帳票</div>
            </div>
            <h2 className="nomiya-display nomiya-kinetic-title mt-5 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
              <span>數字先被看見，判斷才會慢慢變清楚。</span>
            </h2>
            <div className="mt-3 text-sm tracking-[0.2em] text-[var(--muted-soft)]">
              数字にも、読む順番がある
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
              這一段不是再塞更多統計，而是把已經有的資訊換成更像常久自己回頭看店的節奏。先看到趨勢，再看排行，最後才判斷哪個品項真的值得推，哪個只是氣氛很好但其實沒幫你賺錢。
            </p>
            <div className="nomiya-marquee mt-8">
              <div className="nomiya-marquee-track">
                <span>REVENUE</span>
                <span>PROFIT</span>
                <span>TREND</span>
                <span>RANKING</span>
                <span>REVENUE</span>
                <span>PROFIT</span>
                <span>TREND</span>
                <span>RANKING</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <article
              className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '160ms' }}
            >
              <div className="nomiya-photo-frame nomiya-sticky-showcase rounded-[1rem]">
                <div className="nomiya-ghost-word">売</div>
                <div className="nomiya-photo-caption">
                  <span>REVENUE FLOW</span>
                  <span>06</span>
                </div>
              </div>

              <div className="nomiya-worktile rounded-[1.5rem] p-6">
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
                <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  先看節奏，再看細節
                </h3>
                <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                  まず流れ、それから中身
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                  今天、本週、本月、今年這四層不是同時搶你注意，而是讓你像回想一整晚一樣，從大方向慢慢走進店的營運狀態，先知道有沒有賺，再問怎麼賺。
                </p>
              </div>
            </article>

            <article
              className="nomiya-panel nomiya-ornament overflow-hidden rounded-[1.5rem] p-6"
              data-reveal="left"
              style={{ ['--reveal-delay' as string]: '220ms' }}
            >
              <div className="nomiya-ghost-word">利</div>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 02</div>
              <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                排行不是結論，是下一步的提示
              </h3>
              <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                順位から、次の判断へ
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">高營收</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    客人最願意把錢花在哪裡，也看得出今晚大家真正想喝什麼、想吃什麼。
                  </div>
                </div>
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">高毛利</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    哪些品項真正值得繼續推，甚至該放到更前面給客人看。
                  </div>
                </div>
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">低毛利</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    哪些品項應該重新檢查成本或定價，不然越忙越像在白做。
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div data-reveal="left" style={{ ['--reveal-delay' as string]: '100ms' }}>
            <PeriodPanel
            title="本日"
            subtitle="只計算已結帳訂單"
            summary={daySummary}
            accent="border border-[var(--border)] bg-[rgba(247,236,221,0.82)] text-[var(--accent-strong)]"
          />
          </div>
          <div data-reveal="right" style={{ ['--reveal-delay' as string]: '160ms' }}>
            <PeriodPanel
            title="本週"
            subtitle="看這週是否維持穩定節奏"
            summary={weekSummary}
            accent="border border-[var(--border)] bg-[rgba(247,236,221,0.82)] text-[var(--accent-strong)]"
          />
          </div>
          <div data-reveal="left" style={{ ['--reveal-delay' as string]: '220ms' }}>
            <PeriodPanel
            title="本月"
            subtitle="用來判斷酒單與餐點組合是否合理"
            summary={monthSummary}
            accent="border border-[var(--border)] bg-[rgba(247,236,221,0.82)] text-[var(--accent-strong)]"
          />
          </div>
          <div data-reveal="right" style={{ ['--reveal-delay' as string]: '280ms' }}>
            <PeriodPanel
            title="今年"
            subtitle="長期觀察營業體質"
            summary={yearSummary}
            accent="border border-[var(--border)] bg-[rgba(247,236,221,0.82)] text-[var(--accent-strong)]"
          />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div data-reveal="left" style={{ ['--reveal-delay' as string]: '120ms' }}>
            <CompactChart
            title="近 14 天已結帳營收"
            points={buildDailyRevenueSeries(selectedDate, orders, 14)}
          />
          </div>
          <div data-reveal="right" style={{ ['--reveal-delay' as string]: '180ms' }}>
            <CompactChart
            title="近 12 個月已結帳營收"
            points={buildMonthlyRevenueSeries(
              new Date(reportYear, reportMonth - 1, 1),
              orders,
              12
            )}
          />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div data-reveal="left" style={{ ['--reveal-delay' as string]: '100ms' }}>
            <RankedList
            title="本月高營收品項"
            subtitle="知道客人最常把錢花在哪裡"
            items={topRevenueItems}
            mode="revenue"
          />
          </div>
          <div data-reveal="scale" style={{ ['--reveal-delay' as string]: '160ms' }}>
            <RankedList
            title="本月高毛利品項"
            subtitle="知道哪些品項最值得持續推"
            items={topProfitItems}
            mode="profit"
          />
          </div>
          <div data-reveal="right" style={{ ['--reveal-delay' as string]: '220ms' }}>
            <RankedList
            title="本月毛利偏低"
            subtitle="高營收但毛利不漂亮的品項要特別留意"
            items={watchItems}
            mode="watch"
          />
          </div>
        </section>
      </div>
    </main>
  )
}
