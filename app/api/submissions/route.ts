import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ids?: string[] }
  try {
    body = (await request.json()) as { ids?: string[] }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const ids = (body.ids || []).filter(Boolean)
  if (!ids.length) {
    return NextResponse.json({ ok: false, error: 'No ids' }, { status: 400 })
  }

  const { error } = await supabase.from('submissions').delete().in('id', ids).eq('user_id', user.id)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
