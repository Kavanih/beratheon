const SESSION_KEY = 'beratheon_wallet_v1'

export interface WalletSession {
  address: string
  providerId?: string
  connectedAt: number
}

function isStacksAddress(address: string) {
  return address.startsWith('ST') || address.startsWith('SP') || address.startsWith('SM')
}

export function loadWalletSession(): WalletSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WalletSession
    if (!parsed.address || !isStacksAddress(parsed.address)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveWalletSession(session: Pick<WalletSession, 'address' | 'providerId'>) {
  if (typeof window === 'undefined') return
  const payload: WalletSession = {
    address: session.address,
    providerId: session.providerId,
    connectedAt: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function clearWalletSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

/** Best-effort sync read before Stacks Connect finishes loading. */
export function readPersistedWalletAddress(): string | null {
  return loadWalletSession()?.address ?? null
}
