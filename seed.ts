import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.product.findFirst({
    where: { name: '常久打火機' },
  })

  if (existing) {
    console.log('商品已存在:', existing)
    return
  }

  const product = await prisma.product.create({
    data: {
      name: '常久打火機',
      category: 'merchandise',
      productType: 'merchandise',
      inventoryMode: 'quantity',
      isAlcohol: false,
      isRecipe: false,
      isMerchandise: true,
      isWholeBottleSale: false,
      safetyStockQty: 5,
      saleStatus: true,
    },
  })

  console.log('created product:', product)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
