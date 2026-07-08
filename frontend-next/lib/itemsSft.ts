import { standardPrincipalCV, uintCV } from '@stacks/transactions'
import { BERATHEON_CONTRACTS } from '@/lib/contracts'
import { buildLocalCatalog, type CatalogItem } from '@/lib/itemCatalog'
import { clarityOptionalUint, clarityString, clarityTuple, clarityUint } from '@/lib/clarityParse'
import { callReadOnly } from '@/lib/stacksRead'

export interface OnChainItem extends CatalogItem {
  registeredOnChain: boolean
  chainName?: string
  balance: number
}

const metadataCache = new Map<number, { category: number; name: string } | null>()

function parseMetadataTuple(value: unknown): { category: number; name: string } | null {
  const row = clarityTuple(value)
  if (!row) return null
  const name = clarityString(row.name)
  if (!name) return null
  return { category: clarityUint(row.category), name }
}

export async function fetchItemMetadata(tokenId: number): Promise<{ category: number; name: string } | null> {
  if (metadataCache.has(tokenId)) return metadataCache.get(tokenId) ?? null
  try {
    const raw = await callReadOnly(BERATHEON_CONTRACTS.itemsSft, 'get-item-metadata', [uintCV(tokenId)])
    const parsed = parseMetadataTuple(raw)
    metadataCache.set(tokenId, parsed)
    return parsed
  } catch {
    metadataCache.set(tokenId, null)
    return null
  }
}

export async function fetchItemBalance(walletAddress: string, tokenId: number): Promise<number> {
  try {
    const raw = await callReadOnly(
      BERATHEON_CONTRACTS.itemsSft,
      'get-balance',
      [uintCV(tokenId), standardPrincipalCV(walletAddress)],
      walletAddress
    )
    return clarityOptionalUint(raw) ?? 0
  } catch {
    return 0
  }
}

export async function fetchOnChainInventory(walletAddress?: string | null): Promise<OnChainItem[]> {
  const catalog = buildLocalCatalog()
  return Promise.all(
    catalog.map(async (item) => {
      const meta = await fetchItemMetadata(item.tokenId)
      const balance = walletAddress ? await fetchItemBalance(walletAddress, item.tokenId) : 0
      return {
        ...item,
        registeredOnChain: !!meta,
        chainName: meta?.name,
        balance,
      }
    })
  )
}

export async function countRegisteredItems(): Promise<number> {
  const catalog = buildLocalCatalog()
  let count = 0
  for (const item of catalog) {
    const meta = await fetchItemMetadata(item.tokenId)
    if (meta) count++
  }
  return count
}
