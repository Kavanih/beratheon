/**
 * Beratheon × FlowVault integration layer.
 *
 * Dungeon entry: LOCK 1 USDCx as run escrow; remainder stays on HOLD (withdraw anytime).
 */
import {
  DEFAULT_CONTRACTS,
  FlowVault,
  microToToken,
  tokenToMicro,
  type ContractCallExecutor,
  type DepositResult,
  type RoutingRules,
  type VaultState,
} from 'flowvault-sdk'
import { DUNGEON_ESCROW_USDCX, UNDERHAUL_ESCROW_USDCX } from '@/lib/vaultGate'
import { BERATHEON_TREASURY as TREASURY_FROM_CONTRACTS } from '@/lib/contracts'

export const FLOWVAULT_CONTRACT = DEFAULT_CONTRACTS.testnet
export const FLOWVAULT_CONTRACT_ID = `${FLOWVAULT_CONTRACT.contractAddress}.${FLOWVAULT_CONTRACT.contractName}`
export const USDCX_CONTRACT_ID = `${FLOWVAULT_CONTRACT.tokenContractAddress}.${FLOWVAULT_CONTRACT.tokenContractName}`
/** SIP-010 asset id used by wallet FT transfers (Hiro balance key suffix). */
export const USDCX_ASSET_ID = `${USDCX_CONTRACT_ID}::usdcx-token`

export const BERATHEON_TREASURY = TREASURY_FROM_CONTRACTS

export const CREATOR_POOL =
  process.env.NEXT_PUBLIC_CREATOR_POOL ?? 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'

export type VaultStrategyId = 'dungeon_escrow' | 'underhaul_escrow' | 'market_split' | 'custom'

export interface GameStrategy {
  id: VaultStrategyId
  name: string
  desc: string
  /** One-line player benefit */
  unlocks: string
  /** Which FlowVault primitives this strategy uses */
  primitives: ('Lock' | 'Split' | 'Hold')[]
  /** Example deposit amount in USDCx for UI */
  exampleDeposit: string
  buildRules: (ctx: StrategyContext) => Promise<RoutingRules>
}

export interface StrategyContext {
  vault: FlowVault
  senderAddress: string
  /** Optional overrides from UI sliders */
  lockUsdc?: string
  splitUsdc?: string
  lockBlocks?: number
  splitAddress?: string
}

export interface TxProof {
  txId: string
  action: string
  strategy?: VaultStrategyId
  explorerUrl: string
  at: number
}

const BLOCKS_PER_DAY = 144
const MARKET_TREASURY_SPLIT_BPS = 1000 // 10% of each deposit seeds treasury / ops

