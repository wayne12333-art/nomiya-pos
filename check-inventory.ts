import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './src/generated/prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const items = await prisma.inventoryItem.findMany({
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  })

  console.log(
    items.map((item) => ({
      product: item.product.name,
      mode: item.product.inventoryMode,
      theoreticalRemainingMl: item.theoreticalRemainingMl,
      actualRemainingMl: item.actualRemainingMl,
      theoreticalQty: item.theoreticalQty,
      actualQty: item.actualQty,
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