import { NextRequest, NextResponse } from 'next/server'
import { HIRO_API_BASE, splitContractId } from '@/lib/contracts'

const PRINCIPAL_RE = /^S[TM][0-9A-Z]{20,50}$/
const NAME_RE = /^[a-z][a-z0-9-]*$/

export async function POST(req: NextRequest) {
  let body: {
    contractId?: string
    functionName?: string
    arguments?: string[]
    sender?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contractId, functionName, arguments: args = [], sender } = body
  if (!contractId || !functionName) {
    return NextResponse.json({ error: 'contractId and functionName are required' }, { status: 400 })
  }

  if (!NAME_RE.test(functionName)) {
    return NextResponse.json({ error: 'Invalid function name' }, { status: 400 })
  }

  let address: string
  let name: string
  try {
    ;({ address, name } = splitContractId(contractId))
  } catch {
    return NextResponse.json({ error: 'Invalid contractId' }, { status: 400 })
  }

  if (!PRINCIPAL_RE.test(address) || !NAME_RE.test(name)) {
    return NextResponse.json({ error: 'Invalid contract id' }, { status: 400 })
  }

  const callSender = sender && PRINCIPAL_RE.test(sender) ? sender : address
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string' || !/^0x[0-9a-fA-F]+$/.test(arg))) {
    return NextResponse.json({ error: 'Invalid Clarity arguments' }, { status: 400 })
  }

  try {
    const res = await fetch(`${HIRO_API_BASE}/v2/contracts/call-read/${address}/${name}/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: callSender, arguments: args }),
      cache: 'no-store',
    })

    const data = (await res.json()) as { okay?: boolean; result?: string; cause?: string }
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Hiro API request failed'
    return NextResponse.json({ okay: false, cause: message }, { status: 502 })
  }
}
