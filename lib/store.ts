export type EquipmentKind = 'dump_truck' | 'forklift' | 'lift_truck' | 'grab' | 'other'

export interface EquipmentItem {
  id: string
  kind: EquipmentKind
  plate: string
  /** 사용 일자 yyyy-mm-dd */
  usage_date: string
}

export interface Worker {
  id: string
  name: string
  dob: string
  gender: 'male' | 'female' | ''
  nationality: string
  jobTitle: string
  workPeriod: string
}

/** @deprecated legacy */
export interface ScreeningForm {
  workplaceName: string
  workplaceCode: string
  examinationDate: string
  symptoms: 'none' | 'present' | ''
  symptomsDetail: string
  pastHistory: string
  medications: string
  height: string
  weight: string
  bloodPressureSys: string
  bloodPressureDia: string
}

/** @deprecated legacy */
export interface SurveyForm {
  hazardTypes: string[]
  exposureLevel: 'low' | 'medium' | 'high' | ''
  protectiveMeasures: string
  investigator: string
  investigationDate: string
  notes: string
}

/** 내국인 / 외국인 */
export type NationalityKind = 'domestic' | 'foreign'

/** 시트 연동 개인·관리조사서 공통 */
export interface PersonalProfile {
  applicant_name: string
  birth_date: string
  phone: string
  gender: 'male' | 'female' | ''
  /** 시트 국적: 내국인이면 내국인, 외국인이면 외국인 국적명 */
  nationality_kind: NationalityKind
  nationality: string
  address: string
  resident_no: string
  personal_no: string
  foreigner_nationality: string
  foreigner_no: string
  vaccination_status: string
  /** 예진표 등 — 집 전화 (선택) */
  phone_home: string
  /** 체중 kg (선택) */
  weight_kg: string
}

export type YesNo = 'yes' | 'no' | ''

/** 예방접종 업무 개인정보 동의 + 접종대상자 확인사항 (공식 양식 기준) */
export interface VaccineScreeningForm {
  registration_no: string
  guardian_name: string
  relationship: string
  /** 동의: 통합관리시스템 예방접종 이려 사전조회 */
  consent_precheck_history: YesNo
  /** 동의: 추가 접종 일정 SMS */
  consent_sms_schedule: YesNo
  /** 동의: 접종 후 이상반응 관련 SMS */
  consent_sms_adverse: YesNo
  pre_q1_sick: YesNo
  pre_q1_symptoms: string
  pre_q2_allergy: YesNo
  pre_q3_prior_reaction: YesNo
  pre_q3_vaccine_name: string
  pre_q4_chronic: YesNo
  pre_q4_disease: string
  pre_q5_neuro: YesNo
  pre_q6_cancer_immune: YesNo
  pre_q6_disease: string
  pre_q7_steroid_etc: YesNo
  pre_q8_transfusion: YesNo
  pre_q9_recent_vax: YesNo
  pre_q9_vaccine_name: string
  /** 여성: 임신·가임 가능성 (남성은 미선택 가능) */
  pre_q10_pregnancy: YesNo
}

export interface ManagementSurveyForm {
  /** 전자조사서 1단계 진입 시각 (ISO) */
  registered_at: string
  address_override: string
}

export interface LocalSubmission {
  id: string
  pdfUrl: string
  fileName: string
  createdAt: string
  /** 표시·정렬용 사용일 yyyy-mm-dd (없으면 createdAt 날짜) */
  usageDate?: string
}

export interface AppStore {
  language: string
  user: { name: string; email: string; supabaseId?: string } | null
  profile: PersonalProfile | null
  vaccineScreening: VaccineScreeningForm
  managementSurvey: ManagementSurveyForm
  localSubmissions: LocalSubmission[]
  /** 원격 submissions 건별 표시 사용일 (로컬만, 키=Supabase row id) */
  submissionUsageDates: Record<string, string>
  equipment: EquipmentItem[]
  /** 전자조사서 1단계에서 선택한 장비 id (로컬 equipment 목록 기준) */
  surveySelectedEquipmentIds: string[]
  surveyConsentAccepted: boolean
  /** 서명 PNG data URL (시트 삽입용) */
  surveySignature: string
  workers: Worker[]
  screening: ScreeningForm
  survey: SurveyForm
}

export function emptyProfile(): PersonalProfile {
  return {
    applicant_name: '',
    birth_date: '',
    phone: '',
    gender: '',
    nationality_kind: 'domestic',
    nationality: '대한민국',
    address: '',
    resident_no: '',
    personal_no: '',
    foreigner_nationality: '',
    foreigner_no: '',
    vaccination_status: '',
    phone_home: '',
    weight_kg: '',
  }
}

