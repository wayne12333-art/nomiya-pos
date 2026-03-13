import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const protectedPaths = ['/admin', '/pos']
  const isProtected = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const auth = req.cookies.get('admin-auth')?.value

  if (auth !== 'ok') {
    return NextResponse.redirect(new URL('/access', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/pos/:path*'],
}
