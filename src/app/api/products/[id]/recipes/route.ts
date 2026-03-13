import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const recipes = await prisma.recipe.findMany({
      where: {
        saleProductId: id,
      },
      include: {
        ingredientProduct: {
          select: {
            id: true,
            name: true,
            category: true,
            inventoryMode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Fetch recipes error:', error)
    return NextResponse.json({ error: '取得配置失敗' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    const ingredientProductId = String(body.ingredientProductId || '').trim()
    const amount = Number(body.amount || 0)
    const unitType = String(body.unitType || '').trim()

    if (!ingredientProductId) {
      return NextResponse.json({ error: '請選擇原料商品' }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: '配置數量不正確' }, { status: 400 })
    }

    if (!unitType) {
      return NextResponse.json({ error: '請選擇單位' }, { status: 400 })
    }

    const saleProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!saleProduct) {
      return NextResponse.json({ error: '找不到販售商品' }, { status: 404 })
    }

    const ingredientProduct = await prisma.product.findUnique({
      where: { id: ingredientProductId },
    })

    if (!ingredientProduct) {
      return NextResponse.json({ error: '找不到原料商品' }, { status: 404 })
    }

    const recipe = await prisma.recipe.create({
      data: {
        saleProductId: id,
        ingredientProductId,
        amount,
        unitType,
      },
      include: {
        ingredientProduct: {
          select: {
            id: true,
            name: true,
            category: true,
            inventoryMode: true,
          },
        },
      },
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Create recipe error:', error)
    return NextResponse.json({ error: '建立配置失敗' }, { status: 500 })
  }
}