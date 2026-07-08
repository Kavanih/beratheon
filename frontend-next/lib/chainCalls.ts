import type { ClarityValue } from '@stacks/transactions'
import { loadStacksConnect, NETWORK } from '@/lib/stacksConnectClient'
import { splitContractId } from '@/lib/contracts'

export interface ContractCallParams {
  contractId: string
  functionName: string
  functionArgs: ClarityValue[]
  address: string
  postConditionMode?: 'allow' | 'deny'
}

export async function callContract(params: ContractCallParams): Promise<string> {
  const { contractId, functionName, functionArgs, address, postConditionMode = 'allow' } = params
  const { address: contractAddress, name: contractName } = splitContractId(contractId)
  const { request } = await loadStacksConnect()
  const result = await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName,
    functionArgs,
    network: NETWORK,
    address,
    postConditionMode,
    postConditions: [],
  })
  if (typeof result === 'string') return result
  if (result && typeof result === 'object') {
    const r = result as { txid?: string; txId?: string }
    return r.txid ?? r.txId ?? String(result)
  }
  return String(result)
}

export function hiroTxUrl(txid: string) {
  const id = txid.startsWith('0x') ? txid : `0x${txid}`
  return `https://explorer.hiro.so/txid/${id}?chain=testnet`
}