export function emptyVaccineScreening(): VaccineScreeningForm {
  return {
    registration_no: '',
    guardian_name: '',
    relationship: '',
    consent_precheck_history: '',
    consent_sms_schedule: '',
    consent_sms_adverse: '',
    pre_q1_sick: '',
    pre_q1_symptoms: '',
    pre_q2_allergy: '',
    pre_q3_prior_reaction: '',
    pre_q3_vaccine_name: '',
    pre_q4_chronic: '',
    pre_q4_disease: '',
    pre_q5_neuro: '',
    pre_q6_cancer_immune: '',
    pre_q6_disease: '',
    pre_q7_steroid_etc: '',
    pre_q8_transfusion: '',
    pre_q9_recent_vax: '',
    pre_q9_vaccine_name: '',
    pre_q10_pregnancy: '',
  }
}

export function migrateVaccineScreening(raw: unknown): VaccineScreeningForm {
  const e = emptyVaccineScreening()
  if (!raw || typeof raw !== 'object') return e
  const o = raw as Record<string, unknown>
  const out = e as unknown as Record<string, string>
  for (const k of Object.keys(e) as (keyof VaccineScreeningForm)[]) {
    const v = o[k as string]
    if (v === 'yes' || v === 'no') out[k as string] = v
    else if (typeof v === 'string') out[k as string] = v
  }
  return e
}

const PRESCREEN_YESNO: (keyof VaccineScreeningForm)[] = [
  'consent_precheck_history',
  'consent_sms_schedule',
  'consent_sms_adverse',
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

const DEFAULT_MANAGEMENT: ManagementSurveyForm = {
  registered_at: '',
  address_override: '',
}

export function normalizeManagementSurvey(raw: unknown): ManagementSurveyForm {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    registered_at: typeof o.registered_at === 'string' ? o.registered_at : '',
    address_override: typeof o.address_override === 'string' ? o.address_override : '',
  }
}

const DEFAULT_SCREENING: ScreeningForm = {
  workplaceName: '',
  workplaceCode: '',
  examinationDate: '',
  symptoms: '',
  symptomsDetail: '',
  pastHistory: '',
  medications: '',
  height: '',
  weight: '',
  bloodPressureSys: '',
  bloodPressureDia: '',
}

const DEFAULT_SURVEY: SurveyForm = {
  hazardTypes: [],
  exposureLevel: '',
  protectiveMeasures: '',
  investigator: '',
  investigationDate: '',
  notes: '',
}

function migrateProfile(p: PersonalProfile | null | undefined): PersonalProfile | null {
  if (!p) return null
  const base = emptyProfile()
  return {
    ...base,
    ...p,
    nationality_kind: p.nationality_kind === 'foreign' ? 'foreign' : 'domestic',
  }
}

const EQUIPMENT_KINDS_ALL: EquipmentKind[] = ['dump_truck', 'forklift', 'lift_truck', 'grab', 'other']

function normalizeEquipmentItem(raw: unknown): EquipmentItem {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id = typeof o.id === 'string' ? o.id : String(Date.now())
  const k = o.kind
  const kind = (typeof k === 'string' && EQUIPMENT_KINDS_ALL.includes(k as EquipmentKind) ? k : 'other') as EquipmentKind
  const plate = typeof o.plate === 'string' ? o.plate : ''
  const ud = o.usage_date
  const usage_date = typeof ud === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ud) ? ud : ''
  return { id, kind, plate, usage_date }
}

function migrateRaw(raw: Record<string, unknown>): Partial<AppStore> {
  const out: Partial<AppStore> = {}
  if (!raw.profile && raw.user && typeof raw.user === 'object') {
    const u = raw.user as { name?: string; email?: string }
    out.profile = {
      ...emptyProfile(),
      applicant_name: u.name || '',
      phone: '',
    }
  }
  if (!raw.vaccineScreening && raw.screening && typeof raw.screening === 'object') {
    out.vaccineScreening = emptyVaccineScreening()
  }
  if (!raw.managementSurvey && raw.survey && typeof raw.survey === 'object') {
    out.managementSurvey = { ...DEFAULT_MANAGEMENT }
  }
  if (!Array.isArray(raw.localSubmissions)) {
    out.localSubmissions = []
  }
  if (!Array.isArray(raw.equipment)) {
    out.equipment = []
  }
  if (!Array.isArray(raw.surveySelectedEquipmentIds)) {
    out.surveySelectedEquipmentIds = []
  }
  if (!raw.submissionUsageDates || typeof raw.submissionUsageDates !== 'object') {
    out.submissionUsageDates = {}
  }
  return out
}