export const GAME_STRATEGIES: GameStrategy[] = [
  {
    id: 'dungeon_escrow',
    name: 'Dungeon Run Escrow',
    desc: `Entry stake for Dungetron 5000 (Normal). ${DUNGEON_ESCROW_USDCX} USDCx LOCKs per deposit (~1 day), rest stays on HOLD — withdraw anytime. Still your money; it just proves you paid to play.`,
    unlocks: `Unlocks Dungetron Normal when LOCK ≥ ${DUNGEON_ESCROW_USDCX} USDCx`,
    primitives: ['Lock', 'Hold'],
    exampleDeposit: '2',
    async buildRules(ctx) {
      const current = await ctx.vault.getCurrentBlockHeight(ctx.senderAddress)
      const lockAmount = tokenToMicro(ctx.lockUsdc ?? String(DUNGEON_ESCROW_USDCX))
      const lockUntilBlock = current + (ctx.lockBlocks ?? BLOCKS_PER_DAY)
      return {
        lockAmount,
        lockUntilBlock,
        splitAddress: null,
        splitAmount: tokenToMicro('0'),
      }
    },
  },
  {
    id: 'underhaul_escrow',
    name: 'Underhaul Entry Vault',
    desc: `Premium entry for Dungetron: Underhaul. ${UNDERHAUL_ESCROW_USDCX} USDCx LOCKs per deposit (~1 day). Stack LOCK across deposits until you reach ${UNDERHAUL_ESCROW_USDCX} USDCx total locked.`,
    unlocks: `Unlocks Underhaul when total LOCK ≥ ${UNDERHAUL_ESCROW_USDCX} USDCx`,
    primitives: ['Lock', 'Hold'],
    exampleDeposit: '3',
    async buildRules(ctx) {
      const current = await ctx.vault.getCurrentBlockHeight(ctx.senderAddress)
      const lockAmount = tokenToMicro(ctx.lockUsdc ?? String(UNDERHAUL_ESCROW_USDCX))
      const lockUntilBlock = current + (ctx.lockBlocks ?? BLOCKS_PER_DAY)
      return {
        lockAmount,
        lockUntilBlock,
        splitAddress: null,
        splitAmount: tokenToMicro('0'),
      }
    },
  },
  {
    id: 'market_split',
    name: 'Gigamarket Revenue Split',
    desc: 'Support Beratheon + Gigamarket liquidity. 10% of each deposit SPLITs to treasury (project ops). The rest stays on HOLD as your supporter stake — fee share when on-chain marketplace settlement goes live.',
    unlocks: 'HOLD balance = your liquidity stake · fee share tier on Gigamarket (coming with marketplace.clar)',
    primitives: ['Split', 'Hold'],
    exampleDeposit: '10',
    async buildRules(ctx) {
      const splitAmount = tokenToMicro(ctx.splitUsdc ?? '1')
      return {
        lockAmount: tokenToMicro('0'),
        lockUntilBlock: 0,
        splitAddress: ctx.splitAddress ?? BERATHEON_TREASURY,
        splitAmount,
      }
    },
  },
]

/** Create a FlowVault client wired to the connected Stacks wallet. */
export function createVaultClient(
  senderAddress: string,
  executor: ContractCallExecutor
): FlowVault {
  return new FlowVault({
    network: 'testnet',
    senderAddress,
    contractCallExecutor: executor,
  })
}

/** Read-only vault client (no wallet needed). */
export function createReadOnlyVault(): FlowVault {
  return new FlowVault({ network: 'testnet' })
}

export function explorerTxUrl(txid: string) {
  return `https://explorer.hiro.so/txid/${txid}?chain=testnet`
}

const HIRO_TX_API = 'https://api.testnet.hiro.so/extended/v1/tx'

/** Poll Hiro until a tx succeeds or fails on-chain. */
export async function waitForTxConfirmation(
  txId: string,
  { timeoutMs = 120_000, intervalMs = 4_000 } = {}
): Promise<'success' | 'abort_by_response' | 'failed'> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await fetch(`${HIRO_TX_API}/${txId}`)
    if (res.ok) {
      const data = (await res.json()) as { tx_status?: string; tx_result?: { repr?: string } }
      const status = data.tx_status ?? ''
      if (status.includes('success')) return 'success'
      if (status.includes('abort_by_response') || status.includes('failed')) return 'failed'
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Transaction confirmation timed out — check the explorer link')
}

