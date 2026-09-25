'use client'

import { rarityOf } from '@/lib/game'
import { Star } from '../pixel'
import type { EquipSlot, InvItem } from '../GearStation'

const SLOT_LABEL: Record<EquipSlot, string> = {
  headGear: 'Head Gear',
  bodyGear: 'Body Gear',
  headVanity: 'Head Vanity',
  bodyVanity: 'Body Vanity',
  charm: 'Charm',
  rod: 'Rod',
  lure: 'Lure',
  toolbar: 'Toolbar',
}

export default function ItemDetailPanel({
  sel,
  isEquipped,
  focusSlot,
  onRepair,
  onRestore,
  onUnequip,
  onEquip,
}: {
  sel: InvItem | null
  isEquipped: boolean
  focusSlot: EquipSlot | null
  onRepair: () => void
  onRestore: () => void
  onUnequip: () => void
  onEquip: () => void
}) {
  if (!sel) {
    return (
      <div className="gs-panel-inner flex min-h-[280px] flex-col">
        <div className="gs-panel-title font-pixel text-[10px] text-gold">Item Details</div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center font-silk text-[11px] leading-5 text-gold/40">
          <span>Select a gear slot or inventory item</span>
          <span className="text-[10px] text-gold/25">Click a slot, then pick gear to equip</span>
        </div>
      </div>
    )
  }

  const r = rarityOf(sel.rarity)
  const slotLabel = focusSlot ? SLOT_LABEL[focusSlot] : SLOT_LABEL[sel.target]

  return (
    <div className="gs-panel-inner flex min-h-0 flex-1 flex-col gap-3">
      <div className="gs-panel-title font-pixel text-[10px] text-gold">Item Details</div>

      {/* name / type / rarity chips + preview icon */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="gs-chip gs-chip--name truncate font-silk text-[12px] text-white">{sel.name}</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="gs-chip font-silk text-[9px] text-gold/80">{slotLabel}</span>
            <span className="gs-chip inline-flex items-center gap-1 font-silk text-[9px]" style={{ color: r.color, borderColor: r.color }}>
              {r.name}
              <Star filled size={8} />
            </span>
          </div>
        </div>
        <div className="gs-slot gs-slot--preview shrink-0" style={{ borderColor: r.color }}>
          <img src={sel.sprite} alt={sel.name} className="crisp h-14 w-14 object-contain" />
        </div>
      </div>

      {/* stats */}
      {sel.stats && Object.keys(sel.stats).length > 0 && (
        <div className="gs-stat-row font-silk text-[10px] text-gold/70">
          {Object.entries(sel.stats).map(([k, v]) => (
            <span key={k}>
              {k}: <span className="text-uncommon">+{v}</span>
            </span>
          ))}
        </div>
      )}

      {/* durability */}
      <div>
        <div className="mb-1 flex justify-between font-silk text-[9px] text-gold/50">
          <span>Durability</span>
          <span className="text-white">[59/60]</span>
        </div>
        <div className="gs-bar">
          <div className="gs-bar-fill" style={{ width: '98%' }} />
        </div>
      </div>

      {/* resource row (demo) */}
      <div className="flex flex-wrap gap-2 font-silk text-[9px] text-gold/60">
        <span className="gs-chip px-2 py-1">SCROLLS 2.95K/62</span>
        <span className="gs-chip px-2 py-1">CHARGES 3/5</span>
      </div>

      {/* 3D action buttons */}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <button type="button" onClick={onRestore} className="gs-btn-3d col-span-2 py-2.5 font-silk text-[10px]">
          Restore
        </button>
        <button type="button" onClick={onRepair} className="gs-btn-3d py-2.5 font-silk text-[10px]">
          Repair
        </button>
        {isEquipped ? (
          <button type="button" onClick={onUnequip} className="gs-btn-3d py-2.5 font-silk text-[10px]">
            Unequip
          </button>
        ) : (
          <button type="button" onClick={onEquip} className="gs-btn-3d py-2.5 font-silk text-[10px]">
            Equip{focusSlot ? '' : ''}
          </button>
        )}
      </div>
    </div>
  )
}
