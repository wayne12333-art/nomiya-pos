import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CheckoutItem = {
  productId: string
  productName: string
  variantId: string
  variantName: string
  price: number
  qty: number
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const items: CheckoutItem[] = body.items ?? []

    if (!items.length) {
      return NextResponse.json({ error: '訂單沒有商品' }, { status: 400 })
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.qty),
      0
    )

    const order = await prisma.$transaction(async (tx) => {
      const preparedItems: Array<{
        productId: string
        variantId: string
        itemNameSnapshot: string
        variantNameSnapshot: string
        qty: number
        unitPrice: number
        lineTotal: number
        recipeCostSnapshot: number | null
      }> = []

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            recipesAsSale: true,
          },
        })

        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        })

        const inventory = await tx.inventoryItem.findUnique({
          where: { productId: item.productId },
        })

        if (!product || !variant) {
          throw new Error(`找不到商品或規格：${item.productName}`)
        }

        let recipeCostSnapshot: number | null = 0

        if (variant.useRecipeDeduction) {
          for (const recipe of product.recipesAsSale) {
            const ingredientInventory = await tx.inventoryItem.findUnique({
              where: { productId: recipe.ingredientProductId },
            })

            const ingredientProduct = await tx.product.findUnique({
              where: { id: recipe.ingredientProductId },
            })

            if (!ingredientInventory || !ingredientProduct) {
              throw new Error(
                `找不到配方原料庫存：${recipe.ingredientProductId}`
              )
            }

            if (recipe.unitType === 'ml') {
              const deductMl = Number(recipe.amount) * Number(item.qty)
              const newMl =
                (ingredientInventory.theoreticalRemainingMl ?? 0) - deductMl

              const ingredientCost =
                (ingredientInventory.avgCostPerMl ??
                  ingredientInventory.latestCostPerMl ??
                  0) * deductMl

              recipeCostSnapshot += ingredientCost

              await tx.inventoryItem.update({
                where: { productId: recipe.ingredientProductId },
                data: {
                  theoreticalRemainingMl: newMl,
                },
              })
            }

            if (recipe.unitType === 'g') {
              const deductG = Number(recipe.amount) * Number(item.qty)
              const newG =
                (ingredientInventory.theoreticalRemainingG ?? 0) - deductG

              const ingredientCost =
                (ingredientInventory.avgCostPerG ??
                  ingredientInventory.latestCostPerG ??
                  0) * deductG

              recipeCostSnapshot += ingredientCost

              await tx.inventoryItem.update({
                where: { productId: recipe.ingredientProductId },
                data: {
                  theoreticalRemainingG: newG,
                },
              })
            }

            if (recipe.unitType === 'qty') {
              const deductQty = Number(recipe.amount) * Number(item.qty)
              const newQty =
                (ingredientInventory.theoreticalQty ?? 0) - deductQty

              const ingredientCost =
                (ingredientInventory.avgCostPerQty ??
                  ingredientInventory.latestCostPerQty ??
                  0) * deductQty

              recipeCostSnapshot += ingredientCost

              await tx.inventoryItem.update({
                where: { productId: recipe.ingredientProductId },
                data: {
                  theoreticalQty: newQty,
                },
              })
            }
          }
        } else {
          if (!inventory) {
            throw new Error(`找不到商品庫存：${item.productName}`)
          }

          if (product.inventoryMode === 'quantity') {
            const newQty = (inventory.theoreticalQty ?? 0) - Number(item.qty)
            const directCost =
              (inventory.avgCostPerQty ?? inventory.latestCostPerQty ?? 0) *
              Number(item.qty)

            recipeCostSnapshot = directCost

            await tx.inventoryItem.update({
              where: { productId: item.productId },
              data: {
                theoreticalQty: newQty,
              },
            })
          }

          if (product.inventoryMode === 'ml') {
            const deductMl = (variant.volumeMl ?? 0) * Number(item.qty)
            const newMl = (inventory.theoreticalRemainingMl ?? 0) - deductMl

            const directCost =
              (inventory.avgCostPerMl ?? inventory.latestCostPerMl ?? 0) *
              deductMl

            recipeCostSnapshot = directCost

            await tx.inventoryItem.update({
              where: { productId: item.productId },
              data: {
                theoreticalRemainingMl: newMl,
              },
            })
          }

          if (product.inventoryMode === 'g') {
            const deductG = (variant.weightG ?? 0) * Number(item.qty)
            const newG = (inventory.theoreticalRemainingG ?? 0) - deductG

            const directCost =
              (inventory.avgCostPerG ?? inventory.latestCostPerG ?? 0) *
              deductG

            recipeCostSnapshot = directCost

            await tx.inventoryItem.update({
              where: { productId: item.productId },
              data: {
                theoreticalRemainingG: newG,
              },
            })
          }
        }

        preparedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          itemNameSnapshot: item.productName,
          variantNameSnapshot: item.variantName,
          qty: Number(item.qty),
          unitPrice: Number(item.price),
          lineTotal: Number(item.price) * Number(item.qty),
          recipeCostSnapshot:
            recipeCostSnapshot !== null
              ? Number(recipeCostSnapshot.toFixed(2))
              : null,
        })
      }

      const createdOrder = await tx.order.create({
        data: {
          customerName: body.customerName || null,
          subtotal,
          discountAmount: 0,
          adjustmentAmount: 0,
          totalAmount: subtotal,
          paymentMethod: body.paymentMethod || '現金',
          paymentStatus: 'paid',
          closedAt: new Date(),
          items: {
            create: preparedItems,
          },
        },
        include: {
          items: true,
        },
      })

      return createdOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: '建立訂單失敗' }, { status: 500 })
  }
}
