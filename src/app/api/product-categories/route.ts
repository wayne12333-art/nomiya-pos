import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    })

    const categories = products
      .map((item) => item.category?.trim())
      .filter(Boolean)

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Fetch product categories error:', error)
    return NextResponse.json({ error: '取得類別失敗' }, { status: 500 })
  }
}