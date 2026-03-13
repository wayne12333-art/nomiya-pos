import Link from 'next/link'

type ResetInventoryButtonProps = {
  productId: string
  productName: string
}

export default function ResetInventoryButton({
  productId,
  productName,
}: ResetInventoryButtonProps) {
  return (
    <Link
      href={`/admin/stocktakes?productId=${productId}`}
      aria-label={`前往 ${productName} 的盤點調整`}
      className="nomiya-button-secondary rounded-full px-4 py-3 text-sm"
    >
      盤點校正
    </Link>
  )
}
