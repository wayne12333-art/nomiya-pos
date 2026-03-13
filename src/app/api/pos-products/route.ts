import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        saleStatus: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        productType: true,
        inventoryMode: true,
        portionMl: true,
        salePrice: true,
        strongSurcharge: true,
        specialSurcharge: true,
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            volumeMl: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch POS products error:', error)
    return NextResponse.json({ error: '取得 POS 商品失敗' }, { status: 500 })
  }
}
