export default function MenuPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">酒單 / 商品</h1>
        <p className="mt-2 text-neutral-400">之後這裡會接商品資料庫。</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-neutral-900 p-5">
            <h2 className="text-lg font-semibold">威士忌</h2>
            <p className="mt-2 text-sm text-neutral-400">之後接資料表</p>
          </div>

          <div className="rounded-2xl bg-neutral-900 p-5">
            <h2 className="text-lg font-semibold">調酒</h2>
            <p className="mt-2 text-sm text-neutral-400">之後接資料表</p>
          </div>

          <div className="rounded-2xl bg-neutral-900 p-5">
            <h2 className="text-lg font-semibold">周邊商品</h2>
            <p className="mt-2 text-sm text-neutral-400">打火機、熄菸袋</p>
          </div>
        </div>
      </div>
    </main>
  )
}