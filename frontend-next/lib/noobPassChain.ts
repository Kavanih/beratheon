import { standardPrincipalCV } from '@stacks/transactions'
import { BERATHEON_CONTRACTS } from '@/lib/contracts'
import { callContract } from '@/lib/chainCalls'
import { callReadOnly } from '@/lib/stacksRead'
import { clarityBool } from '@/lib/clarityParse'

export const NOOB_PASS_MAX_SUPPLY = 1024

export async function hasNoobPassOnChain(walletAddress: string): Promise<boolean> {
  try {
    const result = await callReadOnly(
      BERATHEON_CONTRACTS.noobPass,
      'is-claimed',
      [standardPrincipalCV(walletAddress)],
      walletAddress
    )
    return clarityBool(result) === true
  } catch {
    return false
  }
}

export async function mintNoobPass(walletAddress: string): Promise<{ txId: string }> {
  if (await hasNoobPassOnChain(walletAddress)) {
    throw new Error('This wallet already minted a Cub Pass')
  }

  const txId = await callContract({
    contractId: BERATHEON_CONTRACTS.noobPass,
    functionName: 'mint',
    functionArgs: [],
    address: walletAddress,
  })

  return { txId }
}
