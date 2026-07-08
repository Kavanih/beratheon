'use client'

import type { MoveType } from '@/lib/game'
import type { Loot } from '@/lib/game'
import { rarityOf } from '@/lib/game'
import { CharacterCanvas, Look } from '../Character'
import { Monster, MoveIcon } from '../pixel'

interface Fx {
  id: number
  text: string
  tone: 'dmg' | 'block' | 'miss'
}

function FloatIcons({ fx, pick }: { fx: Fx[]; pick: MoveType | null }) {
  return (
    <>
      {pick && (
        <div className="absolute -top-[4.5rem] left-1/2 z-20 -translate-x-1/2 animate-popin">
          <div className="battle-frame grid h-20 w-20 place-items-center bg-ink/90">
            <MoveIcon type={pick} size={10} />
          </div>
        </div>
      )}
      {fx.map((f) => (
        <div
          key={f.id}
          className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 animate-rise font-pixel text-[14px] text-shadow-pixel"
          style={{ color: f.tone === 'dmg' ? '#a83245' : '#e8c547' }}
        >
          {f.text}
        </div>
      ))}
    </>
  )
}

function FighterPlatform({
  children,
  hit,
  flip,
}: {
  children: React.ReactNode
  hit: boolean
  flip?: boolean
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative z-10 ${hit ? 'animate-shake' : 'animate-floaty'}`}
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        {children}
      </div>
      <div className="battle-shadow mt-0 h-4 w-36" />
      <div className="battle-platform -mt-2 h-2.5 w-28" />
    </div>
  )
}

export default function BattleArena({
  look,
  enemyVariant,
  loot,
  heroHit,
  enemyHit,
  heroFx,
  enemyFx,
  heroPick,
  enemyPick,
  showPick,
  outcomeLabel,
}: {
  look: Look
  enemyVariant: number
  loot: Loot[]
  heroHit: boolean
  enemyHit: boolean
  heroFx: Fx[]
  enemyFx: Fx[]
  heroPick: MoveType | null
  enemyPick: MoveType | null
  showPick: boolean
  outcomeLabel: string | null
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      {/* hanging loot */}
      <div className="absolute left-1/2 top-[8%] z-10 flex -translate-x-1/2 gap-10">
        {loot.map((l, i) => (
          <div key={i} className="flex animate-floaty flex-col items-center" style={{ animationDelay: `${i * 0.35}s` }}>
            <div className="h-10 w-[2px] bg-wood-light/50" />
            <div
              className="battle-frame grid h-14 w-14 place-items-center bg-ink/90"
              style={{ borderColor: rarityOf(l.rarity).color }}
              title={l.name}
            >
              <img src={l.sprite} alt={l.name} className="crisp h-10 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* combatants */}
      <div className="absolute inset-x-0 bottom-[12%] z-10 flex items-end justify-between px-[8%]">
        <FighterPlatform hit={heroHit}>
          <CharacterCanvas look={look} size={160} dir="right" walk={false} className="crisp" />
          <FloatIcons fx={heroFx} pick={showPick ? heroPick : null} />
        </FighterPlatform>

        {outcomeLabel && (
          <div className="mb-24 animate-popin font-pixel text-[13px] text-gold text-shadow-pixel">{outcomeLabel}</div>
        )}

        <FighterPlatform hit={enemyHit} flip>
          <Monster variant={enemyVariant} size={11} />
          <FloatIcons fx={enemyFx} pick={showPick ? enemyPick : null} />
        </FighterPlatform>
      </div>
    </div>
  )
}
