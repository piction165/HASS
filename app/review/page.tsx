'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStore, emptyProfile, isSurveyStep2Complete, type AppStore } from '@/lib/store'
import { PRESCREEN_TEXT_ROWS, PRESCREEN_YN_ROWS } from '@/lib/prescreen-meta'
import { t, type Lang } from '@/lib/i18n'

export default function ReviewPage() {
  const router = useRouter()
  const [store, setStore] = useState<AppStore>(loadStore)
  const lang = (store.language || 'ko') as Lang

  useEffect(() => {
    const s = loadStore()
    if (!s.user) {
      router.replace('/login')
      return
    }
    setStore(s)
  }, [router])

  const p = { ...emptyProfile(), ...store.profile }
  const v = store.vaccineScreening
  const m = store.managementSurvey

  function Row({ label, value }: { label: string; value?: string | null }) {
    return (
      <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, minWidth: 110, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: 15, color: '#111827', fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</span>
      </div>
    )
  }

  if (!store.user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => router.push('/home')} className="btn-ghost" style={{ padding: 8, flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M14 5l-6 6 6 6" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t('reviewTitle', lang)}</h2>
          </div>
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
            {t('step', lang)} 5
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="bottom-safe">

        <ReviewSection title={t('profileTitle', lang)} done={!!(p.applicant_name && p.birth_date && p.phone)} onEdit={() => router.push('/profile')} lang={lang}>
          <Row label={t('workerName', lang)} value={p.applicant_name} />
          <Row label={t('dateOfBirth', lang)} value={p.birth_date} />
          <Row label={t('gender', lang)} value={p.gender ? t(p.gender, lang) : undefined} />
          <Row label={t('phone', lang)} value={p.phone} />
          <Row label={t('nationality', lang)} value={p.nationality} />
          <Row label={t('address', lang)} value={p.address} />
          <Row label={t('residentNo', lang)} value={p.resident_no ? '•••••••' : undefined} />
        </ReviewSection>

        <ReviewSection
          title={t('surveyTitle', lang)}
          done={!!(p.applicant_name?.trim() && p.birth_date && p.gender && p.address?.trim() && p.resident_no?.trim())}
          onEdit={() => router.push('/survey')}
          lang={lang}
        >
          <Row
            label={t('registeredAtLabel', lang)}
            value={
              m.registered_at
                ? (() => {
                    try {
                      return new Date(m.registered_at).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')
                    } catch {
                      return m.registered_at
                    }
                  })()
                : undefined
            }
          />
          <Row label={t('addressOverride', lang)} value={m.address_override || (lang === 'ko' ? '(개인정보 주소 사용)' : '(use profile address)')} />
        </ReviewSection>

        <ReviewSection
          title={t('screeningTitle', lang)}
          done={isSurveyStep2Complete(v, p.gender)}
          onEdit={() => router.push('/screening')}
          lang={lang}
        >
          <Row label={t('guardianName', lang)} value={v.guardian_name} />
          <Row label={t('relationship', lang)} value={v.relationship} />
          {PRESCREEN_YN_ROWS.map(({ key, pdfLabelKey }) => {
            const ans = v[key]
            const yn = ans === 'yes' ? t('yes', lang) : ans === 'no' ? t('no', lang) : undefined
            return <Row key={key} label={t(pdfLabelKey, lang)} value={yn} />
          })}
          {PRESCREEN_TEXT_ROWS.map(({ key, labelKey }) => {
            const s = String(v[key] ?? '').trim()
            if (!s) return null
            return <Row key={key} label={t(labelKey, lang)} value={s} />
          })}
        </ReviewSection>

        <div style={{ display: 'flex', gap: 10, paddingBottom: 16 }}>
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push('/screening')}>{t('back', lang)}</button>
          <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={() => router.push('/submit')}>{t('pdfSubmit', lang)} →</button>
        </div>
      </div>
    </div>
  )
}

function ReviewSection({
  title, done, onEdit, lang, children,
}: {
  title: string
  done: boolean
  onEdit: () => void
  lang: Lang
  children: React.ReactNode
}) {
  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${done ? '#6ee7b7' : '#e5e7eb'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 20px', background: done ? '#f0fdf4' : '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: done ? '#d1fae5' : '#fef3c7', color: done ? '#065f46' : '#92400e',
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
          }}>
            {done ? t('completedBadge', lang) : t('pendingBadge', lang)}
          </span>
          <button type="button" onClick={onEdit} style={{
            background: 'transparent', border: 'none', color: '#f97316',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '4px 8px',
          }}>{t('edit', lang)}</button>
        </div>
      </div>
      <div style={{ padding: '4px 20px 8px' }}>{children}</div>
    </div>
  )
}
