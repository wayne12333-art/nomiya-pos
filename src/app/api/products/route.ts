import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = String(body.name || '').trim()
    const category = String(body.category || '').trim()
    const productType = String(body.productType || '').trim()
    const inventoryMode = String(body.inventoryMode || '').trim()
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null
    const description = body.description ? String(body.description).trim() : null

    const portionMl = body.portionMl ? Number(body.portionMl) : null
    const estimatedServings = body.estimatedServings
      ? Number(body.estimatedServings)
      : null

    const totalVolumeMl =
      portionMl && estimatedServings ? portionMl * estimatedServings : null

    if (!name) {
      return NextResponse.json({ error: '請輸入商品名稱' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: '請選擇或輸入類別' }, { status: 400 })
    }

    if (!productType) {
      return NextResponse.json({ error: '請選擇商品類型' }, { status: 400 })
    }

    if (!inventoryMode) {
      return NextResponse.json({ error: '請選擇庫存模式' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        productType,
        inventoryMode,
        imageUrl,
        description,

        isAlcohol: Boolean(body.isAlcohol),
        isRecipe: Boolean(body.isRecipe),
        isMerchandise: Boolean(body.isMerchandise),
        isWholeBottleSale: Boolean(body.isWholeBottleSale),
        saleStatus: body.saleStatus !== false,

        portionMl,
        estimatedServings,
        totalVolumeMl,
        totalWeightG: body.totalWeightG ? Number(body.totalWeightG) : null,

        purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null,
        salePrice: body.salePrice ? Number(body.salePrice) : null,
        strongSurcharge: body.strongSurcharge
          ? Number(body.strongSurcharge)
          : null,
        specialSurcharge: body.specialSurcharge
          ? Number(body.specialSurcharge)
          : null,
      },
    })

    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        unopenedBottleQty: 0,
        openedBottleQty: 0,
        theoreticalRemainingMl: 0,
        actualRemainingMl: 0,
        theoreticalRemainingG: 0,
        actualRemainingG: 0,
        theoreticalQty: 0,
        actualQty: 0,
        lowStockThresholdMl: 0,
        lowStockThresholdG: 0,
        lowStockThresholdQty: 0,
        latestCostPerMl: 0,
        avgCostPerMl: 0,
        latestCostPerG: 0,
        avgCostPerG: 0,
        latestCostPerQty: 0,
        avgCostPerQty: 0,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: '建立商品失敗' }, { status: 500 })
  }
}