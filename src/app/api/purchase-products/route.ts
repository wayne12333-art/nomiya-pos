import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        productType: {
          in: ['bottle', 'draft', 'food', 'merchandise'],
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        productType: true,
        inventoryMode: true,
        totalVolumeMl: true,
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch purchase products error:', error)
    return NextResponse.json({ error: '取得進貨商品失敗' }, { status: 500 })
  }
}