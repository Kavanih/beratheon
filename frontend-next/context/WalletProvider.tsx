'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { claimUsername as persistUsername, displayNameFor, getClaimedUsername } from '@/lib/username'
import { fetchOwnerTokenId, mintUsernameNft } from '@/lib/usernameChain'
import { hasNoobPassOnChain, mintNoobPass } from '@/lib/noobPassChain'
import {
  connectStacksWallet,
  ensureStacksConnectReady,
  loadStacksConnect,
  NETWORK,
  readPersistedWalletAddress,
  resolveStxAddress,
} from '@/lib/stacksConnectClient'
import { clearWalletSession, saveWalletSession } from '@/lib/walletSession'

type ClaimResult = { ok: true; username: string; txId?: string } | { ok: false; error: string }
type MintPassResult = { ok: true; txId?: string } | { ok: false; error: string }

interface WalletCtx {
  address: string | null
  shortAddress: string | null
  displayName: string
  claimedUsername: string | null
  hasUsernameNft: boolean
  hasNoobPass: boolean
  claimPlayerName: (name: string) => Promise<ClaimResult>
  mintCubPass: () => Promise<MintPassResult>
  connecting: boolean
  walletReady: boolean
  connected: boolean
  connectError: string | null
  connectWallet: (options?: { useModal?: boolean; providerId?: string }) => Promise<boolean>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletCtx>({
  address: null,
  shortAddress: null,
  displayName: 'guest',
  claimedUsername: null,
  hasUsernameNft: false,
  hasNoobPass: false,
  claimPlayerName: async () => ({ ok: false, error: 'Not connected' }),
  mintCubPass: async () => ({ ok: false, error: 'Not connected' }),
  connecting: false,
  walletReady: false,
  connected: false,
  connectError: null,
  connectWallet: async () => false,
  disconnectWallet: () => {},
})

function shortAddr(address: string) {
  return `${address.slice(0, 5)}…${address.slice(-4)}`
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [walletReady, setWalletReady] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [claimedUsername, setClaimedUsername] = useState<string | null>(null)
  const [hasUsernameNft, setHasUsernameNft] = useState(false)
  const [hasNoobPass, setHasNoobPass] = useState(false)
  const connectLock = useRef(false)
  const sessionBootstrapped = useRef(false)

  const syncUsernameFromChain = useCallback(async (wallet: string) => {
    try {
      const tokenId = await fetchOwnerTokenId(wallet)
      setHasUsernameNft(tokenId != null)
      const local = getClaimedUsername(wallet)
      if (local) setClaimedUsername(local)
    } catch {
      setHasUsernameNft(false)
    }
  }, [])

  const syncNoobPassFromChain = useCallback(async (wallet: string) => {
    try {
      setHasNoobPass(await hasNoobPassOnChain(wallet))
    } catch {
      setHasNoobPass(false)
    }
  }, [])

  useEffect(() => {
    if (sessionBootstrapped.current) return
    sessionBootstrapped.current = true
    const saved = readPersistedWalletAddress()
    if (saved) {
      setAddress(saved)
      setClaimedUsername(getClaimedUsername(saved))
      syncUsernameFromChain(saved).catch(() => {})
      syncNoobPassFromChain(saved).catch(() => {})
    }
  }, [syncUsernameFromChain, syncNoobPassFromChain])

  const claimPlayerName = useCallback(
    async (name: string): Promise<ClaimResult> => {
      if (!address) return { ok: false, error: 'Connect your wallet first' }
      try {
        const { txId } = await mintUsernameNft(address, name)
        const result = persistUsername(address, name)
        if (!result.ok) return result
        setClaimedUsername(result.username)
        setHasUsernameNft(true)
        return { ok: true, username: result.username, txId }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Username mint failed' }
      }
    },
    [address]
  )

  const mintCubPass = useCallback(async (): Promise<MintPassResult> => {
    if (!address) return { ok: false, error: 'Connect your wallet first' }
    try {
      const { txId } = await mintNoobPass(address)
      setHasNoobPass(true)
      return { ok: true, txId }
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : 'Cub Pass mint failed' }
    }
  }, [address])

  const shortAddressValue = address ? shortAddr(address) : null
  const displayName = displayNameFor(address, shortAddressValue)

  useEffect(() => {
    setClaimedUsername(getClaimedUsername(address))
    if (address) syncUsernameFromChain(address).catch(() => {})
    if (address) syncNoobPassFromChain(address).catch(() => {})
  }, [address, syncUsernameFromChain, syncNoobPassFromChain])

  const applyAddress = useCallback((addr: string | null) => {
    setAddress(addr)
    if (addr) {
      saveWalletSession({ address: addr })
      setConnectError(null)
    }
  }, [])

  useEffect(() => {
    ensureStacksConnectReady()
      .then(() => setWalletReady(true))
      .catch((e: unknown) => {
        setConnectError(e instanceof Error ? e.message : 'Failed to load Stacks Connect')
      })
  }, [])

  const restoreSession = useCallback(async () => {
    const saved = readPersistedWalletAddress()
    if (saved) {
      setAddress(saved)
      setClaimedUsername(getClaimedUsername(saved))
      await syncUsernameFromChain(saved)
      await syncNoobPassFromChain(saved)
      return
    }
    try {
      const { getLocalStorage, isConnected, request } = await loadStacksConnect()
      const cached = getLocalStorage()?.addresses?.stx?.[0]?.address
      if (cached) {
        setAddress(cached)
        setClaimedUsername(getClaimedUsername(cached))
        saveWalletSession({ address: cached })
        await syncUsernameFromChain(cached)
        await syncNoobPassFromChain(cached)
        return
      }
      if (!isConnected()) return
      const res = await request('getAddresses', { network: NETWORK })
      const addr = resolveStxAddress(res.addresses) ?? getLocalStorage()?.addresses?.stx?.[0]?.address
      if (addr) {
        setAddress(addr)
        setClaimedUsername(getClaimedUsername(addr))
        saveWalletSession({ address: addr })
        await syncUsernameFromChain(addr)
        await syncNoobPassFromChain(addr)
      }
    } catch {
      /* no session */
    }
  }, [syncUsernameFromChain, syncNoobPassFromChain])

  useEffect(() => {
    if (!walletReady) return
    restoreSession()
  }, [walletReady, restoreSession])

  const connectWallet = useCallback(async (options?: { useModal?: boolean; providerId?: string }): Promise<boolean> => {
    if (connectLock.current) return false
    connectLock.current = true
    setConnecting(true)
    setConnectError(null)
    try {
      const result = await connectStacksWallet(options)
      applyAddress(result.address)
      await syncUsernameFromChain(result.address)
      await syncNoobPassFromChain(result.address)
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Wallet connection failed'
      const cancelled =
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('closed') ||
        msg.toLowerCase().includes('denied')
      if (!cancelled) {
        console.error('[Beratheon] wallet connect failed:', e)
        setConnectError(msg)
      }
      return false
    } finally {
      connectLock.current = false
      setConnecting(false)
    }
  }, [applyAddress, syncUsernameFromChain, syncNoobPassFromChain])

  const disconnectWallet = useCallback(() => {
    loadStacksConnect()
      .then(({ disconnect }) => disconnect())
      .catch(() => {})
    clearWalletSession()
    setAddress(null)
    setHasUsernameNft(false)
    setHasNoobPass(false)
    setConnectError(null)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address,
        shortAddress: shortAddressValue,
        displayName,
        claimedUsername,
        hasUsernameNft,
        hasNoobPass,
        claimPlayerName,
        mintCubPass,
        connecting,
        walletReady,
        connected: !!address,
        connectError,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}
