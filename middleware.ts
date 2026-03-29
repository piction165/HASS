import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase 세션 쿠키 갱신. Edge에서 예외 나면 전체 사이트가 500이 되므로
 * 반드시 try/catch로 넘깁니다.
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\r?\n/g, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/\r?\n/g, '')
  if (!url || !key) {
    return res
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    })

    await supabase.auth.getUser()
  } catch {
    /* OAuth·세션 없이도 페이지는 열리게 */
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
