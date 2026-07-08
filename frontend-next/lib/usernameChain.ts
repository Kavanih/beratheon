import { stringAsciiCV, standardPrincipalCV } from '@stacks/transactions'
import { BERATHEON_CONTRACTS } from '@/lib/contracts'
import { callContract } from '@/lib/chainCalls'
import { callReadOnly } from '@/lib/stacksRead'
import { toChainUsername, validateUsername } from '@/lib/username'

export const USERNAME_MINT_PRICE_STX = 0.005
export const USERNAME_MINT_PRICE_USTX = 5000

export async function fetchOwnerTokenId(walletAddress: string): Promise<number | null> {
  const result = await callReadOnly(
    BERATHEON_CONTRACTS.usernameNft,
    'get-owner-token',
    [standardPrincipalCV(walletAddress)],
    walletAddress
  )
  if (result == null || result === '') return null
  if (typeof result === 'object' && result !== null && 'value' in (result as object)) {
    const wrapped = result as { value?: unknown }
    return typeof wrapped.value === 'number' || typeof wrapped.value === 'bigint'
      ? Number(wrapped.value)
      : null
  }
  if (typeof result === 'number' || typeof result === 'bigint') return Number(result)
  return null
}

export async function isUsernameTakenOnChain(username: string): Promise<boolean> {
  const chainName = toChainUsername(username)
  const result = await callReadOnly(
    BERATHEON_CONTRACTS.usernameNft,
    'get-token-by-username',
    [stringAsciiCV(chainName)]
  )
  if (result == null || result === '') return false
  if (typeof result === 'object' && result !== null && 'value' in (result as object)) {
    return (result as { value?: unknown }).value != null
  }
  return result != null
}

export async function mintUsernameNft(
  walletAddress: string,
  username: string
): Promise<{ txId: string; tokenId?: number }> {
  const err = validateUsername(username)
  if (err) throw new Error(err)

  const chainName = toChainUsername(username)
  if (await isUsernameTakenOnChain(chainName)) {
    throw new Error('Username is already taken on-chain')
  }

  const existing = await fetchOwnerTokenId(walletAddress)
  if (existing != null) {
    throw new Error('This wallet already has a username NFT')
  }

  const txId = await callContract({
    contractId: BERATHEON_CONTRACTS.usernameNft,
    functionName: 'mint',
    functionArgs: [stringAsciiCV(chainName)],
    address: walletAddress,
  })

  return { txId }
}
