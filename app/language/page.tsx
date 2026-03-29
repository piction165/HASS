'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LANGUAGES, type Lang } from '@/lib/i18n'
import { updateStore } from '@/lib/store'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

function LanguagePageInner() {
  const router = useRouter()
  const search = useSearchParams()
  /** 로그인 직후 메인 레이아웃에서 보낸 경우: DB에 언어를 넣고 홈으로 (다시 로그인으로 보내지 않음) */
  const postLoginAccount = search.get('account') === '1'
  const [selected, setSelected] = useState<Lang>('ko')
  const [saving, setSaving] = useState(false)

  async function handleContinue() {
    updateStore({ language: selected })
    if (postLoginAccount) {
      setSaving(true)
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null as null } }
      if (supabase && user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          language: selected,
          updated_at: new Date().toISOString(),
        })
      }
      router.push('/home')
      setSaving(false)
      return
    }
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* Top hero */}
      <div style={{
        background: 'linear-gradient(160deg, #f97316 0%, #ea580c 100%)',
        padding: '60px 24px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 34, letterSpacing: '-1px' }}>H</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>HASS</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '8px 0 0', fontWeight: 500 }}>
            Health & Safety Management System
          </p>
        </div>
      </div>

      {/* Language selection */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8, textAlign: 'center' }}>
          언어를 선택하세요 / Select Language
        </p>

        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            style={{
              width: '100%',
              padding: '20px 20px',
              borderRadius: 16,
              border: `2.5px solid ${selected === lang.code ? '#f97316' : '#e5e7eb'}`,
              background: selected === lang.code ? '#fff7ed' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: selected === lang.code ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: selected === lang.code ? '#c2410c' : '#111827' }}>
                {lang.native}
              </span>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{lang.label}</span>
            </div>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              border: `2.5px solid ${selected === lang.code ? '#f97316' : '#d1d5db'}`,
              background: selected === lang.code ? '#f97316' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {selected === lang.code && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        ))}

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleContinue()}
            disabled={saving}
          >
            {saving ? '…' : '계속 / Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LanguagePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6b7280', fontWeight: 600 }}>…</p>
        </div>
      }
    >
      <LanguagePageInner />
    </Suspense>
  )
}
