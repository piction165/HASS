import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16: middleware.ts 는 deprecated → proxy.ts + export function proxy
 * proxy 는 Node.js 런타임(Edge 아님). Vercel에서 MIDDLEWARE_INVOCATION_FAILED 를 피하기 위함.
 * 세션 갱신은 클라이언트·/auth/callback 라우트로 처리.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
