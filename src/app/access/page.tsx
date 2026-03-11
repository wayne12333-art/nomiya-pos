'use client'

import { useState } from 'react'

export default function AccessPage() {
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password === '1234') {
      window.location.href = '/pos'
    } else {
      alert('密碼錯誤')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-neutral-900 p-6"
      >
        <h1 className="text-2xl font-bold">輸入密碼</h1>
        <p className="mt-2 text-sm text-neutral-400">
          先做測試版，之後再改成真正安全的登入方式
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="請輸入密碼"
          className="mt-6 w-full rounded-xl border border-neutral-700 bg-neutral-800 p-3 outline-none"
        />

        <button className="mt-4 w-full rounded-xl bg-white p-3 font-semibold text-black">
          進入
        </button>
      </form>
    </main>
  )
}