'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** 예전 작업자 명단 경로 — 이제 내 서류로 이동합니다. */
export default function RosterRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/documents')
  }, [router])
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      Redirecting…
    </div>
  )
}
