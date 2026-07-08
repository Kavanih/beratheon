import {
  boolCV,
  cvToValue,
  deserializeCV,
  principalCV,
  serializeCV,
  standardPrincipalCV,
  stringAsciiCV,
  uintCV,
  type ClarityValue,
} from '@stacks/transactions'
import { HIRO_API_BASE, splitContractId } from '@/lib/contracts'

export function serializeArg(cv: ClarityValue): string {
  return `0x${serializeCV(cv)}`
}

export function parseReadOnlyResult(hex: string): unknown {
  const raw = hex.startsWith('0x') ? hex.slice(2) : hex
  return cvToValue(deserializeCV(raw))
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

async function hiroCallRead(
  address: string,
  name: string,
  functionName: string,
  sender: string,
  args: string[]
): Promise<{ okay?: boolean; result?: string; cause?: string }> {
  if (isBrowser()) {
    const res = await fetch('/api/stacks/call-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: `${address}.${name}`,
        functionName,
        sender,
        arguments: args,
      }),
    })
    return (await res.json()) as { okay?: boolean; result?: string; cause?: string }
  }

  const res = await fetch(`${HIRO_API_BASE}/v2/contracts/call-read/${address}/${name}/${functionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, arguments: args }),
  })
  return (await res.json()) as { okay?: boolean; result?: string; cause?: string }
}

export async function callReadOnly(
  contractId: string,
  functionName: string,
  args: ClarityValue[] = [],
  sender = splitContractId(contractId).address
): Promise<unknown> {
  const { address, name } = splitContractId(contractId)
  const data = await hiroCallRead(address, name, functionName, sender, args.map((a) => serializeArg(a)))
  if (!data.okay || !data.result) {
    throw new Error(data.cause ?? `Read-only call failed: ${functionName}`)
  }
  return parseReadOnlyResult(data.result)
}

export async function fetchStacksBlockHeight(): Promise<number> {
  if (isBrowser()) {
    const res = await fetch('/api/stacks/block-height')
    const data = (await res.json()) as { height?: number; error?: string }
    if (typeof data.height !== 'number') {
      throw new Error(data.error ?? 'Could not fetch Stacks block height')
    }
    return data.height
  }

  const res = await fetch(`${HIRO_API_BASE}/extended/v2/blocks?limit=1`)
  const data = (await res.json()) as { results?: { height?: number }[] }
  const height = data.results?.[0]?.height
  if (typeof height !== 'number') throw new Error('Could not fetch Stacks block height')
  return height
}

export { boolCV, principalCV, standardPrincipalCV, stringAsciiCV, uintCV }
