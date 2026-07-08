import { contractPrincipalCV, boolCV, uintCV } from '@stacks/transactions'
import { BERATHEON_CONTRACTS, splitContractId } from '@/lib/contracts'
import { callContract } from '@/lib/chainCalls'
import { clarityOptionalSome, clarityPrincipal, clarityTuple, clarityUint } from '@/lib/clarityParse'
import { callReadOnly, fetchStacksBlockHeight } from '@/lib/stacksRead'
import { getMaterialForTokenId, getTokenIdForMaterial } from '@/lib/itemCatalog'
import type { ItemType } from '@/lib/game'

const LISTING_SCAN_MAX = 64
const LISTING_TTL_BLOCKS = 1440

export interface ChainListing {
  listingId: number
  seller: string
  tokenContract: string
  tokenId: number
  qty: number
  pricePerUnitMicroStx: number
  expiresAt: number
  name: string
  sprite: string
  type: ItemType
  rarity: number
}

function labelForToken(tokenContract: string, tokenId: number): { name: string; sprite: string; type: ItemType; rarity: number } {
  if (tokenContract === BERATHEON_CONTRACTS.itemsSft) {
    const mat = getMaterialForTokenId(tokenId)
    if (mat) {
      return { name: mat.name, sprite: mat.sprite, type: 'Material', rarity: mat.rarity }
    }
  }
  const short = tokenContract.split('.').pop() ?? 'token'
  return {
    name: `${short} #${tokenId}`,
    sprite: '/sprites/materials/ore.png',
    type: 'Collectible',
    rarity: 1,
  }
}


function parseListingTuple(value: unknown): Omit<ChainListing, 'listingId' | 'name' | 'sprite' | 'type' | 'rarity'> | null {
  const row = clarityTuple(value)
  if (!row) return null

  const seller = clarityPrincipal(row.seller)
  const tokenContract = clarityPrincipal(row['token-contract'] ?? row.tokenContract)
  const tokenId = clarityUint(row['token-id'] ?? row.tokenId)
  const qty = clarityUint(row.qty)
  const price = clarityUint(row['price-per-unit-ustx'] ?? row.pricePerUnitUstx)
  const expiresAt = clarityUint(row['expires-at'] ?? row.expiresAt)

  if (!seller || !tokenContract || !tokenId || !qty || !price) return null
  return { seller, tokenContract, tokenId, qty, pricePerUnitMicroStx: price, expiresAt }
}

export async function fetchActiveListings(currentHeight?: number): Promise<ChainListing[]> {
  const height = currentHeight ?? (await fetchStacksBlockHeight())
  const listings: ChainListing[] = []
  let inactiveStreak = 0

  for (let id = 1; id <= LISTING_SCAN_MAX; id++) {
    try {
      const active = await callReadOnly(BERATHEON_CONTRACTS.marketplace, 'is-listing-active', [uintCV(id)])
      if (!clarityOptionalSome(active)) {
        inactiveStreak++
        if (inactiveStreak >= 8) break
        continue
      }
      inactiveStreak = 0

      const raw = await callReadOnly(BERATHEON_CONTRACTS.marketplace, 'get-listing', [uintCV(id)])
      const parsed = parseListingTuple(raw)
      if (!parsed) continue
      if (parsed.expiresAt <= height) continue

      const meta = labelForToken(parsed.tokenContract, parsed.tokenId)
      listings.push({ listingId: id, ...parsed, ...meta })
    } catch {
      inactiveStreak++
      if (inactiveStreak >= 8) break
    }
  }

  return listings
}

export async function buyMarketplaceListing(
  walletAddress: string,
  listingId: number,
  qty: number,
  isJuiced: boolean
): Promise<string> {
  return callContract({
    contractId: BERATHEON_CONTRACTS.marketplace,
    functionName: 'buy',
    functionArgs: [uintCV(listingId), uintCV(qty), boolCV(isJuiced)],
    address: walletAddress,
  })
}

export async function createMarketplaceListing(
  walletAddress: string,
  materialId: string,
  qty: number,
  pricePerUnitMicroStx: number
): Promise<string> {
  const height = await fetchStacksBlockHeight()
  const tokenId = getTokenIdForMaterial(materialId)
  if (!tokenId) throw new Error('Unknown material')
  const { address, name } = splitContractId(BERATHEON_CONTRACTS.itemsSft)
  return callContract({
    contractId: BERATHEON_CONTRACTS.marketplace,
    functionName: 'create-listing',
    functionArgs: [
      contractPrincipalCV(address, name),
      uintCV(tokenId),
      uintCV(qty),
      uintCV(pricePerUnitMicroStx),
      uintCV(height + LISTING_TTL_BLOCKS),
    ],
    address: walletAddress,
  })
}

export function microStxToStx(micro: number): number {
  return micro / 1_000_000
}

export function stxToMicro(amount: number): number {
  return Math.max(1, Math.round(amount * 1_000_000))
}

export { getTokenIdForMaterial as materialTokenId }
