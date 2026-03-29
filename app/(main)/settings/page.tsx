'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { loadStore, updateStore } from '@/lib/store'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { LANGUAGES, t, type Lang } from '@/lib/i18n'

export default function SettingsPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>(() => (loadStore().language || 'ko') as Lang)
  const [savedFlash, setSavedFlash] = useState(false)
  const store = loadStore()

  const persistLanguage = useCallback(async (next: Lang) => {
    updateStore({ language: next })
    setLang(next)
    const supabase = createBrowserSupabaseClient()
    const uid = loadStore().user?.supabaseId
    if (supabase && uid) {
      await supabase.from('profiles').update({ language: next }).eq('id', uid)
    }
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2200)
  }, [])

  async function logout() {
    const supabase = createBrowserSupabaseClient()
    if (supabase) await supabase.auth.signOut()
    updateStore({ user: null })
    router.replace('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="page-header" style={{ background: 'white' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ea580c' }}>{t('settingsTitle', lang)}</h1>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{t('settingsAccount', lang)}</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{store.user?.name || '—'}</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>{store.user?.email || ''}</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{t('settingsLanguage', lang)}</p>
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('settingsLanguagePick', lang)}</p>
          <select
            className="settings-lang-select"
            value={lang}
            onChange={(e) => void persistLanguage(e.target.value as Lang)}
            aria-label={t('settingsLanguage', lang)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} — {l.label}
              </option>
            ))}
          </select>
          {savedFlash && (
            <p style={{ margin: '12px 0 0', fontSize: 13, fontWeight: 600, color: '#059669' }}>{t('settingsLanguageSaved', lang)}</p>
          )}
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9ca3af' }}>{t('languageAccountOnce', lang)}</p>
        </div>

        <button type="button" className="login-submit-primary settings-logout-btn" onClick={() => void logout()} style={{ marginTop: 8, background: '#374151' }}>
          {t('settingsLogout', lang)}
        </button>
      </div>
    </div>
  )
}
