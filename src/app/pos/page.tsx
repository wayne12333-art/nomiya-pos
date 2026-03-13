'use client'

import Link from 'next/link'
import { brandCopy } from '@/lib/brand-copy'
import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'

type ProductVariant = {
  id: string
  name: string
  price: number
  volumeMl: number | null
}

type Product = {
  id: string
  name: string
  category: string
  productType: string
  inventoryMode: string
  portionMl: number | null
  salePrice: number | null
  strongSurcharge: number | null
  specialSurcharge: number | null
  variants?: ProductVariant[]
}

type QuickLogEntry = {
  id: string
  varianceCategory: string | null
  varianceReason: string | null
  countedAt: string
  product: {
    name: string
  }
}

type OrderItem = {
  id: string
  itemNameSnapshot: string
  qty: number
  deliveredQty: number
  unitPrice: number
  lineTotal: number
  itemStatus: string
  cancelReason: string | null
  createdAt: string
  variantId: string | null
  variantNameSnapshot: string | null
}

type OpenOrder = {
  id: string
  customerName: string | null
  subtotal: number
  discountAmount: number
  adjustmentAmount: number
  totalAmount: number
  paymentStatus: string
  serviceMode: string
  note: string | null
  createdAt: string
  servedAt: string | null
  items: OrderItem[]
}

type AddMode = 'basic' | 'strong' | 'special'

type QuickLogDraft = {
  productId: string
  varianceCategory: '招待 Shot' | '老闆自飲'
  label: string
  variantId?: string
  mode?: AddMode
}

const QUICK_CUSTOMER_TYPES = [
  { label: '匿名開單', jp: 'とくめい', prefix: '顧客' },
  { label: '散客', jp: 'ふらり', prefix: '散客' },
  { label: '熟客', jp: 'なじみ', prefix: '熟客' },
  { label: '朋友', jp: 'ともだち', prefix: '朋友' },
] as const

