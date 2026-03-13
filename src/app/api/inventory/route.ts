import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request
) {
  try {
    const body = await req.json().catch(() => ({}))
    const productId = String(body.productId || '').trim()

    if (!productId) {
      return NextResponse.json({ error: '缺少商品' }, { status: 400 })
    }

    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId },
      include: { product: true },
    })

    if (!inventory) {
      return NextResponse.json({ error: '找不到庫存資料' }, { status: 404 })
    }

    const updateData: {
      unopenedBottleQty?: number
      openedBottleQty?: number
      theoreticalRemainingMl?: number
      actualRemainingMl?: number
      theoreticalRemainingG?: number
      actualRemainingG?: number
      theoreticalQty?: number
      actualQty?: number
    } = {}

    if (inventory.product.inventoryMode === 'ml') {
      updateData.unopenedBottleQty = 0
      updateData.openedBottleQty = 0
      updateData.theoreticalRemainingMl = 0
      updateData.actualRemainingMl = 0
    }

    if (inventory.product.inventoryMode === 'g') {
      updateData.theoreticalRemainingG = 0
      updateData.actualRemainingG = 0
    }

    if (inventory.product.inventoryMode === 'quantity') {
      updateData.theoreticalQty = 0
      updateData.actualQty = 0
    }

    await prisma.inventoryItem.update({
      where: { productId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: `${inventory.product.name} 庫存已清空`,
    })
  } catch (error) {
    console.error('Reset inventory error:', error)
    return NextResponse.json({ error: '清空庫存失敗' }, { status: 500 })
  }
}