/** Wait until routing rules appear on-chain (or timeout). */
export async function waitForRoutingRules(
  userAddress: string,
  expected?: { lockAmount?: bigint; splitAmount?: bigint },
  { timeoutMs = 120_000, intervalMs = 4_000 } = {}
) {
  const ro = createReadOnlyVault()
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const rules = await ro.getRoutingRules(userAddress)
    if (rules) {
      const lock = BigInt(rules.lockAmount ?? 0)
      const split = BigInt(rules.splitAmount ?? 0)
      if (lock === 0n && split === 0n) {
        await new Promise((r) => setTimeout(r, intervalMs))
        continue
      }
      if (!expected) return rules
      if (lock === (expected.lockAmount ?? 0n) && split === (expected.splitAmount ?? 0n)) return rules
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Routing rules not visible yet — wait for strategy tx to confirm, then try deposit')
}

// ----------------------------------------------------------------------------
// Strategy helpers
// ----------------------------------------------------------------------------

export function strategyById(id: VaultStrategyId): GameStrategy {
  return GAME_STRATEGIES.find((s) => s.id === id) ?? GAME_STRATEGIES[0]
}

/** Scale lock/split to the deposit amount so routing never exceeds deposit (avoids u1004). */
export function strategyOverridesForDeposit(
  strategyId: VaultStrategyId,
  depositUsdc: string
): Partial<Pick<StrategyContext, 'lockUsdc' | 'splitUsdc'>> {
  const d = Number(depositUsdc)
  if (!Number.isFinite(d) || d <= 0) return {}

  switch (strategyId) {
    case 'dungeon_escrow':
      return { lockUsdc: String(Math.min(DUNGEON_ESCROW_USDCX, d)) }
    case 'underhaul_escrow':
      return { lockUsdc: String(Math.min(UNDERHAUL_ESCROW_USDCX, d)) }
    case 'market_split': {
      const split = Math.max(0.01, (d * MARKET_TREASURY_SPLIT_BPS) / 10_000)
      return { splitUsdc: String(Math.min(split, d)) }
    }
    default:
      return {}
  }
}

export function minDepositFromRules(rules: RoutingRules | null): bigint {
  if (!rules) return 0n
  return BigInt(rules.lockAmount ?? 0) + BigInt(rules.splitAmount ?? 0)
}

/** Returns a user-facing error if deposit is too small for on-chain routing rules. */
export function validateDepositAgainstRules(depositUsdc: string, rules: RoutingRules | null): string | null {
  const dep = Number(depositUsdc)
  if (!Number.isFinite(dep) || dep <= 0) return 'Enter a deposit amount greater than 0'

  if (!rules) return null

  const minMicro = minDepositFromRules(rules)
  if (minMicro === 0n) return null

  const depositMicro = BigInt(tokenToMicro(depositUsdc))
  if (depositMicro < minMicro) {
    const minUsdc = microToToken(String(minMicro))
    return `Deposit must be at least ${minUsdc} USDCx — your on-chain rules LOCK/SPLIT ${minUsdc} USDCx per deposit. Increase the amount or click Set Strategy again.`
  }
  return null
}

/** Plain-language preview of where a deposit goes for the selected strategy. */
export function depositRoutePreview(strategyId: VaultStrategyId, depositUsdc: string): string {
  const d = Number(depositUsdc)
  if (!Number.isFinite(d) || d <= 0) {
    return 'Enter a deposit amount to see how it splits.'
  }

  const overrides = strategyOverridesForDeposit(strategyId, depositUsdc)
  const lock = Number(overrides.lockUsdc ?? 0)
  const split = Number(overrides.splitUsdc ?? 0)
  const hold = Math.max(0, d - lock - split)

  switch (strategyId) {
    case 'dungeon_escrow':
      return [
        `You deposit ${d} USDCx from your wallet into FlowVault.`,
        `→ ${lock} USDCx LOCK (Normal dungeon entry — timed unlock)`,
        `→ ${hold} USDCx HOLD (withdraw anytime)`,
        '',
        `Once LOCK ≥ ${DUNGEON_ESCROW_USDCX} USDCx, Dungetron Normal unlocks.`,
      ].join('\n')
    case 'underhaul_escrow':
      return [
        `You deposit ${d} USDCx from your wallet into FlowVault.`,
        `→ ${lock} USDCx LOCK (Underhaul entry — timed unlock)`,
        `→ ${hold} USDCx HOLD (withdraw anytime)`,
        '',
        `Once total LOCK ≥ ${UNDERHAUL_ESCROW_USDCX} USDCx, Underhaul unlocks.`,
      ].join('\n')
    case 'market_split':
      return [
        `You deposit ${d} USDCx from your wallet into FlowVault.`,
        `→ ${split} USDCx SPLIT (10% → Beratheon treasury / project ops)`,
        `→ ${hold} USDCx HOLD (your Gigamarket liquidity stake — withdraw anytime)`,
        '',
        'HOLD balance qualifies you for fee share when on-chain Gigamarket settlement ships.',
      ].join('\n')
    default:
      return `Deposit ${d} USDCx → 100% HOLD (no rules).`
  }
}

export function flowvaultErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('1004') || msg.includes('u1004')) {
    return 'Routing amounts exceed deposit (error 1004). Deposit must be ≥ your LOCK + SPLIT amounts. Set Strategy again after choosing deposit size.'
  }
  if (msg.includes('1002') || msg.includes('u1002')) {
    return 'Insufficient USDCx in wallet (error 1002).'
  }
  if (msg.includes('1005') || msg.includes('u1005')) {
    return 'USDCx token transfer failed (error 1005). Check wallet balance and testnet USDCx.'
  }
  return msg
}

