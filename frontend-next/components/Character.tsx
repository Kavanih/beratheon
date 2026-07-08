'use client'

import { useEffect, useRef } from 'react'
import { getGearAnchor, HEAD_GEAR_CREST, SPRITE_SIZE, type GearLayer } from '@/lib/gearAnchors'

// ----------------------------------------------------------------------------
// Modular paperdoll character.
//
// A base "noob" body drawn entirely in code so it can: (a) walk in 4 directions
// with a real limb cycle, and (b) wear equipment as layers — head/body skins
// replace the corresponding part, head/body gear tints it with a helmet/plate.
// The same draw routine powers the hub canvas, combat, and the dress-up preview.
// ----------------------------------------------------------------------------

export type Dir = 'up' | 'down' | 'left' | 'right'

export interface Look {
  body: string
  bodyDark: string
  legColor: string
  head: string
  headDark: string
  eye: string
  accent: string
  // vanity skins (override base appearance)
  headSkin?: string | null
  bodySkin?: string | null
  // gear sprites (shown when no vanity on that slot, or as overlay)
  headGearSprite?: string | null
  bodyGearSprite?: string | null
  handsSprite?: string | null
  // gear tint fallback
  helmet?: string | null
  armor?: string | null
  /** Hide procedurally drawn head/torso when HTML or layered gear replaces them. */
  suppressHead?: boolean
  suppressTorso?: boolean
}

export const NOOB_LOOK: Look = {
  body: '#e9f1f6',
  bodyDark: '#b9cad7',
  legColor: '#5b6b7a',
  head: '#f3f8fb',
  headDark: '#d7e3ec',
  eye: '#1a2730',
  accent: '#3ee6ff',
  headSkin: null,
  bodySkin: null,
  headGearSprite: null,
  bodyGearSprite: null,
  handsSprite: null,
  helmet: null,
  armor: null,
}

// --- tiny image cache so canvas layers load once and redraw every frame ------
const imgCache = new Map<string, HTMLImageElement>()
function getImg(url: string): HTMLImageElement {
  let im = imgCache.get(url)
  if (!im) {
    im = new Image()
    im.src = url
    imgCache.set(url, im)
  }
  return im
}
const ready = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0

function drawSpriteCropped(
  ctx: CanvasRenderingContext2D,
  url: string | null | undefined,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  sx: number,
  sy: number,
  sw: number,
  sh: number
) {
  if (!url) return false
  const im = getImg(url)
  if (!ready(im)) return false
  ctx.drawImage(
    im,
    sx,
    sy,
    sw,
    sh,
    Math.round(destX),
    Math.round(destY),
    Math.round(destW),
    Math.round(destH)
  )
  return true
}

function drawGearLayer(
  ctx: CanvasRenderingContext2D,
  url: string | null | undefined,
  layer: GearLayer,
  originX: number,
  originY: number,
  u: number,
  alpha = 1
) {
  if (!url) return false
  const a = getGearAnchor(layer, url)
  const sx = Math.round(a.sx * SPRITE_SIZE)
  const sy = Math.round(a.sy * SPRITE_SIZE)
  const sw = Math.round(a.sw * SPRITE_SIZE)
  const sh = Math.round(a.sh * SPRITE_SIZE)
  const prev = ctx.globalAlpha
  if (alpha < 1) ctx.globalAlpha = alpha
  const ok = drawSpriteCropped(
    ctx,
    url,
    originX + a.x * u,
    originY + a.y * u,
    a.w * u,
    a.h * u,
    sx,
    sy,
    sw,
    sh
  )
  ctx.globalAlpha = prev
  return ok
}

