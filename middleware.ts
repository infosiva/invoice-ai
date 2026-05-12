import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/deal', '/settings']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = req.cookies.get('df_session')
  if (!session?.value) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/deal/:path*', '/settings/:path*'],
}
