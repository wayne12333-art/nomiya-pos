'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { brandCopy } from '@/lib/brand-copy'

const navItems = [
  { label: '總覽', href: '/admin' },
  { label: '商品', href: '/admin/products' },
  { label: '客人', href: '/admin/customers' },
  { label: '訂單', href: '/admin/orders' },
  { label: '庫存', href: '/admin/inventory' },
  { label: '進貨', href: '/admin/purchases' },
  { label: '盤點', href: '/admin/stocktakes' },
  { label: '報表', href: '/admin/reports' },
  { label: 'POS', href: '/pos' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="nomiya-sheet mb-8 rounded-[2rem] px-4 py-5 backdrop-blur-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center border border-[var(--border-strong)] bg-[rgba(255,252,247,0.96)] text-[#17120f] shadow-[0_12px_24px_rgba(62,43,26,0.05)]">
            <div className="nomiya-sign nomiya-sign-soft">
              <span className="nomiya-sign-main">常</span>
              <span className="nomiya-sign-main">久</span>
            </div>
          </div>

          <div>
            <div className="nomiya-eyebrow text-[10px]">Nomiya Changjiou</div>
            <div className="nomiya-display mt-1 text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
              飲酒屋 常久
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              {brandCopy.nav.subtitle}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nomiya-nav-link ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'nomiya-nav-link-active'
                  : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
