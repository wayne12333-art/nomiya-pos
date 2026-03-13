'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { brandCopy } from '@/lib/brand-copy'
import { toast } from '@/lib/toast'

export default function AccessPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (!res.ok) {
      toast({ title: '密碼錯誤', tone: 'error' })
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="nomiya-shell flex min-h-screen items-center justify-center p-6 text-[var(--foreground)]">
      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="nomiya-panel nomiya-panel-ornate nomiya-ornament flex min-h-[620px] flex-col justify-between rounded-[1.5rem] p-8">
          <div>
            <div className="nomiya-section-no">02 Welcome</div>
            <div className="flex items-center gap-3">
              <div className="nomiya-ribbon">Japanese Bar Mood</div>
              <div className="nomiya-stamp">常久</div>
            </div>
            <div className="mt-4 flex items-start gap-6">
              <div className="flex min-h-[148px] w-[92px] items-center justify-center border border-[var(--border-strong)] bg-[rgba(255,252,247,0.96)] text-[#17120f]">
                <div className="nomiya-sign nomiya-sign-soft">
                  <span className="nomiya-sign-main">飲</span>
                  <span className="nomiya-sign-main">酒</span>
                  <span className="nomiya-sign-main">屋</span>
                  <span className="nomiya-sign-main">常</span>
                  <span className="nomiya-sign-main">久</span>
                  <span className="nomiya-sign-sub">nomiya changjiou</span>
                </div>
              </div>

              <div>
                <h1 className="nomiya-display text-3xl font-semibold leading-tight text-[var(--foreground)] md:text-4xl">
                  お一人様歓迎の空気を
                  <br />
                  そのままバックヤードへ
                </h1>
                <div className="mt-3 text-sm tracking-[0.22em] text-[var(--muted-soft)]">
                  ひとりでも、いつもの顔でも
                </div>
              </div>
            </div>
            <div className="mt-4 max-w-xl text-lg text-[var(--foreground)]/90">
              啤酒、日式酒類、隨心所欲的下酒菜與聊天服務。{brandCopy.story.access}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="nomiya-sheet rounded-[1.3rem] p-5">
              <div className="text-xs tracking-[0.25em] text-[var(--muted-soft)]">
                STYLE
              </div>
              <div className="mt-2 text-lg text-[var(--foreground)]">請當自己家</div>
              <div className="mt-1 text-xs tracking-[0.18em] text-[var(--accent)]">うちみたいにどうぞ</div>
            </div>
            <div className="nomiya-sheet rounded-[1.3rem] p-5">
              <div className="text-xs tracking-[0.25em] text-[var(--muted-soft)]">
                FLOW
              </div>
              <div className="mt-2 text-lg text-[var(--foreground)]">お一人様歓迎</div>
              <div className="mt-1 text-xs tracking-[0.18em] text-[var(--accent)]">ひとりでもどうぞ</div>
            </div>
            <div className="nomiya-sheet rounded-[1.3rem] p-5">
              <div className="text-xs tracking-[0.25em] text-[var(--muted-soft)]">
                FOCUS
              </div>
              <div className="mt-2 text-lg text-[var(--foreground)]">隨意不隨便</div>
              <div className="mt-1 text-xs tracking-[0.18em] text-[var(--accent)]">ゆるいけど雑ではない</div>
            </div>
          </div>

          <div className="nomiya-story-band mt-8 text-center text-xs tracking-[0.34em] text-[var(--muted-soft)]">
            COUNTER MOOD · LIGHT WOOD · SOFT NIGHT
          </div>
        </section>

        <section className="nomiya-panel nomiya-panel-ornate flex items-center rounded-[1.5rem] p-6 md:p-8">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="nomiya-section-no">03 Access</div>
            <div className="nomiya-ribbon">Staff Access</div>
            <h2 className="nomiya-display mt-3 text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
              進入後台
            </h2>
            <div className="mt-2 text-sm tracking-[0.22em] text-[var(--muted-soft)]">
              いらっしゃいませ
            </div>
            <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">
              ログイン後は POS、商品、在庫、仕入、棚卸し、營運報表までひと続き。先看到店的空氣，再進到每天真正會用到的工作流。
            </p>

            <label className="mt-8 block text-sm text-[var(--muted)]">
              管理密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="nomiya-input mt-3 w-full rounded-[1.4rem] px-4 py-4"
            />

            <button
              type="submit"
              disabled={loading}
              className="nomiya-button-primary mt-5 w-full rounded-[1.4rem] px-4 py-4 text-base font-semibold"
            >
              {loading ? '登入中...' : '進入常久後台'}
            </button>

            <div className="nomiya-sheet mt-6 rounded-[1.2rem] p-4 text-sm text-[var(--muted)]">
              輔大醫院捷運站附近、週二到週日 20:00-26:00 的那種晚間節奏，也一起被帶進這個介面裡。這裡優先的是現場好讀、好操作，也保留那種「不像店」的鬆弛感。
            </div>

            <div className="nomiya-route mt-4 space-y-4 rounded-[1.2rem] border border-[var(--border)] bg-[rgba(252,246,237,0.82)] p-4 text-sm text-[var(--muted)]">
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 01</div>
                <div className="mt-2 leading-7">先進來，像走回店門口，不急著被欄位和密碼催著走。</div>
              </div>
              <div className="nomiya-route-item">
                <div className="text-xs tracking-[0.24em] text-[var(--muted-soft)]">Step 02</div>
                <div className="mt-2 leading-7">進去之後才開始處理 POS、庫存、報表和那些每天真的會發生的事。</div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
