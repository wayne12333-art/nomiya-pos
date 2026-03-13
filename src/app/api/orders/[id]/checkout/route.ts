import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const paymentMethod = String(body.paymentMethod || '現金').trim()
    const adjustmentMode = String(body.adjustmentMode || 'none').trim()
    const adjustmentValue = Math.max(0, Math.round(Number(body.adjustmentValue || 0)))

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order || order.paymentStatus !== 'open') {
      return NextResponse.json({ error: '找不到可結帳訂單' }, { status: 404 })
    }

    if (!['none', 'discount', 'surcharge'].includes(adjustmentMode)) {
      return NextResponse.json({ error: '調整方式不正確' }, { status: 400 })
    }

    const activeItems = order.items.filter((item) => item.itemStatus === 'active')
    const subtotal = activeItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const discountAmount = adjustmentMode === 'discount' ? adjustmentValue : 0
    const adjustmentAmount = adjustmentMode === 'surcharge' ? adjustmentValue : 0
    const totalAmount = subtotal - discountAmount + adjustmentAmount

    if (activeItems.length === 0 || totalAmount <= 0) {
      return NextResponse.json({ error: '沒有可結帳的品項' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of activeItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            inventoryItems: true,
            recipesAsSale: true,
          },
        })

        if (!product) continue

        if (product.recipesAsSale.length > 0) {
          for (const recipe of product.recipesAsSale) {
            const ingredient = await tx.product.findUnique({
              where: { id: recipe.ingredientProductId },
              include: {
                inventoryItems: true,
              },
            })

            if (!ingredient?.inventoryItems) continue

            const amount = recipe.amount ?? 0
            const totalDeduct = amount * item.qty

            if (recipe.unitType === 'ml') {
              await tx.inventoryItem.update({
                where: { productId: ingredient.id },
                data: {
                  theoreticalRemainingMl: Math.max(
                    (ingredient.inventoryItems.theoreticalRemainingMl ?? 0) - totalDeduct,
                    0
                  ),
                  actualRemainingMl: Math.max(
                    (ingredient.inventoryItems.actualRemainingMl ?? 0) - totalDeduct,
                    0
                  ),
                },
              })
            }

            if (recipe.unitType === 'qty') {
              await tx.inventoryItem.update({
                where: { productId: ingredient.id },
                data: {
                  theoreticalQty: Math.max(
                    (ingredient.inventoryItems.theoreticalQty ?? 0) - totalDeduct,
                    0
                  ),
                  actualQty: Math.max(
                    (ingredient.inventoryItems.actualQty ?? 0) - totalDeduct,
                    0
                  ),
                },
              })
            }
          }
        } else if (product.inventoryMode === 'ml' && product.inventoryItems) {
          const deductMl = product.portionMl ?? 0
          const totalDeductMl = deductMl * item.qty

          if (totalDeductMl > 0) {
            await tx.inventoryItem.update({
              where: { productId: product.id },
              data: {
                theoreticalRemainingMl: Math.max(
                  (product.inventoryItems.theoreticalRemainingMl ?? 0) - totalDeductMl,
                  0
                ),
                actualRemainingMl: Math.max(
                  (product.inventoryItems.actualRemainingMl ?? 0) - totalDeductMl,
                  0
                ),
              },
            })
          }
        } else if (product.inventoryMode === 'quantity' && product.inventoryItems) {
          await tx.inventoryItem.update({
            where: { productId: product.id },
            data: {
              theoreticalQty: Math.max(
                (product.inventoryItems.theoreticalQty ?? 0) - item.qty,
                0
              ),
              actualQty: Math.max(
                (product.inventoryItems.actualQty ?? 0) - item.qty,
                0
              ),
            },
          })
        }
      }

      const paidOrder = await tx.order.update({
        where: { id },
        data: {
          subtotal,
          discountAmount,
          adjustmentAmount,
          totalAmount,
          paymentMethod,
          paymentStatus: 'paid',
          closedAt: new Date(),
        },
        include: {
          items: true,
        },
      })

      if (order.customerName?.trim()) {
        const existingCustomer = await tx.customer.findFirst({
          where: {
            name: order.customerName.trim(),
          },
        })

        if (existingCustomer) {
          await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              visitCount: existingCustomer.visitCount + 1,
              totalSpent: existingCustomer.totalSpent + totalAmount,
              lastVisitAt: new Date(),
            },
          })
        } else {
          await tx.customer.create({
            data: {
              name: order.customerName.trim(),
              note: order.note ?? null,
              visitCount: 1,
              totalSpent: totalAmount,
              lastVisitAt: new Date(),
            },
          })
        }
      }

      return paidOrder
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Checkout order error:', error)
    return NextResponse.json({ error: '結帳失敗' }, { status: 500 })
  }
}
