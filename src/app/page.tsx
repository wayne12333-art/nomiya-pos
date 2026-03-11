export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Nomiya</h1>
        <p className="mt-3 text-neutral-300">單人酒館網站型 POS</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <a
            href="/menu"
            className="rounded-2xl bg-neutral-900 p-6 hover:bg-neutral-800"
          >
            <h2 className="text-xl font-semibold">酒單 / 商品</h2>
            <p className="mt-2 text-sm text-neutral-400">
              查看酒類、調酒與周邊商品
            </p>
          </a>

          <a
            href="/access"
            className="rounded-2xl bg-neutral-900 p-6 hover:bg-neutral-800"
          >
            <h2 className="text-xl font-semibold">進入 POS / 後台</h2>
            <p className="mt-2 text-sm text-neutral-400">
              輸入密碼後進入管理頁
            </p>
          </a>
        </div>
      </div>
    </main>
  )
}