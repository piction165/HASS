'use client'

import type { PersonalProfile, VaccineScreeningForm, YesNo } from '@/lib/store'
import { emptyProfile } from '@/lib/store'
import {
  PRESCREEN_CHECK_YN_KEYS,
  PRESCREEN_CONSENT_YN_KEYS,
  PRESCREEN_TEXT_ROWS,
} from '@/lib/prescreen-meta'
import { t, type Lang } from '@/lib/i18n'

type SetV = <K extends keyof VaccineScreeningForm>(k: K, v: VaccineScreeningForm[K]) => void

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        background: '#fff',
      }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: '#111827', lineHeight: 1.45 }}>{title}</p>
      {subtitle ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{subtitle}</p>
      ) : (
        <div style={{ marginBottom: 12 }} />
      )}
      {children}
    </div>
  )
}

function nationalLine(p: PersonalProfile): string {
  if (p.nationality_kind === 'foreign') {
    return (p.foreigner_nationality || p.nationality || '').trim()
  }
  return (p.nationality || '').trim()
}

function ReadonlyField({ label, value, lang }: { label: string; value: string; lang: Lang }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="form-label">{label}</label>
      <div
        style={{
          background: '#f9fafb',
          color: '#374151',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '12px 14px',
          minHeight: 46,
          display: 'flex',
          alignItems: 'center',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {value || '—'}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{t('readonlyFromProfile', lang)}</p>
    </div>
  )
}

function YesNoRow({ value, onYes, onNo, lang }: { value: YesNo; onYes: () => void; onNo: () => void; lang: Lang }) {
  return (
    <div className="option-group">
      <button type="button" className={`option-btn ${value === 'yes' ? 'selected' : ''}`} onClick={onYes}>
        {t('yes', lang)}
      </button>
      <button type="button" className={`option-btn ${value === 'no' ? 'selected' : ''}`} onClick={onNo}>
        {t('no', lang)}
      </button>
    </div>
  )
}

export function PreScreenFormFields({
  vaccine,
  setV,
  lang,
  subjectGender,
  profile,
  onPatchProfile,
}: {
  vaccine: VaccineScreeningForm
  setV: SetV
  lang: Lang
  subjectGender: string
  profile: PersonalProfile | null
  onPatchProfile: (patch: Partial<PersonalProfile>) => void
}) {
  const isMale = subjectGender === 'male'
  const subj = profile ?? emptyProfile()

  function setConsentAllYes() {
    for (const k of PRESCREEN_CONSENT_YN_KEYS) {
      setV(k, 'yes')
    }
  }

  function setCheckAllNo() {
    for (const k of PRESCREEN_CHECK_YN_KEYS) {
      if (k === 'pre_q10_pregnancy' && isMale) {
        setV('pre_q10_pregnancy', '')
        continue
      }
      setV(k, 'no')
    }
    for (const { key } of PRESCREEN_TEXT_ROWS) {
      setV(key, '')
    }
  }

  return (
    <>
      <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#111827' }}>{t('preVaccineSheetTitle', lang)}</p>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>{t('preVaccineSheetIntro', lang)}</p>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 18 }}>
        <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#374151' }}>{t('preSubjectInfoSection', lang)}</p>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{t('preFromProfileHint', lang)}</p>

        <ReadonlyField label={t('workerName', lang)} value={subj.applicant_name} lang={lang} />
        <ReadonlyField
          label={t('gender', lang)}
          value={subj.gender === 'male' ? t('male', lang) : subj.gender === 'female' ? t('female', lang) : ''}
          lang={lang}
        />
        <ReadonlyField label={t('dateOfBirth', lang)} value={subj.birth_date} lang={lang} />
        <ReadonlyField label={t('nationality', lang)} value={nationalLine(subj)} lang={lang} />

        <div style={{ marginBottom: 12 }}>
          <label className="form-label">{t('weight', lang)}</label>
          <input
            className="input-field"
            value={subj.weight_kg}
            onChange={(e) => onPatchProfile({ weight_kg: e.target.value })}
            inputMode="decimal"
          />
        </div>
        <div style={{ marginBottom: 0 }}>
          <label className="form-label">{`${t('phone', lang)} (${t('phoneMobileShort', lang)})`}</label>
          <input className="input-field" value={subj.phone} onChange={(e) => onPatchProfile({ phone: e.target.value })} inputMode="tel" />
        </div>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>{t('preScreenSelfVerifyNote', lang)}</p>

      <div style={{ marginBottom: 18 }}>
        <label className="form-label">
          {t('guardianName', lang)} <span style={{ color: '#f97316' }}>*</span>
        </label>
        <input className="input-field" value={vaccine.guardian_name} onChange={(e) => setV('guardian_name', e.target.value)} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label className="form-label">
          {t('relationship', lang)} <span style={{ color: '#f97316' }}>*</span>
        </label>
        <input className="input-field" value={vaccine.relationship} onChange={(e) => setV('relationship', e.target.value)} />
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: '#374151' }}>{t('preScreenConsentSection', lang)}</p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>{t('preScreenConsentIntro', lang)}</p>

      <div
        style={{
          marginBottom: 14,
          padding: 14,
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          background: '#fafafa',
        }}
      >
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{t('preBulkConsentHint', lang)}</p>
        <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={setConsentAllYes}>
          {t('preBulkAllYes', lang)}
        </button>
      </div>

      <Card title={t('preConsent1_title', lang)} subtitle={t('preConsent1_sub', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.consent_precheck_history}
          onYes={() => setV('consent_precheck_history', 'yes')}
          onNo={() => setV('consent_precheck_history', 'no')}
        />
      </Card>
      <Card title={t('preConsent2_title', lang)} subtitle={t('preConsent2_sub', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.consent_sms_schedule}
          onYes={() => setV('consent_sms_schedule', 'yes')}
          onNo={() => setV('consent_sms_schedule', 'no')}
        />
      </Card>
      <Card title={t('preConsent3_title', lang)} subtitle={t('preConsent3_sub', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.consent_sms_adverse}
          onYes={() => setV('consent_sms_adverse', 'yes')}
          onNo={() => setV('consent_sms_adverse', 'no')}
        />
      </Card>

      <p style={{ margin: '20px 0 10px', fontSize: 15, fontWeight: 800, color: '#374151' }}>{t('preScreenCheckSection', lang)}</p>

      <div
        style={{
          marginBottom: 14,
          padding: 14,
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          background: '#fafafa',
        }}
      >
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{t('preBulkCheckHint', lang)}</p>
        <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={setCheckAllNo}>
          {t('preBulkAllNo', lang)}
        </button>
      </div>

      <Card title={t('preQ1_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q1_sick}
          onYes={() => setV('pre_q1_sick', 'yes')}
          onNo={() => setV('pre_q1_sick', 'no')}
        />
        {vaccine.pre_q1_sick === 'yes' && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">{t('preQ1_detail', lang)}</label>
            <input
              className="input-field"
              value={vaccine.pre_q1_symptoms}
              onChange={(e) => setV('pre_q1_symptoms', e.target.value)}
            />
          </div>
        )}
      </Card>

      <Card title={t('preQ2_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q2_allergy}
          onYes={() => setV('pre_q2_allergy', 'yes')}
          onNo={() => setV('pre_q2_allergy', 'no')}
        />
      </Card>

      <Card title={t('preQ3_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q3_prior_reaction}
          onYes={() => setV('pre_q3_prior_reaction', 'yes')}
          onNo={() => setV('pre_q3_prior_reaction', 'no')}
        />
        {vaccine.pre_q3_prior_reaction === 'yes' && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">{t('preQ3_detail', lang)}</label>
            <input
              className="input-field"
              value={vaccine.pre_q3_vaccine_name}
              onChange={(e) => setV('pre_q3_vaccine_name', e.target.value)}
            />
          </div>
        )}
      </Card>

      <Card title={t('preQ4_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q4_chronic}
          onYes={() => setV('pre_q4_chronic', 'yes')}
          onNo={() => setV('pre_q4_chronic', 'no')}
        />
        {vaccine.pre_q4_chronic === 'yes' && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">{t('preQ4_detail', lang)}</label>
            <input className="input-field" value={vaccine.pre_q4_disease} onChange={(e) => setV('pre_q4_disease', e.target.value)} />
          </div>
        )}
      </Card>

      <Card title={t('preQ5_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q5_neuro}
          onYes={() => setV('pre_q5_neuro', 'yes')}
          onNo={() => setV('pre_q5_neuro', 'no')}
        />
      </Card>

      <Card title={t('preQ6_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q6_cancer_immune}
          onYes={() => setV('pre_q6_cancer_immune', 'yes')}
          onNo={() => setV('pre_q6_cancer_immune', 'no')}
        />
        {vaccine.pre_q6_cancer_immune === 'yes' && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">{t('preQ6_detail', lang)}</label>
            <input className="input-field" value={vaccine.pre_q6_disease} onChange={(e) => setV('pre_q6_disease', e.target.value)} />
          </div>
        )}
      </Card>

      <Card title={t('preQ7_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q7_steroid_etc}
          onYes={() => setV('pre_q7_steroid_etc', 'yes')}
          onNo={() => setV('pre_q7_steroid_etc', 'no')}
        />
      </Card>

      <Card title={t('preQ8_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q8_transfusion}
          onYes={() => setV('pre_q8_transfusion', 'yes')}
          onNo={() => setV('pre_q8_transfusion', 'no')}
        />
      </Card>

      <Card title={t('preQ9_title', lang)}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q9_recent_vax}
          onYes={() => setV('pre_q9_recent_vax', 'yes')}
          onNo={() => setV('pre_q9_recent_vax', 'no')}
        />
        {vaccine.pre_q9_recent_vax === 'yes' && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">{t('preQ9_detail', lang)}</label>
            <input
              className="input-field"
              value={vaccine.pre_q9_vaccine_name}
              onChange={(e) => setV('pre_q9_vaccine_name', e.target.value)}
            />
          </div>
        )}
      </Card>

      <Card title={t('preQ10_title', lang)} subtitle={subjectGender === 'male' ? t('preQ10_maleHint', lang) : undefined}>
        <YesNoRow
          lang={lang}
          value={vaccine.pre_q10_pregnancy}
          onYes={() => setV('pre_q10_pregnancy', 'yes')}
          onNo={() => setV('pre_q10_pregnancy', 'no')}
        />
      </Card>
    </>
  )
}
