import Link from 'next/link'
import { brandCopy } from '@/lib/brand-copy'
import { prisma } from '@/lib/prisma'
import AdminNav from './admin-nav'

export const dynamic = 'force-dynamic'

function getStartOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getStartOfTomorrow() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
}

function getStartOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function formatCurrency(value: number) {
  return Number(value.toFixed(2))
}

export default async function AdminHomePage() {
  const startOfToday = getStartOfToday()
  const startOfTomorrow = getStartOfTomorrow()
  const startOfMonth = getStartOfMonth()

  const [todayPaidOrders, todayVoidedOrders, openOrders, monthPaidOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          paymentStatus: 'paid',
          closedAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          closedAt: 'desc',
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'voided',
          closedAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
        orderBy: {
          closedAt: 'desc',
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'open',
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'paid',
          closedAt: {
            gte: startOfMonth,
            lt: startOfTomorrow,
          },
        },
      }),
    ])

  const todayRevenue = todayPaidOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  )
  const monthRevenue = monthPaidOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  )
  const todayGuestCount = todayPaidOrders.length

  const todayTopItemsMap = new Map<
    string,
    { name: string; qty: number; amount: number }
  >()

  for (const order of todayPaidOrders) {
    for (const item of order.items) {
      if (item.itemStatus !== 'active') continue

      const key = item.itemNameSnapshot
      const current = todayTopItemsMap.get(key) || {
        name: key,
        qty: 0,
        amount: 0,
      }

      current.qty += item.qty
      current.amount += item.lineTotal
      todayTopItemsMap.set(key, current)
    }
  }

  const todayTopItems = Array.from(todayTopItemsMap.values())
    .sort((a, b) => {
      if (b.qty !== a.qty) return b.qty - a.qty
      return b.amount - a.amount
    })
    .slice(0, 5)

  const quickStats = [
    {
      label: '今日來客',
      value: `${todayGuestCount}`,
      helper: '先當作今晚有來坐下喝一杯的人數',
      tone: 'text-[var(--accent-strong)]',
    },
    {
      label: '今日營收',
      value: `$${formatCurrency(todayRevenue)}`,
      helper: '今晚目前真的有收進來的錢',
      tone: 'text-[var(--foreground)]',
    },
    {
      label: '本月營收',
      value: `$${formatCurrency(monthRevenue)}`,
      helper: '這個月目前累積到這裡',
      tone: 'text-[var(--success)]',
    },
    {
      label: '未結帳單',
      value: `${openOrders.length}`,
      helper: '還在吧台上、還沒真正收乾淨的單',
      tone: 'text-[#ffe2a8]',
    },
    {
      label: '作廢單',
      value: `${todayVoidedOrders.length}`,
      helper: '今晚有幾次按錯或臨時改變主意',
      tone: 'text-[var(--danger)]',
    },
  ]

  const shortcuts = [
    {
      href: '/admin/products',
      label: '商品管理',
      description: '把酒、下酒菜、配方和扣庫先整理好',
    },
    {
      href: '/admin/purchases',
      label: '進貨管理',
      description: '酒快沒了就補，也順手把成本記清楚',
    },
    {
      href: '/admin/inventory',
      label: '庫存總覽',
      description: '先看今晚哪些東西快沒了、哪裡對不起來',
    },
    {
      href: '/admin/reports',
      label: '營運報表',
      description: '回頭看今天有沒有賺、這個月靠誰在撐',
    },
  ]

  return (
    <main className="nomiya-shell p-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminNav />

        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament nomiya-grid-glow overflow-hidden rounded-[2.5rem] p-6 md:p-8"
          data-reveal="hero"
        >
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="nomiya-section-no">04 Dashboard</div>
              <div className="flex items-center gap-3">
                <div className="nomiya-ribbon">Nomiya Dashboard</div>
                <div className="nomiya-stamp">營運</div>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-5">
                <div className="flex min-h-[132px] w-[88px] items-center justify-center border border-[var(--border-strong)] bg-[rgba(255,252,247,0.96)] text-[#17120f]">
                  <div className="nomiya-sign nomiya-sign-soft">
                    <span className="nomiya-sign-main">飲</span>
                    <span className="nomiya-sign-main">酒</span>
                    <span className="nomiya-sign-main">屋</span>
                    <span className="nomiya-sign-main">常</span>
                    <span className="nomiya-sign-main">久</span>
                  </div>
                </div>

                <div>
                  <h1 className="nomiya-display nomiya-kinetic-title text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
                    <span>飲酒屋 常久</span>
                  </h1>
                  <div className="mt-2 text-base text-[var(--foreground)]/92 md:text-lg">
                    今日もなんとか、いい夜にしたい
                  </div>
                  <div className="mt-2 text-sm tracking-[0.2em] text-[var(--muted-soft)]">
                    今夜の流れを、やわらかく見渡す
                  </div>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
                {brandCopy.story.dashboard} {brandCopy.story.dashboardSecondary}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/pos"
                  className="nomiya-button-primary rounded-full px-5 py-3 text-sm font-semibold"
                >
                  直接前往 POS
                </Link>
                <Link
                  href="/admin/reports"
                  className="nomiya-button-secondary rounded-full px-5 py-3 text-sm"
                >
                  查看完整報表
                </Link>
              </div>

              <div className="nomiya-route mt-6 max-w-2xl space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(252,246,237,0.72)] p-4 text-sm text-[var(--muted)]">
                <div className="nomiya-route-item">
                  <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 01</div>
                  <div className="mt-2 leading-7">先確認今晚大概有沒有動起來，別一開始就把自己埋進細節裡。</div>
                </div>
                <div className="nomiya-route-item">
                  <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 02</div>
                  <div className="mt-2 leading-7">如果現場還有未結帳單，就先回 POS；如果差不多收乾淨了，再往下看熱賣、庫存和報表。</div>
                </div>
              </div>
            </div>

            <div
              className="grid gap-4 md:grid-cols-2"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              {quickStats.map((item) => (
                <div key={item.label} className="nomiya-kpi rounded-[1.8rem] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                        {item.label}
                      </div>
                      <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                        {item.label === '今日來客'
                          ? 'きょうの客数'
                          : item.label === '今日營收'
                            ? 'きょうの売上'
                            : item.label === '本月營收'
                              ? 'こんげつの売上'
                              : item.label === '未結帳單'
                                ? '会計待ち'
                                : '取り消し'}
                      </div>
                    </div>
                    <div className="nomiya-pill-soft">
                      {item.label === '今日營收'
                        ? '本日'
                        : item.label === '本月營收'
                          ? '月次'
                          : item.label === '未結帳單'
                            ? '現場'
                            : '概況'}
                    </div>
                  </div>
                  <div className={`mt-4 text-5xl font-semibold leading-none ${item.tone}`}>
                    {item.value}
                  </div>
                  <div className="mt-3 text-[0.82rem] tracking-[0.03em] text-[var(--muted)]/80">
                    {item.helper}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="nomiya-story-band mt-8 text-center text-xs tracking-[0.34em] text-[var(--muted-soft)]"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '220ms' }}
          >
            TODAY · THIS MONTH · OPEN TABS · TOP SELLERS
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="nomiya-panel rounded-[2.2rem] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                  Top Sellers
                </div>
                <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
                  今日熱賣商品
                </h2>
                <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                  きょうの人気
                </div>
              </div>
              <Link href="/admin/orders" className="text-sm text-[var(--muted)] hover:text-[var(--accent-strong)]">
                查看訂單
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {todayTopItems.length === 0 ? (
                <div className="nomiya-panel-soft rounded-[1.6rem] p-5 text-[var(--muted)]">
                  今晚目前還沒結到有熱賣感的東西，等第一波客人進來再看。
                </div>
              ) : (
                todayTopItems.map((item, index) => (
                  <div
                    key={item.name}
                    className="nomiya-panel-soft rounded-[1.6rem] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="nomiya-pill-soft">#{index + 1}</div>
                        <div className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                          {item.name}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[0.8rem] tracking-[0.02em] text-[var(--muted)]/80">
                          售出 {item.qty} 份
                        </div>
                        <div className="mt-2 text-3xl font-semibold leading-none text-[var(--accent-strong)]">
                          ${formatCurrency(item.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="nomiya-panel rounded-[2.2rem] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                  Open Tabs
                </div>
                <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
                  現場未結帳
                </h2>
                <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                  会計待ちの伝票
                </div>
              </div>
              <Link href="/pos" className="text-sm text-[var(--muted)] hover:text-[var(--accent-strong)]">
                前往處理
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {openOrders.length === 0 ? (
                <div className="nomiya-panel-soft rounded-[1.6rem] p-5 text-[var(--muted)]">
                  現場目前沒有卡住的單，這輪算收得蠻乾淨。
                </div>
              ) : (
                openOrders.map((order) => (
                  <div
                    key={order.id}
                    className="nomiya-panel-soft rounded-[1.6rem] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-[var(--foreground)]">
                          {order.customerName || '未命名客人'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[0.82rem] tracking-[0.02em] text-[var(--muted)]/80">
                          <span className="nomiya-pill-soft">
                            品項 {order.items.filter((item) => item.itemStatus === 'active').length} 筆
                          </span>
                          <span className="nomiya-pill-soft">{order.serviceMode ?? '內用'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[0.8rem] tracking-[0.02em] text-[var(--muted)]/80">
                          目前金額
                        </div>
                        <div className="mt-2 text-3xl font-semibold leading-none text-[var(--accent-strong)]">
                          ${formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {order.note ? (
                      <div className="mt-3 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
                        備註：{order.note}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nomiya-kpi rounded-[2rem] p-6 hover:-translate-y-0.5"
            >
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Shortcut
              </div>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                すぐ使う入口
              </div>
              <div className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
                {item.label}
              </div>
              <div className="mt-3 text-[0.84rem] leading-7 text-[var(--muted)]/82">
                {item.description}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
