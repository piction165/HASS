'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { t, type Lang } from '@/lib/i18n'

export function OAuthReturnBanner({ lang }: { lang: Lang }) {
  const search = useSearchParams()
  const errCode = search.get('error')
  const hintRaw = search.get('hint')

  const { headline, detail } = useMemo(() => {
    if (errCode === 'auth') return { headline: t('oauthErrAuth', lang), detail: null as string | null }
    if (errCode === 'config') return { headline: t('oauthErrConfig', lang), detail: null }
    if (errCode === 'exchange') {
      let detail: string | null = null
      if (hintRaw) {
        try {
          detail = decodeURIComponent(hintRaw)
        } catch {
          detail = hintRaw
        }
      }
      return { headline: t('oauthErrExchange', lang), detail }
    }
    if (errCode === 'oauth') {
      let detail: string | null = null
      if (hintRaw) {
        try {
          detail = decodeURIComponent(hintRaw)
        } catch {
          detail = hintRaw
        }
      }
      return { headline: t('oauthErrOAuth', lang), detail }
    }
    return { headline: null as string | null, detail: null as string | null }
  }, [errCode, hintRaw, lang])

  if (!headline) return null

  return (
    <div
      role="alert"
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 14,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      <div>{headline}</div>
      {detail ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            fontWeight: 500,
            opacity: 0.95,
            wordBreak: 'break-word',
          }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  )
}
