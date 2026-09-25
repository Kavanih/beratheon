/** Deployed Beratheon Clarity contract IDs (testnet). */
const DEPLOYER =
  process.env.NEXT_PUBLIC_BERATHEON_DEPLOYER ?? 'ST30PNQ7ZP471GY3BDM0XFT48EA5WC5GTQ0PG3XHR'

function cid(name: string, envKey: string) {
  return process.env[envKey] ?? `${DEPLOYER}.${name}`
}

export const BERATHEON_CONTRACTS = {
  deployer: DEPLOYER,
  traits: cid('traits', 'NEXT_PUBLIC_TRAITS_CONTRACT'),
  itemsSft: cid('items-sft', 'NEXT_PUBLIC_ITEMS_SFT_CONTRACT'),
  honeyToken: cid('honey-token', 'NEXT_PUBLIC_HONEY_TOKEN_CONTRACT'),
  juiceToken: cid('juice-token', 'NEXT_PUBLIC_JUICE_TOKEN_CONTRACT'),
  cubNft: cid('cub-nft', 'NEXT_PUBLIC_CUB_NFT_CONTRACT'),
  usernameNft: cid('username-nft', 'NEXT_PUBLIC_USERNAME_NFT_CONTRACT'),
  noobPass: cid('noob-pass', 'NEXT_PUBLIC_NOOB_PASS_CONTRACT'),
  gameRegistry: cid('game-registry', 'NEXT_PUBLIC_GAME_REGISTRY_CONTRACT'),
  gameAuthority: cid('game-authority', 'NEXT_PUBLIC_GAME_AUTHORITY_CONTRACT'),
  marketplace: cid('marketplace', 'NEXT_PUBLIC_MARKETPLACE_CONTRACT'),
  crafting: cid('crafting', 'NEXT_PUBLIC_CRAFTING_CONTRACT'),
  conquest: cid('conquest', 'NEXT_PUBLIC_CONQUEST_CONTRACT'),
  echoes: cid('echoes', 'NEXT_PUBLIC_ECHOES_CONTRACT'),
  helpers: cid('helpers', 'NEXT_PUBLIC_HELPERS_CONTRACT'),
} as const

export const BERATHEON_TREASURY =
  process.env.NEXT_PUBLIC_BERATHEON_TREASURY ?? 'ST2Y1HES6JR37ZFVZWCPTZWEE0WG79G3Y8VV3EE29'

export const STACKS_NETWORK = (process.env.NEXT_PUBLIC_STACKS_NETWORK ?? 'testnet') as 'testnet' | 'mainnet'

/** True when marketplace contract includes escrow + item transfer (marketplace-v2). */
export const marketplaceHasEscrow = BERATHEON_CONTRACTS.marketplace.includes('marketplace-v2')

export const HIRO_API_BASE =
  STACKS_NETWORK === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so'

export function splitContractId(contractId: string): { address: string; name: string } {
  const dot = contractId.lastIndexOf('.')
  if (dot <= 0) throw new Error(`Invalid contract id: ${contractId}`)
  return { address: contractId.slice(0, dot), name: contractId.slice(dot + 1) }
}
