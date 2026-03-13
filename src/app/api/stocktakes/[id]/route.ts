import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.stocktake.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '盤點紀錄已刪除',
    })
  } catch (error) {
    console.error('Delete stocktake error:', error)
    return NextResponse.json({ error: '刪除盤點紀錄失敗' }, { status: 500 })
  }
}