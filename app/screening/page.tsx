'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadStore,
  updateStore,
  emptyProfile,
  emptyVaccineScreening,
  isSurveyStep2Complete,
  type VaccineScreeningForm,
} from '@/lib/store'
import { PreScreenFormFields } from '@/components/PreScreenFormFields'
import { t, type Lang } from '@/lib/i18n'

export default function ScreeningPage() {
  const router = useRouter()
  const [store, setStore] = useState(loadStore)
  const lang = (store.language || 'ko') as Lang
  const [form, setForm] = useState<VaccineScreeningForm>(() => ({ ...emptyVaccineScreening(), ...store.vaccineScreening }))
  const [error, setError] = useState('')

  useEffect(() => {
    const s = loadStore()
    if (!s.user) {
      router.replace('/login')
      return
    }
    setStore(s)
    setForm({ ...emptyVaccineScreening(), ...s.vaccineScreening })
  }, [router])

  function setV<K extends keyof VaccineScreeningForm>(k: K, v: VaccineScreeningForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function handleSave() {
    setError('')
    const g = store.profile?.gender ?? ''
    if (!isSurveyStep2Complete(form, g)) {
      setError(t('fillRequiredSurvey', lang))
      return
    }
    updateStore({ vaccineScreening: form })
    router.push('/review')
  }

  if (!store.user) return null

  const subjectGender = store.profile?.gender ?? ''

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
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t('screeningTitle', lang)}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{t('vaccineQuestions', lang)}</p>
          </div>
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
            {t('step', lang)} 4
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="bottom-safe">
        <div style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb' }}>
          <PreScreenFormFields
            vaccine={form}
            setV={setV}
            lang={lang}
            subjectGender={subjectGender}
            profile={store.profile ? { ...emptyProfile(), ...store.profile } : null}
            onPatchProfile={(patch) => {
              const s = loadStore()
              updateStore({ profile: { ...emptyProfile(), ...s.profile, ...patch } })
              setStore(loadStore())
            }}
          />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', color: '#dc2626', fontSize: 14 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, paddingBottom: 16 }}>
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push('/survey')}>{t('back', lang)}</button>
          <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>{t('next', lang)} →</button>
        </div>
      </div>
    </div>
  )
}
