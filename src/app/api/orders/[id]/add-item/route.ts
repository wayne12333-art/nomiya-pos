import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type AddMode = 'basic' | 'strong' | 'special'

function calcRecipeCostSnapshot(product: {
  productType: string
  purchasePrice: number | null
  portionMl: number | null
  inventoryItems: {
    avgCostPerMl: number | null
  } | null
}) {
  if (product.productType === 'food' || product.productType === 'merchandise') {
    return product.purchasePrice ?? null
  }

  if (
    product.inventoryItems?.avgCostPerMl &&
    product.portionMl &&
    product.portionMl > 0
  ) {
    return Number((product.inventoryItems.avgCostPerMl * product.portionMl).toFixed(2))
  }

  return null
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const productId = String(body.productId || '').trim()
    const qty = Number(body.qty || 1)
    const mode = String(body.mode || 'basic') as AddMode

    if (!productId) {
      return NextResponse.json({ error: '請選擇商品' }, { status: 400 })
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: '數量不正確' }, { status: 400 })
    }

    if (!['basic', 'strong', 'special'].includes(mode)) {
      return NextResponse.json({ error: '加單模式不正確' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order || order.paymentStatus !== 'open') {
      return NextResponse.json({ error: '找不到可加單的記單' }, { status: 404 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventoryItems: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: '找不到商品' }, { status: 404 })
    }

    const basePrice = product.salePrice ?? 0

    let unitPrice = basePrice
    let optionLabel = '基本'

    if (mode === 'strong') {
      unitPrice = basePrice + (product.strongSurcharge ?? 0)
      optionLabel = '加厚'
    }

    if (mode === 'special') {
      unitPrice = basePrice + (product.specialSurcharge ?? 0)
      optionLabel = '特調'
    }

    const itemNameSnapshot =
      optionLabel === '基本' ? product.name : `${product.name}（${optionLabel}）`

    const recipeCostSnapshot = calcRecipeCostSnapshot(product)

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.orderItem.create({
        data: {
          orderId: id,
          productId: product.id,
          variantId: null,
          itemNameSnapshot,
          variantNameSnapshot: optionLabel,
          qty: Math.round(qty),
          unitPrice,
          lineTotal: unitPrice * Math.round(qty),
          deliveredQty: 0,
          recipeCostSnapshot,
          itemStatus: 'active',
          cancelReason: null,
        },
      })

      const activeItems = await tx.orderItem.findMany({
        where: {
          orderId: id,
          itemStatus: 'active',
        },
      })

      const subtotal = activeItems.reduce((sum, item) => sum + item.lineTotal, 0)

      await tx.order.update({
        where: { id },
        data: {
          subtotal,
          totalAmount: subtotal - (order.discountAmount ?? 0) + (order.adjustmentAmount ?? 0),
          servedAt: null,
        },
      })

      return created
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Add order item error:', error)
    return NextResponse.json({ error: '加單失敗' }, { status: 500 })
  }
}
