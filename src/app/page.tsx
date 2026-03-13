import Link from 'next/link'
import { brandCopy } from '@/lib/brand-copy'

const highlights = [
  { label: '酒', jp: 'さけ', value: '啤酒、日本のお酒、気ままな一杯' },
  { label: '肴', jp: 'さかな', value: '隨意不隨便的下酒菜與剛剛好的聊天' },
  { label: '客', jp: 'きゃく', value: 'お一人様歓迎、請當自己家、常客募集中' },
]

export default function HomePage() {
  return (
    <main className="nomiya-shell px-6 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        <section
          className="nomiya-panel nomiya-panel-ornate nomiya-ornament overflow-hidden rounded-[1.5rem] px-6 py-8 md:px-10 md:py-10"
          data-reveal="hero"
        >
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div data-reveal="left" style={{ ['--reveal-delay' as string]: '80ms' }}>
              <div className="nomiya-section-no">01 Entrance</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="nomiya-ribbon">Nomiya Changjiou</div>
                <div className="nomiya-stamp">酒場</div>
              </div>
              <div className="mt-5 flex items-start gap-5">
                <div className="border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-5">
                  <div className="nomiya-sign nomiya-sign-soft pt-1">
                    <span className="nomiya-sign-main">飲</span>
                    <span className="nomiya-sign-main">酒</span>
                    <span className="nomiya-sign-main">屋</span>
                    <span className="nomiya-sign-main">常</span>
                    <span className="nomiya-sign-main">久</span>
                    <span className="nomiya-sign-sub">nomiya changjiou</span>
                  </div>
                </div>

                <div>
                  <h1 className="nomiya-display nomiya-kinetic-title text-3xl font-semibold text-[var(--foreground)] md:text-5xl">
                    <span>先喝一杯，再決定今晚要聊什麼。</span>
                  </h1>
                  <div className="mt-3 text-sm tracking-[0.22em] text-[var(--muted-soft)]">
                    {brandCopy.events.regulars}
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
                    {brandCopy.story.title} {brandCopy.story.home}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              {highlights.map((item) => (
                <div key={item.label} className="nomiya-sheet rounded-[1.2rem] px-4 pt-4 pb-3">
                  <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--muted-soft)]">
                    {item.label}
                  </div>
                  <div className="mt-1 text-[0.7rem] tracking-[0.24em] text-[var(--accent)]">
                    {item.jp}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="nomiya-marquee mt-8"
            data-reveal="scale"
            style={{ ['--reveal-delay' as string]: '220ms' }}
          >
            <div className="nomiya-marquee-track">
              <span>SCENE OF DRINKING</span>
              <span>MENU</span>
              <span>COUNTER</span>
              <span>DAILY RHYTHM</span>
              <span>SCENE OF DRINKING</span>
              <span>MENU</span>
              <span>COUNTER</span>
              <span>DAILY RHYTHM</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href="/menu"
              className="nomiya-kpi nomiya-ornament rounded-[1rem] p-6 hover:-translate-y-0.5"
              data-reveal="left"
              style={{ ['--reveal-delay' as string]: '260ms' }}
            >
              <div className="text-xs tracking-[0.26em] text-[var(--muted-soft)]">Menu</div>
              <h2 className="nomiya-display mt-3 text-2xl font-semibold text-[var(--foreground)]">
                酒單與商品入口
              </h2>
              <div className="mt-2 text-xs tracking-[0.18em] text-[var(--muted-soft)]">
                おしながき と しなもの
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                把啤酒、日式酒類、調酒與店裡的小物放在同一個入口。先看看今晚想喝什麼，喜歡的人自然會留下。
              </p>
              <div className="mt-5 inline-flex items-center gap-2 border-b border-[var(--foreground)] pb-1 text-sm text-[var(--foreground)]">
                進入酒單
              </div>
            </Link>

            <Link
              href="/access"
              className="nomiya-kpi nomiya-ornament rounded-[1rem] p-6 hover:-translate-y-0.5"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '320ms' }}
            >
              <div className="text-xs tracking-[0.26em] text-[var(--muted-soft)]">Control</div>
              <h2 className="nomiya-display mt-3 text-2xl font-semibold text-[var(--foreground)]">
                POS 與後台管理
              </h2>
              <div className="mt-2 text-xs tracking-[0.18em] text-[var(--muted-soft)]">
                てんない うんえい
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                從開單、加單、會計到報表與庫存，保留吧台工作的手感，也讓每天的店務切換維持輕快，不會一打開就像被系統催著做事。
              </p>
              <div className="mt-5 inline-flex items-center gap-2 border-b border-[var(--foreground)] pb-1 text-sm text-[var(--foreground)]">
                進入後台
              </div>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div
              className="nomiya-photo-frame rounded-[1rem]"
              data-reveal="scale"
              style={{ ['--reveal-delay' as string]: '120ms' }}
            >
              <div className="nomiya-photo-caption">
                <span>JAPANESE BAR</span>
                <span>常久</span>
              </div>
            </div>

            <div
              className="nomiya-route nomiya-sheet space-y-5 rounded-[1.2rem] p-5"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 01</div>
                <div className="nomiya-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  從店門口的氣氛，一路走到每天的工作節奏
                </div>
              </div>
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 02</div>
                <div className="text-sm leading-7 text-[var(--muted)]">
                  這次不是先堆功能，而是先把常久自己的口氣帶進來: 請當自己家、先喝再說、話慢慢聊，一個人來也不用尷尬，坐久了就會慢慢變成熟客。
                </div>
              </div>
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 03</div>
                <div className="text-sm leading-7 text-[var(--muted)]">
                  再把 POS、報表、商品與庫存接進同一條線，讓後台像店的一部分，不像一套只會催你趕快工作的冷系統。
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.44fr_0.56fr]">
          <div
            className="nomiya-panel nomiya-panel-ornate rounded-[1.5rem] p-6 xl:sticky xl:top-28 xl:self-start"
            data-reveal="left"
            style={{ ['--reveal-delay' as string]: '100ms' }}
          >
            <div className="nomiya-section-no">02 Story</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="nomiya-ribbon">House Mood</div>
              <div className="nomiya-stamp">余白</div>
            </div>
            <h2 className="nomiya-display nomiya-kinetic-title mt-5 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
              <span>這裡先讓你坐下來，不急著證明自己多厲害。</span>
            </h2>
            <div className="mt-3 text-sm tracking-[0.2em] text-[var(--muted-soft)]">
              店の空気を、そのまま画面へ
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
              我把貼文裡那種更真實的語氣直接轉進畫面裡。{brandCopy.story.homeSecondary}
            </p>
            <div className="nomiya-marquee mt-8">
              <div className="nomiya-marquee-track">
                <span>SOFT WOOD</span>
                <span>QUIET BAR</span>
                <span>SMALL DAILY RHYTHM</span>
                <span>NOMIYA</span>
                <span>SOFT WOOD</span>
                <span>QUIET BAR</span>
                <span>SMALL DAILY RHYTHM</span>
                <span>NOMIYA</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <article
              className="nomiya-panel nomiya-ornament overflow-hidden rounded-[1.5rem] p-6"
              data-reveal="right"
              style={{ ['--reveal-delay' as string]: '140ms' }}
            >
              <div className="nomiya-ghost-word">間</div>
              <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 01</div>
                <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  留白先出來，資訊再出來
                </h3>
              <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                ま ず は 空 気
              </div>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                參考站最有感的地方，不是某個特效，而是它願意先讓氣氛說話。這裡也一樣，先看到常久那種有點 DIY、破破爛爛但亂中有序、很像自己家又真的能喝一杯的空氣，再看到入口和接下來要去哪。
              </p>
            </article>

            <article
              className="grid gap-4 lg:grid-cols-[0.84fr_1.16fr]"
              data-reveal="left"
              style={{ ['--reveal-delay' as string]: '180ms' }}
            >
              <div className="nomiya-photo-frame nomiya-sticky-showcase rounded-[1rem]">
                <div className="nomiya-ghost-word">流</div>
                <div className="nomiya-photo-caption">
                  <span>COUNTER FLOW</span>
                  <span>02</span>
                </div>
              </div>

              <div className="nomiya-panel rounded-[1.5rem] p-6">
                <div className="text-[0.7rem] tracking-[0.32em] text-[var(--muted-soft)]/80">Scene 02</div>
                <h3 className="nomiya-display mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  讓閱讀順序像在店裡移動
                </h3>
                <div className="mt-2 text-sm tracking-[0.18em] text-[var(--accent)]/78">
                  う ご き の リ ズ ム
                </div>
                <div className="mt-5 space-y-4">
                  <div className="border-t border-[var(--border)] pt-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">先看到主題</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      飲酒屋常久先讓人感覺到「可以先坐一下、喝一杯」，再讓人慢慢進到功能，不會一上來就被表單和按鈕淹過去。
                    </div>
                  </div>
                  <div className="border-t border-[var(--border)] pt-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">再進入工作區</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      menu、POS、後台像店裡不同角落，而不是一串把人趕去做事的連結。先逛，再進去忙。
                    </div>
                  </div>
                  <div className="border-t border-[var(--border)] pt-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">最後再看細節</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      reveal、字帶和段落切換，是把那種邊喝邊聊、夜晚慢慢長出來的鬆弛感補完整的那一層。
                    </div>
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
