'use client'

import { useEffect, useState } from 'react'
import { getClaimedUsername, validateUsername } from '@/lib/username'
import { USERNAME_MINT_PRICE_STX } from '@/lib/usernameChain'

export default function ClaimUsernameModal({
  open,
  onClose,
  walletAddress,
  hasUsernameNft,
  onClaim,
  onClaimed,
}: {
  open: boolean
  onClose: () => void
  walletAddress: string | null
  hasUsernameNft?: boolean
  onClaim: (name: string) => Promise<{ ok: true; username: string; txId?: string } | { ok: false; error: string }>
  onClaimed: (name: string, txId?: string) => void
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const claimed = walletAddress ? getClaimedUsername(walletAddress) : null

  useEffect(() => {
    if (!open) return
    setDraft('')
    setError(null)
    setPending(false)
  }, [open, walletAddress])

  if (!open) return null

  const submit = async () => {
    if (!walletAddress) {
      setError('Connect your wallet first')
      return
    }
    const validation = validateUsername(draft)
    if (validation) {
      setError(validation)
      return
    }
    setPending(true)
    setError(null)
    try {
      const result = await onClaim(draft)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onClaimed(result.username, result.txId)
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="battle-frame w-full max-w-[360px] p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="claim-username-title"
      >
        <div id="claim-username-title" className="font-pixel text-[14px] text-gold text-shadow-pixel">
          {claimed || hasUsernameNft ? 'Your Hero Name' : 'Claim Hero Name'}
        </div>
        <p className="mt-2 font-silk text-[11px] leading-5 text-parchment/75">
          {claimed || hasUsernameNft
            ? 'Your username NFT is linked to this wallet.'
            : `Mint a username NFT on Stacks (${USERNAME_MINT_PRICE_STX} STX). One name per wallet.`}
        </p>

        {!walletAddress ? (
          <p className="mt-4 font-silk text-[11px] text-hp">Connect Xverse or Leather in the top bar first.</p>
        ) : claimed ? (
          <div className="mt-4 rounded border border-gold bg-[#2a2418] px-3 py-3 font-pixel text-[13px] lowercase text-parchment">
            {claimed}
          </div>
        ) : hasUsernameNft ? (
          <p className="mt-4 font-silk text-[11px] text-gold">
            Username NFT detected on-chain. If your name is missing here, reclaim the same name locally after verifying
            on Hiro Explorer.
          </p>
        ) : (
          <>
            <label className="mt-4 block font-silk text-[10px] uppercase tracking-wide text-parchment/70">
              Username (3–20 chars, stored lowercase on-chain)
            </label>
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && !pending && submit()}
              placeholder="e.g. aether_knight"
              disabled={pending}
              className="mt-1.5 w-full rounded border-2 border-edge bg-[#1a1410] px-3 py-2.5 font-silk text-[13px] text-gold focus:border-gold focus:outline-none disabled:opacity-50"
              autoFocus
            />
            {error && <p className="mt-2 font-silk text-[10px] text-hp">{error}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="pixel-btn pixel-btn-gold mt-4 w-full px-3 py-2.5 font-silk text-[12px] disabled:opacity-50"
            >
              {pending ? 'Confirm in wallet…' : `Mint Username · ${USERNAME_MINT_PRICE_STX} STX`}
            </button>
          </>
        )}

        <button type="button" onClick={onClose} className="pixel-btn mt-3 w-full px-3 py-2 font-silk text-[11px]">
          Close
        </button>
      </div>
    </div>
  )
}
