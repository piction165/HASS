'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStore, updateStore, type AppStore, type LocalSubmission } from '@/lib/store'
import { buildGasPayload } from '@/lib/gas-payload'
import { t, type Lang } from '@/lib/i18n'

export default function SubmitPage() {
  const router = useRouter()
  const [store, setStore] = useState<AppStore>(loadStore)
  const lang = (store.language || 'ko') as Lang
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const s = loadStore()
    if (!s.user) {
      router.replace('/login')
      return
    }
    setStore(s)
  }, [router])

  async function handleGeneratePdf() {
    setPdfStatus('generating')
    try {
      const { generateHassPDF } = await import('@/lib/pdf')
      await generateHassPDF(store, lang)
      setPdfStatus('done')
    } catch (e) {
      console.error(e)
      setPdfStatus('idle')
    }
  }

  async function handleSubmit() {
    setSubmitError('')
    setSubmitStatus('submitting')
    try {
      const payload = buildGasPayload(store)
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { ok?: boolean; pdfUrl?: string; fileName?: string; error?: string }
      if (!res.ok || !json.ok) {
        const raw = (json.error || (lang === 'ko' ? '제출에 실패했습니다.' : 'Submit failed')).toString()
        const lower = raw.toLowerCase()
        setSubmitError(
          lower === 'unauthorized' || lower.includes('unauthorized') ? t('gasUnauthorized', lang) : raw
        )
        setSubmitStatus('idle')
        return
      }
      const now = new Date().toISOString()
      const entry: LocalSubmission = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        pdfUrl: json.pdfUrl || '#',
        fileName: json.fileName || 'HASS.pdf',
        createdAt: now,
        usageDate: now.slice(0, 10),
      }
      const prev = loadStore()
      updateStore({
        localSubmissions: [entry, ...(prev.localSubmissions || [])],
      })
      setStore(loadStore())
      setSubmitStatus('done')
    } catch {
      setSubmitError(lang === 'ko' ? '네트워크 오류' : 'Network error')
      setSubmitStatus('idle')
    }
  }

  if (submitStatus === 'done') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '32px 24px', textAlign: 'center', gap: 20 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 28,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(16,185,129,0.35)',
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M8 20l9 9 15-15" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{t('submitted', lang)}</h2>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            {lang === 'ko' ? 'Google 시트/드라이브로 PDF가 생성되었습니다. 내 서류에서 확인하세요.' : 'PDF was generated. Check My documents.'}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => router.push('/documents')} style={{ maxWidth: 320, width: '100%' }}>
          {t('myDocuments', lang)}
        </button>
        <button type="button" className="btn-ghost" onClick={() => router.push('/home')} style={{ color: '#9ca3af' }}>
          {t('home', lang)}
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => router.push('/review')} className="btn-ghost" style={{ padding: 8, flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M14 5l-6 6 6 6" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t('pdfTitle', lang)}</h2>
          </div>
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
            {t('step', lang)} 6
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="bottom-safe">

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>
              {lang === 'ko' ? '제출 요약' : 'Submission summary'}
            </h3>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#374151' }}>
            <p style={{ margin: 0 }}>{t('profileTitle', lang)}: {store.profile?.applicant_name || '—'}</p>
            <p style={{ margin: 0 }}>
              {t('registeredAtLabel', lang)}:{' '}
              {store.managementSurvey?.registered_at
                ? (() => {
                    try {
                      return new Date(store.managementSurvey.registered_at).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')
                    } catch {
                      return store.managementSurvey.registered_at
                    }
                  })()
                : '—'}
            </p>
            <p style={{ margin: 0 }}>{t('screeningTitle', lang)}: {store.vaccineScreening?.guardian_name || '—'}</p>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: pdfStatus === 'done' ? '#d1fae5' : '#fff7ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {pdfStatus === 'done' ? '✅' : '📄'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{t('generatePdf', lang)}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
                {lang === 'ko' ? '기기에 요약 PDF 저장 (선택)' : 'Download summary PDF (optional)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={pdfStatus === 'done' ? 'btn-secondary' : 'btn-primary'}
            onClick={() => void handleGeneratePdf()}
            disabled={pdfStatus === 'generating'}
          >
            {pdfStatus === 'generating' ? (lang === 'ko' ? 'PDF 생성 중...' : 'Generating...') :
             pdfStatus === 'done' ? (lang === 'ko' ? '다시 다운로드' : 'Download again') :
             t('generatePdf', lang)}
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: '#fff7ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>📤</div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{t('submitToAdmin', lang)}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
                {lang === 'ko' ? 'Apps Script(code.gs)로 시트·PDF 생성' : 'Google Apps Script (Sheets + PDF)'}
              </p>
            </div>
          </div>
          {submitError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{submitError}</div>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSubmit()}
            disabled={submitStatus === 'submitting'}
          >
            {submitStatus === 'submitting' ? t('submitting', lang) : t('submitToAdmin', lang)}
          </button>
        </div>

        <div style={{ paddingBottom: 16 }}>
          <button type="button" className="btn-ghost" onClick={() => router.push('/home')} style={{ width: '100%', textAlign: 'center', color: '#9ca3af' }}>
            ← {t('home', lang)}
          </button>
        </div>
      </div>
    </div>
  )
}
