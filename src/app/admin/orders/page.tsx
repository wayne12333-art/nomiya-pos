import { prisma } from '@/lib/prisma'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  status?: string
  q?: string
  from?: string
  to?: string
  range?: string
}>

function formatDateInput(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getQuickRanges(now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + mondayOffset)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    today: {
      from: formatDateInput(today),
      to: formatDateInput(today),
    },
    week: {
      from: formatDateInput(weekStart),
      to: formatDateInput(today),
    },
    month: {
      from: formatDateInput(monthStart),
      to: formatDateInput(today),
    },
  }
}

function formatDateTime(value: Date | string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-TW')
}

function getVoidReason(note: string | null) {
  if (!note) return null
  const match = note.match(/作廢原因：([^\n]+)/)
  return match ? match[1] : null
}

function getStatusLabel(status: string) {
  if (status === 'open') return '未結帳'
  if (status === 'paid') return '已結帳'
  if (status === 'voided') return '已作廢'
  return status
}

function getStatusClass(status: string) {
  if (status === 'open') {
    return 'border-[rgba(189,125,70,0.3)] bg-[rgba(189,125,70,0.12)] text-[var(--accent-strong)]'
  }
  if (status === 'paid') {
    return 'border-[rgba(110,134,113,0.3)] bg-[rgba(110,134,113,0.14)] text-[var(--success)]'
  }
  if (status === 'voided') {
    return 'border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.14)] text-[var(--danger)]'
  }
  return 'border-[var(--border)] bg-[rgba(255,248,238,0.45)] text-[var(--foreground)]'
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="nomiya-panel-soft rounded-[1.4rem] p-4">
      <div className="text-xs tracking-[0.2em] text-[var(--muted-soft)]">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</div>
    </div>
  )
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const status = params.status || 'all'
  const q = (params.q || '').trim()
  const range = (params.range || '').trim()
  const quickRanges = getQuickRanges(new Date())
  const rangeValue =
    range === 'today' || range === 'week' || range === 'month' ? range : ''
  const from = params.from || (rangeValue ? quickRanges[rangeValue].from : '')
  const to = params.to || (rangeValue ? quickRanges[rangeValue].to : '')

  const where: {
    paymentStatus?: string
    OR?: Array<{ customerName?: { contains: string; mode: 'insensitive' } }>
    createdAt?: {
      gte?: Date
      lt?: Date
    }
  } = {}

  if (status !== 'all') {
    where.paymentStatus = status
  }

  if (q) {
    where.OR = [
      {
        customerName: {
          contains: q,
          mode: 'insensitive',
        },
      },
    ]
  }

  if (from || to) {
    where.createdAt = {}

    if (from) {
      where.createdAt.gte = new Date(`${from}T00:00:00`)
    }

    if (to) {
      const end = new Date(`${to}T00:00:00`)
      end.setDate(end.getDate() + 1)
      where.createdAt.lt = end
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: true,
      items: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const summary = {
    total: orders.length,
    open: orders.filter((order) => order.paymentStatus === 'open').length,
    paid: orders.filter((order) => order.paymentStatus === 'paid').length,
    voided: orders.filter((order) => order.paymentStatus === 'voided').length,
    revenue: orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.totalAmount, 0),
  }

  return (
    <main className="nomiya-shell p-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminNav />

        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament rounded-[2.4rem] p-6"
          data-reveal="hero"
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Orders
              </div>
              <h1 className="nomiya-display nomiya-kinetic-title mt-3 text-4xl font-semibold text-[var(--foreground)]">
                <span>訂單列表</span>
              </h1>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                注文の記録
              </div>
              <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {brandCopy.orders.title}
              </div>
            </div>

            <div
              className="xl:w-[820px]"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <a
                  href={`?status=${status}&q=${encodeURIComponent(q)}&range=today`}
                  className={`rounded-full px-4 py-2 text-sm ${
                    rangeValue === 'today'
                      ? 'nomiya-button-primary font-semibold'
                      : 'nomiya-button-secondary'
                  }`}
                >
                  今天
                </a>
                <a
                  href={`?status=${status}&q=${encodeURIComponent(q)}&range=week`}
                  className={`rounded-full px-4 py-2 text-sm ${
                    rangeValue === 'week'
                      ? 'nomiya-button-primary font-semibold'
                      : 'nomiya-button-secondary'
                  }`}
                >
                  本週
                </a>
                <a
                  href={`?status=${status}&q=${encodeURIComponent(q)}&range=month`}
                  className={`rounded-full px-4 py-2 text-sm ${
                    rangeValue === 'month'
                      ? 'nomiya-button-primary font-semibold'
                      : 'nomiya-button-secondary'
                  }`}
                >
                  本月
                </a>
                <a
                  href="/admin/orders"
                  className="nomiya-button-secondary rounded-full px-4 py-2 text-sm"
                >
                  清除快捷
                </a>
              </div>

              <form className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="range" value="" />
                <select
                  name="status"
                  defaultValue={status}
                  className="nomiya-input rounded-2xl p-4"
              >
                <option value="all">全部狀態</option>
                <option value="open">未結帳</option>
                <option value="paid">已結帳</option>
                <option value="voided">已作廢</option>
              </select>

              <input
                name="q"
                defaultValue={q}
                placeholder="搜尋客人名稱"
                className="nomiya-input rounded-2xl p-4"
              />

              <input
                type="date"
                name="from"
                defaultValue={from}
                className="nomiya-input rounded-2xl p-4"
              />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="to"
                    defaultValue={to}
                  className="nomiya-input rounded-2xl p-4"
                />
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
                  href="/admin/orders"
                  className="nomiya-button-secondary rounded-full px-4 py-2 text-sm"
                >
                  重設條件
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          data-reveal="scale"
          style={{ ['--reveal-delay' as string]: '120ms' }}
        >
          <StatCard label="總訂單數" value={`${summary.total}`} />
          <StatCard label="未結帳" value={`${summary.open}`} />
          <StatCard label="已結帳" value={`${summary.paid}`} />
          <StatCard label="已作廢" value={`${summary.voided}`} />
          <StatCard label="已結帳營收" value={`$${summary.revenue}`} />
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
                一晚一晚留下來的記錄
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
              <div className="text-sm leading-7 text-[var(--muted)]">{brandCopy.orders.story}</div>
            </div>
          </div>

          <div
            className="nomiya-panel nomiya-ornament rounded-[2rem] p-6"
            data-reveal="right"
            style={{ ['--reveal-delay' as string]: '180ms' }}
          >
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
            <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
              先看這段時間發生了什麼，再往下翻每一張單
            </h3>
            <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
              まず流れ、それから一枚ずつ
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              狀態、時間、付款方式、作廢原因都不是多餘欄位，它們是在幫你回想那晚到底是順著收乾淨，還是有哪裡卡住。
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {orders.length === 0 ? (
            <div
              className="nomiya-empty rounded-[2rem] p-6 text-[var(--muted)]"
              data-reveal="scale"
              style={{ ['--reveal-delay' as string]: '160ms' }}
            >
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                No Orders Found
              </div>
              <div className="mt-3 text-lg font-semibold text-[var(--foreground)]">目前沒有符合條件的訂單</div>
              <div className="mt-2 text-sm leading-7">
                可以先切回今天、本週或本月，也能清除篩選條件重新查看全部訂單。
              </div>
            </div>
          ) : (
            orders.map((order, index) => {
              const voidReason = getVoidReason(order.note)

              return (
                <article
                  key={order.id}
                  className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
                  data-reveal={index % 2 === 0 ? 'left' : 'right'}
                  style={{ ['--reveal-delay' as string]: `${120 + (index % 4) * 60}ms` }}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-[var(--foreground)]">
                          {order.customerName || '未命名客人'}
                        </h2>

                        <span
                          className={`rounded-full border px-3 py-1 text-sm ${getStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {getStatusLabel(order.paymentStatus)}
                        </span>
                      </div>

                      <div className="text-sm text-[var(--muted)]">
                        開單時間：{formatDateTime(order.createdAt)}
                      </div>

                      <div className="text-sm text-[var(--muted)]">
                        結束時間：{formatDateTime(order.closedAt)}
                      </div>

                      <div className="text-sm text-[var(--muted)]">
                        付款方式：{order.paymentMethod || '—'}
                      </div>

                      {order.note ? (
                        <div className="whitespace-pre-line text-sm text-[var(--muted)]">
                          備註：{order.note}
                        </div>
                      ) : null}

                      {voidReason ? (
                        <div className="text-sm text-[var(--danger)]">作廢原因：{voidReason}</div>
                      ) : null}
                    </div>

                    <div className="grid min-w-[260px] gap-3 sm:grid-cols-4 xl:grid-cols-1">
                      <StatCard label="小計" value={`$${order.subtotal}`} />
                      <StatCard label="折扣" value={`$${order.discountAmount}`} />
                      <StatCard label="加價" value={`$${order.adjustmentAmount ?? 0}`} />
                      <StatCard label="總額" value={`$${order.totalAmount}`} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {order.items.length === 0 ? (
                      <div className="nomiya-empty rounded-2xl p-4 text-[var(--muted)]">
                        此訂單沒有品項
                      </div>
                    ) : (
                      order.items.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4 ${
                            item.itemStatus === 'cancelled'
                              ? 'border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.12)]'
                              : 'border-[var(--border)] bg-[rgba(255,248,238,0.48)]'
                          }`}
                        >
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                              <div className="font-semibold text-[var(--foreground)]">
                                {item.itemNameSnapshot}
                              </div>

                              <div className="mt-1 text-sm text-[var(--muted)]">
                                數量：{item.qty} / 單價：${item.unitPrice} / 小計：${item.lineTotal}
                              </div>

                              {item.variantNameSnapshot ? (
                                <div className="mt-1 text-sm text-[var(--muted)]">
                                  變體：{item.variantNameSnapshot}
                                </div>
                              ) : null}

                              {item.itemStatus === 'cancelled' ? (
                                <div className="mt-1 text-sm text-[var(--danger)]">
                                  已取消：{item.cancelReason || '未填原因'}
                                </div>
                              ) : null}
                            </div>

                            <div className="text-sm text-[var(--muted)]">
                              {formatDateTime(item.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              )
            })
          )}
        </section>
      </div>
    </main>
  )
}
