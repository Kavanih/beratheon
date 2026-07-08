/** Anatomical placement for 64×64 gear icons on the 21×21 noob grid. */

export type GearLayer = 'headGear' | 'headVanity' | 'bodyGear' | 'bodyVanity' | 'hands'

export interface GearAnchor {
  /** Destination on the 21-unit character grid (origin = top-left of sprite bounds). */
  x: number
  y: number
  w: number
  h: number
  z: number
  /** Source crop on the 64×64 icon (normalized 0–1). */
  sx: number
  sy: number
  sw: number
  sh: number
  replaces?: 'head' | 'torso' | 'bust'
}

/** Matches drawCharacter head rect: x=6.5, y=0, w=8, h=7 */
const HEAD_DEST = { x: 6.2, y: -0.2, w: 8.6, h: 7.8 }

/** Matches drawCharacter torso rect: x=6, y=7, w=9, h=6 (+ shoulder pad) */
const TORSO_DEST = { x: 5.6, y: 6.4, w: 9.8, h: 7.2 }

export const GEAR_ANCHORS: Record<GearLayer, GearAnchor> = {
  bodyGear: {
    ...TORSO_DEST,
    z: 15,
    sx: 0.02,
    sy: 0.06,
    sw: 0.96,
    sh: 0.86,
  },
  bodyVanity: {
    ...TORSO_DEST,
    z: 18,
    sx: 0.04,
    sy: 0.08,
    sw: 0.92,
    sh: 0.84,
    replaces: 'torso',
  },
  headGear: {
    ...HEAD_DEST,
    z: 28,
    sx: 0.03,
    sy: 0.02,
    sw: 0.94,
    sh: 0.66,
  },
  headVanity: {
    ...HEAD_DEST,
    z: 32,
    sx: 0.06,
    sy: 0.0,
    sw: 0.88,
    sh: 0.76,
    replaces: 'head',
  },
  hands: {
    x: 3.8,
    y: 9.0,
    w: 13.4,
    h: 4.6,
    z: 36,
    sx: 0.04,
    sy: 0.16,
    sw: 0.92,
    sh: 0.64,
  },
}

/** Body-slot skins are portrait busts — cover head + torso as one layer. */
export const BODY_VANITY_SKIN_ANCHOR: GearAnchor = {
  x: 5.2,
  y: -0.4,
  w: 10.6,
  h: 13.2,
  z: 18,
  sx: 0.05,
  sy: 0.0,
  sw: 0.9,
  sh: 0.94,
  replaces: 'bust',
}

export const HEAD_GEAR_CREST: GearAnchor = {
  ...GEAR_ANCHORS.headGear,
  x: 7.2,
  y: 1.0,
  w: 6.4,
  h: 3.8,
  sx: 0.05,
  sy: 0.02,
  sw: 0.9,
  sh: 0.45,
  z: 34,
}

export function isBodyVanitySkin(spriteUrl?: string | null) {
  return !!spriteUrl?.includes('/skins/')
}

export function getGearAnchor(layer: GearLayer, spriteUrl?: string | null): GearAnchor {
  if (layer === 'bodyVanity' && isBodyVanitySkin(spriteUrl)) return BODY_VANITY_SKIN_ANCHOR
  return GEAR_ANCHORS[layer]
}

/** Character occupies ~16u vertically, starting at y=2.5 on the 21u canvas. */
export function anchorToStyle(a: GearAnchor) {
  return {
    left: `${(a.x / 21) * 100}%`,
    top: `${((2.5 + a.y) / 21) * 100}%`,
    width: `${(a.w / 21) * 100}%`,
    height: `${(a.h / 21) * 100}%`,
    zIndex: a.z,
  } as const
}

export const SPRITE_SIZE = 64
