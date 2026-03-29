import { jsPDF } from 'jspdf'
import type { AppStore } from './store'
import { emptyProfile, emptyVaccineScreening } from './store'
import { PRESCREEN_TEXT_ROWS, PRESCREEN_YN_ROWS } from './prescreen-meta'
import type { Lang } from './i18n'
import { t } from './i18n'

export async function generateHassPDF(store: AppStore, lang: Lang) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  /** 좁은 여백으로 한 장에 더 많이 담기 (목표: 약 2페이지) */
  const margin = 11
  const contentW = pageW - margin * 2
  const footerY = 287
  const bodyBottom = footerY - 6
  let y = 0

  const orange = [249, 115, 22] as const
  const darkText = [17, 24, 39] as const
  const mutedText = [107, 114, 128] as const
  const borderGray = [229, 231, 235] as const

  function setColor(r: number, g: number, b: number) {
    doc.setTextColor(r, g, b)
  }

  function drawRect(x: number, yy: number, w: number, h: number, r: number, g: number, bb: number, filled = true) {
    doc.setFillColor(r, g, bb)
    if (filled) doc.rect(x, yy, w, h, 'F')
    else doc.rect(x, yy, w, h)
  }

  const headerH = 28
  drawRect(0, 0, pageW, headerH, ...orange)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  setColor(255, 255, 255)
  doc.text('HASS', margin, 14)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  setColor(255, 237, 213)
  doc.text('Health & Safety / Vaccine forms', margin, 21)
  const dateStr = new Date().toLocaleDateString('ko-KR')
  doc.text(dateStr, pageW - margin, 13, { align: 'right' })
  if (store.user) {
    doc.text(store.user.name, pageW - margin, 20, { align: 'right' })
  }
  y = headerH + 8

  function ensureSpace(needMm: number) {
    if (y + needMm > bodyBottom) {
      doc.addPage()
      y = 10
    }
  }

  function sectionHeader(title: string) {
    ensureSpace(10)
    const h = 6.5
    drawRect(margin, y, contentW, h, 255, 247, 237)
    doc.setDrawColor(...borderGray)
    doc.rect(margin, y, contentW, h)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setColor(...orange)
    doc.text(title, margin + 3, y + 4.5)
    y += h + 2
  }

  function dataRow(label: string, value: string) {
    const labelW = 42
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    setColor(...mutedText)
    const lines = doc.splitTextToSize(value || '—', contentW - labelW - 6)
    const rowH = Math.max(5.8, lines.length * 3.9)
    ensureSpace(rowH + 1)
    doc.text(label, margin + 2, y + 4)
    setColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(lines, margin + labelW, y + 4)
    doc.setDrawColor(...borderGray)
    doc.line(margin, y + rowH, pageW - margin, y + rowH)
    y += rowH
  }

  const p = { ...emptyProfile(), ...store.profile }
  sectionHeader(t('profileTitle', lang))
  dataRow(t('workerName', lang), p.applicant_name)
  dataRow(t('dateOfBirth', lang), p.birth_date)
  dataRow(t('gender', lang), p.gender ? t(p.gender, lang) : '')
  dataRow(t('phone', lang), p.phone)
  if (p.weight_kg?.trim()) {
    dataRow(t('weight', lang), p.weight_kg)
  }
  dataRow(t('nationality', lang), p.nationality)
  dataRow(t('address', lang), p.address)
  dataRow(t('residentNo', lang), p.resident_no ? '***' : '')
  y += 3

  sectionHeader(t('surveyTitle', lang))
  const m = store.managementSurvey
  const regAt = m.registered_at
    ? (() => {
        try {
          return new Date(m.registered_at).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')
        } catch {
          return m.registered_at
        }
      })()
    : ''
  dataRow(t('registeredAtLabel', lang), regAt)
  dataRow(t('addressOverride', lang), m.address_override || '')
  y += 3

  sectionHeader(t('screeningTitle', lang))
  const v = { ...emptyVaccineScreening(), ...store.vaccineScreening }
  dataRow(t('guardianName', lang), v.guardian_name)
  dataRow(t('relationship', lang), v.relationship)
  for (const { key, pdfLabelKey } of PRESCREEN_YN_ROWS) {
    const ans = v[key]
    const yn = ans === 'yes' ? t('yes', lang) : ans === 'no' ? t('no', lang) : '—'
    dataRow(t(pdfLabelKey, lang), yn)
  }
  for (const { key, labelKey } of PRESCREEN_TEXT_ROWS) {
    const s = String(v[key] ?? '').trim()
    if (s) dataRow(t(labelKey, lang), s)
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    setColor(...mutedText)
    doc.text(`HASS · ${dateStr} · ${i}/${pageCount}`, pageW / 2, footerY, { align: 'center' })
  }

  doc.save(`HASS_${dateStr.replace(/\./g, '-')}.pdf`)
}
