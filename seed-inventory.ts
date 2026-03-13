import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const products = await prisma.product.findMany()

  for (const product of products) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    })

    if (existing) continue

    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        unopenedBottleQty: product.inventoryMode === 'ml' ? 0 : 0,
        openedBottleQty: product.inventoryMode === 'ml' ? 1 : 0,
        theoreticalRemainingMl:
          product.inventoryMode === 'ml' ? product.totalVolumeMl ?? 0 : 0,
        actualRemainingMl:
          product.inventoryMode === 'ml' ? product.totalVolumeMl ?? 0 : 0,
        theoreticalQty: product.inventoryMode === 'quantity' ? 20 : 0,
        actualQty: product.inventoryMode === 'quantity' ? 20 : 0,
        lowStockThresholdMl: product.safetyStockMl ?? 0,
        lowStockThresholdQty: product.safetyStockQty ?? 0,
      },
    })
  }

  console.log('inventory seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
