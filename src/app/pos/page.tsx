export default function PosPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4">
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-7 rounded-2xl bg-neutral-900 p-4">
          <h1 className="text-2xl font-bold">POS 銷售</h1>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="rounded-2xl bg-neutral-800 p-4 text-left hover:bg-neutral-700">
              <div className="font-semibold">Jim Beam</div>
              <div className="mt-2 text-sm text-neutral-400">30ml / 45ml / 60ml</div>
            </button>

            <button className="rounded-2xl bg-neutral-800 p-4 text-left hover:bg-neutral-700">
              <div className="font-semibold">Highball</div>
              <div className="mt-2 text-sm text-neutral-400">調酒商品</div>
            </button>

            <button className="rounded-2xl bg-neutral-800 p-4 text-left hover:bg-neutral-700">
              <div className="font-semibold">打火機</div>
              <div className="mt-2 text-sm text-neutral-400">周邊商品</div>
            </button>

            <button className="rounded-2xl bg-neutral-800 p-4 text-left hover:bg-neutral-700">
              <div className="font-semibold">熄菸袋</div>
              <div className="mt-2 text-sm text-neutral-400">周邊商品</div>
            </button>
          </div>
        </section>

        <aside className="col-span-5 rounded-2xl bg-neutral-900 p-4">
          <h2 className="text-xl font-bold">本次訂單</h2>

          <div className="mt-4 rounded-xl bg-neutral-800 p-4 text-neutral-400">
            目前還沒接購物車功能
          </div>

          <div className="mt-4 space-y-3">
            <input
              placeholder="客戶名稱"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-3"
            />

            <select className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-3">
              <option>現金</option>
              <option>匯款</option>
              <option>LINE Pay</option>
            </select>

            <button className="w-full rounded-xl bg-white p-3 font-semibold text-black">
              結帳
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}