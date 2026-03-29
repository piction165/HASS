'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStore, type LocalSubmission } from '@/lib/store'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { t, type Lang } from '@/lib/i18n'

type RemoteRow = { id: string; pdf_url: string; file_name: string | null; created_at: string }

export default function DocumentsPage() {
  const router = useRouter()
  const [store, setStore] = useState(loadStore)
  const lang = (store.language || 'ko') as Lang
  const [remote, setRemote] = useState<RemoteRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = loadStore()
    if (!s.user) {
      router.replace('/login')
      return
    }
    setStore(s)

    const supabase = createBrowserSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('submissions')
        .select('id, pdf_url, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setRemote((data as RemoteRow[]) || [])
      setLoading(false)
    })()
  }, [router])

  const local = store.localSubmissions || []
  const merged: { key: string; pdfUrl: string; fileName: string; createdAt: string; source: 'remote' | 'local' }[] = [
    ...remote.map((r) => ({
      key: `r-${r.id}`,
      pdfUrl: r.pdf_url,
      fileName: r.file_name || 'PDF',
      createdAt: r.created_at,
      source: 'remote' as const,
    })),
    ...local.map((l: LocalSubmission) => ({
      key: `l-${l.id}`,
      pdfUrl: l.pdfUrl,
      fileName: l.fileName,
      createdAt: l.createdAt,
      source: 'local' as const,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t('documentsTitle', lang)}</h2>
          </div>
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
            {t('step', lang)} 2
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px' }} className="bottom-safe">
        {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>{lang === 'ko' ? '불러오는 중…' : 'Loading…'}</p>}

        {!loading && merged.length === 0 && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>{t('noDocuments', lang)}</p>
            <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/survey')}>
              {t('survey', lang)}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {merged.map((item) => (
            <div
              key={item.key}
              style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#fff7ed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
              }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.fileName}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
                  {new Date(item.createdAt).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                  {item.source === 'local' && (
                    <span style={{ marginLeft: 8, color: '#f97316' }}>· local</span>
                  )}
                </p>
              </div>
              <a
                href={item.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ flexShrink: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                {t('openPdf', lang)}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