/** Build routing rules for a game strategy (does not broadcast). */
export async function buildStrategyRules(
  vault: FlowVault,
  senderAddress: string,
  strategyId: VaultStrategyId,
  overrides?: Partial<Pick<StrategyContext, 'lockUsdc' | 'splitUsdc' | 'lockBlocks' | 'splitAddress'>>
) {
  const strategy = strategyById(strategyId)
  const ctx: StrategyContext = { vault, senderAddress, ...overrides }
  const rules = await strategy.buildRules(ctx)
  return { strategy, rules }
}

/** Broadcast routing rules to FlowVault v2 (`set-routing-rules`). */
export async function applyStrategy(
  vault: FlowVault,
  senderAddress: string,
  strategyId: VaultStrategyId,
  overrides?: Partial<Pick<StrategyContext, 'lockUsdc' | 'splitUsdc' | 'lockBlocks' | 'splitAddress'>>,
  options?: { waitForConfirm?: boolean }
) {
  const { strategy, rules } = await buildStrategyRules(vault, senderAddress, strategyId, overrides)
  const strategyTx = await vault.createStrategy(rules)
  if (options?.waitForConfirm) {
    const status = await waitForTxConfirmation(strategyTx.txId)
    if (status === 'failed') {
      throw new Error('Strategy transaction failed on-chain — routing rules were not saved')
    }
    await waitForRoutingRules(senderAddress, {
      lockAmount: BigInt(String(rules.lockAmount)),
      splitAmount: BigInt(String(rules.splitAmount)),
    })
  }
  return {
    strategy,
    rules,
    strategyTxId: strategyTx.txId,
    explorerUrl: explorerTxUrl(strategyTx.txId),
  }
}

/** Deposit USDCx after routing rules are on-chain. */
export async function depositToVault(vault: FlowVault, depositUsdc: string) {
  const depositTx = await vault.deposit(tokenToMicro(depositUsdc))
  return {
    depositTxId: depositTx.txId,
    explorerUrl: explorerTxUrl(depositTx.txId),
  }
}

/** Set strategy then deposit — two wallet signatures, waits for strategy confirm first. */
export async function applyStrategyAndDeposit(
  vault: FlowVault,
  senderAddress: string,
  strategyId: VaultStrategyId,
  depositUsdc: string,
  overrides?: Partial<Pick<StrategyContext, 'lockUsdc' | 'splitUsdc' | 'lockBlocks' | 'splitAddress'>>
) {
  const strategyResult = await applyStrategy(vault, senderAddress, strategyId, overrides, {
    waitForConfirm: true,
  })
  const depositResult = await depositToVault(vault, depositUsdc)
  return {
    ...strategyResult,
    ...depositResult,
  }
}

/** Human-readable breakdown of a deposit contract response. */
export function formatDepositBreakdown(result: DepositResult) {
  return {
    deposited: microToToken(String(result.deposited)),
    held: microToToken(String(result.held)),
    locked: microToToken(String(result.locked)),
    split: microToToken(String(result.split)),
  }
}

/** Format vault state for the UI. */
export function formatVaultState(state: VaultState) {
  return {
    total: microToToken(String(state.totalBalance)),
    locked: microToToken(String(state.lockedBalance)),
    available: microToToken(String(state.unlockedBalance)),
    lockUntilBlock: state.lockUntilBlock,
    currentBlock: state.currentBlock,
    blocksRemaining: Math.max(0, state.lockUntilBlock - state.currentBlock),
    hasLock: state.lockedBalance > 0,
    routing: state.routingRules,
  }
}
