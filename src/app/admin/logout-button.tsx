'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)

    await fetch('/api/logout', {
      method: 'POST',
    })

    setLoading(false)
    router.push('/access')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/30"
    >
      {loading ? '登出中...' : '登出'}
    </button>
  )
}