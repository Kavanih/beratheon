'use client'

import type { Combatant } from '@/lib/game'
import { Monster } from '../pixel'
import { CharacterCanvas, Look, NOOB_LOOK } from '../Character'

function BattleStatBar({ value, max, kind }: { value: number; max: number; kind: 'hp' | 'arm' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const fill =
    kind === 'hp'
      ? 'linear-gradient(180deg,#f0e6a8,#c9a227 55%,#8a6b12)'
      : 'linear-gradient(180deg,#9be8ff,#43d4ff 55%,#2a8fb8)'
  const label = kind === 'hp' ? 'HP' : 'ARM'
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-7 shrink-0 font-silk text-[9px] text-parchment/80">{label}</span>
      <div className="battle-bar relative h-4 min-w-[120px] flex-1">
        <div className="battle-bar-fill h-full transition-[width] duration-300" style={{ width: `${pct}%`, background: fill }} />
        <span className="absolute inset-0 flex items-center justify-center font-silk text-[8px] text-white text-shadow-pixel">
          {value} / {max}
        </span>
      </div>
    </div>
  )
}

function FighterHud({
  c,
  side,
  look,
}: {
  c: Combatant
  side: 'left' | 'right'
  look?: Look
}) {
  return (
    <div className={`battle-hud flex w-[min(100%,320px)] gap-2 p-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="grid h-14 w-14 shrink-0 place-items-center border-2 border-wood-dark bg-ink">
        {c.variant === -1 ? (
          <CharacterCanvas look={look ?? NOOB_LOOK} size={48} dir="down" />
        ) : (
          <Monster variant={c.variant} size={4} />
        )}
      </div>
      <div className={`min-w-0 flex-1 ${side === 'right' ? 'text-right' : ''}`}>
        <BattleStatBar value={c.hp} max={c.maxHp} kind="hp" />
        <div className="mt-1.5">
          <BattleStatBar value={c.armor} max={c.maxArmor} kind="arm" />
        </div>
        <div
          className={`battle-nameplate mt-2 inline-flex items-center gap-2 px-2 py-0.5 ${side === 'right' ? 'float-right' : ''}`}
        >
          <span className="font-silk text-[10px] text-parchment">{c.name}</span>
          <span className="font-silk text-[9px] text-gold">Lv.{c.level}</span>
        </div>
      </div>
    </div>
  )
}

export default function BattleHud({
  hero,
  enemy,
  floor,
  room,
  roomsPerFloor,
  turn,
  look,
}: {
  hero: Combatant
  enemy: Combatant
  floor: number
  room: number
  roomsPerFloor: number
  turn: number
  look?: Look
}) {
  return (
    <div className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-3 pt-2">
      <FighterHud c={hero} side="left" look={look} />
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <div className="flex gap-2">
          <div className="battle-plaque px-3 py-1 font-silk text-[9px] text-parchment">
            Floor <span className="text-gold">{floor}</span>
          </div>
          <div className="battle-plaque px-3 py-1 font-silk text-[9px] text-parchment">
            Room <span className="text-gold">{room}/{roomsPerFloor}</span>
          </div>
        </div>
        <div className="battle-plaque px-2 py-0.5 font-silk text-[8px] text-parchment/60">Turn {turn}</div>
      </div>
      <FighterHud c={enemy} side="right" />
    </div>
  )
}
