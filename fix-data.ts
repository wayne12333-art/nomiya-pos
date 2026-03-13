import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // 找出錯誤的 Jim Beam（id 為空字串）
  const badJimBeam = await prisma.product.findUnique({
    where: { id: '' },
  })

  if (badJimBeam) {
    console.log('找到錯誤 Jim Beam:', badJimBeam)

    // 建立一筆新的正確商品
    const newJimBeam = await prisma.product.create({
      data: {
        name: badJimBeam.name,
        category: badJimBeam.category,
        productType: badJimBeam.productType,
        inventoryMode: badJimBeam.inventoryMode,
        isAlcohol: badJimBeam.isAlcohol,
        isRecipe: badJimBeam.isRecipe,
        isMerchandise: badJimBeam.isMerchandise,
        isWholeBottleSale: badJimBeam.isWholeBottleSale,
        totalVolumeMl: badJimBeam.totalVolumeMl,
        safetyStockMl: badJimBeam.safetyStockMl,
        safetyStockQty: badJimBeam.safetyStockQty,
        saleStatus: badJimBeam.saleStatus,
        imageUrl: badJimBeam.imageUrl,
        description: badJimBeam.description,
      },
    })

    console.log('建立新的 Jim Beam:', newJimBeam)

    // 把舊 variant 複製到新商品，順便修正 volumeMl
    const oldVariants = await prisma.productVariant.findMany({
      where: { productId: '' },
    })

    for (const oldVariant of oldVariants) {
      let fixedVolumeMl = oldVariant.volumeMl

      if (oldVariant.name === '30ml') fixedVolumeMl = 30
      if (oldVariant.name === '45ml') fixedVolumeMl = 45
      if (oldVariant.name === '60ml') fixedVolumeMl = 60

      const newVariant = await prisma.productVariant.create({
        data: {
          productId: newJimBeam.id,
          name: oldVariant.name,
          price: oldVariant.price,
          volumeMl: fixedVolumeMl,
          useRecipeDeduction: oldVariant.useRecipeDeduction,
        },
      })

      console.log('建立新規格:', newVariant)
    }

    // 建立新的庫存資料
    const oldInventory = await prisma.inventoryItem.findUnique({
      where: { productId: '' },
    })

    if (oldInventory) {
      const newInventory = await prisma.inventoryItem.create({
        data: {
          productId: newJimBeam.id,
          unopenedBottleQty: oldInventory.unopenedBottleQty,
          openedBottleQty: oldInventory.openedBottleQty,
          theoreticalRemainingMl: oldInventory.theoreticalRemainingMl,
          actualRemainingMl: oldInventory.actualRemainingMl,
          theoreticalQty: oldInventory.theoreticalQty,
          actualQty: oldInventory.actualQty,
          lowStockThresholdMl: oldInventory.lowStockThresholdMl,
          lowStockThresholdQty: oldInventory.lowStockThresholdQty,
        },
      })

      console.log('建立新庫存:', newInventory)
    }

    console.log('修正完成。舊的空 id 資料先保留，確認新資料正常後再刪。')
  } else {
    console.log('沒有找到 id 為空字串的 Jim Beam')
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
