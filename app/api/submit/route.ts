import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const gasUrl = process.env.HASS_APPS_SCRIPT_URL?.trim()
  const secret = process.env.HASS_APPS_SCRIPT_SECRET?.trim()
  if (!gasUrl || !secret) {
    const missing = [
      !gasUrl && 'HASS_APPS_SCRIPT_URL',
      !secret && 'HASS_APPS_SCRIPT_SECRET',
    ]
      .filter(Boolean)
      .join(', ')
    return NextResponse.json(
      {
        ok: false,
        error: `서버 환경 변수가 없습니다: ${missing}. 프로젝트 루트의 .env.local 에 두 값을 넣고 dev 서버를 다시 시작하세요.`,
      },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const payload = { ...body, secret }

  const gasRes = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await gasRes.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Apps Script 응답이 JSON이 아닙니다', raw: text.slice(0, 500) },
      { status: 502 }
    )
  }

  const obj = data as { ok?: boolean; pdfUrl?: string; fileName?: string; error?: string }
  if (!gasRes.ok || !obj.ok) {
    return NextResponse.json(
      { ok: false, error: obj.error || 'Apps Script 오류', detail: obj },
      { status: gasRes.ok ? 400 : 502 }
    )
  }

  const supabase = await createServerSupabaseClient()
  if (supabase && obj.pdfUrl) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('submissions').insert({
          user_id: user.id,
          pdf_url: obj.pdfUrl,
          file_name: obj.fileName ?? null,
        })
      }
    } catch {
      /* RLS/스키마 미적용 시에도 Apps Script 제출은 성공으로 처리 */
    }
  }

  return NextResponse.json({
    ok: true,
    pdfId: (obj as { pdfId?: string }).pdfId,
    pdfUrl: obj.pdfUrl,
    fileName: obj.fileName,
    filledCells: (obj as { filledCells?: unknown }).filledCells,
  })
}
