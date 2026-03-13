import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const recipe = await prisma.recipe.create({
      data: {
        saleProductId: body.saleProductId,
        ingredientProductId: body.ingredientProductId,
        amount: Number(body.amount),
        unitType: body.unitType,
      },
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Create recipe error:', error)
    return NextResponse.json({ error: '建立配方失敗' }, { status: 500 })
  }
}