/** Locked USDCx required to enter Dungetron 5000 (Normal). */
export const DUNGEON_ESCROW_USDCX = 1

/** Total locked USDCx required to enter Dungetron: Underhaul. */
export const UNDERHAUL_ESCROW_USDCX = 2

/** HOLD balance treated as Gigamarket liquidity / supporter stake (fee-share tier). */
export const GIGAMARKET_MIN_STAKE_USDCX = 5

/** Estimated fee-share tier for supporters (UI only until marketplace.clar is live). */
export const GIGAMARKET_FEE_SHARE_BPS = 500 // 5% of marketplace fees, illustrative

export function parseUsdcxAmount(value: string | null | undefined): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function hasDungeonEscrow(lockedUsdcx: string | null | undefined): boolean {
  return parseUsdcxAmount(lockedUsdcx) >= DUNGEON_ESCROW_USDCX
}

export function hasUnderhaulEscrow(lockedUsdcx: string | null | undefined): boolean {
  return parseUsdcxAmount(lockedUsdcx) >= UNDERHAUL_ESCROW_USDCX
}

export function hasGigamarketStake(availableUsdcx: string | null | undefined): boolean {
  return parseUsdcxAmount(availableUsdcx) >= GIGAMARKET_MIN_STAKE_USDCX
}

export function vaultGateMessage(lockedUsdcx: string | null | undefined): string {
  const have = parseUsdcxAmount(lockedUsdcx)
  if (have >= DUNGEON_ESCROW_USDCX) return ''
  return `Lock at least ${DUNGEON_ESCROW_USDCX} USDCx in FlowVault first (you have ${have} locked). Vault → Dungeon Run Escrow → Set Strategy → Deposit.`
}

export function underhaulGateMessage(lockedUsdcx: string | null | undefined): string {
  const have = parseUsdcxAmount(lockedUsdcx)
  if (have >= UNDERHAUL_ESCROW_USDCX) return ''
  return `Underhaul needs ${UNDERHAUL_ESCROW_USDCX} USDCx locked total (you have ${have}). Vault → Underhaul Entry → Set Strategy → Deposit.`
}

export function gigamarketStakeMessage(availableUsdcx: string | null | undefined): string {
  const have = parseUsdcxAmount(availableUsdcx)
  if (have >= GIGAMARKET_MIN_STAKE_USDCX) {
    return `${have} USDCx staked — eligible for ~${GIGAMARKET_FEE_SHARE_BPS / 100}% of Gigamarket fees when on-chain settlement ships.`
  }
  return `Deposit ${GIGAMARKET_MIN_STAKE_USDCX}+ USDCx via Gigamarket Revenue Split to qualify for fee share (you have ${have} USDCx on HOLD).`
}

/** User has vault balance but nothing locked for dungeon entry. */
export function holdVsLockHint(totalUsdcx: string | null | undefined, lockedUsdcx: string | null | undefined): string {
  const total = parseUsdcxAmount(totalUsdcx)
  const locked = parseUsdcxAmount(lockedUsdcx)
  if (total < DUNGEON_ESCROW_USDCX || locked >= DUNGEON_ESCROW_USDCX) return ''
  return `You have ${total} USDCx in the vault but ${locked} locked. HOLD does not count for Dungetron — pick Dungeon Run Escrow, Set Strategy, then Deposit at least 2 USDCx from your wallet (1 locks). Money already on HOLD stays withdrawable; you need a new deposit after strategy is set.`
}
