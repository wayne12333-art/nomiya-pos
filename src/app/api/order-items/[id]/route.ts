import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function recalcOrder(orderId: string) {
  const activeItems = await prisma.orderItem.findMany({
    where: {
      orderId,
      itemStatus: 'active',
    },
  })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) return

  const subtotal = activeItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const allDelivered =
    activeItems.length > 0 && activeItems.every((item) => item.deliveredQty >= item.qty)

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      totalAmount: subtotal - (order.discountAmount ?? 0) + (order.adjustmentAmount ?? 0),
      servedAt: allDelivered ? new Date() : null,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const qty = Number(body.qty)
    const deliveredQty =
      body.deliveredQty === undefined ? null : Number(body.deliveredQty)

    if (deliveredQty === null && (!Number.isFinite(qty) || qty <= 0)) {
      return NextResponse.json({ error: '數量不正確' }, { status: 400 })
    }

    const item = await prisma.orderItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: '找不到品項' }, { status: 404 })
    }

    if (item.itemStatus !== 'active') {
      return NextResponse.json({ error: '已取消品項不可修改' }, { status: 400 })
    }

    if (
      deliveredQty !== null &&
      (!Number.isFinite(deliveredQty) ||
        deliveredQty < 0 ||
        deliveredQty > item.qty)
    ) {
      return NextResponse.json({ error: '交付份數不正確' }, { status: 400 })
    }

    const updated = await prisma.orderItem.update({
      where: { id },
      data: {
        ...(deliveredQty !== null
          ? {
              deliveredQty: Math.round(deliveredQty),
            }
          : {
              qty: Math.round(qty),
              lineTotal: item.unitPrice * Math.round(qty),
              deliveredQty: Math.min(item.deliveredQty, Math.round(qty)),
            }),
      },
    })

    await recalcOrder(item.orderId)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update order item error:', error)
    return NextResponse.json({ error: '修改品項失敗' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const cancelReason = body.cancelReason
      ? String(body.cancelReason).trim()
      : '取消'

    const item = await prisma.orderItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: '找不到品項' }, { status: 404 })
    }

    if (item.itemStatus === 'cancelled') {
      return NextResponse.json({ error: '此品項已取消' }, { status: 400 })
    }

    const updated = await prisma.orderItem.update({
      where: { id },
      data: {
        itemStatus: 'cancelled',
        cancelReason: cancelReason || '取消',
      },
    })

    await recalcOrder(item.orderId)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Cancel order item error:', error)
    return NextResponse.json({ error: '取消品項失敗' }, { status: 500 })
  }
}
