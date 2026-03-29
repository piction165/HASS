import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PKCE는 서버에서 exchange 해야 하고, 교환 후 세션 쿠키는
 * 반드시 이 응답(리다이렉트)의 Set-Cookie에 실려야 합니다.
 * `cookies()`만 set 하면 리다이렉트 응답에 안 붙어 "Unable to exchange external code"가 날 수 있습니다.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/home'

  const oauthErr = requestUrl.searchParams.get('error')
  if (oauthErr) {
    const raw = requestUrl.searchParams.get('error_description') ?? ''
    let text = ''
    try {
      text = decodeURIComponent(raw.replace(/\+/g, ' '))
    } catch {
      text = raw
    }
    const hint = (text || oauthErr).slice(0, 400).trim()
    return NextResponse.redirect(`${origin}/login?error=oauth&hint=${encodeURIComponent(hint)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\r?\n/g, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/\r?\n/g, '')
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`)
  }

  const path = next.startsWith('/') ? next : `/${next}`
  const response = NextResponse.redirect(new URL(path, origin))

  const cookieStore = await cookies()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const hint = (error.message || 'exchange').slice(0, 400)
    return NextResponse.redirect(`${origin}/login?error=exchange&hint=${encodeURIComponent(hint)}`)
  }

  return response
}
