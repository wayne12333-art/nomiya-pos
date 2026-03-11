export default function AdminProductsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">商品管理</h1>
          <button className="rounded-xl bg-white px-4 py-2 font-semibold text-black">
            新增商品
          </button>
        </div>

        <div className="mt-8 grid gap-4">
          <div className="rounded-2xl bg-neutral-900 p-5">
            <div className="font-semibold">Jim Beam</div>
            <div className="mt-2 text-sm text-neutral-400">
              類型：酒類 / 庫存模式：ml / 總容量：700ml
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-900 p-5">
            <div className="font-semibold">打火機</div>
            <div className="mt-2 text-sm text-neutral-400">
              類型：周邊 / 庫存模式：quantity
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}