import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const name = String(body.name || '').trim()
    const category = String(body.category || '').trim()

    if (!name) {
      return NextResponse.json({ error: '請輸入商品名稱' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: '請輸入商品類別' }, { status: 400 })
    }

    const portionMl =
      body.portionMl === null || body.portionMl === '' || body.portionMl === undefined
        ? null
        : Number(body.portionMl)

    const estimatedServings =
      body.estimatedServings === null ||
      body.estimatedServings === '' ||
      body.estimatedServings === undefined
        ? null
        : Number(body.estimatedServings)

    const totalVolumeMl =
      portionMl && estimatedServings ? portionMl * estimatedServings : null

    const salePrice =
      body.salePrice === null || body.salePrice === '' || body.salePrice === undefined
        ? null
        : Number(body.salePrice)

    const strongSurcharge =
      body.strongSurcharge === null ||
      body.strongSurcharge === '' ||
      body.strongSurcharge === undefined
        ? null
        : Number(body.strongSurcharge)

    const specialSurcharge =
      body.specialSurcharge === null ||
      body.specialSurcharge === '' ||
      body.specialSurcharge === undefined
        ? null
        : Number(body.specialSurcharge)

    const purchasePrice =
      body.purchasePrice === null ||
      body.purchasePrice === '' ||
      body.purchasePrice === undefined
        ? null
        : Number(body.purchasePrice)

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
        saleStatus: body.saleStatus === undefined ? true : Boolean(body.saleStatus),

        portionMl,
        estimatedServings,
        totalVolumeMl,

        salePrice,
        strongSurcharge,
        specialSurcharge,
        purchasePrice,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: '更新商品失敗' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { productId: id } })
      await tx.stocktake.deleteMany({ where: { productId: id } })
      await tx.purchaseItem.deleteMany({ where: { productId: id } })
      await tx.recipe.deleteMany({ where: { saleProductId: id } })
      await tx.recipe.deleteMany({ where: { ingredientProductId: id } })
      await tx.productVariant.deleteMany({ where: { productId: id } })
      await tx.inventoryItem.deleteMany({ where: { productId: id } })
      await tx.openedBottle.deleteMany({ where: { productId: id } })
      await tx.product.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: '商品已完全刪除' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: '刪除商品失敗' }, { status: 500 })
  }
}