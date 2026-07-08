/** Hero energy — max 240, regens 10 per hour (full in 24h). */
export const MAX_ENERGY = 240
export const ENERGY_PER_HOUR = 10
const MS_PER_ENERGY = (60 * 60 * 1000) / ENERGY_PER_HOUR
const STORAGE_KEY = 'beratheon_energy_v1'

interface EnergyState {
  value: number
  updatedAt: number
}

function walletKey(address: string | null | undefined) {
  return address?.toUpperCase() ?? 'guest'
}

function readStore(): Record<string, EnergyState> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, EnergyState>
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, EnergyState>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function tick(state: EnergyState): EnergyState {
  const now = Date.now()
  const elapsed = now - state.updatedAt
  const gained = Math.floor(elapsed / MS_PER_ENERGY)
  if (gained <= 0) return state
  return {
    value: Math.min(MAX_ENERGY, state.value + gained),
    updatedAt: state.updatedAt + gained * MS_PER_ENERGY,
  }
}

/** Current energy after applying passive regen. */
export function getEnergy(address: string | null | undefined): number {
  const key = walletKey(address)
  const store = readStore()
  const raw = store[key]
  if (!raw) return MAX_ENERGY
  const next = tick(raw)
  if (next.value !== raw.value || next.updatedAt !== raw.updatedAt) {
    store[key] = next
    writeStore(store)
  }
  return next.value
}

/** Spend energy and persist (also applies regen first). */
export function spendEnergy(address: string | null | undefined, amount: number): number {
  const key = walletKey(address)
  const store = readStore()
  const current = getEnergy(address)
  const next = Math.max(0, current - amount)
  store[key] = { value: next, updatedAt: Date.now() }
  writeStore(store)
  return next
}

/** Ms until next +1 energy (for UI hints). */
export function msUntilNextEnergy(address: string | null | undefined): number {
  const key = walletKey(address)
  const store = readStore()
  const raw = store[key]
  if (!raw) return 0
  const ticked = tick(raw)
  if (ticked.value >= MAX_ENERGY) return 0
  return MS_PER_ENERGY - (Date.now() - ticked.updatedAt)
}
