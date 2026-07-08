'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ContractCallExecutor } from 'flowvault-sdk'
import { DEFAULT_CONTRACTS, FlowVault, microToToken } from 'flowvault-sdk'
import { callContract } from '@/lib/chainCalls'
import { createReadOnlyVault, createVaultClient, formatVaultState } from '@/lib/flowvault'
import { claimUsername as persistUsername, displayNameFor, getClaimedUsername } from '@/lib/username'
import { fetchOwnerTokenId, mintUsernameNft } from '@/lib/usernameChain'
import {
  connectStacksWallet,
  ensureStacksConnectReady,
  loadStacksConnect,
  NETWORK,
  readPersistedWalletAddress,
  resolveStxAddress,
} from '@/lib/stacksConnectClient'
import { clearWalletSession, saveWalletSession } from '@/lib/walletSession'

export interface VaultSnapshot {
  total: string
  locked: string
  available: string
  hasLock: boolean
  blocksRemaining: number
}

type ClaimResult = { ok: true; username: string; txId?: string } | { ok: false; error: string }

interface WalletCtx {
  address: string | null
  shortAddress: string | null
  displayName: string
  claimedUsername: string | null
  hasUsernameNft: boolean
  claimPlayerName: (name: string) => Promise<ClaimResult>
  connecting: boolean
  walletReady: boolean
  connected: boolean
  connectError: string | null
  connectWallet: (options?: { useModal?: boolean; providerId?: string }) => Promise<boolean>
  disconnectWallet: () => void
  vault: FlowVault | null
  vaultSnapshot: VaultSnapshot | null
  refreshVault: () => Promise<VaultSnapshot | null>
  contractLabel: string
}

const WalletContext = createContext<WalletCtx>({
  address: null,
  shortAddress: null,
  displayName: 'guest',
  claimedUsername: null,
  hasUsernameNft: false,
  claimPlayerName: async () => ({ ok: false, error: 'Not connected' }),
  connecting: false,
  walletReady: false,
  connected: false,
  connectError: null,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  vault: null,
  vaultSnapshot: null,
  refreshVault: async () => null,
  contractLabel: '',
})

function shortAddr(address: string) {
  return `${address.slice(0, 5)}…${address.slice(-4)}`
}

const contracts = DEFAULT_CONTRACTS.testnet

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [walletReady, setWalletReady] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [vaultSnapshot, setVaultSnapshot] = useState<VaultSnapshot | null>(null)
  const [claimedUsername, setClaimedUsername] = useState<string | null>(null)
  const [hasUsernameNft, setHasUsernameNft] = useState(false)
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

  useEffect(() => {
    if (sessionBootstrapped.current) return
    sessionBootstrapped.current = true
    const saved = readPersistedWalletAddress()
    if (saved) {
      setAddress(saved)
      setClaimedUsername(getClaimedUsername(saved))
      syncUsernameFromChain(saved).catch(() => {})
    }
  }, [syncUsernameFromChain])

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

  const shortAddressValue = address ? shortAddr(address) : null
  const displayName = displayNameFor(address, shortAddressValue)
  const contractLabel = `${contracts.contractAddress}.${contracts.contractName}`

  useEffect(() => {
    setClaimedUsername(getClaimedUsername(address))
    if (address) syncUsernameFromChain(address).catch(() => {})
  }, [address, syncUsernameFromChain])

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
      }
    } catch {
      /* no session */
    }
  }, [syncUsernameFromChain])

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
  }, [applyAddress, syncUsernameFromChain])

  const disconnectWallet = useCallback(() => {
    loadStacksConnect()
      .then(({ disconnect }) => disconnect())
      .catch(() => {})
    clearWalletSession()
    setAddress(null)
    setVaultSnapshot(null)
    setHasUsernameNft(false)
    setConnectError(null)
  }, [])

  const vault = useMemo(() => {
    if (!address) return null

    const executor: ContractCallExecutor = async (call) =>
      callContract({
        contractId: `${call.contractAddress}.${call.contractName}`,
        functionName: call.functionName,
        functionArgs: call.functionArgs,
        address,
        postConditionMode: String(call.postConditionMode ?? 'allow').toLowerCase().includes('deny')
          ? 'deny'
          : 'allow',
      })

    return createVaultClient(address, executor)
  }, [address])

  const refreshVault = useCallback(async (): Promise<VaultSnapshot | null> => {
    if (!address) {
      setVaultSnapshot(null)
      return null
    }
    const ro = createReadOnlyVault()
    const state = await ro.getVaultState(address)
    const formatted = formatVaultState(state)
    const snapshot: VaultSnapshot = {
      total: formatted.total,
      locked: formatted.locked,
      available: formatted.available,
      hasLock: formatted.hasLock,
      blocksRemaining: formatted.blocksRemaining,
    }
    setVaultSnapshot(snapshot)
    return snapshot
  }, [address])

  useEffect(() => {
    refreshVault().catch(() => setVaultSnapshot(null))
  }, [refreshVault])

  return (
    <WalletContext.Provider
      value={{
        address,
        shortAddress: shortAddressValue,
        displayName,
        claimedUsername,
        hasUsernameNft,
        claimPlayerName,
        connecting,
        walletReady,
        connected: !!address,
        connectError,
        connectWallet,
        disconnectWallet,
        vault,
        vaultSnapshot,
        refreshVault,
        contractLabel,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}

export function formatUsdcx(micro: number | string) {
  return microToToken(String(micro))
}
