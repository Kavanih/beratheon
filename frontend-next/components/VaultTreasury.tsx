'use client'

import { useCallback, useEffect, useState } from 'react'
import { tokenToMicro, microToToken } from 'flowvault-sdk'
import { useWallet } from '@/context/WalletProvider'
import {
  applyStrategy,
  applyStrategyAndDeposit,
  createReadOnlyVault,
  depositToVault,
  depositRoutePreview,
  explorerTxUrl,
  flowvaultErrorMessage,
  FLOWVAULT_CONTRACT_ID,
  GAME_STRATEGIES,
  strategyOverridesForDeposit,
  USDCX_CONTRACT_ID,
  validateDepositAgainstRules,
  type TxProof,
  type VaultStrategyId,
} from '@/lib/flowvault'
import { DUNGEON_ESCROW_USDCX, holdVsLockHint } from '@/lib/vaultGate'

export default function VaultTreasury({ onMessage }: { onMessage: (m: string) => void }) {
  const {
    address,
    connected,
    connecting,
    connectWallet,
    disconnectWallet,
    vault,
    vaultSnapshot,
    refreshVault,
    contractLabel,
    connectError,
    walletReady,
  } = useWallet()
  const [strategyId, setStrategyId] = useState<VaultStrategyId>('dungeon_escrow')
  const [depositAmount, setDepositAmount] = useState('2')
  const [withdrawAmount, setWithdrawAmount] = useState('1')
  const [busy, setBusy] = useState(false)
  const [routingSummary, setRoutingSummary] = useState<string | null>(null)
  const [minDepositHint, setMinDepositHint] = useState<string | null>(null)
  const [proofs, setProofs] = useState<TxProof[]>([])

  useEffect(() => {
    try {
      setProofs(JSON.parse(localStorage.getItem('beratheon_tx_proofs') ?? '[]'))
    } catch {
      setProofs([])
    }
  }, [])

  const strategy = GAME_STRATEGIES.find((s) => s.id === strategyId)!

  const refresh = useCallback(async () => {
    if (!address) return
    await refreshVault()
    const ro = createReadOnlyVault()
    const rules = await ro.getRoutingRules(address)
    if (!rules || (Number(rules.lockAmount) === 0 && Number(rules.splitAmount) === 0)) {
      setRoutingSummary('No routing rules — deposits stay 100% on HOLD')
      setMinDepositHint(null)
      return
    }
    const parts: string[] = []
    const lockAmt = Number(rules.lockAmount)
    const splitAmt = Number(rules.splitAmount)
    const minUsdc = microToToken(String(BigInt(rules.lockAmount) + BigInt(rules.splitAmount)))
    setMinDepositHint(`Minimum deposit with current rules: ${minUsdc} USDCx`)
    if (lockAmt > 0) {
      parts.push(`LOCK ${microToToken(String(rules.lockAmount))} USDCx until block ${rules.lockUntilBlock}`)
    }
    if (splitAmt > 0 && rules.splitAddress) {
      parts.push(`SPLIT ${microToToken(String(rules.splitAmount))} USDCx → ${rules.splitAddress.slice(0, 8)}…`)
    }
    setRoutingSummary(parts.join(' · ') || null)
  }, [address, refreshVault])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const saveProof = (proof: TxProof) => {
    const next = [proof, ...proofs].slice(0, 12)
    setProofs(next)
    localStorage.setItem('beratheon_tx_proofs', JSON.stringify(next))
  }

  const runStrategy = async () => {
    if (!vault || !address) {
      onMessage('Connect your Stacks wallet first')
      return
    }
    setBusy(true)
    try {
      onMessage('Setting strategy — confirm in wallet, then waiting for on-chain confirmation…')
      const overrides = strategyOverridesForDeposit(strategyId, depositAmount)
      const result = await applyStrategy(vault, address, strategyId, overrides, { waitForConfirm: true })
      saveProof({
        txId: result.strategyTxId,
        action: `Strategy (${strategy.name})`,
        strategy: strategyId,
        explorerUrl: result.explorerUrl,
        at: Date.now(),
      })
      onMessage(`Strategy confirmed on-chain — you can deposit now`)
      await refresh()
    } catch (e: unknown) {
      onMessage(flowvaultErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const runDeposit = async () => {
    if (!vault || !address) {
      onMessage('Connect your Stacks wallet first')
      return
    }
    setBusy(true)
    try {
      const ro = createReadOnlyVault()
      const rules = await ro.getRoutingRules(address)
      const validation = validateDepositAgainstRules(depositAmount, rules)
      if (validation) {
        onMessage(validation)
        return
      }
      const result = await depositToVault(vault, depositAmount)
      saveProof({
        txId: result.depositTxId,
        action: `Deposit ${depositAmount} USDCx`,
        strategy: strategyId,
        explorerUrl: result.explorerUrl,
        at: Date.now(),
      })
      onMessage(`Deposited ${depositAmount} USDCx — check explorer for held/locked/split`)
      await refresh()
    } catch (e: unknown) {
      onMessage(flowvaultErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const runWithdraw = async () => {
    if (!vault || !address) return
    setBusy(true)
    try {
      const tx = await vault.withdraw(tokenToMicro(withdrawAmount))
      saveProof({
        txId: tx.txId,
        action: 'Withdraw unlocked',
        explorerUrl: explorerTxUrl(tx.txId),
        at: Date.now(),
      })
      onMessage(`Withdrew ${withdrawAmount} USDCx`)
      await refresh()
    } catch (e: unknown) {
      onMessage(e instanceof Error ? e.message : 'Withdraw failed')
    } finally {
      setBusy(false)
    }
  }

  const runClearRules = async () => {
    if (!vault) return
    setBusy(true)
    try {
      const tx = await vault.clearRoutingRules()
      saveProof({ txId: tx.txId, action: 'Clear routing rules', explorerUrl: explorerTxUrl(tx.txId), at: Date.now() })
      onMessage('Routing rules cleared')
      await refresh()
    } catch (e: unknown) {
      onMessage(e instanceof Error ? e.message : 'Clear failed')
    } finally {
      setBusy(false)
    }
  }

  const runDungeonUnlock = async () => {
    if (!vault || !address) {
      onMessage('Connect your Stacks wallet first')
      return
    }
    setStrategyId('dungeon_escrow')
    setDepositAmount('2')
    setBusy(true)
    try {
      onMessage('Unlock Dungetron — confirm strategy tx, then deposit tx in your wallet…')
      const overrides = strategyOverridesForDeposit('dungeon_escrow', '2')
      const result = await applyStrategyAndDeposit(vault, address, 'dungeon_escrow', '2', overrides)
      saveProof({
        txId: result.strategyTxId,
        action: 'Strategy (Dungeon Run Escrow)',
        strategy: 'dungeon_escrow',
        explorerUrl: explorerTxUrl(result.strategyTxId),
        at: Date.now(),
      })
      saveProof({
        txId: result.depositTxId,
        action: 'Deposit 2 USDCx (dungeon unlock)',
        strategy: 'dungeon_escrow',
        explorerUrl: explorerTxUrl(result.depositTxId),
        at: Date.now(),
      })
      onMessage('Done — at least 1 USDCx should now be LOCKED. Return to Dungetron and Enter.')
      await refresh()
    } catch (e: unknown) {
      onMessage(flowvaultErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const holdLockHint =
    connected && vaultSnapshot ? holdVsLockHint(vaultSnapshot.total, vaultSnapshot.locked) : ''

  return (
    <div className="vault-treasury flex h-full w-full flex-col gap-3 overflow-y-auto p-3 text-parchment">
      <div className="pixel-panel flex flex-wrap items-center gap-3 px-4 py-3">
        <div>
          <div className="font-pixel text-[18px] text-gold text-shadow-pixel">BERATHEON VAULT</div>
          <div className="font-silk text-[13px] text-parchment/70">FlowVault v2 on Stacks testnet — Lock · Split · Hold</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {connected ? (
            <>
              <span className="label-chip max-w-[200px] truncate px-2 py-1 font-silk text-[13px] text-gold" title={address ?? ''}>
                {address}
              </span>
              <button onClick={disconnectWallet} className="pixel-btn px-3 py-1.5 font-silk text-[13px]">
                Disconnect
              </button>
            </>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => connectWallet()}
                disabled={connecting || !walletReady}
                className="pixel-btn pixel-btn-gold px-4 py-2 font-silk text-[14px]"
              >
                {!walletReady ? 'Loading wallet…' : connecting ? 'Approve in Xverse…' : 'Connect Xverse'}
              </button>
              <button
                onClick={() => connectWallet({ useModal: true })}
                disabled={connecting || !walletReady}
                className="pixel-btn px-3 py-2 font-silk text-[12px]"
              >
                Other wallet
              </button>
              {connectError && (
                <span className="max-w-[280px] text-right font-silk text-[11px] text-hp">{connectError}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pixel-panel px-4 py-2.5 font-silk text-[12px] leading-5 text-parchment/65">
        <div className="break-all">
          Contract: <span className="text-gold/90">{contractLabel || FLOWVAULT_CONTRACT_ID}</span>
        </div>
        <div className="mt-1 break-all">
          Token: <span className="text-gold/90">{USDCX_CONTRACT_ID}</span>
        </div>
      </div>

      {holdLockHint && (
        <div className="pixel-panel flex flex-wrap items-center gap-3 border-hp/40 px-4 py-3">
          <p className="flex-1 font-silk text-[12px] leading-5 text-hp">{holdLockHint}</p>
          <button
            onClick={runDungeonUnlock}
            disabled={busy || !connected}
            className="pixel-btn pixel-btn-gold px-4 py-2 font-silk text-[12px]"
          >
            {busy ? 'Signing…' : `Unlock Dungetron (${DUNGEON_ESCROW_USDCX} USDCx lock)`}
          </button>
        </div>
      )}

      <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          <div className="pixel-panel p-4">
            <div className="mb-3 font-silk text-[14px] uppercase tracking-wide text-parchment/75">
              Choose what your deposit unlocks
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {GAME_STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStrategyId(s.id)
                    setDepositAmount(s.exampleDeposit)
                  }}
                  className={`rounded border-2 p-3 text-left transition ${
                    strategyId === s.id
                      ? 'border-gold bg-[#2a2418] shadow-[inset_0_0_0_1px_rgba(201,162,39,0.35)]'
                      : 'border-edge bg-[#0a1622] hover:border-wood-light'
                  }`}
                >
                  <div className="font-silk text-[16px] font-bold text-gold">{s.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.primitives.map((p) => (
                      <span key={p} className="label-chip px-1.5 py-0.5 font-silk text-[11px] text-gold">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 font-silk text-[12px] leading-5 text-gold/90">{s.unlocks}</p>
                  <p className="mt-2 font-silk text-[13px] leading-5 text-parchment/80">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-panel p-4">
            <div className="mb-2 font-silk text-[16px] font-bold text-gold">{strategy.name}</div>
            <p className="mb-1 font-silk text-[12px] text-gold/90">{strategy.unlocks}</p>
            {routingSummary && (
              <p className="mb-3 rounded border border-wood-light bg-[#1a1410] px-3 py-2 font-silk text-[13px] text-gold">
                On-chain rules: {routingSummary}
              </p>
            )}

            {minDepositHint && (
              <p className="mb-3 rounded border border-gold/40 bg-[#2a2418] px-3 py-2 font-silk text-[13px] text-gold">
                {minDepositHint}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-silk text-[13px] text-parchment/75">Step 1 — Set routing rules</label>
                <button
                  onClick={runStrategy}
                  disabled={busy || !connected}
                  className="pixel-btn w-full px-3 py-3 font-silk text-[14px]"
                >
                  {busy ? 'Signing…' : 'Set Strategy (wallet tx)'}
                </button>
                <p className="mt-2 font-silk text-[12px] leading-4 text-parchment/60">
                  Writes LOCK/SPLIT config to {FLOWVAULT_CONTRACT_ID.split('.')[1]}. Wait for confirmation before depositing.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block font-silk text-[13px] text-parchment/75">Step 2 — Deposit USDCx</label>
                <input
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mb-2 w-full rounded border-2 border-edge bg-[#1a1410] px-3 py-2.5 font-silk text-[16px] text-gold focus:border-gold focus:outline-none"
                />
                <button
                  onClick={runDeposit}
                  disabled={busy || !connected}
                  className="pixel-btn pixel-btn-gold w-full px-3 py-3 font-silk text-[14px]"
                >
                  {busy ? 'Signing…' : 'Deposit USDCx'}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-silk text-[13px] text-parchment/75">Withdraw unlocked (HOLD)</label>
                <input
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded border-2 border-edge bg-[#1a1410] px-3 py-2.5 font-silk text-[16px] text-gold focus:border-gold focus:outline-none"
                />
                <button
                  onClick={runWithdraw}
                  disabled={busy || !connected}
                  className="pixel-btn mt-2 w-full px-3 py-3 font-silk text-[14px]"
                >
                  Withdraw
                </button>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={runClearRules}
                  disabled={busy || !connected}
                  className="pixel-btn w-full px-3 py-2.5 font-silk text-[13px]"
                >
                  Clear Routing Rules
                </button>
              </div>
            </div>
          </div>

          <div className="pixel-panel p-4">
            <div className="mb-2 font-silk text-[16px] uppercase tracking-wide text-parchment/75">
              How this deposit splits ({strategy.name})
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-edge bg-[#1a1410] p-3 font-silk text-[14px] leading-7 text-parchment/90">
{`${depositRoutePreview(strategyId, depositAmount)}

Step 1: Set Strategy writes these rules on-chain.
Step 2: Deposit moves USDCx from wallet → vault using those rules.

No strategy set? Everything stays on HOLD (withdraw anytime).
Strategy tx failed before deposit? Same — 100% HOLD, no lock/split.`}
            </pre>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="pixel-panel p-4">
            <div className="mb-2 font-silk text-[13px] uppercase tracking-wide text-parchment/75">Vault State</div>
            {!connected ? (
              <div className="grid h-24 place-items-center font-silk text-[14px] text-parchment/55">
                Connect Xverse or Leather to view
              </div>
            ) : vaultSnapshot ? (
              <div className="flex flex-col gap-2 font-silk text-[14px]">
                <Row label="Total" value={`${vaultSnapshot.total} USDCx`} />
                <Row label="Locked" value={`${vaultSnapshot.locked} USDCx`} accent="#e8b84a" />
                <Row label="Available (HOLD)" value={`${vaultSnapshot.available} USDCx`} accent="#c9a227" />
                {vaultSnapshot.hasLock && (
                  <Row label="Unlock in" value={`${vaultSnapshot.blocksRemaining} blocks`} accent="#ffce4a" />
                )}
                <button onClick={() => refresh()} className="pixel-btn mt-1 px-3 py-1.5 font-silk text-[13px]">
                  Refresh
                </button>
              </div>
            ) : (
              <div className="font-silk text-[14px] text-parchment/55">Loading…</div>
            )}
          </div>

          <div className="pixel-panel flex-1 p-4">
            <div className="mb-2 font-silk text-[13px] uppercase tracking-wide text-parchment/75">
              On-Chain Proof (for bounty)
            </div>
            {proofs.length === 0 ? (
              <div className="font-silk text-[14px] leading-5 text-parchment/55">
                Set strategy + deposit on testnet — tx links appear here for your submission form.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {proofs.map((p) => (
                  <a
                    key={p.txId}
                    href={p.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-edge bg-[#1a1410] p-2.5 transition hover:border-gold"
                  >
                    <div className="font-silk text-[14px] text-parchment">{p.action}</div>
                    <div className="truncate font-silk text-[12px] text-gold">{p.txId}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-edge bg-[#1a1410] px-3 py-2 font-silk text-[14px]">
      <span className="text-parchment/70">{label}</span>
      <span style={{ color: accent ?? '#c9a227' }}>{value}</span>
    </div>
  )
}
