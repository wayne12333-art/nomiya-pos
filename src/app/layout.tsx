import type { Metadata } from 'next'
import MotionProvider from './motion-provider'
import ScrollRefreshButton from './scroll-refresh-button'
import ToastProvider from './toast-provider'
import './globals.css'

export const metadata: Metadata = {
  title: '常久 Nomiya POS',
  description: '常久店內 POS 與後台管理系統',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        <MotionProvider />
        <ToastProvider />
        <ScrollRefreshButton />
        {children}
      </body>
    </html>
  )
}
