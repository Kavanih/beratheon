import type { EquipSlot, Equipped, InvItem } from '@/components/GearStation'

const SAVE_KEY = 'beratheon_player_v1'
const UI_KEY = 'beratheon_gear_ui_v1'

export interface SavedEquipRef {
  id: string
  kind: InvItem['kind']
  target: EquipSlot
}

export interface PlayerSave {
  equipped: Partial<Record<EquipSlot, SavedEquipRef>>
}

export interface GearUiSave {
  focusSlot: EquipSlot | null
  sel: { id: string; kind: InvItem['kind']; from?: EquipSlot } | null
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

export function loadPlayerSave(): PlayerSave | null {
  return readJson<PlayerSave>(SAVE_KEY)
}

export function savePlayerSave(equipped: Equipped) {
  const payload: PlayerSave = {
    equipped: Object.fromEntries(
      Object.entries(equipped).map(([slot, item]) => [
        slot,
        item ? { id: item.id, kind: item.kind, target: item.target } : undefined,
      ])
    ) as PlayerSave['equipped'],
  }
  writeJson(SAVE_KEY, payload)
}

export function hydrateEquipped(
  refs: Partial<Record<EquipSlot, SavedEquipRef>> | undefined,
  catalog: InvItem[]
): Equipped {
  if (!refs) return {}
  const byKey = new Map(catalog.map((it) => [`${it.kind}:${it.id}`, it]))
  const out: Equipped = {}
  for (const [slot, ref] of Object.entries(refs) as [EquipSlot, SavedEquipRef][]) {
    const item = byKey.get(`${ref.kind}:${ref.id}`)
    if (item && item.target === ref.target) out[slot] = item
  }
  return out
}

export function loadGearUi(): GearUiSave | null {
  return readJson<GearUiSave>(UI_KEY)
}

export function saveGearUi(ui: GearUiSave) {
  writeJson(UI_KEY, ui)
}
