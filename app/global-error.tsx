'use client'

/**
 * 루트 레이아웃까지 실패할 때 표시. 전역 스타일시트 없이도 읽을 수 있게 최소 인라인 스타일만 사용합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          fontFamily: "'Noto Sans KR', system-ui, sans-serif",
          background: 'linear-gradient(165deg, #fff7ed 0%, #f9fafb 40%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#fff',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 12px 40px rgba(234, 88, 12, 0.15)',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #fb923c, #ea580c)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            H
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#111827' }}>
            문제가 발생했어요
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
            {error.message || '앱을 다시 불러오거나 잠시 후 시도해 주세요.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 14,
                border: 'none',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
              }}
            >
              다시 시도
            </button>
            <a
              href="/"
              style={{
                display: 'block',
                padding: '14px 20px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fafafa',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              처음으로
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
