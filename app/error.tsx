'use client'

import { useEffect, useState } from 'react'
import { loadStore } from '@/lib/store'
import { t, type Lang } from '@/lib/i18n'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [lang, setLang] = useState<Lang>('ko')

  useEffect(() => {
    setLang((loadStore().language || 'ko') as Lang)
  }, [])

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="login-shell"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        minHeight: '100vh',
      }}
    >
      <div className="login-card-wrap" style={{ width: '100%', maxWidth: 400 }}>
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
            aria-hidden
          >
            !
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#111827' }}>
            {t('errorTitle', lang)}
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
            {error.message || (lang === 'ko' ? '페이지를 불러오지 못했습니다. 새로고침하거나 잠시 후 다시 시도해 주세요.' : 'Please refresh or try again later.')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="login-submit-primary" onClick={reset}>
              {t('errorRetry', lang)}
            </button>
            <a
              href="/"
              className="login-lang-btn"
              style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
            >
              {t('errorHome', lang)}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
