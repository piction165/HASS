import { NextResponse } from 'next/server'
import { mapOcrJsonToProfile } from '@/lib/ocr-map'

/**
 * OCR 제공사마다 요청/응답 형식이 다릅니다.
 * - OCR_API_URL: POST 엔드포인트 (기본: JSON { image / imageBase64 / base64 })
 * - OCR_API_KEY: Authorization Bearer 로 전달
 * - OCR_BODY_WRAPPER: 비어 있지 않으면 본문을 { [wrapper]: image } 형태로 감쌈 (예: document)
 */
export async function POST(request: Request) {
  const endpoint = process.env.OCR_API_URL?.trim()
  const apiKey = process.env.OCR_API_KEY?.trim()
  if (!endpoint || !apiKey) {
    return NextResponse.json(
      { ok: false, error: 'OCR_API_URL 및 OCR_API_KEY 를 .env 에 설정해 주세요.' },
      { status: 503 }
    )
  }

  let imageBase64: string
  try {
    const json = (await request.json()) as { imageBase64?: string }
    imageBase64 = (json.imageBase64 || '').replace(/^data:image\/\w+;base64,/, '')
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!imageBase64) {
    return NextResponse.json({ ok: false, error: 'imageBase64 가 필요합니다.' }, { status: 400 })
  }

  const wrapper = process.env.OCR_BODY_WRAPPER?.trim()
  const bodyObj = wrapper
    ? { [wrapper]: imageBase64 }
    : { image: imageBase64, imageBase64, base64: imageBase64 }

  const ocrRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(bodyObj),
  })

  const text = await ocrRes.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'OCR API 응답이 JSON이 아닙니다', status: ocrRes.status, raw: text.slice(0, 400) },
      { status: 502 }
    )
  }

  if (!ocrRes.ok) {
    return NextResponse.json(
      { ok: false, error: 'OCR API 오류', status: ocrRes.status, detail: raw },
      { status: 502 }
    )
  }

  const profilePatch = mapOcrJsonToProfile(raw)
  return NextResponse.json({ ok: true, profilePatch, raw })
}
