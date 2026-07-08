'use client'

import { useMemo } from 'react'
import { CharacterCanvas, Look } from '../Character'
import type { Equipped } from '../GearStation'
import {
  anchorToStyle,
  getGearAnchor,
  HEAD_GEAR_CREST,
  isBodyVanitySkin,
  SPRITE_SIZE,
  type GearAnchor,
  type GearLayer,
} from '@/lib/gearAnchors'

const LAYER_ORDER: GearLayer[] = ['bodyGear', 'bodyVanity', 'headGear', 'headVanity', 'hands']

const LAYER_FROM_EQUIP: Record<GearLayer, keyof Equipped> = {
  headGear: 'headGear',
  headVanity: 'headVanity',
  bodyGear: 'bodyGear',
  bodyVanity: 'bodyVanity',
  hands: 'toolbar',
}

function GearLayerImg({ url, anchor }: { url: string; anchor: GearAnchor }) {
  const pos = anchorToStyle(anchor)
  const sx = Math.round(anchor.sx * SPRITE_SIZE)
  const sy = Math.round(anchor.sy * SPRITE_SIZE)
  const sw = Math.round(anchor.sw * SPRITE_SIZE)
  const sh = Math.round(anchor.sh * SPRITE_SIZE)

  return (
    <div
      className="paperdoll-layer pointer-events-none absolute overflow-hidden"
      style={{
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        zIndex: pos.zIndex,
      }}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        className="crisp absolute max-w-none"
        style={{
          left: `${-(sx / sw) * 100}%`,
          top: `${-(sy / sh) * 100}%`,
          width: `${(SPRITE_SIZE / sw) * 100}%`,
          height: `${(SPRITE_SIZE / sh) * 100}%`,
          filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.4))',
        }}
      />
    </div>
  )
}

export default function PaperdollPreview({
  look,
  equipped,
  size = 280,
  playerName,
}: {
  look: Look
  equipped: Equipped
  size?: number
  playerName?: string
}) {
  const bodyVanitySkin = isBodyVanitySkin(equipped.bodyVanity?.sprite)

  const baseLook = useMemo<Look>(
    () => ({
      ...look,
      headSkin: null,
      bodySkin: null,
      headGearSprite: null,
      bodyGearSprite: null,
      handsSprite: null,
      helmet: null,
      armor: null,
    }),
    [look]
  )

  const hideHead = !!(equipped.headVanity || equipped.headGear || bodyVanitySkin)
  const hideTorso = !!(equipped.bodyVanity || bodyVanitySkin)

  const baseOnly: Look = {
    ...baseLook,
    suppressHead: hideHead,
    suppressTorso: hideTorso,
  }

  const layers = LAYER_ORDER.map((layer) => {
    const slot = LAYER_FROM_EQUIP[layer]
    const item = equipped[slot]
    if (!item?.sprite) return null

    if (layer === 'headGear' && equipped.headVanity) {
      return <GearLayerImg key={layer} url={item.sprite} anchor={HEAD_GEAR_CREST} />
    }

    return <GearLayerImg key={layer} url={item.sprite} anchor={getGearAnchor(layer, item.sprite)} />
  })

  return (
    <div className="flex flex-col items-center">
      {playerName && (
        <div className="mb-2 font-silk text-[10px] uppercase tracking-widest text-gold/80">{playerName}</div>
      )}
      <div
        className="gs-char-frame paperdoll relative bg-[#040a10] shadow-[inset_2px_2px_0_rgba(0,255,255,0.12),inset_-2px_-2px_0_rgba(0,0,0,0.9)]"
        style={{
          width: size,
          height: size,
          border: '2px solid #1e4058',
          borderRadius: 6,
        }}
      >
        <CharacterCanvas
          look={baseOnly}
          size={size}
          dir="down"
          walk={false}
          className="crisp absolute left-0 top-0 block"
        />
        {layers}
      </div>
    </div>
  )
}
