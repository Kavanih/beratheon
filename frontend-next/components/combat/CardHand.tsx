'use client'

import type { MoveType } from '@/lib/game'
import { MOVE_META, MOVE_TYPES } from '@/lib/game'
import { rarityOf } from '@/lib/game'
import { MoveIcon } from '../pixel'

const ACCENT: Record<MoveType, string> = {
  sword: '#c9a227',
  shield: '#e8b84a',
  spell: '#b15cff',
}

const CARD_W = 140
const CARD_H = 148

export default function CardHand({
  moves,
  activePick,
  disabled,
  readonly,
  mirror,
  onPlay,
}: {
  moves: Record<MoveType, { atk: number; def: number; charges: number; maxCharges: number }>
  activePick?: MoveType | null
  disabled?: boolean
  readonly?: boolean
  mirror?: boolean
  onPlay?: (m: MoveType) => void
}) {
  return (
    <div className={`flex flex-col gap-2.5 ${mirror ? 'items-end' : 'items-start'}`}>
      <div className={`flex gap-2.5 ${mirror ? 'flex-row-reverse' : ''}`}>
        {MOVE_TYPES.map((m) => (
          <div
            key={m}
            className="battle-modifier grid place-items-center font-silk text-[12px] text-gold"
            style={{ width: CARD_W, height: 32 }}
          >
            {moves[m].atk}
          </div>
        ))}
      </div>
      <div className={`flex gap-2.5 ${mirror ? 'flex-row-reverse' : ''}`}>
        {MOVE_TYPES.map((m) => {
          const move = moves[m]
          const active = activePick === m
          const off = disabled || readonly || move.charges <= 0
          const accent = ACCENT[m]
          const rarity = rarityOf(MOVE_META[m].rarity)

          return (
            <button
              key={m}
              type="button"
              onClick={() => onPlay?.(m)}
              disabled={off}
              className={`battle-card group relative flex flex-col ${active ? 'battle-card--active' : ''} ${
                off ? 'opacity-55' : 'hover:-translate-y-1'
              } ${readonly ? 'cursor-default' : ''}`}
              style={{
                width: CARD_W,
                height: CARD_H,
                ['--card-accent' as string]: accent,
                borderColor: active ? accent : rarity.color,
              }}
            >
              <div className="flex w-full justify-between px-2 pt-1.5 font-silk text-[13px]">
                <span className="text-gold">{move.atk}</span>
                <span className="text-gold">{move.def}</span>
              </div>
              <div
                className="flex flex-[0.55] items-center justify-center px-1 py-1"
                style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
              >
                <MoveIcon type={m} size={11} />
              </div>
              <div className="px-1 pb-6 text-center font-silk text-[8px] uppercase tracking-wide text-parchment/70">
                {MOVE_META[m].label}
              </div>
              <div className="battle-card-accent absolute inset-x-0 bottom-0 flex justify-center gap-1 py-1.5">
                {Array.from({ length: move.maxCharges }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2 w-2 border border-black/40"
                    style={{ background: i < move.charges ? accent : 'transparent' }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
