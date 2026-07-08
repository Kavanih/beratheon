const STORE_KEY = 'beratheon_usernames_v1'

interface UsernameStore {
  byWallet: Record<string, string>
  taken: Record<string, string>
}

function normalizeWallet(address: string) {
  return address.trim().toUpperCase()
}

function normalizeUsername(name: string) {
  return name.trim().toLowerCase()
}

function readStore(): UsernameStore {
  if (typeof window === 'undefined') return { byWallet: {}, taken: {} }
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return { byWallet: {}, taken: {} }
    const parsed = JSON.parse(raw) as UsernameStore
    return {
      byWallet: parsed.byWallet ?? {},
      taken: parsed.taken ?? {},
    }
  } catch {
    return { byWallet: {}, taken: {} }
  }
}

function writeStore(store: UsernameStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function validateUsername(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 3) return 'Username must be at least 3 characters'
  if (trimmed.length > 20) return 'Username must be 20 characters or fewer'
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Use letters, numbers, and underscores only'
  return null
}

/** Lowercase form stored on-chain in username-nft.clar */
export function toChainUsername(name: string): string {
  return name.trim().toLowerCase()
}

export function getClaimedUsername(walletAddress: string | null | undefined): string | null {
  if (!walletAddress) return null
  const store = readStore()
  return store.byWallet[normalizeWallet(walletAddress)] ?? null
}

export function isUsernameTaken(name: string, exceptWallet?: string | null): boolean {
  const key = normalizeUsername(name)
  const owner = readStore().taken[key]
  if (!owner) return false
  if (exceptWallet && owner === normalizeWallet(exceptWallet)) return false
  return true
}

export function claimUsername(walletAddress: string, name: string): { ok: true; username: string } | { ok: false; error: string } {
  const err = validateUsername(name)
  if (err) return { ok: false, error: err }

  const wallet = normalizeWallet(walletAddress)
  const store = readStore()
  const existing = store.byWallet[wallet]
  if (existing) return { ok: false, error: 'This wallet already claimed a username' }

  const key = normalizeUsername(name)
  if (store.taken[key]) return { ok: false, error: 'Username is already taken' }

  const username = name.trim()
  store.byWallet[wallet] = username
  store.taken[key] = wallet
  writeStore(store)
  return { ok: true, username }
}

export function displayNameFor(
  walletAddress: string | null | undefined,
  shortAddress: string | null | undefined
): string {
  const claimed = getClaimedUsername(walletAddress)
  if (claimed) return claimed
  if (shortAddress) return shortAddress
  if (walletAddress) return `${walletAddress.slice(0, 6)}…`
  return 'guest'
}
