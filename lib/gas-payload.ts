import type { AppStore, PersonalProfile, VaccineScreeningForm } from './store'
import { emptyProfile, emptyVaccineScreening } from './store'

function sheetNationality(p: PersonalProfile): string {
  if (p.nationality_kind === 'domestic') return '내국인'
  return (p.foreigner_nationality || p.nationality || '').trim() || '외국인'
}

/** Payload for Google Apps Script `doPost` (matches code.gs). */
export function buildGasPayload(store: AppStore): Record<string, unknown> {
  const p: PersonalProfile = store.profile ?? emptyProfile()
  const v: VaccineScreeningForm = store.vaccineScreening ?? emptyVaccineScreening()
  const m = store.managementSurvey
  const address = (m.address_override || p.address || '').trim()
  const nat = sheetNationality(p)
  const submittedAt = new Date().toISOString()

  const out: Record<string, unknown> = {
    applicant_name: p.applicant_name,
    name: p.applicant_name,
    fullName: p.applicant_name,
    birth_date: p.birth_date,
    birthDate: p.birth_date,
    dob: p.birth_date,
    gender: p.gender,
    sex: p.gender,
    phone: p.phone,
    phone_home: p.phone_home,
    phoneHome: p.phone_home,
    mobile: p.phone,
    contact: p.phone,
    phone_number: p.phone,
    weight_kg: p.weight_kg,
    weightKg: p.weight_kg,
    nationality: nat,
    nation: nat,
    address,
    full_address: address,
    resident_no: p.resident_no,
    residentNo: p.resident_no,
    personal_no: p.personal_no || p.resident_no,
    personalNo: p.personal_no || p.resident_no,
    registration_no: v.registration_no || p.personal_no || p.resident_no,
    registrationNumber: v.registration_no || p.personal_no || p.resident_no,
    vaccination_status: p.vaccination_status,
    vaccinationStatus: p.vaccination_status,
    vaccine_status: p.vaccination_status,
    registered_at: m.registered_at || '',
    registeredAt: m.registered_at || '',
    submitted_at: submittedAt,
    submittedAt,
    foreigner_nationality: p.nationality_kind === 'foreign' ? (p.foreigner_nationality || nat) : '',
    foreignerNationality: p.nationality_kind === 'foreign' ? (p.foreigner_nationality || nat) : '',
    foreigner_no: p.nationality_kind === 'foreign' ? p.foreigner_no : '',
    foreignerNo: p.nationality_kind === 'foreign' ? p.foreigner_no : '',
    guardian_name: v.guardian_name,
    guardianName: v.guardian_name,
    parent_name: v.guardian_name,
    relationship: v.relationship,
    relation: v.relationship,
  }

  Object.assign(out, v)

  const sig = store.surveySignature?.trim() || ''
  out.signature_screening = sig
  out.signature_survey = sig
  out.signatureData = sig

  return out
}
