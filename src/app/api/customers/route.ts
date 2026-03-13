import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: [
        { visitCount: 'desc' },
        { lastVisitAt: 'desc' },
        { name: 'asc' },
      ],
      take: 100,
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Fetch customers error:', error)
    return NextResponse.json({ error: '取得客人資料失敗' }, { status: 500 })
  }
}