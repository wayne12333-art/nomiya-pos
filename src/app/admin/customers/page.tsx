import { prisma } from '@/lib/prisma'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'
import CustomerEditForm from './customer-edit-form'

export const dynamic = 'force-dynamic'

function parseCustomerNote(note: string | null) {
  const raw = note || ''
  const lines = raw.split('\n')
  const tagLine = lines.find((line) => line.startsWith('[標籤] '))
  const tag = tagLine ? tagLine.replace('[標籤] ', '').trim() : '未分類'
  const memo = lines
    .filter((line) => !line.startsWith('[標籤] '))
    .join('\n')
    .trim()

  return { tag, memo }
}

function getTagStyle(tag: string) {
  switch (tag) {
    case '常客':
      return 'border-[rgba(110,134,113,0.3)] bg-[rgba(110,134,113,0.14)] text-[var(--success)]'
    case '新客':
      return 'border-[rgba(107,138,170,0.3)] bg-[rgba(107,138,170,0.14)] text-[#597fa3]'
    case '朋友':
      return 'border-[rgba(152,132,166,0.3)] bg-[rgba(152,132,166,0.14)] text-[#7d668d]'
    case '注意':
      return 'border-[rgba(187,118,109,0.3)] bg-[rgba(187,118,109,0.14)] text-[var(--danger)]'
    default:
      return 'border-[var(--border)] bg-[rgba(255,248,238,0.45)] text-[var(--foreground)]'
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

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tag?: string }>
}) {
  const params = (await searchParams) || {}
  const q = (params.q || '').trim()
  const tag = (params.tag || '').trim()

  const allCustomers = await prisma.customer.findMany({
    where: q
      ? {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        }
      : undefined,
    orderBy: [{ lastVisitAt: 'desc' }, { visitCount: 'desc' }, { name: 'asc' }],
    include: {
      orders: {
        where: {
          paymentStatus: {
            not: 'voided',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          items: true,
        },
      },
    },
  })

  const customers = allCustomers.filter((customer) => {
    if (!tag) return true
    return parseCustomerNote(customer.note).tag === tag
  })

  const regulars = customers.filter((customer) => parseCustomerNote(customer.note).tag === '常客').length
  const recentVisitors = customers.filter((customer) => customer.lastVisitAt).length
  const topSpend = customers.reduce((max, customer) => Math.max(max, customer.totalSpent), 0)
  const tagOptions = ['常客', '新客', '朋友', '注意', '未分類']

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
                Customer Ledger
              </div>
              <h1 className="nomiya-display nomiya-kinetic-title mt-3 text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
                <span>熟客台帳</span>
              </h1>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                お客さまの記録
              </div>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {brandCopy.customers.title}
              </div>
            </div>

            <div
              className="grid gap-4 md:grid-cols-3"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <StatCard label="客人總數" value={`${customers.length}`} helper="目前有留下紀錄的客人" />
              <StatCard label="常客" value={`${regulars}`} helper="標記為常客的名單" />
              <StatCard label="最高總消費" value={`$${topSpend}`} helper={`最近有來店 ${recentVisitors} 位`} />
            </div>
          </div>
        </section>

        <section
          className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
          data-reveal="scale"
          style={{ ['--reveal-delay' as string]: '120ms' }}
        >
          <form method="GET" className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="搜尋客人名稱"
              className="nomiya-input rounded-2xl p-4"
            />
            <select
              name="tag"
              defaultValue={tag}
              className="nomiya-input rounded-2xl p-4"
            >
              <option value="">全部標籤</option>
              {tagOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="nomiya-button-primary rounded-2xl px-6 py-4 font-semibold"
            >
              搜尋
            </button>
          </form>
          <div className="mt-3 flex justify-end">
            <a
              href="/admin/customers"
              className="nomiya-button-secondary rounded-full px-4 py-2 text-sm"
            >
              重設條件
            </a>
          </div>
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
                一次一次來，才會變成熟客
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
              <div className="text-sm leading-7 text-[var(--muted)]">{brandCopy.customers.story}</div>
            </div>
          </div>

          <div
            className="nomiya-panel nomiya-ornament rounded-[2rem] p-6"
            data-reveal="right"
            style={{ ['--reveal-delay' as string]: '180ms' }}
          >
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
            <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
              先看人，再看數字和常點的東西
            </h3>
            <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
              顔と記憶から、少しずつ
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              來店次數、總消費、常點品項都重要，但更重要的是這個人今天坐哪裡、平常喝什麼、下次來的時候能不能不用重新認識。
            </p>
          </div>
        </section>

        {customers.length === 0 ? (
          <div
            className="nomiya-panel rounded-[2rem] p-6 text-[var(--muted)]"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '160ms' }}
          >
            目前沒有客人資料
          </div>
        ) : (
          <div className="grid gap-5">
            {customers.map((customer, index) => {
              const parsed = parseCustomerNote(customer.note)

              const itemStats = new Map<string, number>()
              for (const order of customer.orders) {
                for (const item of order.items) {
                  const key = `${item.itemNameSnapshot} / ${item.variantNameSnapshot || '無'}`
                  itemStats.set(key, (itemStats.get(key) || 0) + item.qty)
                }
              }

              const favoriteItems = Array.from(itemStats.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)

              return (
                <div
                  key={customer.id}
                  className="nomiya-panel nomiya-counter-block rounded-[2rem] p-6"
                  data-reveal={index % 2 === 0 ? 'left' : 'right'}
                  style={{ ['--reveal-delay' as string]: `${120 + (index % 4) * 60}ms` }}
                >
                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {customer.name}
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-sm ${getTagStyle(
                            parsed.tag
                          )}`}
                        >
                          {parsed.tag}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="來店次數" value={`${customer.visitCount}`} helper="累積到店紀錄" />
                        <StatCard label="總消費" value={`$${customer.totalSpent}`} helper="已結帳累積消費" />
                        <StatCard
                          label="最近來店"
                          value={
                            customer.lastVisitAt
                              ? new Date(customer.lastVisitAt).toLocaleDateString('zh-TW')
                              : '—'
                          }
                          helper="最後一次消費時間"
                        />
                        <StatCard label="最近訂單數" value={`${customer.orders.length}`} helper="最近 12 筆內的有效訂單" />
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <div className="nomiya-panel-soft rounded-[1.5rem] p-4">
                          <div className="text-sm font-semibold text-[var(--foreground)]">
                            台帳備忘
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                            {parsed.memo || '目前沒有備忘'}
                          </div>
                        </div>

                        <div className="nomiya-panel-soft rounded-[1.5rem] p-4">
                          <div className="text-sm font-semibold text-[var(--foreground)]">
                            常點商品
                          </div>

                          {favoriteItems.length === 0 ? (
                            <div className="mt-3 text-sm text-[var(--muted)]">
                              目前沒有足夠資料
                            </div>
                          ) : (
                            <div className="mt-3 grid gap-2">
                              {favoriteItems.map(([name, qty]) => (
                                <div
                                  key={name}
                                  className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,238,0.45)] p-3 text-sm"
                                >
                                  <div className="font-medium text-[var(--foreground)]">{name}</div>
                                  <div className="mt-1 text-[var(--muted)]">累積點過：{qty}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <CustomerEditForm
                        id={customer.id}
                        initialName={customer.name}
                        initialNote={customer.note}
                      />

                      <div className="nomiya-panel-soft rounded-[1.5rem] p-4">
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                          最近來店摘要
                        </div>

                        {customer.orders.length === 0 ? (
                          <div className="mt-3 text-sm text-[var(--muted)]">目前沒有訂單</div>
                        ) : (
                          <div className="mt-3 grid gap-3">
                            {customer.orders.map((order) => (
                              <details
                                key={order.id}
                                className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,238,0.48)] p-3"
                              >
                                <summary className="cursor-pointer list-none">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="font-semibold text-[var(--foreground)]">
                                        ${order.totalAmount}
                                      </div>
                                      <div className="mt-1 text-sm text-[var(--muted)]">
                                        {new Date(order.createdAt).toLocaleString('zh-TW')}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
                                      {order.paymentMethod}
                                    </div>
                                  </div>
                                </summary>

                                <div className="mt-4 grid gap-2">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="rounded-xl bg-[rgba(255,252,247,0.58)] p-3 text-sm"
                                    >
                                      <div className="font-medium text-[var(--foreground)]">
                                        {item.itemNameSnapshot} / {item.variantNameSnapshot || '無'}
                                      </div>
                                      <div className="mt-1 text-[var(--muted)]">
                                        數量：{item.qty} / 單價：${item.unitPrice} / 小計：${item.lineTotal}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
