import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: {
        purchaseDate: 'desc',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Fetch purchases error:', error)
    return NextResponse.json({ error: '取得進貨紀錄失敗' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const productId = String(body.productId || '').trim()
    const supplierName = body.supplierName ? String(body.supplierName).trim() : null
    const note = body.note ? String(body.note).trim() : null
    const qty = Number(body.qty || 0)
    const unitCost = Number(body.unitCost || 0)
    const volumeMl = body.volumeMl === '' || body.volumeMl === null || body.volumeMl === undefined
      ? null
      : Number(body.volumeMl)

    if (!productId) {
      return NextResponse.json({ error: '請選擇商品' }, { status: 400 })
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: '進貨數量不正確' }, { status: 400 })
    }

    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      return NextResponse.json({ error: '進貨金額不正確' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventoryItems: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: '找不到商品' }, { status: 404 })
    }

    const totalCost = Math.round(unitCost * qty)

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          supplierName,
          totalAmount: totalCost,
          note,
          items: {
            create: {
              productId,
              qty: Math.round(qty),
              volumeMl:
                product.inventoryMode === 'ml'
                  ? (volumeMl ?? product.totalVolumeMl ?? null)
                  : null,
              weightG: null,
              unitCost: Math.round(unitCost),
              totalCost,
            },
          },
        },
        include: {
          items: true,
        },
      })

      let inventory = await tx.inventoryItem.findUnique({
        where: { productId },
      })

      if (!inventory) {
        inventory = await tx.inventoryItem.create({
          data: {
            productId,
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
      }

      if (product.inventoryMode === 'ml') {
        const addMl = (volumeMl ?? product.totalVolumeMl ?? 0) * qty
        const totalExistingMl = inventory.actualRemainingMl ?? 0
        const totalNewMl = addMl
        const latestCostPerMl = totalNewMl > 0 ? totalCost / totalNewMl : 0

        const existingValue =
          (inventory.avgCostPerMl ?? 0) * (inventory.actualRemainingMl ?? 0)
        const newValue = latestCostPerMl * totalNewMl
        const nextMl = totalExistingMl + totalNewMl

        const avgCostPerMl = nextMl > 0 ? (existingValue + newValue) / nextMl : 0

        await tx.inventoryItem.update({
          where: { productId },
          data: {
            theoreticalRemainingMl: (inventory.theoreticalRemainingMl ?? 0) + addMl,
            actualRemainingMl: (inventory.actualRemainingMl ?? 0) + addMl,
            unopenedBottleQty: (inventory.unopenedBottleQty ?? 0) + Math.round(qty),
            latestCostPerMl,
            avgCostPerMl,
          },
        })
      }

      if (product.inventoryMode === 'quantity') {
        const totalExistingQty = inventory.actualQty ?? 0
        const latestCostPerQty = qty > 0 ? totalCost / qty : 0

        const existingValue =
          (inventory.avgCostPerQty ?? 0) * (inventory.actualQty ?? 0)
        const newValue = latestCostPerQty * qty
        const nextQty = totalExistingQty + qty

        const avgCostPerQty = nextQty > 0 ? (existingValue + newValue) / nextQty : 0

        await tx.inventoryItem.update({
          where: { productId },
          data: {
            theoreticalQty: (inventory.theoreticalQty ?? 0) + Math.round(qty),
            actualQty: (inventory.actualQty ?? 0) + Math.round(qty),
            latestCostPerQty,
            avgCostPerQty,
          },
        })
      }

      return purchase
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create purchase error:', error)
    return NextResponse.json({ error: '建立進貨失敗' }, { status: 500 })
  }
}