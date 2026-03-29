'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { loadStore, updateStore } from '@/lib/store'
import { withTimeout } from '@/lib/with-timeout'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const SESSION_MS = 12_000
import { MainNav } from '@/components/MainNav'
import type { Lang } from '@/lib/i18n'

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const lang = (loadStore().language || 'ko') as Lang

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    if (!supabase) {
      const s = loadStore()
      if (!s.user) {
        router.replace('/login')
        return
      }
      setReady(true)
      return
    }

    void withTimeout(supabase.auth.getSession(), SESSION_MS).then(async ({ data, error }) => {
      if (error) {
        console.error(error)
        router.replace('/login')
        return
      }
      const session = data?.session ?? null
      if (!session) {
        router.replace('/login')
        return
      }

      const meta = session.user.user_metadata as {
        name?: string
        full_name?: string
        given_name?: string
        family_name?: string
      } | undefined
      const combined = [meta?.family_name, meta?.given_name].filter(Boolean).join(' ').trim()
      const name =
        meta?.full_name ||
        meta?.name ||
        combined ||
        session.user.email?.split('@')[0] ||
        'User'
      updateStore({
        user: { name, email: session.user.email ?? '', supabaseId: session.user.id },
      })

      const { data: prof } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', session.user.id)
        .maybeSingle()

      if (prof?.language) {
        updateStore({ language: prof.language })
      } else {
        router.replace('/language?account=1')
        return
      }

      setReady(true)
    }).catch((e) => {
      console.error(e)
      router.replace('/login')
    })
  }, [router, pathname])

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          color: '#4b5563',
          background: '#f9fafb',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 6px 24px rgba(249,115,22,0.3)',
          }}
        />
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>불러오는 중…</p>
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Loading your session</p>
      </div>
    )
  }

  return (
    <>
      <div className="main-pad">{children}</div>
      <MainNav lang={lang} />
    </>
  )
}
