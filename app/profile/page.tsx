'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadStore,
  saveStore,
  updateStore,
  emptyProfile,
  type PersonalProfile,
} from '@/lib/store'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { t, type Lang } from '@/lib/i18n'

function rowToProfile(row: Record<string, unknown>): PersonalProfile {
  const nk = row.nationality_kind
  const nationalityKind: PersonalProfile['nationality_kind'] =
    nk === 'foreign' || nk === 'domestic'
      ? nk
      : String(row.foreigner_no ?? '').trim() || String(row.foreigner_nationality ?? '').trim()
        ? 'foreign'
        : 'domestic'
  return {
    applicant_name: String(row.applicant_name ?? ''),
    birth_date: String(row.birth_date ?? ''),
    phone: String(row.phone ?? ''),
    gender: (row.gender === 'male' || row.gender === 'female' ? row.gender : '') as PersonalProfile['gender'],
    nationality_kind: nationalityKind,
    nationality: String(row.nationality ?? '대한민국'),
    address: String(row.address ?? ''),
    resident_no: String(row.resident_no ?? ''),
    personal_no: String(row.personal_no ?? ''),
    foreigner_nationality: String(row.foreigner_nationality ?? ''),
    foreigner_no: String(row.foreigner_no ?? ''),
    vaccination_status: String(row.vaccination_status ?? ''),
    phone_home: String(row.phone_home ?? ''),
    weight_kg: String(row.weight_kg ?? ''),
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [store, setStore] = useState(loadStore)
  const lang = (store.language || 'ko') as Lang
  const [form, setForm] = useState<PersonalProfile>(() => ({ ...emptyProfile(), ...store.profile }))
  const [error, setError] = useState('')
  const [loadingRemote, setLoadingRemote] = useState(true)

  useEffect(() => {
    const s = loadStore()
    if (!s.user) {
      router.replace('/login')
      return
    }
    setStore(s)
    setForm({ ...emptyProfile(), ...s.profile })

    const supabase = createBrowserSupabaseClient()
    if (!supabase) {
      setLoadingRemote(false)
      return
    }

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingRemote(false)
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (data) {
        const merged = rowToProfile(data as Record<string, unknown>)
        setForm((prev) => ({ ...emptyProfile(), ...merged, ...prev }))
        const next = loadStore()
        saveStore({ ...next, profile: { ...emptyProfile(), ...merged, ...next.profile } })
      }
      setLoadingRemote(false)
    })()
  }, [router])

  function set<K extends keyof PersonalProfile>(k: K, v: PersonalProfile[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setError('')
    if (!form.applicant_name.trim() || !form.birth_date || !form.phone.trim() || !form.gender) {
      setError(t('enterRequired', lang))
      return
    }

    const next = updateStore({ profile: form })
    setStore(next)

    const supabase = createBrowserSupabaseClient()
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
    if (supabase && user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        applicant_name: form.applicant_name,
        birth_date: form.birth_date,
        phone: form.phone,
        gender: form.gender,
        nationality: form.nationality,
        address: form.address,
        resident_no: form.resident_no,
        personal_no: form.personal_no,
        foreigner_nationality: form.foreigner_nationality,
        foreigner_no: form.foreigner_no,
        vaccination_status: form.vaccination_status,
        phone_home: form.phone_home,
        weight_kg: form.weight_kg,
        updated_at: new Date().toISOString(),
      })
    }

    router.push('/home')
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
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t('profileTitle', lang)}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
              {lang === 'ko' ? '한 번만 입력하면 이후 서식에 자동 반영됩니다.' : 'Saved once and reused across forms.'}
            </p>
          </div>
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
            {t('step', lang)} 1
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="bottom-safe">
        {loadingRemote && (
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{lang === 'ko' ? '불러오는 중…' : 'Loading…'}</p>
        )}

        <Section title={lang === 'ko' ? '기본 정보' : 'Basic'}>
          <Field label={`${t('workerName', lang)} *`}>
            <input className="input-field" value={form.applicant_name} onChange={(e) => set('applicant_name', e.target.value)} />
          </Field>
          <Field label={`${t('dateOfBirth', lang)} *`}>
            <input className="input-field" type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
          </Field>
          <Field label={`${t('gender', lang)} *`}>
            <div className="option-group">
              <button type="button" className={`option-btn ${form.gender === 'male' ? 'selected' : ''}`} onClick={() => set('gender', 'male')}>{t('male', lang)}</button>
              <button type="button" className={`option-btn ${form.gender === 'female' ? 'selected' : ''}`} onClick={() => set('gender', 'female')}>{t('female', lang)}</button>
            </div>
          </Field>
          <Field label={`${t('phone', lang)} *`}>
            <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
          </Field>
          <Field label={`${t('phone', lang)} (${t('phoneHomeShort', lang)})`}>
            <input className="input-field" value={form.phone_home} onChange={(e) => set('phone_home', e.target.value)} inputMode="tel" />
          </Field>
          <Field label={t('weight', lang)}>
            <input className="input-field" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} inputMode="decimal" />
          </Field>
          <Field label={t('nationality', lang)}>
            <input className="input-field" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
          </Field>
          <Field label={t('address', lang)}>
            <textarea className="textarea-field" value={form.address} onChange={(e) => set('address', e.target.value)} style={{ minHeight: 72 }} />
          </Field>
        </Section>

        <Section title={lang === 'ko' ? '등록·식별' : 'ID'}>
          <Field label={t('residentNo', lang)}>
            <input className="input-field" value={form.resident_no} onChange={(e) => set('resident_no', e.target.value)} autoComplete="off" />
          </Field>
          <Field label={t('registrationNoShort', lang)}>
            <input className="input-field" value={form.personal_no} onChange={(e) => set('personal_no', e.target.value)} placeholder={lang === 'ko' ? '예진표 등록번호 등' : 'Registration no.'} />
          </Field>
          <Field label={t('foreignerNationality', lang)}>
            <input className="input-field" value={form.foreigner_nationality} onChange={(e) => set('foreigner_nationality', e.target.value)} />
          </Field>
          <Field label={t('foreignerNo', lang)}>
            <input className="input-field" value={form.foreigner_no} onChange={(e) => set('foreigner_no', e.target.value)} />
          </Field>
          <Field label={t('vaccinationShort', lang)}>
            <input className="input-field" value={form.vaccination_status} onChange={(e) => set('vaccination_status', e.target.value)} placeholder={lang === 'ko' ? '예: 기접종 / 미접종' : 'e.g. vaccinated'} />
          </Field>
        </Section>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', color: '#dc2626', fontSize: 14 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, paddingBottom: 16 }}>
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push('/home')}>{t('back', lang)}</button>
          <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={() => void handleSave()}>
            {t('save', lang)}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>{title}</h3>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}
