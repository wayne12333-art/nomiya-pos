import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const name = (body.name || '').trim()
    const note = (body.note || '').trim()

    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: '找不到客人' }, { status: 404 })
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name || existing.name,
        note: note || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json({ error: '更新客人失敗' }, { status: 500 })
  }
}