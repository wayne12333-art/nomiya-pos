import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ConsumeCategory = '招待 Shot' | '老闆自飲'
type AddMode = 'basic' | 'strong' | 'special'

function buildReason(
  productName: string,
  category: ConsumeCategory,
  optionLabel: string,
  qty: number,
  note?: string
) {
  const parts = [`${category}｜${productName}${optionLabel ? ` / ${optionLabel}` : ''}`]
  if (qty > 1) parts.push(`x${qty}`)
  if (note?.trim()) parts.push(note.trim())
  return parts.join('｜')
}

function resolvePortionMl(product: {
  portionMl: number | null
  totalVolumeMl: number | null
  estimatedServings: number | null
}) {
  if (product.portionMl && product.portionMl > 0) {
    return product.portionMl
  }

  if (
    product.totalVolumeMl &&
    product.totalVolumeMl > 0 &&
    product.estimatedServings &&
    product.estimatedServings > 0
  ) {
    return Math.round(product.totalVolumeMl / product.estimatedServings)
  }

  return 0
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const productId = String(body.productId || '').trim()
    const variantId = body.variantId ? String(body.variantId).trim() : null
    const mode = String(body.mode || 'basic') as AddMode
    const varianceCategory = String(body.varianceCategory || '').trim() as ConsumeCategory
    const qty = Math.max(1, Number(body.qty || 1))
    const note = String(body.note || '').trim()

    if (!productId) {
      return NextResponse.json({ error: '缺少商品' }, { status: 400 })
    }

    if (!['招待 Shot', '老闆自飲'].includes(varianceCategory)) {
      return NextResponse.json({ error: '快捷記錄類型不正確' }, { status: 400 })
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: '數量不正確' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventoryItems: true,
        variants: true,
        recipesAsSale: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: '找不到商品' }, { status: 404 })
    }

    let optionLabel = '基本'
    let deductMl = 0
    let deductQty = 0
    let useRecipeDeduction = false
    let selectedVariant: (typeof product.variants)[number] | null = null

    if (variantId) {
      selectedVariant = product.variants.find((item) => item.id === variantId) ?? null
      if (!selectedVariant) {
        return NextResponse.json({ error: '找不到規格' }, { status: 404 })
      }
      optionLabel = selectedVariant.name
      useRecipeDeduction = selectedVariant.useRecipeDeduction
      if (product.inventoryMode === 'ml') {
        deductMl = selectedVariant.volumeMl ?? resolvePortionMl(product)
      } else {
        deductQty = 1
      }
    } else if (product.inventoryMode === 'ml') {
      deductMl = resolvePortionMl(product)
      optionLabel = mode === 'strong' ? '加厚' : mode === 'special' ? '特調' : '基本'
      useRecipeDeduction = product.recipesAsSale.length > 0
    } else {
      deductQty = 1
      optionLabel = mode === 'strong' ? '加厚' : mode === 'special' ? '特調' : '基本'
      useRecipeDeduction = product.recipesAsSale.length > 0
    }

    if (
      !useRecipeDeduction &&
      product.inventoryMode === 'ml' &&
      deductMl <= 0
    ) {
      return NextResponse.json({ error: '此品項沒有可扣除的 ml 設定' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      if (useRecipeDeduction) {
        if (product.recipesAsSale.length === 0) {
          throw new Error('此品項沒有可用的配方扣庫設定')
        }

        for (const recipe of product.recipesAsSale) {
          if (!recipe.amount || !recipe.unitType) continue

          const ingredientInventory = await tx.inventoryItem.findUnique({
            where: { productId: recipe.ingredientProductId },
          })

          if (!ingredientInventory) {
            throw new Error(`找不到原料庫存：${recipe.ingredientProductId}`)
          }

          if (recipe.unitType === 'ml') {
            const theoreticalMl = ingredientInventory.theoreticalRemainingMl ?? 0
            const currentActualMl = ingredientInventory.actualRemainingMl ?? 0
            const actualMl = Math.max(currentActualMl - Number(recipe.amount) * qty, 0)

            await tx.stocktake.create({
              data: {
                productId: recipe.ingredientProductId,
                varianceCategory,
                theoreticalMl,
                actualMl,
                varianceMl: actualMl - theoreticalMl,
                varianceReason: buildReason(product.name, varianceCategory, optionLabel, qty, note),
              },
            })

            await tx.inventoryItem.update({
              where: { productId: recipe.ingredientProductId },
              data: {
                actualRemainingMl: actualMl,
              },
            })
          }

          if (recipe.unitType === 'g') {
            const theoreticalG = ingredientInventory.theoreticalRemainingG ?? 0
            const currentActualG = ingredientInventory.actualRemainingG ?? 0
            const actualG = Math.max(currentActualG - Number(recipe.amount) * qty, 0)

            await tx.stocktake.create({
              data: {
                productId: recipe.ingredientProductId,
                varianceCategory,
                theoreticalG,
                actualG,
                varianceG: actualG - theoreticalG,
                varianceReason: buildReason(product.name, varianceCategory, optionLabel, qty, note),
              },
            })

            await tx.inventoryItem.update({
              where: { productId: recipe.ingredientProductId },
              data: {
                actualRemainingG: actualG,
              },
            })
          }

          if (recipe.unitType === 'qty') {
            const theoreticalQty = ingredientInventory.theoreticalQty ?? 0
            const currentActualQty = ingredientInventory.actualQty ?? 0
            const actualQty = Math.max(currentActualQty - Number(recipe.amount) * qty, 0)

            await tx.stocktake.create({
              data: {
                productId: recipe.ingredientProductId,
                varianceCategory,
                theoreticalQty,
                actualQty,
                varianceQty: actualQty - theoreticalQty,
                varianceReason: buildReason(product.name, varianceCategory, optionLabel, qty, note),
              },
            })

            await tx.inventoryItem.update({
              where: { productId: recipe.ingredientProductId },
              data: {
                actualQty,
              },
            })
          }
        }

        return { success: true }
      }

      const inventory = await tx.inventoryItem.findUnique({
        where: { productId },
      })

      if (!inventory) {
        throw new Error('找不到庫存資料')
      }

      if (product.inventoryMode === 'ml') {
        const theoreticalMl = inventory.theoreticalRemainingMl ?? 0
        const currentActualMl = inventory.actualRemainingMl ?? 0
        const actualMl = Math.max(currentActualMl - deductMl * qty, 0)
        const varianceMl = actualMl - theoreticalMl

        const stocktake = await tx.stocktake.create({
          data: {
            productId,
            varianceCategory,
            theoreticalMl,
            actualMl,
            varianceMl,
            varianceReason: buildReason(product.name, varianceCategory, optionLabel, qty, note),
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
      const currentActualQty = inventory.actualQty ?? 0
      const actualQty = Math.max(currentActualQty - deductQty * qty, 0)
      const varianceQty = actualQty - theoreticalQty

      const stocktake = await tx.stocktake.create({
        data: {
          productId,
          varianceCategory,
          theoreticalQty,
          actualQty,
          varianceQty,
          varianceReason: buildReason(product.name, varianceCategory, optionLabel, qty, note),
        },
      })

      await tx.inventoryItem.update({
        where: { productId },
        data: {
          actualQty,
        },
      })

      return stocktake
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Quick stocktake log error:', error)
    const message = error instanceof Error ? error.message : '快捷記錄失敗'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const logs = await prisma.stocktake.findMany({
      where: {
        varianceCategory: {
          in: ['招待 Shot', '老闆自飲'],
        },
      },
      orderBy: {
        countedAt: 'desc',
      },
      take: 8,
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Fetch quick stocktake logs error:', error)
    return NextResponse.json({ error: '取得快捷紀錄失敗' }, { status: 500 })
  }
}
