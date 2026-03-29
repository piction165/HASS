import type { PersonalProfile } from './store'

function str(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function parseGenderFromOcr(raw: string): PersonalProfile['gender'] {
  const s = raw.trim().toLowerCase()
  if (!s) return ''
  if (['female', 'f', '여', '여성', 'woman', 'girl'].some((x) => s === x || s.includes(x))) {
    if (s.includes('남') && !s.includes('여')) return ''
    return 'female'
  }
  if (['male', 'm', '남', '남성', 'man', 'boy'].some((x) => s === x || s.includes(x))) return 'male'
  return ''
}

/** YYYYMMDD, YYYY.MM.DD, YYYY-MM-DD 등 → YYYY-MM-DD (date input용) */
function normalizeBirthDate(raw: string): string {
  const t = raw.replace(/\s/g, '')
  if (!t) return ''
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dot = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(t)
  if (dot) {
    const y = dot[1]
    const mo = dot[2].padStart(2, '0')
    const d = dot[3].padStart(2, '0')
    return `${y}-${mo}-${d}`
  }
  const compact = /^(\d{4})(\d{2})(\d{2})$/.exec(t)
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`
  return t
}

function pickDeep(obj: unknown, keys: string[]): string {
  if (!obj || typeof obj !== 'object') return ''
  const stack: unknown[] = [obj]
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || typeof cur !== 'object') continue
    for (const k of keys) {
      if (k in (cur as Record<string, unknown>)) {
        const val = (cur as Record<string, unknown>)[k]
        const s = str(val)
        if (s) return s
      }
    }
    for (const v of Object.values(cur as Record<string, unknown>)) {
      if (v && typeof v === 'object') stack.push(v)
    }
  }
  return ''
}

/**
 * Maps arbitrary OCR JSON into profile-shaped fields.
 * Works with common shapes: { name }, { fields: { ... } }, { result: { ... } }, Korean keys.
 */
export function mapOcrJsonToProfile(data: unknown): Partial<PersonalProfile> {
  if (!data || typeof data !== 'object') return {}

  const root = data as Record<string, unknown>
  const fields =
    (root.fields as Record<string, unknown>) ||
    (root.result as Record<string, unknown>) ||
    (root.data as Record<string, unknown>) ||
    root

  const birthRaw = pickDeep(fields, [
    'birth_date', 'birthDate', 'dob', 'date_of_birth', '생년월일', 'birth',
  ])
  const genderRaw = pickDeep(fields, ['gender', 'sex', '성별'])
  const birthNorm = birthRaw ? normalizeBirthDate(birthRaw) : ''
  const genderParsed = parseGenderFromOcr(genderRaw)

  const raw: Partial<PersonalProfile> = {
    applicant_name: pickDeep(fields, [
      'applicant_name', 'name', 'fullName', 'full_name', 'given_name', '성명', '이름',
    ]),
    birth_date: birthNorm,
    gender: genderParsed,
    resident_no: pickDeep(fields, [
      'resident_no', 'residentNo', 'ssn', 'id_number', 'personal_no', '주민번호', 'registrationNumber',
    ]),
    personal_no: pickDeep(fields, ['personal_no', 'personalNo', 'registration_no', '등록번호']),
    nationality: pickDeep(fields, ['nationality', 'nation', 'country', '국적']),
    address: pickDeep(fields, ['address', 'full_address', 'addr', '주소']),
    foreigner_no: pickDeep(fields, ['foreigner_no', 'foreignerNo', 'alien_registration_no', '외국인번호']),
    foreigner_nationality: pickDeep(fields, ['foreigner_nationality', 'foreignerNationality', '외국인국적']),
  }

  const out: Partial<PersonalProfile> = {}
  for (const [k, v] of Object.entries(raw) as [keyof PersonalProfile, PersonalProfile[keyof PersonalProfile]][]) {
    if (v !== '' && v !== undefined && v !== null) {
      ;(out as Record<string, unknown>)[k] = v
    }
  }
  return out
}
