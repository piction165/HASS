'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStore } from '@/lib/store'
import { t, type Lang } from '@/lib/i18n'

export default function HomePage() {
  const router = useRouter()
  const lang = (loadStore().language || 'ko') as Lang
  const name = loadStore().user?.name || ''

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff7ed 0%, #f9fafb 40%)', paddingBottom: 8 }}>
      <header style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        padding: '32px 22px 28px',
        color: 'white',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 12px 40px rgba(234, 88, 12, 0.25)',
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: '0.06em' }}>HASS</p>
        <h1 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>
          {t('homeGreeting', lang)}
        </h1>
        {name ? (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, opacity: 0.95 }}>{name}님, {t('homeSubGreeting', lang)}</p>
        ) : (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, opacity: 0.95 }}>{t('homeSubGreeting', lang)}</p>
        )}
      </header>

      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em' }}>전자조사서</p>
        <button
          type="button"
          onClick={() => router.push('/survey')}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '20px 18px',
            borderRadius: 18,
            border: '1px solid #fed7aa',
            cursor: 'pointer',
            background: 'white',
            boxShadow: '0 8px 28px rgba(249, 115, 22, 0.12)',
            display: 'flex',
            alignItems: 'stretch',
            gap: 14,
          }}
        >
          <div style={{
            width: 52, minHeight: 52, borderRadius: 14, background: '#fff7ed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
          }} aria-hidden>📝</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#ea580c' }}>{t('electronicSurveyTitle', lang)}</p>
            <p style={{ margin: '6px 0 4px', fontSize: 17, fontWeight: 800, color: '#111827' }}>{t('homeCardSurvey', lang)}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.45 }}>
              {lang === 'ko' ? '관리조사서 + 예진표 + 동의서' : 'Management + screening + consent'}
            </p>
          </div>
          <span style={{ alignSelf: 'center', fontWeight: 800, color: '#f97316', fontSize: 14 }}>{t('homeWriteAction', lang)} →</span>
        </button>

        <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em' }}>
          {lang === 'ko' ? '장비' : 'Equipment'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/equipment')}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '20px 18px',
            borderRadius: 18,
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            background: 'white',
            boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'stretch',
            gap: 14,
          }}
        >
          <div style={{
            width: 52, minHeight: 52, borderRadius: 14, background: '#f9fafb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
          }} aria-hidden>🚛</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{t('homeCardEquipment', lang)}</p>
            <p style={{ margin: '6px 0 4px', fontSize: 17, fontWeight: 800, color: '#111827' }}>
              {lang === 'ko' ? '사용 장비 기록' : 'Equipment record'}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.45 }}>
              {lang === 'ko' ? '장비 및 차량 정보' : 'Type & vehicle number'}
            </p>
          </div>
          <span style={{ alignSelf: 'center', fontWeight: 800, color: '#9ca3af', fontSize: 14 }}>{t('homeRecordAction', lang)} →</span>
        </button>

        <div style={{
          marginTop: 8,
          padding: '18px 16px',
          borderRadius: 16,
          background: 'white',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#374151' }}>{t('homeFeatureTitle', lang)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#ea580c' }}>· {t('electronicSurveyTitle', lang)}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{t('homeFeatureSurveyBody', lang)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#ea580c' }}>· {t('homeCardEquipment', lang)}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{t('homeFeatureEquipmentBody', lang)}</p>
            </div>
          </div>
        </div>

        <Link href="/settings" style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 8 }}>
          {t('navSettings', lang)} →
        </Link>
      </div>
    </div>
  )
}
