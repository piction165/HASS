'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  emptyProfile,
  emptyVaccineScreening,
  loadStore,
  updateStore,
  isSurveyStep1Complete,
  isSurveyStep2Complete,
  isSurveyStep3Complete,
  type ManagementSurveyForm,
  type PersonalProfile,
  type VaccineScreeningForm,
  type AppStore,
} from '@/lib/store'
import { buildGasPayload } from '@/lib/gas-payload'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { SignaturePad } from '@/components/SignaturePad'
import { PreScreenFormFields } from '@/components/PreScreenFormFields'
import { t, type Lang } from '@/lib/i18n'

export default function SurveyWizardPage() {
  const router = useRouter()
  const lang = (loadStore().language || 'ko') as Lang
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<PersonalProfile>(() => ({ ...emptyProfile(), ...loadStore().profile }))
  const [mgmt, setMgmt] = useState<ManagementSurveyForm>(() => ({ ...loadStore().managementSurvey }))
  const [vaccine, setVaccine] = useState<VaccineScreeningForm>(() => ({ ...emptyVaccineScreening(), ...loadStore().vaccineScreening }))
  const [consent, setConsent] = useState(() => loadStore().surveyConsentAccepted)
  const [signature, setSignature] = useState(() => loadStore().surveySignature || '')
  const [err, setErr] = useState('')
  const [ocrBusy, setOcrBusy] = useState(false)
  const [submitBusy, setSubmitBusy] = useState(false)
  const [ocrFilled, setOcrFilled] = useState(false)

  useEffect(() => {
    if (step !== 1) return
    setMgmt((m) => (m.registered_at ? m : { ...m, registered_at: new Date().toISOString() }))
  }, [step])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    if (!supabase) return
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (!data) return
      setProfile((prev) => ({
        ...prev,
        applicant_name: prev.applicant_name || String(data.applicant_name || ''),
        birth_date: prev.birth_date || String(data.birth_date || ''),
        phone: prev.phone || String(data.phone || ''),
        phone_home: prev.phone_home || String((data as { phone_home?: string }).phone_home || ''),
        weight_kg: prev.weight_kg || String((data as { weight_kg?: string }).weight_kg || ''),
        gender: (data.gender === 'male' || data.gender === 'female' ? data.gender : prev.gender) as PersonalProfile['gender'],
        address: prev.address || String(data.address || ''),
        resident_no: prev.resident_no || String(data.resident_no || ''),
        personal_no: prev.personal_no || String((data as { personal_no?: string }).personal_no || ''),
        nationality: prev.nationality || String((data as { nationality?: string }).nationality || ''),
        nationality_kind:
          (data as { nationality_kind?: string }).nationality_kind === 'foreign' ||
          (data as { nationality_kind?: string }).nationality_kind === 'domestic'
            ? ((data as { nationality_kind: 'foreign' | 'domestic' }).nationality_kind)
            : prev.nationality_kind,
        foreigner_nationality: prev.foreigner_nationality || String(data.foreigner_nationality || ''),
        foreigner_no: prev.foreigner_no || String(data.foreigner_no || ''),
      }))
    })
  }, [])

  const persistPartial = useCallback(() => {
    updateStore({
      profile,
      managementSurvey: mgmt,
      vaccineScreening: vaccine,
      surveySelectedEquipmentIds: [],
      surveyConsentAccepted: consent,
      surveySignature: signature,
    })
  }, [profile, mgmt, vaccine, consent, signature])

  async function runOcr(file: File | null) {
    if (!file) return
    setErr('')
    setOcrBusy(true)
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(String(r.result))
        r.onerror = () => rej(new Error('read'))
        r.readAsDataURL(file)
      })
      const r = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      })
      const j = (await r.json()) as { ok?: boolean; profilePatch?: Partial<PersonalProfile>; error?: string }
      if (!r.ok || !j.ok) {
        setErr(j.error || 'OCR')
        return
      }
      const patch = j.profilePatch || {}
      setProfile((p) => ({ ...p, ...patch }))
      if (Object.keys(patch).length) setOcrFilled(true)
    } catch {
      setErr('OCR')
    } finally {
      setOcrBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function goNext() {
    setErr('')
    if (step === 1) {
      if (!isSurveyStep1Complete(profile, mgmt)) {
        setErr(t('fillRequiredSurvey', lang))
        return
      }
      persistPartial()
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (step === 2) {
      if (!isSurveyStep2Complete(vaccine, profile.gender)) {
        setErr(t('fillRequiredSurvey', lang))
        return
      }
      persistPartial()
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goBack() {
    setErr('')
    if (step <= 1) router.push('/home')
    else {
      persistPartial()
      setStep((s) => s - 1)
    }
  }

  async function submitAll() {
    setErr('')
    if (!isSurveyStep3Complete(consent, signature)) {
      setErr(t('fillRequiredSurvey', lang))
      return
    }
    updateStore({
      profile,
      managementSurvey: mgmt,
      vaccineScreening: vaccine,
      surveySelectedEquipmentIds: [],
      surveyConsentAccepted: consent,
      surveySignature: signature,
    })
    const base = loadStore()
    const merged: AppStore = {
      ...base,
      profile,
      managementSurvey: mgmt,
      vaccineScreening: vaccine,
      surveySelectedEquipmentIds: [],
      surveyConsentAccepted: consent,
      surveySignature: signature,
    }
    setSubmitBusy(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGasPayload(merged)),
      })
      const json = (await res.json()) as { ok?: boolean; pdfUrl?: string; fileName?: string; error?: string }
      if (!res.ok || !json.ok) {
        const raw = (json.error || 'submit').toString()
        const lower = raw.toLowerCase()
        if (lower === 'unauthorized' || lower.includes('unauthorized')) {
          setErr(t('gasUnauthorized', lang))
        } else {
          setErr(raw)
        }
        return
      }
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      updateStore({
        localSubmissions: [
          {
            id,
            pdfUrl: json.pdfUrl || '#',
            fileName: json.fileName || 'HASS.pdf',
            createdAt: new Date().toISOString(),
            usageDate: new Date().toISOString().slice(0, 10),
          },
          ...base.localSubmissions,
        ],
        surveyConsentAccepted: false,
        surveySignature: '',
        surveySelectedEquipmentIds: [],
        managementSurvey: { ...mgmt, registered_at: '' },
      })
      router.push('/records')
    } catch {
      setErr('network')
    } finally {
      setSubmitBusy(false)
    }
  }

  function setV<K extends keyof VaccineScreeningForm>(k: K, v: VaccineScreeningForm[K]) {
    setVaccine((prev) => ({ ...prev, [k]: v }))
  }

  const stepLabels = [t('wizardStep1', lang), t('wizardStep2', lang), t('wizardStep3', lang)]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="page-header" style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#ea580c' }}>{t('wizardTitle', lang)}</p>
        <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 800, color: '#111827' }}>
          {t('wizardStepOf', lang)} {step}/3
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {stepLabels.map((label, i) => (
            <span
              key={label}
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '6px 10px',
                borderRadius: 99,
                background: step === i + 1 ? '#fff7ed' : '#f3f4f6',
                color: step === i + 1 ? '#c2410c' : '#9ca3af',
                border: step === i + 1 ? '1px solid #fdba74' : '1px solid #e5e7eb',
              }}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px 100px' }} className="bottom-safe">
        {err && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 12, borderRadius: 12, marginBottom: 14, fontSize: 14 }}>
            {err}
          </div>
        )}

        {step === 1 && (
          <>
            <section style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb', marginBottom: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#111827' }}>{t('ocrTitle', lang)}</p>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{t('ocrDesc', lang)}</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => void runOcr(e.target.files?.[0] || null)} />
              <button type="button" className="btn-secondary" disabled={ocrBusy} onClick={() => fileRef.current?.click()}>
                {ocrBusy ? '…' : t('ocrUpload', lang)}
              </button>
              {ocrFilled && (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: '#059669', fontWeight: 600, lineHeight: 1.45 }}>{t('ocrAutoFilled', lang)}</p>
              )}
            </section>

            <section style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb', marginBottom: 14 }}>
              <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#111827' }}>{t('basicInfo', lang)}</p>

              {mgmt.registered_at && (
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                  {t('registeredAtLabel', lang)}:{' '}
                  {new Date(mgmt.registered_at).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                </p>
              )}

              <Field label={`${t('workerName', lang)} *`} hint={t('hintName', lang)} lang={lang}>
                <input className="input-field" value={profile.applicant_name} onChange={(e) => setProfile((p) => ({ ...p, applicant_name: e.target.value }))} placeholder="홍길동" />
              </Field>

              <Field label={`${t('gender', lang)} *`} lang={lang}>
                <div className="option-group">
                  <button type="button" className={`option-btn ${profile.gender === 'male' ? 'selected' : ''}`} onClick={() => setProfile((p) => ({ ...p, gender: 'male' }))}>{t('maleLabel', lang)}</button>
                  <button type="button" className={`option-btn ${profile.gender === 'female' ? 'selected' : ''}`} onClick={() => setProfile((p) => ({ ...p, gender: 'female' }))}>{t('femaleLabel', lang)}</button>
                </div>
              </Field>

              <Field label={`${t('dateOfBirth', lang)} *`} hint={t('hintDob', lang)} lang={lang}>
                <input className="input-field" type="date" value={profile.birth_date} onChange={(e) => setProfile((p) => ({ ...p, birth_date: e.target.value }))} />
              </Field>

              <Field label={`${t('address', lang)} *`} hint={t('hintAddress', lang)} lang={lang}>
                <input className="input-field" value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} placeholder="서울특별시 강남구…" />
              </Field>

              <Field label={`${t('residentNo', lang)} *`} hint={t('hintResident', lang)} lang={lang}>
                <input className="input-field" value={profile.resident_no} onChange={(e) => setProfile((p) => ({ ...p, resident_no: e.target.value }))} placeholder="123456-1234567" autoComplete="off" />
              </Field>

              <Field label={`${t('nationality', lang)} *`} lang={lang}>
                <div className="option-group">
                  <button type="button" className={`option-btn ${profile.nationality_kind === 'domestic' ? 'selected' : ''}`} onClick={() => setProfile((p) => ({ ...p, nationality_kind: 'domestic', nationality: '대한민국' }))}>{t('nationalityDomestic', lang)}</button>
                  <button type="button" className={`option-btn ${profile.nationality_kind === 'foreign' ? 'selected' : ''}`} onClick={() => setProfile((p) => ({ ...p, nationality_kind: 'foreign' }))}>{t('nationalityForeign', lang)}</button>
                </div>
              </Field>

              {profile.nationality_kind === 'foreign' && (
                <>
                  <Field label={t('foreignerNationality', lang)} lang={lang}>
                    <input className="input-field" value={profile.foreigner_nationality} onChange={(e) => setProfile((p) => ({ ...p, foreigner_nationality: e.target.value }))} />
                  </Field>
                  <Field label={t('foreignerNo', lang)} lang={lang}>
                    <input className="input-field" value={profile.foreigner_no} onChange={(e) => setProfile((p) => ({ ...p, foreigner_no: e.target.value }))} />
                  </Field>
                </>
              )}

              <Field label={t('phone', lang)} lang={lang}>
                <input className="input-field" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} inputMode="tel" />
              </Field>
            </section>
          </>
        )}

        {step === 2 && (
          <section style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>{t('sheetScreening', lang)}</p>
            <PreScreenFormFields
              vaccine={vaccine}
              setV={setV}
              lang={lang}
              subjectGender={profile.gender || ''}
              profile={profile}
              onPatchProfile={(patch) => setProfile((p) => ({ ...p, ...patch }))}
            />
          </section>
        )}

        {step === 3 && (
          <section style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>{t('consentTitle', lang)}</p>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#4b5563', lineHeight: 1.55 }}>{t('consentBody', lang)}</p>
            <label className={`checkbox-tile ${consent ? 'checked' : ''}`} style={{ cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#ea580c' }} />
              <span style={{ fontWeight: 700 }}>{t('consentCheck', lang)}</span>
            </label>
            <p style={{ margin: '0 0 8px', fontWeight: 800 }}>{t('signatureLabel', lang)}</p>
            <SignaturePad clearLabel={t('signatureClear', lang)} onChange={setSignature} />
          </section>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={goBack}>{step === 1 ? t('wizardCancel', lang) : t('wizardPrev', lang)}</button>
          {step < 3 ? (
            <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={goNext}>{t('wizardNext', lang)}</button>
          ) : (
            <button type="button" className="btn-primary" style={{ flex: 2 }} disabled={submitBusy} onClick={() => void submitAll()}>
              {submitBusy ? t('submitting', lang) : t('submitFinal', lang)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children, lang: _lang }: { label: string; hint?: string; children: React.ReactNode; lang: Lang }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>{hint}</p>}
    </div>
  )
}