function defaultStore(): AppStore {
  return {
    language: 'ko',
    user: null,
    profile: null,
    vaccineScreening: emptyVaccineScreening(),
    managementSurvey: DEFAULT_MANAGEMENT,
    localSubmissions: [],
    submissionUsageDates: {},
    equipment: [],
    surveySelectedEquipmentIds: [],
    surveyConsentAccepted: false,
    surveySignature: '',
    workers: [],
    screening: DEFAULT_SCREENING,
    survey: DEFAULT_SURVEY,
  }
}

export function loadStore(): AppStore {
  if (typeof window === 'undefined') {
    return defaultStore()
  }
  try {
    const raw = localStorage.getItem('hass_store')
    if (!raw) return defaultStore()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const migrated = migrateRaw(parsed)
    const merged = { ...parsed, ...migrated } as AppStore
    return {
      language: typeof merged.language === 'string' ? merged.language : 'ko',
      user: merged.user ?? null,
      profile: migrateProfile(merged.profile ?? null),
      vaccineScreening: migrateVaccineScreening(merged.vaccineScreening ?? emptyVaccineScreening()),
      managementSurvey: normalizeManagementSurvey(merged.managementSurvey ?? DEFAULT_MANAGEMENT),
      localSubmissions: Array.isArray(merged.localSubmissions) ? merged.localSubmissions : [],
      submissionUsageDates:
        merged.submissionUsageDates && typeof merged.submissionUsageDates === 'object' && !Array.isArray(merged.submissionUsageDates)
          ? (merged.submissionUsageDates as Record<string, string>)
          : {},
      equipment: Array.isArray(merged.equipment) ? merged.equipment.map(normalizeEquipmentItem) : [],
      surveySelectedEquipmentIds: Array.isArray(merged.surveySelectedEquipmentIds)
        ? merged.surveySelectedEquipmentIds
        : [],
      surveyConsentAccepted: Boolean(merged.surveyConsentAccepted),
      surveySignature: typeof merged.surveySignature === 'string' ? merged.surveySignature : '',
      workers: Array.isArray(merged.workers) ? merged.workers : [],
      screening: merged.screening ?? DEFAULT_SCREENING,
      survey: merged.survey ?? DEFAULT_SURVEY,
    }
  } catch {
    return defaultStore()
  }
}

export function saveStore(store: AppStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem('hass_store', JSON.stringify(store))
}

export function getStore(): AppStore {
  return loadStore()
}

export function updateStore(partial: Partial<AppStore>) {
  const current = loadStore()
  const updated = { ...current, ...partial }
  saveStore(updated)
  return updated
}

/** 1단계: 관리조사서 기본 정보 */
export function isSurveyStep1Complete(p: PersonalProfile | null, _m: ManagementSurveyForm): boolean {
  if (!p) return false
  if (!p.applicant_name?.trim() || !p.birth_date || !p.gender || !p.address?.trim() || !p.resident_no?.trim()) return false
  if (p.nationality_kind === 'foreign' && (!p.foreigner_nationality?.trim() || !p.foreigner_no?.trim())) return false
  return true
}

/** 2단계: 예진표 (공식 예/아니오 + 조건부 기입) */
export function isSurveyStep2Complete(v: VaccineScreeningForm, subjectGender: PersonalProfile['gender']): boolean {
  if (!v.guardian_name?.trim() || !v.relationship?.trim()) return false
  for (const k of PRESCREEN_YESNO) {
    if (k === 'pre_q10_pregnancy' && subjectGender === 'male') continue
    if (v[k] !== 'yes' && v[k] !== 'no') return false
  }
  if (v.pre_q1_sick === 'yes' && !v.pre_q1_symptoms?.trim()) return false
  if (v.pre_q3_prior_reaction === 'yes' && !v.pre_q3_vaccine_name?.trim()) return false
  if (v.pre_q4_chronic === 'yes' && !v.pre_q4_disease?.trim()) return false
  if (v.pre_q6_cancer_immune === 'yes' && !v.pre_q6_disease?.trim()) return false
  if (v.pre_q9_recent_vax === 'yes' && !v.pre_q9_vaccine_name?.trim()) return false
  return true
}

/** 3단계: 동의·서명 후 제출 */
export function isSurveyStep3Complete(consent: boolean, signature: string): boolean {
  return consent && !!signature?.trim()
}
