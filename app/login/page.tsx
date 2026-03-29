'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStore, updateStore } from '@/lib/store'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { t, type Lang } from '@/lib/i18n'
import { OAuthReturnBanner } from './oauth-banner'

export default function LoginPage() {
  const router = useRouter()
  const store = loadStore()
  const lang = (store.language || 'ko') as Lang
  const supabaseConfigured = isSupabaseConfigured()
  const supabase = createBrowserSupabaseClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<'kakao' | 'google' | null>(null)
  const socialDisabled = !supabaseConfigured || !supabase
  const [authMethod, setAuthMethod] = useState<'social' | 'email'>(() => (socialDisabled ? 'email' : 'social'))

  async function handleOAuth(provider: 'kakao' | 'google') {
    setError('')
    if (!supabase) {
      setError(t('supabaseMissing', lang))
      return
    }
    setLoading(true)
    setOauthProvider(provider)
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    setOauthProvider(null)
    if (e) setError(e.message)
  }

  function handleEmailSubmit() {
    setError('')
    if (!email || !password) {
      setError(t('enterRequired', lang))
      return
    }
    if (mode === 'signup' && !name) {
      setError(t('enterRequired', lang))
      return
    }
    setLoading(true)
    setTimeout(() => {
      const displayName = mode === 'signup' ? name : email.split('@')[0]
      updateStore({ user: { name: displayName, email } })
      router.push('/home')
      setLoading(false)
    }, 400)
  }

  return (
    <div className="login-shell">
      <header className="login-hero">
        <div className="login-hero-badge">
          <span>H</span>
        </div>
        <h1>HASS</h1>
        <p>{t('appSubtitle', lang)}</p>
      </header>

      <div className="login-card-wrap">
        <div className="login-card">
          <Suspense fallback={null}>
            <OAuthReturnBanner lang={lang} />
          </Suspense>

          <div className="login-tabs" role="tablist" aria-label={lang === 'ko' ? '로그인 방법' : 'Sign-in method'}>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'social'}
              className={`login-tab ${authMethod === 'social' ? 'login-tab-active' : ''}`}
              onClick={() => { setAuthMethod('social'); setError('') }}
            >
              {t('loginMethodSocial', lang)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'email'}
              className={`login-tab ${authMethod === 'email' ? 'login-tab-active' : ''}`}
              onClick={() => { setAuthMethod('email'); setError('') }}
            >
              {t('loginMethodEmail', lang)}
            </button>
          </div>

          {authMethod === 'social' && (
            <>
              <p className="login-section-label" style={{ marginTop: 16 }}>{t('socialLogin', lang)}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  className="login-btn-social login-btn-kakao"
                  onClick={() => void handleOAuth('kakao')}
                  disabled={loading || socialDisabled}
                >
                  <KakaoMark />
                  {loading && oauthProvider === 'kakao' ? '…' : t('kakaoLogin', lang)}
                </button>
                <button
                  type="button"
                  className="login-btn-social login-btn-google"
                  onClick={() => void handleOAuth('google')}
                  disabled={loading || socialDisabled}
                >
                  <GoogleMark />
                  {loading && oauthProvider === 'google' ? '…' : t('googleLogin', lang)}
                </button>
              </div>
              {socialDisabled && (
                <div className="login-hint-warn" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span>{t('supabaseRequiredForSocial', lang)}</span>
                  <span style={{ fontWeight: 600, color: '#92400e' }}>{t('emailWorksWithoutEnv', lang)}</span>
                </div>
              )}
              {!socialDisabled && (
                <p className="login-footnote" style={{ marginTop: 12 }}>{t('oauthProvidersHint', lang)}</p>
              )}
            </>
          )}

          {authMethod === 'email' && (
            <>
              <p style={{ margin: '16px 0 14px', fontSize: 15, fontWeight: 700, color: '#374151' }}>{t('continueWithEmail', lang)}</p>

              <div className="login-tabs" role="tablist" aria-label={lang === 'ko' ? '이메일 모드' : 'Email mode'}>
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    className={`login-tab ${mode === m ? 'login-tab-active' : ''}`}
                    onClick={() => { setMode(m); setError('') }}
                  >
                    {m === 'login' ? t('login', lang) : t('signup', lang)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'signup' && (
                  <div>
                    <label className="form-label" htmlFor="login-name">{t('name', lang)}</label>
                    <input
                      id="login-name"
                      className="input-field"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('name', lang)}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div>
                  <label className="form-label" htmlFor="login-email">{t('email', lang)}</label>
                  <input
                    id="login-email"
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="login-password">{t('password', lang)}</label>
                  <input
                    id="login-password"
                    className="input-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 14,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#dc2626',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                className="login-submit-primary"
                onClick={handleEmailSubmit}
                disabled={loading}
              >
                {loading && !oauthProvider ? '…' : mode === 'login' ? t('login', lang) : t('signup', lang)}
              </button>

              <p className="login-footnote">
                {lang === 'ko'
                  ? '이메일은 로컬 데모용입니다. 배포 시에는 소셜 로그인만 켜두는 것을 권장합니다.'
                  : 'Email is for local demo; prefer social login in production.'}
              </p>
            </>
          )}

          <button type="button" className="login-lang-btn" onClick={() => router.push('/language')}>
            언어 변경 · Change language
          </button>
        </div>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function KakaoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.63 1.53 4.95 3.89 6.29L4.5 20.5c-.12.35.08.73.43.85.12.04.25.06.38.04l5.19-1.04c.97.27 2 .41 3.1.41 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
      />
    </svg>
  )
}
