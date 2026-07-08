/**
 * Browser-only Stacks Connect bootstrap + connect helpers.
 * Xverse must be called directly from the user's click (not via the Connect modal),
 * otherwise the extension popup is blocked.
 * @see https://docs.xverse.app/sats-connect/connecting-to-the-wallet/connect-to-xverse-wallet
 */

import {
  loadWalletSession,
  readPersistedWalletAddress,
  saveWalletSession,
} from './walletSession'

const NETWORK = 'testnet' as const
const CONNECT_TIMEOUT_MS = 45_000

export const XVERSE_PROVIDER_ID = 'XverseProviders.BitcoinProvider'
export const LEATHER_PROVIDER_ID = 'LeatherProvider'

let initPromise: Promise<void> | null = null

export function ensureStacksConnectReady(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Stacks Connect runs in the browser only'))
  }
  if (!initPromise) {
    initPromise = import('@stacks/connect-ui/loader').then(({ defineCustomElements }) => {
      defineCustomElements()
    })
  }
  return initPromise
}

export async function loadStacksConnect() {
  await ensureStacksConnectReady()
  return import('@stacks/connect')
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out. Open the Xverse extension icon in your toolbar, set network to Testnet, then click Connect again.`
        )
      )
    }, ms)
    promise
      .then((v) => {
        clearTimeout(timer)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(timer)
        reject(e)
      })
  })
}

function isStacksAddress(address: string) {
  return address.startsWith('ST') || address.startsWith('SP') || address.startsWith('SM')
}

export function resolveStxAddress(addresses: { address: string; symbol?: string; purpose?: string }[] | undefined) {
  if (!addresses?.length) return null
  const stacksPurpose = addresses.find((a) => a.purpose === 'stacks')
  if (stacksPurpose?.address && isStacksAddress(stacksPurpose.address)) return stacksPurpose.address
  return (
    addresses.find((a) => a.symbol === 'STX')?.address ??
    addresses.find((a) => isStacksAddress(a.address))?.address ??
    null
  )
}

export function readStoredStxAddress(): string | null {
  const ours = readPersistedWalletAddress()
  if (ours) return ours
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('@stacks/connect')
    if (!raw) return null
    const data = JSON.parse(raw) as { addresses?: { stx?: { address: string }[] } }
    return data.addresses?.stx?.[0]?.address ?? null
  } catch {
    return null
  }
}

async function persistWalletConnection(address: string, providerId?: string) {
  saveWalletSession({ address, providerId })
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      '@stacks/connect',
      JSON.stringify({
        addresses: {
          stx: [{ address, symbol: 'STX' }],
          btc: [],
        },
        version: '1.0.0',
        updatedAt: Date.now(),
      })
    )
  } catch {
    /* quota / private mode */
  }
}

type WalletProviderLike = {
  request?: (method: string, params?: object) => Promise<unknown>
}

function parseXverseWalletConnect(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as {
    status?: string
    result?: { addresses?: { address: string; purpose?: string; symbol?: string }[] }
    addresses?: { address: string; purpose?: string; symbol?: string }[]
  }
  if (payload.status === 'error') return null
  const addresses = payload.result?.addresses ?? payload.addresses
  return resolveStxAddress(addresses)
}

async function getProvider(providerId: string): Promise<WalletProviderLike> {
  const { getProviderFromId } = await import('@stacks/connect-ui')
  const provider = getProviderFromId(providerId) as WalletProviderLike | null
  if (!provider?.request) {
    throw new Error(
      providerId.includes('Xverse')
        ? 'Xverse extension not detected. Install Xverse, refresh this page, then try again.'
        : `${providerId} not detected. Install the wallet extension and refresh.`
    )
  }
  return provider
}

/** Direct provider call — keeps the browser user-gesture chain for Xverse popups. */
async function connectViaProvider(providerId: string): Promise<{ address: string; via: 'direct' }> {
  const { setSelectedProviderId } = await import('@stacks/connect-ui')
  const { request, getLocalStorage } = await loadStacksConnect()
  const provider = await getProvider(providerId)
  setSelectedProviderId(providerId)

  if (providerId.includes('Xverse')) {
    const wc = await withTimeout(
      provider.request!('wallet_connect', {
        addresses: ['stacks'],
        network: 'Testnet',
        message: 'Connect Beratheon on Stacks testnet',
      }),
      CONNECT_TIMEOUT_MS,
      'Xverse connection'
    )
    const fromWc = parseXverseWalletConnect(wc)
    if (fromWc) {
      await persistWalletConnection(fromWc, providerId)
      return { address: fromWc, via: 'direct' }
    }
  }

  const res = await withTimeout(
    request(
      { provider: provider as never, enableOverrides: true, enableLocalStorage: true, persistWalletSelect: true },
      'getAddresses',
      { network: NETWORK }
    ),
    CONNECT_TIMEOUT_MS,
    'Wallet connection'
  )

  const addr =
    resolveStxAddress(res.addresses) ?? getLocalStorage()?.addresses?.stx?.[0]?.address ?? null
  if (!addr) {
    throw new Error('No Stacks testnet address returned. Switch your wallet to Testnet and try again.')
  }
  await persistWalletConnection(addr, providerId)
  return { address: addr, via: 'direct' }
}

export interface ConnectResult {
  address: string
  via: 'direct' | 'modal' | 'cache'
}

export interface ConnectOptions {
  /** Open the Stacks Connect wallet picker modal (Leather, etc.) */
  useModal?: boolean
  /** Connect to a specific extension by provider id */
  providerId?: string
}

/**
 * Connect wallet. Default: Xverse direct (no modal) so the extension popup opens.
 */
export async function connectStacksWallet(options: ConnectOptions = {}): Promise<ConnectResult> {
  await ensureStacksConnectReady()

  if (!options.useModal && !options.providerId) {
    const cached = readStoredStxAddress() ?? loadWalletSession()?.address
    if (cached && isStacksAddress(cached)) {
      return { address: cached, via: 'cache' }
    }
  }

  if (options.useModal) {
    const { request, getLocalStorage } = await loadStacksConnect()
    const res = await withTimeout(
      request(
        {
          forceWalletSelect: true,
          persistWalletSelect: true,
          enableLocalStorage: true,
          enableOverrides: true,
          approvedProviderIds: [XVERSE_PROVIDER_ID, LEATHER_PROVIDER_ID],
        },
        'getAddresses',
        { network: NETWORK }
      ),
      CONNECT_TIMEOUT_MS,
      'Wallet picker'
    )
    const addr =
      resolveStxAddress(res.addresses) ?? getLocalStorage()?.addresses?.stx?.[0]?.address ?? null
    if (!addr) throw new Error('No Stacks testnet address returned.')
    await persistWalletConnection(addr)
    return { address: addr, via: 'modal' }
  }

  const providerId = options.providerId ?? XVERSE_PROVIDER_ID
  return connectViaProvider(providerId)
}

export { NETWORK, readPersistedWalletAddress }
