'use client'

import { useEffect, useRef, useState } from 'react'
import { rarityOf, SKINS } from '@/lib/game'
import { loadGearUi, saveGearUi } from '@/lib/playerStorage'
import { Star } from './pixel'
import type { Look } from './Character'
import GearSlot from './gear/GearSlot'
import ItemDetailPanel from './gear/ItemDetailPanel'
import PaperdollPreview from './gear/PaperdollPreview'

export type EquipSlot =
  | 'headGear'
  | 'bodyGear'
  | 'headVanity'
  | 'bodyVanity'
  | 'charm'
  | 'rod'
  | 'lure'
  | 'toolbar'

export interface InvItem {
  id: string
  name: string
  sprite: string
  rarity: number
  target: EquipSlot
  kind: 'gear' | 'skin' | 'charm'
  stats?: Record<string, number>
}

export type Equipped = Partial<Record<EquipSlot, InvItem>>

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

function canEquipTo(item: InvItem, slot: EquipSlot) {
  return item.target === slot
}

export default function GearStation({
  playerName,
  look,
  owned,
  equipped,
  onEquip,
  onUnequip,
  onMessage,
}: {
  playerName: string
  look: Look
  owned: InvItem[]
  equipped: Equipped
  onEquip: (slot: EquipSlot, item: InvItem) => void
  onUnequip: (slot: EquipSlot) => void
  onMessage: (m: string) => void
}) {
  const skinItems: InvItem[] = SKINS.map((s) => ({
    id: s.id,
    name: s.name,
    sprite: s.sprite,
    rarity: s.rarity,
    target: s.slot === 'head' ? 'headVanity' : 'bodyVanity',
    kind: 'skin',
  }))
  const inventory = [...owned, ...skinItems]

  const [sel, setSel] = useState<{ item: InvItem; from?: EquipSlot } | null>(null)
  const [focusSlot, setFocusSlot] = useState<EquipSlot | null>(null)
  const selRestored = useRef(false)
  const persistUi = useRef(false)
  const isEquippedSel = sel?.from != null

  useEffect(() => {
    const saved = loadGearUi()
    if (saved?.focusSlot) setFocusSlot(saved.focusSlot)
  }, [])

  useEffect(() => {
    if (selRestored.current) return
    const saved = loadGearUi()
    if (!saved?.sel) {
      selRestored.current = true
      return
    }
    const match = inventory.find((it) => it.id === saved.sel!.id && it.kind === saved.sel!.kind)
    if (match) {
      setSel({ item: match, from: saved.sel.from })
      selRestored.current = true
    }
  }, [inventory])

  useEffect(() => {
    if (!persistUi.current) {
      persistUi.current = true
      return
    }
    saveGearUi({
      focusSlot,
      sel: sel ? { id: sel.item.id, kind: sel.item.kind, from: sel.from } : null,
    })
  }, [focusSlot, sel])

  const pickSlot = (slot: EquipSlot, item?: InvItem) => {
    setFocusSlot(slot)
    if (item) setSel({ item, from: slot })
    else if (sel && !sel.from && canEquipTo(sel.item, slot)) {
      onEquip(slot, sel.item)
      onMessage(`Equipped ${sel.item.name}`)
    }
  }

  const doEquip = () => {
    if (!sel) return
    const slot = sel.from ?? focusSlot ?? sel.item.target
    if (focusSlot && !canEquipTo(sel.item, focusSlot) && !sel.from) {
      onMessage(`${sel.item.name} doesn't fit ${SLOT_LABEL[focusSlot]}`)
      return
    }
    onEquip(slot, sel.item)
    onMessage(`Equipped ${sel.item.name}`)
    setSel({ item: sel.item, from: slot })
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 p-3">
      {/* window chrome */}
      <div className="gs-frame shrink-0 px-4 py-2.5">
        <span className="font-pixel text-[11px] text-[#00ffff]">Gear Station</span>
      </div>

      {/* two-panel body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* ── LEFT: character + gear slots (CSS grid paperdoll) ── */}
        <div className="gs-frame flex min-h-[480px] min-w-0 flex-col overflow-hidden p-3">
          <div className="gs-paperdoll min-h-0 flex-1">
            <GearSlot
              item={equipped.headGear}
              label="Head Gear"
              selected={sel?.from === 'headGear'}
              focused={focusSlot === 'headGear'}
              onClick={() => pickSlot('headGear', equipped.headGear)}
              align="left"
            />
            <GearSlot
              item={equipped.bodyGear}
              label="Body Gear"
              selected={sel?.from === 'bodyGear'}
              focused={focusSlot === 'bodyGear'}
              onClick={() => pickSlot('bodyGear', equipped.bodyGear)}
              align="left"
            />

            <div className="gs-char-box flex flex-col items-center justify-center">
              <PaperdollPreview look={look} equipped={equipped} size={280} playerName={playerName} />
            </div>

            <GearSlot
              item={equipped.headVanity}
              label="Head Vanity"
              selected={sel?.from === 'headVanity'}
              focused={focusSlot === 'headVanity'}
              onClick={() => pickSlot('headVanity', equipped.headVanity)}
              align="right"
            />
            <GearSlot
              item={equipped.bodyVanity}
              label="Body Vanity"
              selected={sel?.from === 'bodyVanity'}
              focused={focusSlot === 'bodyVanity'}
              onClick={() => pickSlot('bodyVanity', equipped.bodyVanity)}
              align="right"
            />
            <GearSlot
              item={equipped.rod}
              label="Rod"
              selected={sel?.from === 'rod'}
              focused={focusSlot === 'rod'}
              onClick={() => pickSlot('rod', equipped.rod)}
              align="right"
            />
            <GearSlot
              item={equipped.lure}
              label="Lure"
              selected={sel?.from === 'lure'}
              focused={focusSlot === 'lure'}
              onClick={() => pickSlot('lure', equipped.lure)}
              align="right"
            />

            <div className="gs-charm-row">
              <GearSlot
                item={equipped.charm}
                label="Charm"
                selected={sel?.from === 'charm'}
                focused={focusSlot === 'charm'}
                onClick={() => pickSlot('charm', equipped.charm)}
                align="center"
                compact
              />
              <div className="gs-slot gs-slot--sm gs-slot--disabled grid place-items-center opacity-40">
                <span className="font-silk text-[8px] text-gold/20">+</span>
              </div>
            </div>

            <div className="gs-toolbar-row">
              <span className="font-silk text-[8px] uppercase text-gold/50">Toolbar</span>
              <div className="flex justify-center gap-2">
                <GearSlot
                  item={equipped.toolbar}
                  label="Gloves"
                  selected={sel?.from === 'toolbar'}
                  focused={focusSlot === 'toolbar'}
                  onClick={() => pickSlot('toolbar', equipped.toolbar)}
                  align="center"
                  compact
                />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="gs-slot gs-slot--sm gs-slot--disabled grid place-items-center opacity-40">
                    <span className="font-silk text-[8px] text-gold/20">+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: details + inventory ── */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="gs-frame min-h-0 flex-1 overflow-hidden p-2">
            <ItemDetailPanel
              sel={sel?.item ?? null}
              isEquipped={isEquippedSel}
              focusSlot={focusSlot}
              onRepair={() => onMessage('Repaired (demo)')}
              onRestore={() => onMessage('Restored (demo)')}
              onUnequip={() => {
                if (!sel?.from) return
                onUnequip(sel.from)
                setSel(null)
                setFocusSlot(null)
              }}
              onEquip={doEquip}
            />
          </div>

          <div className="gs-frame flex max-h-[220px] min-h-[160px] flex-col overflow-hidden p-2">
            <div className="gs-panel-title mb-2 font-pixel text-[9px] text-[#00ffff]">Inventory</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {inventory.slice(0, 8).map((it, i) => {
                  const r = rarityOf(it.rarity)
                  const active = sel && !sel.from && sel.item.id === it.id && sel.item.kind === it.kind
                  return (
                    <button
                      key={`${it.kind}-${it.id}-${i}`}
                      type="button"
                      onClick={() => setSel({ item: it })}
                      title={`${it.name} → ${SLOT_LABEL[it.target]}`}
                      className={`gs-slot gs-slot--sm relative ${active ? 'gs-slot--active' : ''}`}
                      style={!active ? { borderColor: r.color } : undefined}
                    >
                      <img src={it.sprite} alt={it.name} className="crisp h-10 w-10 object-contain" />
                      <div className="absolute right-0 top-0 flex">
                        {Array.from({ length: Math.min(3, it.rarity + 1) }).map((_, k) => (
                          <Star key={k} size={7} />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
              {inventory.length > 8 && (
                <p className="mt-2 text-center font-silk text-[8px] text-gold/30">
                  +{inventory.length - 8} more in bag
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
