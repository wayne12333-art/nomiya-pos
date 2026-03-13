import Link from 'next/link'
import { brandCopy } from '@/lib/brand-copy'
import AdminNav from '../admin-nav'
import PurchaseForm from './purchase-form'
import PurchaseHistory from './purchase-history'

export const dynamic = 'force-dynamic'

export default function AdminPurchasesPage() {
  return (
    <main className="nomiya-shell p-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminNav />

        <section className="nomiya-panel nomiya-panel-ornate nomiya-ornament rounded-[2.4rem] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="nomiya-section-no">09 Purchases</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="nomiya-ribbon">Purchases</div>
                <div className="nomiya-stamp">仕入</div>
              </div>
              <h1 className="nomiya-display mt-5 text-4xl font-semibold text-[var(--foreground)]">
                進貨管理
              </h1>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                仕入れの記録
              </div>
              <div className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {brandCopy.purchases.title}
              </div>
            </div>

            <Link
              href="/admin/products"
              className="nomiya-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm"
            >
              前往商品管理
            </Link>
          </div>

          <div className="nomiya-story-band mt-8 text-center text-xs tracking-[0.34em] text-[var(--muted-soft)]">
            SUPPLIER · COST · INCOMING STOCK · HISTORY
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
                補貨也是在決定這個月怎麼過
              </div>
            </div>
            <div className="nomiya-route-item mt-5">
              <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Chapter 02</div>
              <div className="text-sm leading-7 text-[var(--muted)]">{brandCopy.purchases.story}</div>
            </div>
          </div>

          <div
            className="nomiya-panel nomiya-ornament rounded-[2rem] p-6"
            data-reveal="right"
            style={{ ['--reveal-delay' as string]: '180ms' }}
          >
            <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
            <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
              先看補進來多少，再看成本是不是開始亂跑
            </h3>
            <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
              入ってくる量と、上がる原価
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              進貨不是單純填一筆紀錄，而是順手把這批酒、這批食材後面會造成的成本壓力一起看進來，才不會月底才發現毛利變薄了。
            </p>
          </div>
        </section>

        <PurchaseForm />
        <PurchaseHistory />
      </div>
    </main>
  )
}
