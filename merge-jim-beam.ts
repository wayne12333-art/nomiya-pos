import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './src/generated/prisma/client'

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
    '目前 Jim Beam：',
    jimBeams.map((p) => ({
      id: p.id,
      variantCount: p.variants.length,
      inventoryCount: p.inventoryItems.length,
      orderItemsCount: p.orderItems.length,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        volumeMl: v.volumeMl,
        price: v.price,
      })),
    }))
  )

  if (jimBeams.length <= 1) {
    console.log('沒有重複的 Jim Beam')
    return
  }

  // 保留：有正常 ml 規格的那一筆
  const keep =
    jimBeams.find(
      (p) =>
        p.id !== '' &&
        p.variants.some((v) => v.volumeMl !== null && v.volumeMl > 0)
    ) ?? jimBeams[0]

  const duplicates = jimBeams.filter((p) => p.id !== keep.id)

  console.log('保留商品:', keep.id)
  console.log('準備合併刪除:', duplicates.map((p) => p.id))

  for (const dup of duplicates) {
    // 1. 把訂單明細改掛到保留商品
    if (dup.orderItems.length > 0) {
      await prisma.orderItem.updateMany({
        where: { productId: dup.id },
        data: { productId: keep.id },
      })
      console.log(`已轉移 orderItems: ${dup.id} -> ${keep.id}`)
    }

    // 2. 把規格搬過去（避免重複名稱+價格就不搬）
    for (const variant of dup.variants) {
      const exists = await prisma.productVariant.findFirst({
        where: {
          productId: keep.id,
          name: variant.name,
          price: variant.price,
        },
      })

      let targetVariantId: string | null = null

      if (!exists) {
        const created = await prisma.productVariant.create({
          data: {
            productId: keep.id,
            name: variant.name,
            price: variant.price,
            volumeMl: variant.volumeMl,
            useRecipeDeduction: variant.useRecipeDeduction,
          },
        })
        targetVariantId = created.id
        console.log(`已搬移規格 ${variant.name} -> ${keep.id}`)
      } else {
        targetVariantId = exists.id
      }

      // 3. 把原本掛在舊規格上的訂單明細，改掛到新/既有規格
      await prisma.orderItem.updateMany({
        where: { variantId: variant.id },
        data: { variantId: targetVariantId },
      })
    }

    // 4. 合併庫存
    const dupInventory = dup.inventoryItems[0]
    const keepInventory = keep.inventoryItems[0]

    if (dupInventory && keepInventory) {
      await prisma.inventoryItem.update({
        where: { productId: keep.id },
        data: {
          unopenedBottleQty:
            (keepInventory.unopenedBottleQty ?? 0) +
            (dupInventory.unopenedBottleQty ?? 0),
          openedBottleQty:
            (keepInventory.openedBottleQty ?? 0) +
            (dupInventory.openedBottleQty ?? 0),
          theoreticalRemainingMl: Math.max(
            keepInventory.theoreticalRemainingMl ?? 0,
            dupInventory.theoreticalRemainingMl ?? 0
          ),
          actualRemainingMl: Math.max(
            keepInventory.actualRemainingMl ?? 0,
            dupInventory.actualRemainingMl ?? 0
          ),
          theoreticalQty:
            (keepInventory.theoreticalQty ?? 0) +
            (dupInventory.theoreticalQty ?? 0),
          actualQty:
            (keepInventory.actualQty ?? 0) +
            (dupInventory.actualQty ?? 0),
        },
      })

      await prisma.inventoryItem.deleteMany({
        where: { productId: dup.id },
      })

      console.log(`已合併庫存 ${dup.id} -> ${keep.id}`)
    } else if (dupInventory && !keepInventory) {
      await prisma.inventoryItem.update({
        where: { productId: dup.id },
        data: { productId: keep.id },
      })
      console.log(`已直接轉移庫存 ${dup.id} -> ${keep.id}`)
    }

    // 5. 刪掉舊規格
    await prisma.productVariant.deleteMany({
      where: { productId: dup.id },
    })

    // 6. 刪掉舊商品
    await prisma.product.delete({
      where: { id: dup.id },
    })

    console.log(`已刪除重複商品 ${dup.id}`)
  }

  const finalJimBeams = await prisma.product.findMany({
    where: { name: 'Jim Beam' },
    include: { variants: true, inventoryItems: true, orderItems: true },
  })

  console.log(
    '清理後 Jim Beam：',
    finalJimBeams.map((p) => ({
      id: p.id,
      variantCount: p.variants.length,
      inventoryCount: p.inventoryItems.length,
      orderItemsCount: p.orderItems.length,
    }))
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })