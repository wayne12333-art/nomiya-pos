import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const variant = await prisma.productVariant.create({
      data: {
        productId: body.productId,
        name: body.name,
        price: Number(body.price),
        volumeMl: body.volumeMl ? Number(body.volumeMl) : null,
        useRecipeDeduction: body.useRecipeDeduction ?? false,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    console.error('Create variant error:', error)
    return NextResponse.json({ error: '建立規格失敗' }, { status: 500 })
  }
}