'use client'

import { Coin, EnergyBolt } from './pixel'
import { useWallet } from '@/context/WalletProvider'
import { LEATHER_PROVIDER_ID } from '@/lib/stacksConnectClient'

export default function TopBar({
  energy,
  maxEnergy,
  gold,
  title,
}: {
  energy: number
  maxEnergy: number
  gold: number
  title: string
}) {
  const { connected, shortAddress, connecting, connectWallet, disconnectWallet, connectError, walletReady } =
    useWallet()
  const pct = Math.max(0, Math.min(100, (energy / maxEnergy) * 100))

  return (
    <div className="z-30 flex items-center justify-between gap-3 border-b-2 border-wood-dark bg-ink/95 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="font-silk text-[10px] uppercase tracking-widest text-parchment">{title}</span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {connected ? (
          <>
            <button
              type="button"
              onClick={disconnectWallet}
              className="label-chip px-2 py-1 font-silk text-[10px] text-gold"
              title="Disconnect wallet"
            >
              {shortAddress}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex flex-wrap items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => connectWallet()}
                disabled={connecting || !walletReady}
                className="pixel-btn pixel-btn-gold px-3 py-1.5 font-silk text-[10px]"
                title="Opens Xverse extension directly (Testnet)"
              >
                {!walletReady ? 'Loading…' : connecting ? 'Approve in Xverse…' : 'Connect Xverse'}
              </button>
              <button
                type="button"
                onClick={() => connectWallet({ providerId: LEATHER_PROVIDER_ID })}
                disabled={connecting || !walletReady}
                className="pixel-btn px-2 py-1.5 font-silk text-[9px]"
                title="Connect Leather wallet"
              >
                Leather
              </button>
            </div>
            {connectError && (
              <span className="max-w-[280px] text-right font-silk text-[8px] text-hp" title={connectError}>
                {connectError}
              </span>
            )}
          </div>
        )}
        <div className="label-chip flex items-center gap-2 px-2 py-1.5">
          <EnergyBolt size={14} />
          <div className="relative h-2.5 w-28 overflow-hidden rounded-[2px] border border-wood bg-ink">
            <div
              className="h-full"
              style={{ width: `${pct}%`, background: 'linear-gradient(180deg,#f0e6a8,#e8c547 60%,#c9a227)' }}
            />
          </div>
          <span className="font-silk text-[9px] text-parchment">
            {energy}/{maxEnergy}
          </span>
        </div>
        <div className="label-chip flex items-center gap-1.5 px-2 py-1.5" title="Off-chain game gold">
          <Coin size={14} />
          <span className="font-silk text-[10px] text-gold">{gold.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
