import { NextResponse } from 'next/server'
import { HIRO_API_BASE } from '@/lib/contracts'

export async function GET() {
  try {
    const res = await fetch(`${HIRO_API_BASE}/extended/v2/blocks?limit=1`, { next: { revalidate: 15 } })
    const data = (await res.json()) as { results?: { height?: number }[] }
    const height = data.results?.[0]?.height
    if (typeof height !== 'number') {
      return NextResponse.json({ error: 'Could not fetch block height' }, { status: 502 })
    }
    return NextResponse.json({ height })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Hiro API request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
