import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const products = await prisma.product.findMany({
    where: { name: 'Jim Beam' },
    orderBy: { id: 'asc' },
  })

  console.log('found:', products)

  if (products.length > 1) {
    const toDelete = products[products.length - 1]

    await prisma.product.delete({
      where: { id: toDelete.id },
    })

    console.log('deleted:', toDelete.id)
  } else {
    console.log('沒有重複資料')
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
