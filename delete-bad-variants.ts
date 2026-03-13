import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const badVariants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { productId: '' },
        { volumeMl: null },
      ],
    },
  })

  console.log('準備刪除的規格：', badVariants)

  if (badVariants.length === 0) {
    console.log('沒有需要刪除的錯誤規格')
    return
  }

  const result = await prisma.productVariant.deleteMany({
    where: {
      OR: [
        { productId: '' },
        { volumeMl: null },
      ],
    },
  })

  console.log('已刪除規格數量：', result.count)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
