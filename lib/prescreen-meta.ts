import type { VaccineScreeningForm } from './store'

/** 개인정보 처리 동의 3항 (일괄 예) */
export const PRESCREEN_CONSENT_YN_KEYS: (keyof VaccineScreeningForm)[] = [
  'consent_precheck_history',
  'consent_sms_schedule',
  'consent_sms_adverse',
]

/** 접종대상자 확인사항 (일괄 아니오) */
export const PRESCREEN_CHECK_YN_KEYS: (keyof VaccineScreeningForm)[] = [
  'pre_q1_sick',
  'pre_q2_allergy',
  'pre_q3_prior_reaction',
  'pre_q4_chronic',
  'pre_q5_neuro',
  'pre_q6_cancer_immune',
  'pre_q7_steroid_etc',
  'pre_q8_transfusion',
  'pre_q9_recent_vax',
  'pre_q10_pregnancy',
]

/** PDF·검토용 예/아니오 항목 순서 */
export const PRESCREEN_YN_ROWS: { key: keyof VaccineScreeningForm; pdfLabelKey: string }[] = [
  { key: 'consent_precheck_history', pdfLabelKey: 'prePdf_c1' },
  { key: 'consent_sms_schedule', pdfLabelKey: 'prePdf_c2' },
  { key: 'consent_sms_adverse', pdfLabelKey: 'prePdf_c3' },
  { key: 'pre_q1_sick', pdfLabelKey: 'prePdf_q1' },
  { key: 'pre_q2_allergy', pdfLabelKey: 'prePdf_q2' },
  { key: 'pre_q3_prior_reaction', pdfLabelKey: 'prePdf_q3' },
  { key: 'pre_q4_chronic', pdfLabelKey: 'prePdf_q4' },
  { key: 'pre_q5_neuro', pdfLabelKey: 'prePdf_q5' },
  { key: 'pre_q6_cancer_immune', pdfLabelKey: 'prePdf_q6' },
  { key: 'pre_q7_steroid_etc', pdfLabelKey: 'prePdf_q7' },
  { key: 'pre_q8_transfusion', pdfLabelKey: 'prePdf_q8' },
  { key: 'pre_q9_recent_vax', pdfLabelKey: 'prePdf_q9' },
  { key: 'pre_q10_pregnancy', pdfLabelKey: 'prePdf_q10' },
]

export const PRESCREEN_TEXT_ROWS: { key: keyof VaccineScreeningForm; labelKey: string }[] = [
  { key: 'pre_q1_symptoms', labelKey: 'preQ1_detail' },
  { key: 'pre_q3_vaccine_name', labelKey: 'preQ3_detail' },
  { key: 'pre_q4_disease', labelKey: 'preQ4_detail' },
  { key: 'pre_q6_disease', labelKey: 'preQ6_detail' },
  { key: 'pre_q9_vaccine_name', labelKey: 'preQ9_detail' },
]
