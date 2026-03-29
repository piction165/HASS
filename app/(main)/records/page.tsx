'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStore, updateStore, type EquipmentItem, type LocalSubmission } from '@/lib/store'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { equipmentKindLabel } from '@/lib/equipment-kinds'
import { t, type Lang } from '@/lib/i18n'

type Tab = 'survey' | 'equipment'

type Row = {
  id: string
  pdf_url: string
  file_name: string | null
  created_at: string
  /** yyyy-mm-dd */
  usageDate: string
  source: 'remote' | 'local'
  localEntryId?: string
}

function isoToYmd(iso: string): string {
  if (!iso || typeof iso !== 'string') return ''
  const d = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

async function downloadPdfFile(url: string, fileName: string) {
  const name = fileName || 'HASS.pdf'
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch')
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export default function RecordsPage() {
  const router = useRouter()
  const lang = (loadStore().language || 'ko') as Lang
  const [tab, setTab] = useState<Tab>('survey')
  const [rows, setRows] = useState<Row[]>([])
  const [equipList, setEquipList] = useState<EquipmentItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refreshSurvey = useCallback(async () => {
    const st = loadStore()
    const usageMap = st.submissionUsageDates || {}
    const local = (st.localSubmissions || []) as LocalSubmission[]
    const localRows: Row[] = local.map((l) => {
      const created_at = l.createdAt
      const usageDate =
        typeof l.usageDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.usageDate)
          ? l.usageDate
          : isoToYmd(created_at)
      return {
        id: `l-${l.id}`,
        localEntryId: l.id,
        pdf_url: l.pdfUrl,
        file_name: l.fileName,
        created_at,
        usageDate,
        source: 'local' as const,
      }
    })

    const supabase = createBrowserSupabaseClient()
    let remoteRows: Row[] = []
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('submissions')
          .select('id, pdf_url, file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        remoteRows =
          (data as { id: string; pdf_url: string; file_name: string | null; created_at: string }[] | null)?.map((r) => {
            const y = usageMap[r.id]
            const usageDate =
              typeof y === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(y) ? y : isoToYmd(r.created_at)
            return {
              id: r.id,
              pdf_url: r.pdf_url,
              file_name: r.file_name,
              created_at: r.created_at,
              usageDate,
              source: 'remote' as const,
            }
          }) ?? []
      }
    }

    const merged = [...remoteRows, ...localRows].sort((a, b) => {
      if (a.usageDate !== b.usageDate) return b.usageDate.localeCompare(a.usageDate)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setRows(merged)
    setSelected(new Set())
    setLoading(false)
  }, [])

  const refreshEquipment = useCallback(() => {
    setEquipList([...(loadStore().equipment || [])])
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('tab') === 'equipment') {
      setTab('equipment')
    }
  }, [])

  useEffect(() => {
    void refreshSurvey()
  }, [refreshSurvey])

  useEffect(() => {
    if (tab === 'equipment') refreshEquipment()
  }, [tab, refreshEquipment])

  const allIds = rows.map((r) => r.id)
  const allSelected = rows.length > 0 && selected.size === rows.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    const remoteIds = [...selected].filter((id) => !id.startsWith('l-'))
    const localIds = [...selected].filter((id) => id.startsWith('l-')).map((id) => id.slice(2))

    if (remoteIds.length) {
      const supabase = createBrowserSupabaseClient()
      if (supabase) {
        await fetch('/api/submissions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: remoteIds }),
        })
      }
    }

    if (localIds.length) {
      const s = loadStore()
      updateStore({
        localSubmissions: s.localSubmissions.filter((l) => !localIds.includes(l.id)),
      })
    }

    void refreshSurvey()
  }

  function removeEquipment(id: string) {
    const s = loadStore()
    updateStore({ equipment: s.equipment.filter((e) => e.id !== id) })
    refreshEquipment()
  }

  async function shareRow(url: string, title: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      alert(lang === 'ko' ? '링크가 복사되었습니다.' : 'Link copied.')
    } catch {
      /* ignore */
    }
  }

  function patchSurveyUsageDate(row: Row, usageDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(usageDate)) return
    const s = loadStore()
    if (row.source === 'local' && row.localEntryId) {
      updateStore({
        localSubmissions: s.localSubmissions.map((x) =>
          x.id === row.localEntryId ? { ...x, usageDate } : x
        ),
      })
    } else if (row.source === 'remote') {
      updateStore({
        submissionUsageDates: { ...s.submissionUsageDates, [row.id]: usageDate },
      })
    }
    void refreshSurvey()
  }

  function patchEquipmentUsage(id: string, usage_date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(usage_date)) return
    const s = loadStore()
    updateStore({
      equipment: s.equipment.map((x) => (x.id === id ? { ...x, usage_date } : x)),
    })
    refreshEquipment()
  }

  async function shareEquipmentRow(e: EquipmentItem) {
    const title = `${equipmentKindLabel(e.kind, lang)} · ${e.plate}`
    const text = `${t('equipmentUsageDate', lang)}: ${e.usage_date || '—'}`
    try {
      if (navigator.share) {
        await navigator.share({ title, text })
        return
      }
      await navigator.clipboard.writeText(`${title}\n${text}`)
      alert(lang === 'ko' ? '복사되었습니다.' : 'Copied.')
    } catch {
      /* ignore */
    }
  }

  function downloadEquipmentRow(e: EquipmentItem) {
    const lines = [
      equipmentKindLabel(e.kind, lang),
      `${t('equipmentPlate', lang)}: ${e.plate}`,
      `${t('equipmentUsageDate', lang)}: ${e.usage_date || '—'}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `equipment_${(e.plate || 'record').replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="page-header" style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ea580c' }}>{t('recordsTitle', lang)}</h1>
        <div
          className="login-tabs"
          role="tablist"
          aria-label="records"
          style={{ marginTop: 14 }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'survey'}
            className={`login-tab ${tab === 'survey' ? 'login-tab-active' : ''}`}
            onClick={() => setTab('survey')}
          >
            {t('recordsTabSurvey', lang)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'equipment'}
            className={`login-tab ${tab === 'equipment' ? 'login-tab-active' : ''}`}
            onClick={() => setTab('equipment')}
          >
            {t('recordsTabEquipment', lang)}
          </button>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#6b7280' }}>
          {tab === 'survey' ? t('recordsSurveyHelp', lang) : t('recordsEquipmentHelp', lang)}
        </p>
      </div>

      {tab === 'survey' && (
        <>
          <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '10px 16px', fontSize: 14 }} onClick={toggleAll}>
              {t('selectAll', lang)}
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 16px', fontSize: 14, opacity: selected.size ? 1 : 0.45 }}
              disabled={!selected.size}
              onClick={() => void deleteSelected()}
            >
              {t('deleteSelected', lang)}
            </button>
          </div>

          <div style={{ padding: '0 20px 24px' }} className="bottom-safe">
            {loading && <p style={{ color: '#9ca3af' }}>…</p>}
            {!loading && rows.length === 0 && (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>{t('noDocuments', lang)}</p>
            )}
            {rows.map((r) => (
              <div
                key={r.id}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  border: selected.has(r.id) ? '2px solid #f97316' : '1px solid #e5e7eb',
                  padding: '14px 16px',
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    style={{ width: 20, height: 20, marginTop: 4, accentColor: '#ea580c', flexShrink: 0 }}
                    aria-label="select"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#111827', wordBreak: 'break-word' }}>
                      {r.file_name || 'PDF'}
                    </p>
                    <label className="form-label" style={{ marginTop: 10, marginBottom: 4, fontSize: 12, color: '#6b7280' }}>
                      {t('recordsUsageDate', lang)}
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={r.usageDate}
                      onChange={(e) => patchSurveyUsageDate(r, e.target.value)}
                      style={{ maxWidth: '100%', padding: '10px 12px', fontSize: 15 }}
                    />
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
                      {lang === 'ko' ? '제출 시각' : 'Submitted'}:{' '}
                      {new Date(r.created_at).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                      {r.source === 'local' ? ' · local' : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingLeft: 32 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, padding: '12px 14px', fontSize: 14, fontWeight: 700 }}
                    onClick={() => void downloadPdfFile(r.pdf_url, r.file_name || 'HASS.pdf')}
                  >
                    {t('recordsDownload', lang)}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, padding: '12px 14px', fontSize: 14, fontWeight: 700 }}
                    onClick={() => void shareRow(r.pdf_url, r.file_name || 'HASS')}
                  >
                    {t('share', lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'equipment' && (
        <div style={{ padding: '16px 20px 24px' }} className="bottom-safe">
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', marginBottom: 16 }}
            onClick={() => router.push('/equipment')}
          >
            {t('recordsAddEquipment', lang)}
          </button>
          {equipList.length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>{t('noEquipmentInRecords', lang)}</p>
          )}
          {equipList.map((e) => (
            <div
              key={e.id}
              style={{
                background: 'white',
                borderRadius: 14,
                border: '1px solid #e5e7eb',
                padding: '14px 16px',
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#111827' }}>{equipmentKindLabel(e.kind, lang)}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 15, color: '#374151' }}>{e.plate}</p>
                </div>
                <button type="button" className="btn-ghost" style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', flexShrink: 0 }} onClick={() => removeEquipment(e.id)}>
                  {t('recordsRemoveItem', lang)}
                </button>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 4, fontSize: 12, color: '#6b7280' }}>
                  {t('equipmentUsageDate', lang)}
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={e.usage_date}
                  onChange={(ev) => patchEquipmentUsage(e.id, ev.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 15 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px 14px', fontSize: 14, fontWeight: 700 }}
                  onClick={() => downloadEquipmentRow(e)}
                >
                  {t('recordsDownload', lang)}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px 14px', fontSize: 14, fontWeight: 700 }}
                  onClick={() => void shareEquipmentRow(e)}
                >
                  {t('share', lang)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
