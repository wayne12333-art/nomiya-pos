import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const jimBeams = await prisma.product.findMany({
    where: { name: 'Jim Beam' },
    include: {
      variants: true,
      inventoryItems: true,
      orderItems: true,
    },
    orderBy: { id: 'asc' },
  })

  console.log(
    jimBeams.map((p) => ({
      id: p.id,
      name: p.name,
      totalVolumeMl: p.totalVolumeMl,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        volumeMl: v.volumeMl,
        price: v.price,
      })),
      inventoryCount: p.inventoryItems.length,
      orderItemsCount: p.orderItems.length,
    }))
  )

  if (jimBeams.length <= 1) {
    console.log('沒有重複的 Jim Beam')
    return
  }

  // 保留「有正常規格」而且不是空 id 的那一筆
  const keep =
    jimBeams.find(
      (p) =>
        p.id !== '' &&
        p.variants.some((v) => v.volumeMl !== null && v.volumeMl > 0)
    ) ?? jimBeams[0]

  const toDelete = jimBeams.filter((p) => p.id !== keep.id)

  console.log('保留:', keep.id)
  console.log('刪除:', toDelete.map((p) => p.id))

  for (const product of toDelete) {
    await prisma.productVariant.deleteMany({
      where: { productId: product.id },
    })

    await prisma.inventoryItem.deleteMany({
      where: { productId: product.id },
    })

    // 只刪沒有訂單明細掛上的商品，避免外鍵問題
    if (product.orderItems.length === 0) {
      await prisma.product.delete({
        where: { id: product.id },
      })
      console.log('已刪除商品:', product.id)
    } else {
      console.log('跳過有訂單明細的商品:', product.id)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
