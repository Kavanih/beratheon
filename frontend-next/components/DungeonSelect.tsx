'use client'

import { DUNGEONS, Dungeon } from '@/lib/game'
import HallTileBackground from './HallTileBackground'
import { EnergyBolt, Monster, MoveIcon } from './pixel'

export default function DungeonSelect({
  energy,
  maxEnergy,
  entering,
  onEnter,
  onBack,
}: {
  energy: number
  maxEnergy: number
  entering?: boolean
  onEnter: (d: Dungeon) => void
  onBack: () => void
}) {
  function handleDungeonClick(d: Dungeon) {
    if (energy < d.energy) return
    onEnter(d)
  }

  function enterLabel(d: Dungeon) {
    if (energy < d.energy) return 'Not enough energy'
    return `Enter · ${d.energy} energy`
  }

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <HallTileBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <button onClick={onBack} className="pixel-btn mb-6 px-3 py-2 font-silk text-[11px]">
          ‹ Back to Hub
        </button>

        <div className="mb-2 flex items-center gap-2 font-silk text-[11px] uppercase tracking-widest text-parchment/70">
          Combat
        </div>
        <h1 className="font-pixel text-[24px] text-gold text-shadow-pixel">Dungetron Overview</h1>
        <p className="mt-4 max-w-2xl font-silk text-[12px] leading-6 text-parchment/85">
          Dungetron is a rogue-lite combat dungeon with enemies of increasing difficulty. There are
          4 rooms to each of the 4 floors. Clear a room by defeating the enemy to receive the items
          they drop — you keep these even when you die. Once you die, your progress resets and you
          begin again from the start.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 font-silk text-[10px] text-parchment/75">
          <Legend t="sword" b="Spell" />
          <Legend t="spell" b="Guard" />
          <Legend t="shield" b="Strike" />
          <span className="label-chip px-2 py-1">Win an exchange → deal damage &amp; repair shield</span>
        </div>

        <p className="mt-3 font-silk text-[10px] text-parchment/60">
          Energy: {energy}/{maxEnergy} · regens 10 per hour (full in 24h)
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {DUNGEONS.map((d) => {
            const energyOk = energy >= d.energy
            return (
              <div key={d.id} className="pixel-panel overflow-hidden">
                <div className="relative grid h-40 place-items-center overflow-hidden border-b-2 border-edge bg-[#1a1410]/80">
                  <div className="relative animate-floaty" style={{ transform: 'scaleX(-1)' }}>
                    <Monster variant={d.startVariant} size={7} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-silk text-[14px] font-bold text-gold">{d.name}</div>
                  <p className="mt-2 h-14 font-silk text-[11px] leading-5 text-parchment/75">{d.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 font-silk text-[10px]">
                    <span className="label-chip px-2 py-1">{d.floors} floors · {d.rooms} rooms</span>
                    <span className="label-chip flex items-center gap-1 px-2 py-1 text-gold">
                      <EnergyBolt size={10} /> {d.energy} energy
                    </span>
                  </div>
                  <div className="mt-2 font-silk text-[10px] text-parchment/60">Rewards: {d.reward}</div>
                  <button
                    onClick={() => handleDungeonClick(d)}
                    disabled={entering || !energyOk}
                    className="pixel-btn pixel-btn-gold mt-3 w-full px-4 py-3 font-silk text-[12px]"
                  >
                    {entering ? 'Entering…' : enterLabel(d)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Legend({ t, b }: { t: 'sword' | 'shield' | 'spell'; b: string }) {
  return (
    <div className="label-chip flex items-center gap-1 px-2 py-1">
      <div className="grid h-5 w-5 place-items-center">
        <MoveIcon type={t} size={2} />
      </div>
      <span className="text-parchment/50">beats</span>
      <span className="text-gold">{b}</span>
    </div>
  )
}
