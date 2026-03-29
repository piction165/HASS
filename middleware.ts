import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase 등 외부 패키지 없이 통과만 시킵니다.
 * Vercel에서 빈 미들웨어 슬롯/이전 번들 캐시 이슈를 피하고, 500(MIDDLEWARE_*) 원인 분리용.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