function formatCurrency(value: number) {
  return Number(value.toFixed(2))
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<OpenOrder[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [productQuery, setProductQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('現金')
  const [paymentNote, setPaymentNote] = useState('')
  const [adjustmentMode, setAdjustmentMode] = useState<'none' | 'discount' | 'surcharge'>('none')
  const [adjustmentValue, setAdjustmentValue] = useState('')
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
  const [quickLogKey, setQuickLogKey] = useState<string | null>(null)
  const [quickLogDraft, setQuickLogDraft] = useState<QuickLogDraft | null>(null)
  const [quickLogQty, setQuickLogQty] = useState('1')
  const [quickLogNote, setQuickLogNote] = useState('')
  const [quickLogs, setQuickLogs] = useState<QuickLogEntry[]>([])
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editingCustomerName, setEditingCustomerName] = useState('')
  const [editingOrderNote, setEditingOrderNote] = useState('')
  const [editingServiceMode, setEditingServiceMode] = useState<'內用' | '外帶'>('內用')
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null)
  const [cancelReasonDraft, setCancelReasonDraft] = useState('按錯')
  const [isVoidConfirming, setIsVoidConfirming] = useState(false)
  const [voidReasonDraft, setVoidReasonDraft] = useState('按錯')

  async function loadProducts() {
    const res = await fetch('/api/pos-products')
    const data = await res.json().catch(() => [])
    setProducts(Array.isArray(data) ? data : [])
  }

  async function loadOrders() {
    const res = await fetch('/api/orders/open-list')
    const data = await res.json().catch(() => [])
    setOrders(Array.isArray(data) ? data : [])
  }

  async function loadQuickLogs() {
    const res = await fetch('/api/stocktakes/quick-log')
    const data = await res.json().catch(() => [])
    setQuickLogs(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    async function bootstrap() {
      setIsBootstrapping(true)
      try {
        await Promise.all([loadProducts(), loadOrders(), loadQuickLogs()])
      } finally {
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (orders.length === 0) {
      if (selectedOrderId) setSelectedOrderId('')
      return
    }

    const hasSelectedOrder = orders.some((order) => order.id === selectedOrderId)
    if (!hasSelectedOrder) {
      setSelectedOrderId(orders[0]?.id ?? '')
    }
  }, [orders, selectedOrderId])

  useEffect(() => {
    if (!showPendingOnly) return
    if (!selectedOrderId) return

    const selectedOrderStillPending = orders.some(
      (order) => order.id === selectedOrderId && !order.servedAt
    )

    if (selectedOrderStillPending) return

    const firstPendingOrder = orders.find((order) => !order.servedAt)
    setSelectedOrderId(firstPendingOrder?.id ?? '')
  }, [orders, selectedOrderId, showPendingOnly])

  useEffect(() => {
    setAdjustmentMode('none')
    setAdjustmentValue('')
  }, [selectedOrderId])

  const categories = useMemo(() => {
    return ['全部', ...Array.from(new Set(products.map((p) => p.category)))]
  }, [products])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === '全部' || product.category === selectedCategory
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [products, productQuery, selectedCategory])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId]
  )

  const activeSelectedItems = useMemo(() => {
    return selectedOrder?.items.filter((item) => item.itemStatus === 'active') || []
  }, [selectedOrder])

  const checkoutPreview = useMemo(() => {
    const subtotal = selectedOrder?.subtotal ?? 0
    const parsedValue = Math.max(0, Math.round(Number(adjustmentValue || 0)))
    const discountAmount = adjustmentMode === 'discount' ? parsedValue : 0
    const surchargeAmount = adjustmentMode === 'surcharge' ? parsedValue : 0

    return {
      subtotal,
      discountAmount,
      surchargeAmount,
      total: Math.max(subtotal - discountAmount + surchargeAmount, 0),
    }
  }, [adjustmentMode, adjustmentValue, selectedOrder])

  const orderSummary = useMemo(() => {
    return {
      openOrders: orders.length,
      totalItems: activeSelectedItems.reduce((sum, item) => sum + item.qty, 0),
      totalAmount: selectedOrder?.totalAmount ?? 0,
    }
  }, [orders.length, activeSelectedItems, selectedOrder])

  const hasNoProductsForFilter = !isBootstrapping && filteredProducts.length === 0
  const hasActiveProductFilters =
    selectedCategory !== '全部' || productQuery.trim().length > 0
  const visibleOrders = useMemo(() => {
    const sortedOrders = [...orders].sort((a, b) => {
      if (!a.servedAt && b.servedAt) return -1
      if (a.servedAt && !b.servedAt) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    if (!showPendingOnly) return sortedOrders
    return sortedOrders.filter((order) => !order.servedAt)
  }, [orders, showPendingOnly])

  function generateQuickCustomerName(prefix: string) {
    const nextNumber =
      orders.filter((order) => (order.customerName || '').startsWith(prefix)).length + 1
    return `${prefix} ${nextNumber}`
  }

  function getElapsedText(createdAt: string) {
    const diffMs = nowMs - new Date(createdAt).getTime()
    const minutes = Math.floor(diffMs / 60000)

    if (minutes < 1) return '剛開單'
    if (minutes < 60) return `${minutes} 分鐘`
    const hours = Math.floor(minutes / 60)
    const remainMinutes = minutes % 60
    return `${hours} 小時 ${remainMinutes} 分`
  }

  async function openOrder(overrideCustomerName?: string) {
    const finalCustomerName = overrideCustomerName?.trim() || customerName.trim()

    if (!finalCustomerName) {
      toast({ title: '請先輸入客人名稱', tone: 'error' })
      return
    }

    const res = await fetch('/api/orders/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: finalCustomerName,
        note,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '開單失敗', tone: 'error' })
      return
    }

    setCustomerName('')
    setNote('')
    await loadOrders()
    setSelectedOrderId(data.id)
  }

  async function addItem(productId: string, mode: AddMode) {
    if (!selectedOrderId) {
      toast({ title: '請先選擇一張記單', tone: 'error' })
      return
    }

    setLoadingOrderId(productId + mode)

    const res = await fetch(`/api/orders/${selectedOrderId}/add-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        qty: 1,
        mode,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoadingOrderId(null)

    if (!res.ok) {
      toast({ title: data?.error || '加單失敗', tone: 'error' })
      return
    }

    toast({ title: '已加入記單', description: '品項已新增', tone: 'success' })

    await loadOrders()
  }

  async function addVariantItem(productId: string, variantId: string) {
    if (!selectedOrderId) {
      toast({ title: '請先選擇一張記單', tone: 'error' })
      return
    }

    setLoadingOrderId(`${productId}-${variantId}`)

    const res = await fetch(`/api/orders/${selectedOrderId}/add-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        variantId,
        qty: 1,
      }),
    })

    const data = await res.json().catch(() => null)
    setLoadingOrderId(null)

    if (!res.ok) {
      toast({ title: data?.error || '加單失敗', tone: 'error' })
      return
    }

    toast({ title: '已加入記單', description: '規格品項已新增', tone: 'success' })

    await loadOrders()
  }

  async function quickLogConsumption(
    draft: QuickLogDraft
  ) {
    const qty = Math.max(1, Number(quickLogQty || 1))
    const requestKey = `${draft.productId}-${draft.variantId || draft.mode || 'basic'}-${draft.varianceCategory}`
    setQuickLogKey(requestKey)

    const res = await fetch('/api/stocktakes/quick-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: draft.productId,
        variantId: draft.variantId,
        mode: draft.mode || 'basic',
        varianceCategory: draft.varianceCategory,
        qty,
        note: quickLogNote.trim(),
      }),
    })

    const data = await res.json().catch(() => null)
    setQuickLogKey(null)

    if (!res.ok) {
      toast({ title: data?.error || '快捷記錄失敗', tone: 'error' })
      return
    }

    toast({
      title: draft.varianceCategory === '招待 Shot' ? '已記為招待 Shot' : '已記為老闆自飲',
      description: `${draft.label} x${qty}`,
      tone: 'success',
    })
    setQuickLogDraft(null)
    setQuickLogQty('1')
    setQuickLogNote('')
    await loadQuickLogs()
  }

  function openQuickLogDraft(draft: QuickLogDraft) {
    setQuickLogDraft(draft)
    setQuickLogQty('1')
    setQuickLogNote('')
    toast({
      title: draft.varianceCategory === '招待 Shot' ? '已打開招待記錄' : '已打開自飲記錄',
      description: `${draft.label}，在右下角補數量後送出。`,
    })
  }

  async function changeQty(itemId: string, qty: number) {
    if (qty <= 0) return

    const res = await fetch(`/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '修改失敗', tone: 'error' })
      return
    }

    toast({ title: '數量已更新', tone: 'success' })

    await loadOrders()
  }

  async function changeDeliveredQty(itemId: string, qty: number) {
    if (qty < 0) return

    const res = await fetch(`/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveredQty: qty }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '更新交付狀態失敗', tone: 'error' })
      return
    }

    toast({ title: '交付份數已更新', tone: 'success' })
    await loadOrders()
  }

  async function cancelItem(itemId: string, reason: string) {
    const res = await fetch(`/api/order-items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancelReason: reason.trim() || '按錯',
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '取消失敗', tone: 'error' })
      return
    }

    toast({ title: '品項已取消', tone: 'success' })
    setCancellingItemId(null)
    setCancelReasonDraft('按錯')
    await loadOrders()
  }

  async function checkoutOrder() {
    if (!selectedOrderId) {
      toast({ title: '請先選擇記單', tone: 'error' })
      return
    }

    if (paymentMethod === '其他' && !paymentNote.trim()) {
      toast({ title: '請補充其他付款方式備註', tone: 'error' })
      return
    }

    const finalPaymentMethod =
      paymentMethod === '其他' ? `其他：${paymentNote.trim()}` : paymentMethod
    const parsedAdjustmentValue = Math.max(0, Math.round(Number(adjustmentValue || 0)))

    const res = await fetch(`/api/orders/${selectedOrderId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod: finalPaymentMethod,
        adjustmentMode,
        adjustmentValue: parsedAdjustmentValue,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '結帳失敗', tone: 'error' })
      return
    }

    toast({ title: '結帳完成', tone: 'success' })
    setSelectedOrderId('')
    setPaymentMethod('現金')
    setPaymentNote('')
    setAdjustmentMode('none')
    setAdjustmentValue('')
    await loadOrders()
  }

  async function saveOrderMeta(orderId: string) {
    const nextName = editingCustomerName.trim()

    if (!nextName) {
      toast({ title: '客人名稱不可空白', tone: 'error' })
      return
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: nextName,
        note: editingOrderNote,
        serviceMode: editingServiceMode,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '更新客人名稱失敗', tone: 'error' })
      return
    }

    toast({ title: '記單資料已更新', tone: 'success' })
    setEditingOrderId(null)
    setEditingCustomerName('')
    setEditingOrderNote('')
    setEditingServiceMode('內用')
    await loadOrders()
  }

  async function deleteOrder() {
    if (!selectedOrderId) {
      toast({ title: '請先選擇記單', tone: 'error' })
      return
    }
    const finalReason = voidReasonDraft.trim() || '未填原因'

    const res = await fetch(`/api/orders/${selectedOrderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voidReason: finalReason,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      toast({ title: data?.error || '作廢記單失敗', tone: 'error' })
      return
    }

    toast({ title: '記單已作廢', tone: 'success' })
    setSelectedOrderId('')
    setIsVoidConfirming(false)
    setVoidReasonDraft('按錯')
    await loadOrders()
  }

  return (
    <main className="nomiya-shell text-[var(--foreground)]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament nomiya-grid-glow overflow-hidden rounded-[2.4rem] p-6"
          data-reveal="hero"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="nomiya-section-no">06 Counter</div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center border border-[var(--border-strong)] bg-[rgba(255,252,247,0.96)] text-[#17120f]">
                  <div className="nomiya-sign nomiya-sign-soft">
                    <span className="nomiya-sign-main">常</span>
                    <span className="nomiya-sign-main">久</span>
                  </div>
                </div>
                <div>
                  <div className="nomiya-ribbon">Japanese Bar Counter</div>
                  <h1 className="nomiya-display nomiya-kinetic-title mt-3 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
                    <span>飲酒屋 常久 POS</span>
                  </h1>
                  <div className="mt-2 text-sm tracking-[0.2em] text-[var(--muted-soft)]">
                    お一人様でも、いつもの顔でも
                  </div>
                </div>
              </div>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                伝票の作成、追加、会計、取り消しの流れはそのままに、{brandCopy.story.counter}
                先讓吧台的人知道現在要顧哪張單、哪份餐點還沒出去，再慢慢把這晚收乾淨。
              </div>
            </div>

            <div className="flex flex-wrap gap-3" data-reveal="right" style={{ ['--reveal-delay' as string]: '180ms' }}>
              <Link
                href="/admin"
                className="nomiya-button-secondary rounded-full px-5 py-3 text-sm"
              >
                回到後台
              </Link>
              <div className="nomiya-sheet rounded-full px-4 py-3 text-sm text-[var(--muted)]">
                開單中 {orderSummary.openOrders} 張
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.88fr_1.2fr_0.92fr]">
          <aside className="space-y-6" data-reveal="left" style={{ ['--reveal-delay' as string]: '100ms' }}>
            <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                    Open Tabs
                  </div>
                  <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
                    出單中
                  </h2>
                  <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                    でんぴょう一覧
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPendingOnly((current) => !current)}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      showPendingOnly ? 'nomiya-button-primary font-semibold' : 'nomiya-button-secondary'
                    }`}
                  >
                    {showPendingOnly ? '待交付中' : '全部記單'}
                  </button>
                  <div className="text-sm text-[var(--muted)]">{visibleOrders.length} 張</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {visibleOrders.length === 0 ? (
                  <div className="nomiya-empty rounded-[1.5rem] p-4 text-[var(--muted)]">
                    <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                      {isBootstrapping ? 'Loading Tabs' : showPendingOnly ? 'No Pending Tabs' : 'No Open Tabs'}
                    </div>
                    <div className="mt-2 text-sm leading-7">
                      {isBootstrapping
                        ? '正在整理目前記單...'
                        : showPendingOnly
                          ? '目前沒有待交付記單，可以切回全部記單查看。'
                          : '目前沒有未結帳記單，先建立一張新記單。'}
                    </div>
                  </div>
                ) : (
                  visibleOrders.map((order) => {
                    const isActive = selectedOrderId === order.id
                    const isEditingName = editingOrderId === order.id

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`nomiya-worktile rounded-[1.5rem] p-4 text-left ${
                          isActive
                            ? 'border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(239,224,204,0.96),rgba(233,214,191,0.94))] shadow-[0_14px_30px_rgba(91,64,36,0.1)]'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {isEditingName ? (
                              <div className="space-y-2">
                                <input
                                  value={editingCustomerName}
                                  onChange={(event) => setEditingCustomerName(event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                  placeholder="輸入客人名稱"
                                  className="nomiya-input rounded-[1rem] px-3 py-2 text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {(['內用', '外帶'] as const).map((mode) => (
                                    <button
                                      key={mode}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        setEditingServiceMode(mode)
                                      }}
                                      className={`rounded-[0.9rem] px-3 py-2 text-xs ${
                                        editingServiceMode === mode
                                          ? 'nomiya-button-primary font-semibold'
                                          : 'nomiya-button-secondary'
                                      }`}
                                    >
                                      {mode}
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={editingOrderNote}
                                  onChange={(event) => setEditingOrderNote(event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                  placeholder="備註"
                                  rows={2}
                                  className="nomiya-input rounded-[1rem] px-3 py-2 text-sm"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      void saveOrderMeta(order.id)
                                    }}
                                    className="nomiya-button-primary rounded-[0.9rem] px-3 py-2 text-xs"
                                  >
                                    儲存
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setEditingOrderId(null)
                                      setEditingCustomerName('')
                                      setEditingOrderNote('')
                                      setEditingServiceMode('內用')
                                    }}
                                    className="nomiya-button-secondary rounded-[0.9rem] px-3 py-2 text-xs"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-lg font-semibold text-[var(--foreground)]">
                                  {order.customerName || '未命名客人'}
                                </div>
                                <div className="mt-1 text-sm text-[var(--muted)]">
                                  已開單：{getElapsedText(order.createdAt)}
                                </div>
                              </>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="nomiya-pill-soft">
                                {order.serviceMode}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs ${
                                  order.servedAt
                                    ? 'bg-[rgba(173,196,149,0.2)] text-[var(--sage-deep)]'
                                    : 'bg-[rgba(229,194,139,0.18)] text-[var(--accent-strong)]'
                                }`}
                              >
                                {order.servedAt ? '已交付' : '待交付'}
                              </span>
                              {order.servedAt ? (
                                <span className="nomiya-pill-soft">
                                  客人已拿到餐點
                                </span>
                              ) : null}
                            </div>
                            {order.note ? (
                              <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                備註：{order.note}
                              </div>
                            ) : null}
                          </div>
                          {isActive ? (
                            <div className="rounded-full bg-[rgba(229,194,139,0.14)] px-2.5 py-1 text-xs text-[var(--accent-strong)]">
                              目前操作
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-[var(--muted)]">
                            {order.items.filter((item) => item.itemStatus === 'active').length} 筆品項
                          </span>
                          <span className="font-semibold text-[var(--accent-strong)]">
                            ${formatCurrency(order.totalAmount)}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditingOrderId(order.id)
                              setEditingCustomerName(order.customerName || '')
                              setEditingOrderNote(order.note || '')
                              setEditingServiceMode(
                                order.serviceMode === '外帶' ? '外帶' : '內用'
                              )
                            }}
                            className="nomiya-button-secondary w-full rounded-[1rem] px-3 py-2.5 text-sm"
                          >
                            編輯資料
                          </button>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </section>

            <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-5">
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                New Tab
              </div>
              <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
                開新記單
              </h2>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                あたらしい伝票
              </div>

              <div className="mt-5 grid gap-3">
                <div className="nomiya-sheet rounded-[1.4rem] p-4">
                  <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                    QUICK OPEN
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    直接依現場客人類型開單，像平常一樣先喊一聲「幫你開一張」，不用每次都重打。
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {QUICK_CUSTOMER_TYPES.map((type) => (
                    <button
                      key={type.label}
                      type="button"
                      onClick={() => openOrder(generateQuickCustomerName(type.prefix))}
                      className={`rounded-[1.4rem] border px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                        type.label === '匿名開單'
                          ? 'border-[rgba(154,107,63,0.24)] bg-[linear-gradient(135deg,rgba(238,221,197,0.94),rgba(233,205,165,0.86))] shadow-[0_12px_30px_rgba(118,82,48,0.12)]'
                          : 'border-[var(--border)] bg-[rgba(252,246,237,0.92)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-[var(--foreground)]">
                            {type.label}
                          </div>
                          <div className="mt-1 text-[0.68rem] tracking-[0.22em] text-[var(--muted-soft)]">
                            {type.jp}
                          </div>
                        </div>
                        <div className="rounded-full border border-[rgba(154,107,63,0.18)] bg-[rgba(255,251,246,0.72)] px-2.5 py-1 text-[11px] tracking-[0.18em] text-[var(--accent-strong)]">
                          {type.prefix}
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-[var(--muted)]">
                        {type.prefix} 系列直接建立下一張記單，先記下來再慢慢聊。
                      </div>
                    </button>
                  ))}
                  </div>
                </div>

                <div className="nomiya-sheet rounded-[1.4rem] p-4">
                  <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                    CUSTOM NAME
                  </div>
                  <div className="mt-3 grid gap-3">
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="客人名稱"
                      className="nomiya-input rounded-[1.4rem] px-4 py-4"
                    />

                    <button
                      type="button"
                      onClick={() => openOrder()}
                      className="nomiya-button-primary rounded-[1.4rem] px-4 py-4 font-semibold"
                    >
                      以客名開單
                    </button>
                  </div>
                </div>

                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="備註"
                  className="nomiya-input rounded-[1.4rem] px-4 py-4"
                />
              </div>
            </section>
          </aside>

          <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-5" data-reveal="scale" style={{ ['--reveal-delay' as string]: '180ms' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                  Menu Board
                </div>
                <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
                  快速加單
                </h2>
                <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                  すぐに追加する
                </div>
                <div className="mt-2 text-[0.84rem] text-[var(--muted)]/82">
                  先選左側記單，再從這裡加品項，像吧台邊做邊記那樣順手。
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="搜尋商品或分類"
                  className="nomiya-input min-w-[14rem] rounded-full px-4 py-2.5 text-sm"
                />

                {hasActiveProductFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProductQuery('')
                      setSelectedCategory('全部')
                    }}
                    className="nomiya-button-secondary rounded-full px-4 py-2 text-sm"
                  >
                    清除條件
                  </button>
                ) : null}

                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      selectedCategory === category
                        ? 'nomiya-button-primary font-semibold'
                        : 'nomiya-button-secondary'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {hasNoProductsForFilter ? (
                <div className="nomiya-empty rounded-[1.6rem] p-5 text-[var(--muted)] md:col-span-2 2xl:col-span-3">
                  <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                    No Matching Items
                  </div>
                  <div className="mt-2 text-sm leading-7">
                    目前沒有符合這組條件的商品。可以清掉搜尋字、切回「全部」，或先到商品管理上架品項。
                  </div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="nomiya-worktile rounded-[1.6rem] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--foreground)]">
                          {product.name}
                        </div>
                        <div className="mt-1 text-sm text-[var(--muted)]">
                          {product.category} / {product.productType}
                        </div>
                      </div>
                      <div className="nomiya-pill-soft text-[var(--accent-strong)]">
                        ${product.salePrice ?? 0}
                      </div>
                    </div>

                    {product.variants && product.variants.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {product.variants.map((variant) => (
                          <div key={variant.id} className="rounded-[1rem] border border-[var(--border)]/80 bg-[rgba(255,252,247,0.72)] p-3">
                            <button
                              type="button"
                              onClick={() => addVariantItem(product.id, variant.id)}
                              disabled={loadingOrderId === `${product.id}-${variant.id}`}
                              className="nomiya-button-secondary w-full rounded-[1.1rem] px-3 py-3 text-left text-sm disabled:opacity-50"
                            >
                              {loadingOrderId === `${product.id}-${variant.id}`
                                ? `加入 ${variant.name} 中...`
                                : `${variant.name}（$${variant.price}）`}
                            </button>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickLogDraft({
                                    productId: product.id,
                                    varianceCategory: '招待 Shot',
                                    variantId: variant.id,
                                    label: `${product.name} / ${variant.name}`,
                                  })
                                }
                                disabled={quickLogKey === `${product.id}-${variant.id}-招待 Shot`}
                                className="rounded-[0.95rem] border border-[rgba(184,127,58,0.18)] bg-[rgba(244,232,211,0.86)] px-3 py-2 text-xs text-[var(--accent-strong)] disabled:opacity-50"
                              >
                                {quickLogKey === `${product.id}-${variant.id}-招待 Shot` ? '記錄中...' : '招待'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickLogDraft({
                                    productId: product.id,
                                    varianceCategory: '老闆自飲',
                                    variantId: variant.id,
                                    label: `${product.name} / ${variant.name}`,
                                  })
                                }
                                disabled={quickLogKey === `${product.id}-${variant.id}-老闆自飲`}
                                className="rounded-[0.95rem] border border-[rgba(143,111,79,0.18)] bg-[rgba(239,231,221,0.86)] px-3 py-2 text-xs text-[var(--foreground)] disabled:opacity-50"
                              >
                                {quickLogKey === `${product.id}-${variant.id}-老闆自飲` ? '記錄中...' : '自飲'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-2">
                        <div className="rounded-[1rem] border border-[var(--border)]/80 bg-[rgba(255,252,247,0.72)] p-3">
                          <button
                            type="button"
                            onClick={() => addItem(product.id, 'basic')}
                            disabled={loadingOrderId === product.id + 'basic'}
                            className="nomiya-button-secondary w-full rounded-[1.1rem] px-3 py-3 text-left text-sm disabled:opacity-50"
                          >
                            {loadingOrderId === product.id + 'basic' ? '加入基本杯型中...' : '基本杯型'}
                          </button>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openQuickLogDraft({
                                  productId: product.id,
                                  varianceCategory: '招待 Shot',
                                  mode: 'basic',
                                  label: `${product.name} / 基本`,
                                })
                              }
                              disabled={quickLogKey === `${product.id}-basic-招待 Shot`}
                              className="rounded-[0.95rem] border border-[rgba(184,127,58,0.18)] bg-[rgba(244,232,211,0.86)] px-3 py-2 text-xs text-[var(--accent-strong)] disabled:opacity-50"
                            >
                              {quickLogKey === `${product.id}-basic-招待 Shot` ? '記錄中...' : '招待'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openQuickLogDraft({
                                  productId: product.id,
                                  varianceCategory: '老闆自飲',
                                  mode: 'basic',
                                  label: `${product.name} / 基本`,
                                })
                              }
                              disabled={quickLogKey === `${product.id}-basic-老闆自飲`}
                              className="rounded-[0.95rem] border border-[rgba(143,111,79,0.18)] bg-[rgba(239,231,221,0.86)] px-3 py-2 text-xs text-[var(--foreground)] disabled:opacity-50"
                            >
                              {quickLogKey === `${product.id}-basic-老闆自飲` ? '記錄中...' : '自飲'}
                            </button>
                          </div>
                        </div>

                        {product.strongSurcharge ? (
                          <div className="rounded-[1rem] border border-[var(--border)]/80 bg-[rgba(255,252,247,0.72)] p-3">
                            <button
                              type="button"
                              onClick={() => addItem(product.id, 'strong')}
                              disabled={loadingOrderId === product.id + 'strong'}
                              className="nomiya-button-secondary w-full rounded-[1.1rem] px-3 py-3 text-left text-sm disabled:opacity-50"
                            >
                              {loadingOrderId === product.id + 'strong'
                                ? '加入加厚中...'
                                : `加厚（$${(product.salePrice ?? 0) + product.strongSurcharge}）`}
                            </button>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickLogDraft({
                                    productId: product.id,
                                    varianceCategory: '招待 Shot',
                                    mode: 'strong',
                                    label: `${product.name} / 加厚`,
                                  })
                                }
                                disabled={quickLogKey === `${product.id}-strong-招待 Shot`}
                                className="rounded-[0.95rem] border border-[rgba(184,127,58,0.18)] bg-[rgba(244,232,211,0.86)] px-3 py-2 text-xs text-[var(--accent-strong)] disabled:opacity-50"
                              >
                                {quickLogKey === `${product.id}-strong-招待 Shot` ? '記錄中...' : '招待'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickLogDraft({
                                    productId: product.id,
                                    varianceCategory: '老闆自飲',
                                    mode: 'strong',
                                    label: `${product.name} / 加厚`,
                                  })
                                }
                                disabled={quickLogKey === `${product.id}-strong-老闆自飲`}
                                className="rounded-[0.95rem] border border-[rgba(143,111,79,0.18)] bg-[rgba(239,231,221,0.86)] px-3 py-2 text-xs text-[var(--foreground)] disabled:opacity-50"
                              >
                                {quickLogKey === `${product.id}-strong-老闆自飲` ? '記錄中...' : '自飲'}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {product.specialSurcharge ? (
                          <div className="rounded-[1rem] border border-[var(--border)]/80 bg-[rgba(255,252,247,0.72)] p-3">
                            <button
                              type="button"
                              onClick={() => addItem(product.id, 'special')}
                              disabled={loadingOrderId === product.id + 'special'}
                              className="nomiya-button-secondary w-full rounded-[1.1rem] px-3 py-3 text-left text-sm disabled:opacity-50"
                            >
                              {loadingOrderId === product.id + 'special'
                                ? '加入特調中...'
                                : `特調（$${(product.salePrice ?? 0) + product.specialSurcharge}）`}
                            </button>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickLogDraft({
                                    productId: product.id,
                                    varianceCategory: '招待 Shot',
                                    mode: 'special',
                                    label: `${product.name} / 特調`,
                                  })
                                }
                                disabled={quickLogKey === `${product.id}-special-招待 Shot`}
                                className="rounded-[0.95rem] border border-[rgba(184,127,58,0.18)] bg-[rgba(244,232,211,0.86)] px-3 py-2 text-xs text-[var(--accent-strong)] disabled:opacity-50"
                              >
                                {quickLogKey === `${product.id}-special-招待 Shot` ? '記錄中...' : '招待'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickLogDraft({
                                    productId: product.id,
                                    varianceCategory: '老闆自飲',
                                    mode: 'special',
                                    label: `${product.name} / 特調`,
                                  })
                                }
                                disabled={quickLogKey === `${product.id}-special-老闆自飲`}
                                className="rounded-[0.95rem] border border-[rgba(143,111,79,0.18)] bg-[rgba(239,231,221,0.86)] px-3 py-2 text-xs text-[var(--foreground)] disabled:opacity-50"
                              >
                                {quickLogKey === `${product.id}-special-老闆自飲` ? '記錄中...' : '自飲'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6" data-reveal="right" style={{ ['--reveal-delay' as string]: '260ms' }}>
            <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                    Current Ticket
                  </div>
                  <h2 className="nomiya-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
                    目前記單
                  </h2>
                  <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                    いまの伝票
                  </div>
                </div>
                {selectedOrder ? (
                  <div className="text-sm text-[var(--muted)]">
                    {getElapsedText(selectedOrder.createdAt)}
                  </div>
                ) : null}
              </div>

              {!selectedOrder ? (
                <div className="nomiya-empty mt-5 rounded-[1.5rem] p-5 text-[var(--muted)]">
                  <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                    Select A Ticket
                  </div>
                  <div className="mt-2 text-sm leading-7">
                    請先從左側選一張記單，再開始加單與結帳。
                  </div>
                </div>
              ) : (
                <>
                  <div className="nomiya-worktile mt-5 rounded-[1.6rem] p-4">
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {selectedOrder.customerName || '未命名客人'}
                    </div>
                    {selectedOrder.note ? (
                      <div className="mt-2 text-sm text-[var(--muted)]">
                        備註：{selectedOrder.note}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="nomiya-pill-soft">{selectedOrder.serviceMode}</span>
                      <span className="nomiya-pill-soft">
                        {selectedOrder.servedAt ? '已全部交付' : '尚有待交付'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedOrder.items.length === 0 ? (
                      <div className="nomiya-empty rounded-[1.5rem] p-4 text-[var(--muted)]">
                        <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                          No Items Yet
                        </div>
                        <div className="mt-2 text-sm leading-7">
                          目前沒有品項，從中間快速加單區直接加入。
                        </div>
                      </div>
                    ) : (
                      selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-[1.5rem] p-4 ${
                            item.itemStatus === 'cancelled'
                              ? 'border border-[rgba(187,118,109,0.28)] bg-[rgba(244,226,221,0.88)]'
                              : 'nomiya-worktile'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-[var(--foreground)]">
                                {item.itemNameSnapshot}
                              </div>
                              <div className="mt-1 text-sm text-[var(--muted)]">
                                {item.qty} 份 / 單價 ${item.unitPrice} / 小計 $
                                {formatCurrency(item.lineTotal)}
                              </div>
                              {item.itemStatus === 'active' ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                  <span className="nomiya-pill-soft">
                                    已交付 {item.deliveredQty} / {item.qty}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs ${
                                      item.deliveredQty >= item.qty
                                        ? 'bg-[rgba(173,196,149,0.2)] text-[var(--sage-deep)]'
                                        : 'bg-[rgba(229,194,139,0.18)] text-[var(--accent-strong)]'
                                    }`}
                                  >
                                    {item.deliveredQty >= item.qty ? '本品項已送完' : '本品項待交付'}
                                  </span>
                                </div>
                              ) : null}
                              {item.itemStatus === 'cancelled' ? (
                                <div className="mt-1 text-sm text-[var(--danger)]">
                                  已取消：{item.cancelReason || '未填原因'}
                                </div>
                              ) : null}
                            </div>

                            {item.itemStatus === 'active' ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => changeQty(item.id, item.qty + 1)}
                                  className="nomiya-button-secondary rounded-xl px-3 py-1.5"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    item.qty > 1
                                      ? changeQty(item.id, item.qty - 1)
                                      : (() => {
                                          setCancellingItemId(item.id)
                                          setCancelReasonDraft('按錯')
                                        })()
                                  }
                                  className="nomiya-button-secondary rounded-xl px-3 py-1.5"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancellingItemId(item.id)
                                    setCancelReasonDraft('按錯')
                                  }}
                                  className="rounded-xl border border-[rgba(187,118,109,0.32)] bg-[rgba(244,226,221,0.92)] px-3 py-1.5 text-[13px] text-[var(--danger)]"
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeDeliveredQty(
                                      item.id,
                                      Math.max(item.deliveredQty - 1, 0)
                                    )
                                  }
                                  className="nomiya-button-secondary rounded-xl px-3 py-1.5"
                                >
                                  交付 -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeDeliveredQty(
                                      item.id,
                                      Math.min(item.deliveredQty + 1, item.qty)
                                    )
                                  }
                                  className="nomiya-button-primary rounded-xl px-3 py-1.5"
                                >
                                  交付 +1
                                </button>
                              </div>
                            ) : null}
                          </div>
                          {cancellingItemId === item.id ? (
                            <div className="mt-4 rounded-[1rem] border border-[rgba(187,118,109,0.2)] bg-[rgba(255,248,245,0.9)] p-3">
                              <div className="text-[0.68rem] tracking-[0.22em] text-[var(--muted-soft)]/80">
                                CANCEL ITEM
                              </div>
                              <input
                                value={cancelReasonDraft}
                                onChange={(event) => setCancelReasonDraft(event.target.value)}
                                placeholder="取消原因"
                                className="nomiya-input mt-3 rounded-[0.9rem] px-3 py-2 text-sm"
                              />
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => void cancelItem(item.id, cancelReasonDraft)}
                                  className="rounded-[0.9rem] border border-[rgba(187,118,109,0.32)] bg-[rgba(244,226,221,0.92)] px-3 py-2 text-sm text-[var(--danger)]"
                                >
                                  確認取消
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancellingItemId(null)
                                    setCancelReasonDraft('按錯')
                                  }}
                                  className="nomiya-button-secondary rounded-[0.9rem] px-3 py-2 text-sm"
                                >
                                  返回
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                    <div className="nomiya-kpi rounded-[1.5rem] p-4">
                      <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                        ITEMS
                      </div>
                      <div className="mt-4 text-5xl font-semibold leading-none text-[var(--foreground)]">
                        {orderSummary.totalItems}
                      </div>
                    </div>

                    <div className="nomiya-kpi rounded-[1.5rem] p-4">
                      <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                        TOTAL
                      </div>
                      <div className="mt-4 text-5xl font-semibold leading-none text-[var(--accent-strong)]">
                        ${formatCurrency(orderSummary.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="nomiya-worktile rounded-[1.5rem] p-4">
                      <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                        Payment Method
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {['現金', 'LINE Pay', '信用卡', '其他'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(method)
                              if (method !== '其他') setPaymentNote('')
                            }}
                            className={`rounded-[1rem] px-3 py-3 text-sm ${
                              paymentMethod === method
                                ? 'nomiya-button-primary font-semibold'
                                : 'nomiya-button-secondary'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                      {paymentMethod === '其他' ? (
                        <input
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="例如：轉帳 / 街口 / 招待券"
                          className="nomiya-input mt-3 rounded-[1rem] px-4 py-3 text-sm"
                        />
                      ) : null}
                      <div className="mt-3 text-sm text-[var(--muted)]">
                        目前會以{' '}
                        <span className="font-semibold text-[var(--foreground)]">
                          {paymentMethod === '其他' && paymentNote.trim()
                            ? `其他：${paymentNote.trim()}`
                            : paymentMethod}
                        </span>{' '}
                        結帳
                      </div>

                      <div className="mt-4 rounded-[1rem] border border-[var(--border)]/80 bg-[rgba(255,252,247,0.72)] p-3">
                        <div className="text-[0.68rem] tracking-[0.22em] text-[var(--muted-soft)]/80">
                          PRICE ADJUST
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                          如果這張單要打折或加價，先在這裡補一下。
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentMode('none')
                              setAdjustmentValue('')
                            }}
                            className={`rounded-[0.9rem] px-3 py-2 text-sm ${
                              adjustmentMode === 'none'
                                ? 'nomiya-button-primary font-semibold'
                                : 'nomiya-button-secondary'
                            }`}
                          >
                            不調整
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustmentMode('discount')}
                            className={`rounded-[0.9rem] px-3 py-2 text-sm ${
                              adjustmentMode === 'discount'
                                ? 'nomiya-button-primary font-semibold'
                                : 'nomiya-button-secondary'
                            }`}
                          >
                            打折
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustmentMode('surcharge')}
                            className={`rounded-[0.9rem] px-3 py-2 text-sm ${
                              adjustmentMode === 'surcharge'
                                ? 'nomiya-button-primary font-semibold'
                                : 'nomiya-button-secondary'
                            }`}
                          >
                            加價
                          </button>
                        </div>
                        {adjustmentMode !== 'none' ? (
                          <input
                            value={adjustmentValue}
                            onChange={(e) => setAdjustmentValue(e.target.value)}
                            type="number"
                            min="0"
                            placeholder={adjustmentMode === 'discount' ? '折扣金額' : '加價金額'}
                            className="nomiya-input mt-3 rounded-[1rem] px-4 py-3 text-sm"
                          />
                        ) : null}
                        <div className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
                          <div className="flex items-center justify-between gap-3">
                            <span>小計</span>
                            <span className="font-semibold text-[var(--foreground)]">
                              ${formatCurrency(checkoutPreview.subtotal)}
                            </span>
                          </div>
                          {checkoutPreview.discountAmount > 0 ? (
                            <div className="flex items-center justify-between gap-3">
                              <span>折扣</span>
                              <span className="font-semibold text-[var(--danger)]">
                                -${formatCurrency(checkoutPreview.discountAmount)}
                              </span>
                            </div>
                          ) : null}
                          {checkoutPreview.surchargeAmount > 0 ? (
                            <div className="flex items-center justify-between gap-3">
                              <span>加價</span>
                              <span className="font-semibold text-[var(--accent-strong)]">
                                +${formatCurrency(checkoutPreview.surchargeAmount)}
                              </span>
                            </div>
                          ) : null}
                          <div className="mt-1 flex items-center justify-between gap-3 border-t border-[var(--border)]/70 pt-2">
                            <span className="font-semibold text-[var(--foreground)]">應收</span>
                            <span className="text-lg font-semibold text-[var(--foreground)]">
                              ${formatCurrency(checkoutPreview.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={checkoutOrder}
                      className="nomiya-button-primary rounded-[1.4rem] px-4 py-4 font-semibold"
                    >
                      結帳
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsVoidConfirming((current) => !current)
                        setVoidReasonDraft('按錯')
                      }}
                      className="rounded-[1.4rem] border border-[rgba(187,118,109,0.32)] bg-[rgba(244,226,221,0.92)] px-4 py-4 font-semibold text-[var(--danger)]"
                    >
                      作廢開單
                    </button>
                    {isVoidConfirming ? (
                      <div className="rounded-[1.4rem] border border-[rgba(187,118,109,0.2)] bg-[rgba(255,248,245,0.92)] p-4">
                        <div className="text-[0.68rem] tracking-[0.22em] text-[var(--muted-soft)]/80">
                          VOID ORDER
                        </div>
                        <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          確認作廢這張記單前，先寫下原因。
                        </div>
                        <input
                          value={voidReasonDraft}
                          onChange={(event) => setVoidReasonDraft(event.target.value)}
                          placeholder="例如：按錯 / 測試 / 客人離開"
                          className="nomiya-input mt-3 rounded-[1rem] px-4 py-3 text-sm"
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => void deleteOrder()}
                            className="rounded-[1rem] border border-[rgba(187,118,109,0.32)] bg-[rgba(244,226,221,0.92)] px-4 py-3 text-sm font-semibold text-[var(--danger)]"
                          >
                            確認作廢
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsVoidConfirming(false)
                              setVoidReasonDraft('按錯')
                            }}
                            className="nomiya-button-secondary rounded-[1rem] px-4 py-3 text-sm"
                          >
                            返回
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </section>

            <section className="nomiya-panel nomiya-counter-block rounded-[2rem] p-5">
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Quick Log
              </div>
              <h2 className="nomiya-display mt-2 text-3xl font-semibold text-[var(--foreground)]">
                最近招待 / 自飲
              </h2>
              <div className="mt-1 text-[0.62rem] tracking-[0.26em] text-[var(--accent)]/72">
                さっきの記録
              </div>

              <div className="mt-4 grid gap-3">
                {quickLogs.length === 0 ? (
                  <div className="nomiya-empty rounded-[1.5rem] p-4 text-[var(--muted)]">
                    <div className="text-[0.68rem] tracking-[0.28em] text-[var(--muted-soft)]/80">
                      No Quick Logs
                    </div>
                    <div className="mt-2 text-sm leading-7">
                      這一輪還沒有招待或自飲紀錄，等你按下去之後這裡就會開始留痕跡。
                    </div>
                  </div>
                ) : (
                  quickLogs.map((log) => (
                    <div key={log.id} className="nomiya-worktile rounded-[1.4rem] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                          {log.varianceCategory || log.product.name}
                        </div>
                        <div className="text-xs text-[var(--muted-soft)]">
                          {new Date(log.countedAt).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {log.varianceReason || log.product.name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
      {quickLogDraft ? (
        <div className="fixed inset-x-4 bottom-4 z-40 md:inset-x-auto md:right-6 md:w-[24rem]">
          <div className="rounded-[1.6rem] border border-[rgba(184,127,58,0.22)] bg-[rgba(255,248,240,0.97)] p-4 shadow-[0_18px_50px_rgba(84,56,26,0.18)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[0.68rem] tracking-[0.24em] text-[var(--muted-soft)]/80">
                  QUICK LOG
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {quickLogDraft.varianceCategory}
                </div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {quickLogDraft.label}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickLogDraft(null)
                  setQuickLogQty('1')
                  setQuickLogNote('')
                }}
                className="nomiya-button-secondary rounded-full px-3 py-1.5 text-xs"
              >
                關閉
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={quickLogQty}
                onChange={(event) => setQuickLogQty(event.target.value)}
                type="number"
                min="1"
                placeholder="數量"
                className="nomiya-input rounded-[1rem] px-4 py-3 text-sm"
              />
              <input
                value={quickLogNote}
                onChange={(event) => setQuickLogNote(event.target.value)}
                placeholder="簡短備註，例如 生日招待 / 老闆試酒"
                className="nomiya-input rounded-[1rem] px-4 py-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void quickLogConsumption(quickLogDraft)}
                  disabled={
                    quickLogKey ===
                    `${quickLogDraft.productId}-${quickLogDraft.variantId || quickLogDraft.mode || 'basic'}-${quickLogDraft.varianceCategory}`
                  }
                  className="nomiya-button-primary flex-1 rounded-[1rem] px-4 py-3 text-sm font-semibold"
                >
                  {quickLogKey ===
                  `${quickLogDraft.productId}-${quickLogDraft.variantId || quickLogDraft.mode || 'basic'}-${quickLogDraft.varianceCategory}`
                    ? '記錄中...'
                    : '確認記錄'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickLogDraft(null)
                    setQuickLogQty('1')
                    setQuickLogNote('')
                  }}
                  className="nomiya-button-secondary flex-1 rounded-[1rem] px-4 py-3 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
