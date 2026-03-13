import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: '找不到進貨紀錄' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        const inventory = await tx.inventoryItem.findUnique({
          where: { productId: item.productId },
        })

        if (!inventory) continue

        if (item.product.inventoryMode === 'ml') {
          const removeMl = (item.volumeMl ?? 0) * item.qty
          const nextActualMl = Math.max((inventory.actualRemainingMl ?? 0) - removeMl, 0)
          const nextTheoreticalMl = Math.max(
            (inventory.theoreticalRemainingMl ?? 0) - removeMl,
            0
          )
          const nextBottleQty = Math.max((inventory.unopenedBottleQty ?? 0) - item.qty, 0)

          await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: {
              actualRemainingMl: nextActualMl,
              theoreticalRemainingMl: nextTheoreticalMl,
              unopenedBottleQty: nextBottleQty,
              latestCostPerMl: nextActualMl > 0 ? inventory.latestCostPerMl : 0,
              avgCostPerMl: nextActualMl > 0 ? inventory.avgCostPerMl : 0,
            },
          })
        }

        if (item.product.inventoryMode === 'quantity') {
          const nextActualQty = Math.max((inventory.actualQty ?? 0) - item.qty, 0)
          const nextTheoreticalQty = Math.max(
            (inventory.theoreticalQty ?? 0) - item.qty,
            0
          )

          await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: {
              actualQty: nextActualQty,
              theoreticalQty: nextTheoreticalQty,
              latestCostPerQty: nextActualQty > 0 ? inventory.latestCostPerQty : 0,
              avgCostPerQty: nextActualQty > 0 ? inventory.avgCostPerQty : 0,
            },
          })
        }
      }

      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      })

      await tx.purchase.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true, message: '進貨紀錄已刪除' })
  } catch (error) {
    console.error('Delete purchase error:', error)
    return NextResponse.json({ error: '刪除進貨紀錄失敗' }, { status: 500 })
  }
}