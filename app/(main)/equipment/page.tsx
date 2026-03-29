'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStore, updateStore, type EquipmentItem, type EquipmentKind } from '@/lib/store'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { EQUIPMENT_KINDS, equipmentKindLabel } from '@/lib/equipment-kinds'
import { t, type Lang } from '@/lib/i18n'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
}

export default function EquipmentPage() {
  const router = useRouter()
  const lang = (loadStore().language || 'ko') as Lang
  const [kind, setKind] = useState<EquipmentKind>('dump_truck')
  const [plate, setPlate] = useState('')

  async function addItem() {
    if (!plate.trim()) return
    const item: EquipmentItem = {
      id: newId(),
      kind,
      plate: plate.trim(),
      usage_date: new Date().toISOString().slice(0, 10),
    }
    const s = loadStore()
    const next = [...(s.equipment || []), item]
    updateStore({ equipment: next })
    setPlate('')

    const supabase = createBrowserSupabaseClient()
    const uid = s.user?.supabaseId
    if (supabase && uid) {
      await supabase.from('equipment').insert({ user_id: uid, kind, plate: item.plate })
    }

    router.push('/records?tab=equipment')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" className="btn-ghost" style={{ padding: 8 }} onClick={() => router.push('/home')} aria-label="back">
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ea580c' }}>{t('equipmentTitle', lang)}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {lang === 'ko' ? '장비 종류 · 차량 번호' : 'Type & plate'}
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }} className="bottom-safe">
        <div style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e5e7eb' }}>
          <label className="form-label">{t('equipmentKind', lang)}</label>
          <select className="select-field" value={kind} onChange={(e) => setKind(e.target.value as EquipmentKind)}>
            {EQUIPMENT_KINDS.map((k) => (
              <option key={k} value={k}>{equipmentKindLabel(k, lang)}</option>
            ))}
          </select>
          <label className="form-label" style={{ marginTop: 14 }}>{t('equipmentPlate', lang)}</label>
          <input className="input-field" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="12가 3456" />
          <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={() => void addItem()}>
            {t('equipmentAdd', lang)}
          </button>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {t('equipmentViewInRecords', lang)}
          </p>
        </div>
      </div>
    </div>
  )
}
