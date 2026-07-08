'use client'

import { useMemo, useState } from 'react'
import { GEAR, GearItem, materialByKey, rarityOf } from '@/lib/game'
import { Star } from './pixel'

const CATEGORIES = ['All', 'Head', 'Body', 'Hands', 'Charm', 'Lure', 'Rod', 'Vanity'] as const
type Cat = (typeof CATEGORIES)[number]
const SLOT_OF: Record<string, string> = { Head: 'head', Body: 'body', Hands: 'hands' }

export default function Workbench({
  materials,
  onCraft,
}: {
  materials: Record<string, number>
  onCraft: (item: GearItem, qty: number) => void
}) {
  const [cat, setCat] = useState<Cat>('All')
  const [selectedId, setSelectedId] = useState<string>(GEAR[0]?.id ?? '')
  const [qty, setQty] = useState(1)

  const list = useMemo(() => {
    if (cat === 'All') return GEAR
    const slot = SLOT_OF[cat]
    if (!slot) return [] // Charm/Lure/Rod/Vanity have no craftable items yet
    return GEAR.filter((g) => g.slot === slot)
  }, [cat])

  const selected = GEAR.find((g) => g.id === selectedId) ?? list[0]

  const ingredients = useMemo(() => {
    if (!selected) return []
    return Object.entries(selected.craftCost).map(([key, need]) => {
      const mat = materialByKey(key)
      const have = materials[mat.id] ?? 0
      return { mat, need: need * qty, have }
    })
  }, [selected, qty, materials])

  const canCraft = ingredients.length > 0 && ingredients.every((i) => i.have >= i.need)
  const successRate = selected ? Math.max(40, 100 - selected.rarity * 10) : 0

  return (
    <div className="flex h-full w-full flex-col px-3 py-3">
      {/* header */}
      <div className="pixel-panel mb-3 flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[13px] text-gold text-shadow-pixel">WORKBENCH</span>
          <span className="font-silk text-[9px] text-gold/50">// FORGE &amp; UPGRADE GEAR</span>
        </div>
        <div className="label-chip px-2 py-1 font-silk text-[9px] text-gold">
          {GEAR.length} BLUEPRINTS
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[120px_1fr_300px] gap-3 overflow-hidden">
        {/* categories */}
        <div className="pixel-panel flex flex-col gap-1 overflow-y-auto p-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`pixel-btn px-2 py-2 text-left font-silk text-[10px] ${
                cat === c ? '!border-gold !text-white shadow-glow' : ''
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="pixel-panel overflow-y-auto p-3">
          {list.length === 0 ? (
            <div className="grid h-full place-items-center font-silk text-[11px] text-gold/40">
              No blueprints in this category yet
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
              {list.map((g) => {
                const r = rarityOf(g.rarity)
                const sel = selected?.id === g.id
                return (
                  <button
                    key={`${g.slot}-${g.id}`}
                    onClick={() => {
                      setSelectedId(g.id)
                      setQty(1)
                    }}
                    title={g.name}
                    className={`group relative flex aspect-square flex-col items-center justify-center rounded border-2 bg-[#0a1622] p-1 transition hover:-translate-y-0.5 ${
                      sel ? 'shadow-glow-strong' : ''
                    }`}
                    style={{ borderColor: sel ? '#3ee6ff' : r.color, boxShadow: `inset 0 0 18px ${r.color}22` }}
                  >
                    <img src={g.sprite} alt={g.name} className="h-10 w-10" />
                    <div className="absolute right-0.5 top-0.5 flex">
                      {Array.from({ length: g.rarity + 1 }).map((_, i) => (
                        <Star key={i} size={8} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* detail */}
        <div className="pixel-panel flex flex-col gap-3 overflow-y-auto p-3">
          {selected ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded border-2 bg-[#0a1622]"
                  style={{ borderColor: rarityOf(selected.rarity).color }}
                >
                  <img src={selected.sprite} alt={selected.name} className="h-12 w-12" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-silk text-[12px] font-bold text-gold">{selected.name}</div>
                  <div
                    className="mt-1 inline-block rounded border px-1.5 py-0.5 font-silk text-[8px] uppercase"
                    style={{ color: rarityOf(selected.rarity).color, borderColor: rarityOf(selected.rarity).color }}
                  >
                    {rarityOf(selected.rarity).name} · {selected.slot}
                  </div>
                </div>
              </div>

              {/* stats */}
              <div>
                <div className="mb-1 font-silk text-[9px] uppercase tracking-wide text-gold/50">Stats</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selected.stats).map(([k, v]) => (
                    <span key={k} className="label-chip px-2 py-1 font-silk text-[9px]">
                      <span className="text-gold/60">{k}</span> <span className="text-gold">+{v}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ingredients */}
              <div>
                <div className="mb-1 font-silk text-[9px] uppercase tracking-wide text-gold/50">Ingredients</div>
                <div className="flex flex-col gap-1.5">
                  {ingredients.map(({ mat, need, have }) => {
                    const ok = have >= need
                    return (
                      <div key={mat.id} className="flex items-center gap-2 rounded border border-edge bg-[#0a1622] p-1.5">
                        <img src={mat.sprite} alt={mat.name} className="h-7 w-7" />
                        <span className="flex-1 truncate font-silk text-[10px]" style={{ color: rarityOf(mat.rarity).color }}>
                          {mat.name}
                        </span>
                        <span className={`font-silk text-[10px] ${ok ? 'text-uncommon' : 'text-hp'}`}>
                          {have}/{need}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* success rate */}
              <div className="flex items-center justify-between font-silk text-[10px]">
                <span className="text-gold/60">Success Rate</span>
                <span className="text-uncommon">{successRate}%</span>
              </div>

              {/* qty */}
              <div className="mt-auto flex items-center gap-2">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="pixel-btn h-8 w-8 font-silk text-[14px]">
                  -
                </button>
                <div className="grid h-8 flex-1 place-items-center rounded border-2 border-edge bg-[#0a1622] font-silk text-[12px] text-gold">
                  {qty}
                </div>
                <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="pixel-btn h-8 w-8 font-silk text-[14px]">
                  +
                </button>
              </div>
              <button
                disabled={!canCraft}
                onClick={() => onCraft(selected, qty)}
                className="pixel-btn pixel-btn-gold w-full px-4 py-3 font-silk text-[13px]"
              >
                {canCraft ? `Craft ×${qty}` : 'Missing Materials'}
              </button>
            </>
          ) : (
            <div className="grid h-full place-items-center font-silk text-[11px] text-gold/40">
              Select a blueprint
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
