import { RootRedirect } from './root-redirect'

/** 서버에서도 HTML에 스플래시가 내려가므로, JS 지연·세션 대기 중에도 빈 화면이 아닙니다. */
export default function RootPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f9fafb',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: 24,
          maxWidth: 320,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
          }}
        >
          <span style={{ color: 'white', fontWeight: 800, fontSize: 28, letterSpacing: '-1px' }}>H</span>
        </div>
        <p style={{ color: '#111827', fontSize: 16, fontWeight: 700, margin: 0 }}>HASS</p>
        <p style={{ color: '#4b5563', fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
          잠시만 기다려 주세요. 곧 언어 선택 또는 로그인 화면으로 이동합니다.
        </p>
        <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Loading…</p>
      </div>
      <RootRedirect />
    </div>
  )
}
