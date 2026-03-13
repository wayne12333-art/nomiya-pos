import Link from 'next/link'
import { brandCopy } from '@/lib/brand-copy'

const sections = [
  {
    no: '01',
    title: '威士忌',
    jp: 'ウイスキー',
    note: '單杯、highball，適合話講到一半再續一杯的那種節奏。',
    detail:
      '從安靜的 single malt 到陪聊天也很順的 highball，重點不是酒寫得多專業，是你一看就知道今晚想從哪杯開始。',
  },
  {
    no: '02',
    title: '調酒',
    jp: 'カクテル',
    note: '清爽、果香、經典，適合當晚上的第一杯，也適合亂點一杯看看。',
    detail:
      '把味道分類、杯型與特調一起整理，讓客人看酒單時像在看今晚的氣氛，不像在做選擇題。',
  },
  {
    no: '03',
    title: '周邊商品',
    jp: 'まわりの品',
    note: '打火機、熄菸袋與店裡那些順手就會帶走的小東西。',
    detail:
      '不只酒，也把常久的小物和店裡那種有點亂、有點可愛的氣味收進來，讓這頁更像真正的店鋪入口。',
  },
]

export default function MenuPage() {
  return (
    <main className="nomiya-shell px-6 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament overflow-hidden rounded-[1.5rem] px-6 py-8 md:px-10 md:py-10"
          data-reveal="hero"
        >
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="nomiya-section-no">07 Menu</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="nomiya-ribbon">Menu Preview</div>
                <div className="nomiya-stamp">品書</div>
              </div>
              <h1 className="nomiya-display nomiya-kinetic-title mt-5 text-4xl font-semibold text-[var(--foreground)] md:text-6xl">
                <span>先看看今晚想喝哪一杯。</span>
              </h1>
              <div className="mt-3 text-sm tracking-[0.22em] text-[var(--muted-soft)]">
                おしながき と 気ままな肴
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
                這頁會延續常久 IG 的那種口氣: {brandCopy.menu.intro}
              </p>
            </div>

            <div
              className="nomiya-photo-frame rounded-[1rem]"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="nomiya-photo-caption">
                <span>DRINK LIST</span>
                <span>常久</span>
              </div>
            </div>
          </div>

          <div
            className="nomiya-marquee mt-8"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '220ms' }}
          >
            <div className="nomiya-marquee-track">
              <span>WHISKY</span>
              <span>COCKTAIL</span>
              <span>SMALL GOODS</span>
              <span>STORE TASTE</span>
              <span>WHISKY</span>
              <span>COCKTAIL</span>
              <span>SMALL GOODS</span>
              <span>STORE TASTE</span>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {sections.map((section, index) => (
              <section
                key={section.title}
                className="grid gap-4 border-t border-[var(--border)] pt-6 lg:grid-cols-[0.78fr_1.22fr]"
                data-reveal={index % 2 === 0 ? 'left' : 'right'}
                style={{ ['--reveal-delay' as string]: `${140 + index * 80}ms` }}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : undefined}>
                  <div className="nomiya-photo-frame nomiya-sticky-showcase rounded-[1rem]">
                    <div className="nomiya-ghost-word">{section.jp}</div>
                    <div className="nomiya-photo-caption">
                      <span>{section.jp}</span>
                      <span>{section.no}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col justify-center ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                    {section.no}
                  </div>
                  <h2 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
                    {section.title}
                  </h2>
                  <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                    {section.jp}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{section.note}</p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]/84">
                    {section.detail}
                  </p>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
            <div
              className="nomiya-route nomiya-sheet space-y-5 rounded-[1rem] p-6"
              data-reveal="left"
              style={{ ['--reveal-delay' as string]: '140ms' }}
            >
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 01</div>
                <div className="nomiya-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  店の気分から、おしながきへ
                </div>
              </div>
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 02</div>
                <div className="text-sm leading-7 text-[var(--muted)]">
                  先看到氣氛、酒的分類和店裡的說話方式，再往下進入真實商品資料。這樣比較像走進店裡看黑板，不像先被丟一張硬梆梆的價格表。
                </div>
              </div>
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 03</div>
                <div className="text-sm leading-7 text-[var(--muted)]">
                  等你要接實際商品資料時，我可以把這頁直接變成真正可展示、可對外看的店內 menu，讓人看到就想來喝一杯，不用想太多理由。
                </div>
              </div>
            </div>

            <div
              className="nomiya-kpi rounded-[1rem] p-6"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '220ms' }}
            >
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">
                Control
              </div>
              <h2 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                返回 POS / 後台
              </h2>
              <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                てんない うんえい
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                若要直接進入結帳、商品、報表、庫存與進貨管理，從這裡回到工作區。
              </p>
              <Link
                href="/access"
                className="mt-6 inline-flex items-center gap-2 border-b border-[var(--foreground)] pb-1 text-sm text-[var(--foreground)]"
              >
                返回 POS / 後台
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <div
            className="nomiya-panel nomiya-panel-ornate rounded-[1.5rem] p-6 xl:sticky xl:top-28 xl:self-start"
            data-reveal="left"
            style={{ ['--reveal-delay' as string]: '120ms' }}
          >
            <div className="nomiya-section-no">08 Selection</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="nomiya-ribbon">Store Selection</div>
              <div className="nomiya-stamp">選品</div>
            </div>
            <h2 className="nomiya-display nomiya-kinetic-title mt-5 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
              <span>選酒、配一點下酒菜，今晚差不多就有樣子了。</span>
            </h2>
            <div className="mt-3 text-sm tracking-[0.2em] text-[var(--muted-soft)]">
              えらぶ時間まで、店の空気にする
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
              {brandCopy.menu.curation} 所以這裡的節奏也會更鬆一點，像常久平常發文那種有點亂來、但你會懂的口氣。
            </p>
            <div className="nomiya-marquee mt-8">
              <div className="nomiya-marquee-track">
                <span>WHISKY SELECTION</span>
                <span>CLASSIC COCKTAIL</span>
                <span>STORE GOODS</span>
                <span>SLOW DRINKING</span>
                <span>WHISKY SELECTION</span>
                <span>CLASSIC COCKTAIL</span>
                <span>STORE GOODS</span>
                <span>SLOW DRINKING</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <article
              className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '160ms' }}
            >
              <div className="nomiya-photo-frame nomiya-sticky-showcase rounded-[1rem]">
                <div className="nomiya-ghost-word">酒</div>
                <div className="nomiya-photo-caption">
                  <span>WHISKY</span>
                  <span>CURATION</span>
                </div>
              </div>

              <div className="nomiya-panel rounded-[1.5rem] p-6">
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 03</div>
                <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  從分類走到風味，而不是從欄位走到欄位
                </h3>
                <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                  さがすより、めぐる感覚
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                  之後這頁若接實際商品資料，我會讓酒、調酒、小物都維持這種「逛」的節奏，而不是只剩商品清單、價格和一堆很像在結帳前才會看的話。
                </p>
              </div>
            </article>

            <article
              className="nomiya-panel nomiya-ornament overflow-hidden rounded-[1.5rem] p-6"
              data-reveal="left"
              style={{ ['--reveal-delay' as string]: '220ms' }}
            >
              <div className="nomiya-ghost-word">品</div>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 04</div>
              <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                讓店內商品也有被展示的理由
              </h3>
              <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                ものにも余韻を
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">酒</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {brandCopy.menu.drink}
                  </div>
                </div>
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">調酒</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    清爽、經典、偏重，之後可以用展示段落把 mood 說清楚，也把那些怪可愛的名字和說法一起放進來，讓人一看就知道這杯是不是自己的菜。
                  </div>
                </div>
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">小物</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    打火機、熄菸袋這些，也都算是店的氣味與記憶點之一，知道的人自然會想把它帶回去。
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  )
}
