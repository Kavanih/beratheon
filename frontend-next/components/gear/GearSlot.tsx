'use client'

import { rarityOf } from '@/lib/game'
import { Star } from '../pixel'
import type { InvItem } from '../GearStation'

export default function GearSlot({
  item,
  label,
  selected,
  focused,
  onClick,
  align = 'left',
  compact,
}: {
  item?: InvItem
  label: string
  selected: boolean
  focused: boolean
  onClick: () => void
  align?: 'left' | 'right' | 'center'
  compact?: boolean
}) {
  const r = item ? rarityOf(item.rarity) : null
  const active = selected || focused

  return (
    <div
      className={`flex flex-col gap-1 ${
        align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        title={label}
        className={`gs-slot relative grid place-items-center ${compact ? 'gs-slot--sm' : ''} ${
          active ? 'gs-slot--active' : ''
        }`}
        style={!active && r ? { borderColor: r.color } : undefined}
      >
        {item ? (
          <img src={item.sprite} alt={item.name} className="crisp h-12 w-12 object-contain" />
        ) : (
          <span className="font-silk text-[8px] uppercase text-gold/20">+</span>
        )}
        {item && (
          <>
            <span className="absolute bottom-0.5 left-0.5">
              <Star filled size={10} />
            </span>
            <span className="absolute right-0.5 top-0.5 h-2 w-2 bg-[#00ffff] shadow-[1px_1px_0_#004466]" />
          </>
        )}
      </button>
      {!compact && (
        <span className="max-w-[72px] text-center font-silk text-[8px] uppercase leading-tight text-gold/60">
          {label}
        </span>
      )}
    </div>
  )
}
