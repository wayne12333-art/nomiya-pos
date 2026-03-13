import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'open',
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Fetch open orders error:', error)
    return NextResponse.json({ error: '取得記單失敗' }, { status: 500 })
  }
}