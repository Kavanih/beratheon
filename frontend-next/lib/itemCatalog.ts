import { MATERIALS, rarityOf, type Material } from '@/lib/game'

/** Stable token-id order for items-sft (matches seed script registration). */
export const MATERIAL_TOKEN_ORDER = Object.keys(MATERIALS).sort((a, b) => Number(a) - Number(b))

export function getTokenIdForMaterial(materialId: string): number {
  const idx = MATERIAL_TOKEN_ORDER.indexOf(materialId)
  return idx >= 0 ? idx + 1 : 0
}

export function getMaterialForTokenId(tokenId: number): Material | null {
  const materialId = MATERIAL_TOKEN_ORDER[tokenId - 1]
  return materialId ? MATERIALS[materialId] ?? null : null
}

const APP_ORIGIN =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/** Hosted JSON metadata (pin this folder to IPFS for production). */
export function materialMetadataUrl(materialId: string): string {
  return `${APP_ORIGIN}/metadata/items/${materialId}.json`
}

export function materialImageUrl(materialId: string): string {
  const mat = MATERIALS[materialId]
  return mat ? `${APP_ORIGIN}${mat.sprite}` : `${APP_ORIGIN}/materials/${materialId}.png`
}

export function buildMaterialMetadata(materialId: string, tokenId: number) {
  const mat = MATERIALS[materialId]
  if (!mat) return null
  const rarity = rarityOf(mat.rarity)
  return {
    name: mat.name,
    description: `${mat.name} — Beratheon crafting material (items-sft token #${tokenId}).`,
    image: materialImageUrl(materialId),
    external_url: `${APP_ORIGIN}/?item=${materialId}`,
    attributes: [
      { trait_type: 'Category', value: 'Material' },
      { trait_type: 'Rarity', value: rarity.name },
      { trait_type: 'Game Item ID', value: materialId },
      { trait_type: 'SFT Token ID', value: String(tokenId) },
    ],
  }
}

export interface CatalogItem {
  materialId: string
  tokenId: number
  name: string
  sprite: string
  rarity: number
  metadataUrl: string
}

export function buildLocalCatalog(): CatalogItem[] {
  return MATERIAL_TOKEN_ORDER.map((materialId, idx) => {
    const mat = MATERIALS[materialId]
    return {
      materialId,
      tokenId: idx + 1,
      name: mat.name,
      sprite: mat.sprite,
      rarity: mat.rarity,
      metadataUrl: materialMetadataUrl(materialId),
    }
  })
}
