import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const productId = body.productId as string
    const countedOpenedRemainingMl = body.countedOpenedRemainingMl
      ? Number(body.countedOpenedRemainingMl)
      : null
    const countedQty = body.countedQty ? Number(body.countedQty) : null
    const varianceCategory = body.varianceCategory || null
    const varianceReason = body.varianceReason || null

    if (!productId) {
      return NextResponse.json({ error: '缺少商品' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId },
    })

    if (!product || !inventory) {
      return NextResponse.json({ error: '找不到商品或庫存' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      if (product.inventoryMode === 'ml') {
        const theoreticalMl = inventory.theoreticalRemainingMl ?? 0
        const actualMl = countedOpenedRemainingMl ?? 0
        const varianceMl = actualMl - theoreticalMl

        const stocktake = await tx.stocktake.create({
          data: {
            productId,
            varianceCategory,
            theoreticalMl,
            actualMl,
            varianceMl,
            varianceReason,
          },
        })

        await tx.inventoryItem.update({
          where: { productId },
          data: {
            actualRemainingMl: actualMl,
          },
        })

        return stocktake
      }

      const theoreticalQty = inventory.theoreticalQty ?? 0
      const actualQty = countedQty ?? 0
      const varianceQty = actualQty - theoreticalQty

      const stocktake = await tx.stocktake.create({
        data: {
          productId,
          varianceCategory,
          theoreticalQty,
          actualQty,
          varianceQty,
          varianceReason,
        },
      })

      await tx.inventoryItem.update({
        where: { productId },
        data: {
          actualQty: actualQty,
        },
      })

      return stocktake
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create stocktake error:', error)
    return NextResponse.json({ error: '建立盤點失敗' }, { status: 500 })
  }
}
