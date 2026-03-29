import { createBrowserClient } from '@supabase/ssr'

function trimEnv(v: string | undefined): string {
  if (!v) return ''
  return v.trim().replace(/\r?\n/g, '')
}

export function isSupabaseConfigured(): boolean {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return !!(url && key)
}

export function createBrowserSupabaseClient() {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!url || !key) return null
  try {
    return createBrowserClient(url, key)
  } catch {
    return null
  }
}
