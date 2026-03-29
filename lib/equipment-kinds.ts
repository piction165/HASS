import type { EquipmentKind } from './store'
import type { Lang } from './i18n'

export const EQUIPMENT_KINDS: EquipmentKind[] = ['dump_truck', 'forklift', 'lift_truck', 'grab', 'other']

const LABELS: Record<EquipmentKind, Record<Lang, string>> = {
  dump_truck: { ko: '덤프트럭', en: 'Dump truck', mn: 'Самосвал', tl: 'Dump truck' },
  forklift: { ko: '포크레인', en: 'Forklift', mn: 'Ачигч', tl: 'Forklift' },
  lift_truck: { ko: '지게차', en: 'Lift truck', mn: 'Өргөгч', tl: 'Lift truck' },
  grab: { ko: '집게차량', en: 'Grab truck', mn: 'Шанагатай', tl: 'Grab' },
  other: { ko: '기타', en: 'Other', mn: 'Бусад', tl: 'Iba pa' },
}

export function equipmentKindLabel(kind: EquipmentKind, lang: Lang): string {
  return LABELS[kind]?.[lang] ?? LABELS[kind]?.ko ?? kind
}
