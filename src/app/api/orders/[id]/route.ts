import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const customerName =
      typeof body.customerName === 'string' ? body.customerName.trim() : null
    const note = typeof body.note === 'string' ? body.note.trim() : null
    const serviceMode =
      body.serviceMode === '內用' || body.serviceMode === '外帶'
        ? body.serviceMode
        : null

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: '找不到記單' }, { status: 404 })
    }

    if (order.paymentStatus !== 'open') {
      return NextResponse.json({ error: '只能更新未結帳記單' }, { status: 400 })
    }

    if (customerName !== null && !customerName) {
      return NextResponse.json({ error: '客人名稱不可空白' }, { status: 400 })
    }

    if (customerName === null && note === null && serviceMode === null) {
      return NextResponse.json({ error: '沒有可更新的內容' }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(customerName !== null
          ? {
              customerName,
            }
          : {}),
        ...(note !== null
          ? {
              note: note || null,
            }
          : {}),
        ...(serviceMode !== null
          ? {
              serviceMode,
            }
          : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update order served state error:', error)
    return NextResponse.json({ error: '更新出餐狀態失敗' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))

    const voidReason = body.voidReason
      ? String(body.voidReason).trim()
      : '未填原因'

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: '找不到記單' }, { status: 404 })
    }

    if (order.paymentStatus !== 'open') {
      return NextResponse.json({ error: '只能作廢未結帳記單' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: {
          orderId: id,
          itemStatus: 'active',
        },
        data: {
          itemStatus: 'cancelled',
          cancelReason: `開單作廢：${voidReason}`,
        },
      })

      return tx.order.update({
        where: { id },
        data: {
          subtotal: 0,
          totalAmount: 0,
          paymentStatus: 'voided',
          paymentMethod: '作廢',
          closedAt: new Date(),
          note: order.note
            ? `${order.note}\n作廢原因：${voidReason}`
            : `作廢原因：${voidReason}`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: '記單已作廢',
      order: updated,
    })
  } catch (error) {
    console.error('Void order error:', error)
    return NextResponse.json({ error: '作廢記單失敗' }, { status: 500 })
  }
}