/** Draw a character whose feet rest at (cx, feetY). `u` is the pixel unit. */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  feetY: number,
  u: number,
  dir: Dir,
  phase: number,
  moving: boolean,
  look: Look
) {
  const p = look
  const px = (v: number) => Math.round(v)
  const cyc = Math.sin(phase * Math.PI * 2)
  const swing = moving ? cyc * u * 1.2 : 0
  const bob = moving ? Math.abs(cyc) * u * 0.7 : Math.sin(phase * 0.7) * u * 0.22

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.40)'
  ctx.beginPath()
  ctx.ellipse(cx, feetY + u * 0.6, u * 4, u * 1.4, 0, 0, Math.PI * 2)
  ctx.fill()

  const top = feetY - 16 * u - bob
  const originX = cx - 10.5 * u
  const originY = top
  const headW = 8 * u
  const headH = 7 * u
  const headX = cx - headW / 2
  const headY = top
  const torsoW = 9 * u
  const torsoH = 6 * u
  const torsoX = cx - torsoW / 2
  const torsoY = top + 7 * u
  const legY = torsoY + torsoH
  const legH = 3 * u

  const hasHeadVanity = !!(p.headSkin && ready(getImg(p.headSkin)))
  const hasHeadGear = !!p.headGearSprite
  const hasBodyVanity = !!(p.bodySkin && ready(getImg(p.bodySkin)))
  const bodyVanitySkin = hasBodyVanity && p.bodySkin!.includes('/skins/')
  const drawHead = !p.suppressHead && !hasHeadVanity && !hasHeadGear && !bodyVanitySkin
  const drawTorso = !p.suppressTorso && !hasBodyVanity && !bodyVanitySkin

  // ---- legs (alternating step) ----
  ctx.fillStyle = p.legColor
  const lLift = Math.max(0, swing)
  const rLift = Math.max(0, -swing)
  ctx.fillRect(px(cx - 3 * u), px(legY - lLift), px(2.4 * u), px(legH + lLift + 0.6 * u))
  ctx.fillRect(px(cx + 0.6 * u), px(legY - rLift), px(2.4 * u), px(legH + rLift + 0.6 * u))
  ctx.fillStyle = p.accent
  ctx.fillRect(px(cx - 3 * u), px(legY + legH - 0.6 * u - lLift), px(2.4 * u), px(0.8 * u))
  ctx.fillRect(px(cx + 0.6 * u), px(legY + legH - 0.6 * u - rLift), px(2.4 * u), px(0.8 * u))

  // ---- arms (swing opposite to legs) ----
  const armColor = p.armor ?? p.body
  ctx.fillStyle = armColor
  ctx.fillRect(px(torsoX - 1.7 * u), px(torsoY + rLift * 0.6), px(2 * u), px(4.4 * u))
  ctx.fillRect(px(torsoX + torsoW - 0.3 * u), px(torsoY + lLift * 0.6), px(2 * u), px(4.4 * u))
  // hands (base)
  ctx.fillStyle = p.head
  ctx.fillRect(px(torsoX - 1.7 * u), px(torsoY + rLift * 0.6 + 4 * u), px(2 * u), px(1.4 * u))
  ctx.fillRect(px(torsoX + torsoW - 0.3 * u), px(torsoY + lLift * 0.6 + 4 * u), px(2 * u), px(1.4 * u))

  // ---- torso base ----
  if (drawTorso) {
    ctx.fillStyle = armColor
    ctx.fillRect(px(torsoX), px(torsoY), px(torsoW), px(torsoH))
    ctx.fillStyle = p.bodyDark
    ctx.fillRect(px(torsoX), px(torsoY + torsoH - 1.2 * u), px(torsoW), px(1.2 * u))
    if (p.armor) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(px(cx - 2.6 * u), px(torsoY + 1 * u), px(5.2 * u), px(1.1 * u))
    }
  }

  // body gear under vanity
  if (!hasBodyVanity) {
    drawGearLayer(ctx, p.bodyGearSprite, 'bodyGear', originX, originY, u)
  } else if (p.bodyGearSprite) {
    drawGearLayer(ctx, p.bodyGearSprite, 'bodyGear', originX, originY, u, 0.35)
  }

  // body vanity skin
  drawGearLayer(ctx, p.bodySkin, 'bodyVanity', originX, originY, u)

  // belt
  ctx.fillStyle = p.accent
  ctx.fillRect(px(torsoX), px(torsoY + torsoH - 0.5 * u), px(torsoW), px(0.7 * u))

  // ---- head ----
  if (hasHeadVanity) {
    drawGearLayer(ctx, p.headSkin, 'headVanity', originX, originY, u)
    if (p.headGearSprite) {
      const crest = HEAD_GEAR_CREST
      const sx = Math.round(crest.sx * SPRITE_SIZE)
      const sy = Math.round(crest.sy * SPRITE_SIZE)
      const sw = Math.round(crest.sw * SPRITE_SIZE)
      const sh = Math.round(crest.sh * SPRITE_SIZE)
      drawSpriteCropped(
        ctx,
        p.headGearSprite,
        originX + crest.x * u,
        originY + crest.y * u,
        crest.w * u,
        crest.h * u,
        sx,
        sy,
        sw,
        sh
      )
    }
  } else if (hasHeadGear) {
    drawGearLayer(ctx, p.headGearSprite, 'headGear', originX, originY, u)
  } else if (drawHead) {
    ctx.fillStyle = p.head
    ctx.fillRect(px(headX), px(headY), px(headW), px(headH))
    ctx.fillStyle = p.headDark
    ctx.fillRect(px(headX), px(headY + headH - 1 * u), px(headW), px(1 * u))
    ctx.fillStyle = p.eye
    if (dir === 'up') {
      ctx.fillStyle = p.headDark
      ctx.fillRect(px(headX), px(headY), px(headW), px(2 * u))
    } else if (dir === 'left') {
      ctx.fillRect(px(cx - 2.8 * u), px(headY + 3 * u), px(1.7 * u), px(2 * u))
    } else if (dir === 'right') {
      ctx.fillRect(px(cx + 1.1 * u), px(headY + 3 * u), px(1.7 * u), px(2 * u))
    } else {
      ctx.fillRect(px(cx - 2.6 * u), px(headY + 3 * u), px(1.6 * u), px(2 * u))
      ctx.fillRect(px(cx + 1 * u), px(headY + 3 * u), px(1.6 * u), px(2 * u))
    }
    if (p.helmet) {
      ctx.fillStyle = p.helmet
      ctx.fillRect(px(headX - 0.5 * u), px(headY - 0.9 * u), px(headW + 1 * u), px(2.6 * u))
      ctx.fillStyle = 'rgba(255,255,255,0.30)'
      ctx.fillRect(px(headX - 0.5 * u), px(headY - 0.9 * u), px(headW + 1 * u), px(0.6 * u))
    }
    ctx.fillStyle = p.accent
    ctx.fillRect(px(cx - 1 * u), px(headY - 1.7 * u), px(2 * u), px(1.5 * u))
  }

  // gloves on top of everything
  drawGearLayer(ctx, p.handsSprite, 'hands', originX, originY, u)
}

// ----------------------------------------------------------------------------
// Self-animating canvas view for static panels (gear station, combat, etc.)
// ----------------------------------------------------------------------------
export function CharacterCanvas({
  look,
  size = 180,
  dir = 'down',
  walk = false,
  className = '',
}: {
  look: Look
  size?: number
  dir?: Dir
  walk?: boolean
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const lookRef = useRef(look)
  lookRef.current = look

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = size
    c.height = size
    let raf = 0

    // preload sprite layers so equip changes appear immediately once loaded
    const urls = [
      look.headSkin,
      look.bodySkin,
      look.headGearSprite,
      look.bodyGearSprite,
      look.handsSprite,
    ].filter(Boolean) as string[]
    for (const url of urls) {
      const im = getImg(url)
      if (!ready(im)) im.onload = () => {}
    }

    const loop = () => {
      const t = performance.now()
      ctx.clearRect(0, 0, size, size)
      ctx.imageSmoothingEnabled = false
      const u = size / 21
      drawCharacter(ctx, size / 2, size - u * 2.5, u, dir, t / 480, walk, lookRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [size, dir, walk, look])

  return (
    <canvas
      ref={ref}
      className={className}
      width={size}
      height={size}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  )
}
