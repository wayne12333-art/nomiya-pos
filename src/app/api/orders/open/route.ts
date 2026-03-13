import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const customerName = String(body.customerName || '').trim()
    const note = body.note ? String(body.note).trim() : null

    if (!customerName) {
      return NextResponse.json({ error: '請輸入客人名稱' }, { status: 400 })
    }

    const existingOpenOrder = await prisma.order.findFirst({
      where: {
        paymentStatus: 'open',
        customerName,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
      },
    })

    if (existingOpenOrder) {
      return NextResponse.json(existingOpenOrder, { status: 200 })
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        subtotal: 0,
        discountAmount: 0,
        adjustmentAmount: 0,
        totalAmount: 0,
        paymentMethod: '未結帳',
        paymentStatus: 'open',
        serviceMode: '內用',
        note,
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Open order error:', error)
    return NextResponse.json({ error: '開單失敗' }, { status: 500 })
  }
}
