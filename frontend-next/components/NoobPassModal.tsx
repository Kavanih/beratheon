'use client'

import { useEffect, useState } from 'react'
import { NOOB_PASS_MAX_SUPPLY } from '@/lib/noobPassChain'

export default function NoobPassModal({
  open,
  onClose,
  walletAddress,
  hasNoobPass,
  onMint,
  onMinted,
}: {
  open: boolean
  onClose: () => void
  walletAddress: string | null
  hasNoobPass?: boolean
  onMint: () => Promise<{ ok: true; txId?: string } | { ok: false; error: string }>
  onMinted: (txId?: string) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setPending(false)
  }, [open, walletAddress])

  if (!open) return null

  const submit = async () => {
    if (!walletAddress) {
      setError('Connect your wallet first')
      return
    }
    setPending(true)
    setError(null)
    try {
      const result = await onMint()
      if (!result.ok) {
        setError(result.error)
        return
      }
      onMinted(result.txId)
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
        aria-labelledby="noob-pass-title"
      >
        <div id="noob-pass-title" className="font-pixel text-[14px] text-gold text-shadow-pixel">
          {hasNoobPass ? 'Cub Pass' : 'Mint Cub Pass'}
        </div>
        <p className="mt-2 font-silk text-[11px] leading-5 text-parchment/75">
          {hasNoobPass
            ? 'Your wallet holds a Beratheon Cub Pass — early supporter NFT on Stacks.'
            : `Free mint on testnet. ${NOOB_PASS_MAX_SUPPLY} total supply — one per wallet. Shows you are part of the Beratheon community.`}
        </p>

        {!walletAddress ? (
          <p className="mt-4 font-silk text-[11px] text-hp">Connect Xverse or Leather in the top bar first.</p>
        ) : hasNoobPass ? (
          <p className="mt-4 font-silk text-[11px] text-gold">Cub Pass linked to this wallet.</p>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="pixel-btn pixel-btn-gold mt-4 w-full px-4 py-3 font-silk text-[12px]"
          >
            {pending ? 'Confirm in wallet…' : 'Mint Cub Pass (free)'}
          </button>
        )}

        {error && <p className="mt-3 font-silk text-[11px] text-hp">{error}</p>}

        <button type="button" onClick={onClose} className="pixel-btn mt-4 w-full px-3 py-2 font-silk text-[11px]">
          Close
        </button>
      </div>
    </div>
  )
}
