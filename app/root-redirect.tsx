'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { withTimeout } from '@/lib/with-timeout'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'

const SESSION_MS = 12_000

export function RootRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createBrowserSupabaseClient()
      if (!supabase) {
        router.replace('/language')
        return
      }
      void withTimeout(supabase.auth.getSession(), SESSION_MS)
        .then(({ data, error }) => {
          if (error) {
            console.error(error)
            router.replace('/login')
            return
          }
          const session = data?.session ?? null
          if (session) {
            router.replace('/home')
            return
          }
          const raw = localStorage.getItem('hass_store')
          if (!raw) {
            router.replace('/language')
            return
          }
          try {
            const parsed = JSON.parse(raw) as { language?: string }
            if (parsed.language) router.replace('/login')
            else router.replace('/language')
          } catch {
            router.replace('/language')
          }
        })
        .catch((e) => {
          console.error(e)
          router.replace('/language')
        })
      return
    }

    const raw = localStorage.getItem('hass_store')
    if (!raw) {
      router.replace('/language')
      return
    }
    try {
      const store = JSON.parse(raw) as { user?: unknown; language?: string }
      if (!store.user) {
        router.replace('/login')
      } else {
        router.replace('/home')
      }
    } catch {
      router.replace('/language')
    }
  }, [router])

  return null
}
