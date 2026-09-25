import {
  HALL_MAP,
  HALL_PALETTE as P,
  HALL_STATIONS,
  TILE,
  U,
  tileAt,
  tileHash,
  type Station,
} from './hallMap'

export { HALL_STATIONS, MAP_H, MAP_W, TILE, U, tileAt, isWallTile } from './hallMap'
export type { Station } from './hallMap'

type TileAt = (x: number, y: number) => string

export function paintMapStatic(ctx: CanvasRenderingContext2D, map: string[], at: TileAt) {
  const mapW = map[0].length
  const mapH = map.length
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      drawGround(ctx, x * TILE, y * TILE, map[y][x], x, y)
    }
  }
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const t = map[y][x]
      const px = x * TILE
      const py = y * TILE
      if (t === '#') drawWall(ctx, px, py, x, y, at)
      else if (t === 'f') drawWoodFence(ctx, px, py, x, y, at)
      else if (t === 'T') drawTorchBase(ctx, px, py, x, y)
      else if (t === 'S') drawSign(ctx, px, py)
      else if (t === 'B') drawBanner(ctx, px, py)
      else if (t === 'C') drawChest(ctx, px, py)
      else if (t === 'O') drawPot(ctx, px, py)
    }
  }
}

export function paintMapAnimated(ctx: CanvasRenderingContext2D, map: string[], _at: TileAt, t: number) {
  const mapW = map[0].length
  const mapH = map.length
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const ch = map[y][x]
      const px = x * TILE
      const py = y * TILE
      if (ch === '~') drawSlime(ctx, px, py, x, y, t)
      else if (ch === 'T') drawTorchFlame(ctx, px, py, x, y, t)
    }
  }
}

/** Tile the battle arena to fill the viewport — same art as Hall of Heroes. */
export function paintBattleViewport(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  tilePx: number,
  t: number
) {
  const cols = Math.ceil(cw / tilePx)
  const rows = Math.ceil(ch / tilePx)
  const wallRows = Math.max(2, Math.round(rows * 0.18))
  const scale = tilePx / TILE

  const at: TileAt = (x, y) => {
    if (y < 0 || y >= rows || x < 0 || x >= cols) return '.'
    if (y < wallRows) return '#'
    if (y >= rows - 2) {
      if (y === rows - 1 && x > 1 && x < cols - 2) return '~'
      return '.'
    }
    if (y === wallRows) {
      const bx = Math.max(2, Math.floor(cols * 0.1))
      const tx1 = Math.floor(cols * 0.44)
      const tx2 = Math.floor(cols * 0.56)
      if (x === bx || x === cols - 1 - bx) return 'B'
      if (x === tx1 || x === tx2) return 'T'
    }
    const potRow = Math.floor(rows * 0.52)
    if (y === potRow) {
      const ox = Math.max(2, Math.floor(cols * 0.14))
      if (x === ox || x === cols - 1 - ox) return 'O'
    }
    return '.'
  }

  const stamp = (col: number, row: number, draw: () => void) => {
    ctx.save()
    ctx.translate(col * tilePx, row * tilePx)
    ctx.scale(scale, scale)
    draw()
    ctx.restore()
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = at(col, row)
      stamp(col, row, () => drawGround(ctx, 0, 0, ch, col, row))
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = at(col, row)
      stamp(col, row, () => {
        if (ch === '#') drawWall(ctx, 0, 0, col, row, at)
        else if (ch === 'T') drawTorchBase(ctx, 0, 0, col, row)
        else if (ch === 'B') drawBanner(ctx, 0, 0)
        else if (ch === 'O') drawPot(ctx, 0, 0)
      })
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = at(col, row)
      stamp(col, row, () => {
        if (ch === '~') drawSlime(ctx, 0, 0, col, row, t)
        else if (ch === 'T') drawTorchFlame(ctx, 0, 0, col, row, t)
      })
    }
  }
}

export function paintHallStatic(ctx: CanvasRenderingContext2D) {
  paintMapStatic(ctx, HALL_MAP, tileAt)
  // arena south entrance arch (gap in bottom fence, row 13)
  drawArenaEntrance(ctx)
}

function drawArenaEntrance(ctx: CanvasRenderingContext2D) {
  const gateY = 13
  for (const gateX of [15, 16]) {
    const px = gateX * TILE
    const py = gateY * TILE
    ctx.fillStyle = P.carpetTrim
    ctx.fillRect(px + U, py + U / 2, TILE - 2 * U, U / 2)
    ctx.fillStyle = P.woodMid
    ctx.fillRect(px + U, py + U, U, 4 * U)
    ctx.fillRect(px + TILE - 2 * U, py + U, U, 4 * U)
    ctx.fillStyle = P.slimeGlow
    ctx.globalAlpha = 0.35
    ctx.fillRect(px + 2 * U, py + 2 * U, TILE - 4 * U, 2 * U)
    ctx.globalAlpha = 1
  }
}

export function paintHallAnimated(ctx: CanvasRenderingContext2D, t: number) {
  paintMapAnimated(ctx, HALL_MAP, tileAt, t)
  for (const s of HALL_STATIONS) drawStation(ctx, s, t)
}

export function drawPlayerShadow(ctx: CanvasRenderingContext2D, wx: number, wy: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.42)'
  ctx.beginPath()
  ctx.ellipse(wx, wy + U * 2.2, U * 5.5, U * 2, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawGround(ctx: CanvasRenderingContext2D, px: number, py: number, t: string, x: number, y: number) {
  if (t === '#') {
    ctx.fillStyle = P.mortar
    ctx.fillRect(px, py, TILE, TILE)
    return
  }
  if (t === ',') {
    drawCarpet(ctx, px, py)
    return
  }
  if (t === '~' || t === 'f') {
    ctx.fillStyle = P.stoneMid
    ctx.fillRect(px, py, TILE, TILE)
    drawStoneFloor(ctx, px, py, x, y, t === '~' ? 0.85 : 1)
    return
  }
  drawStoneFloor(ctx, px, py, x, y, 1)
}

function drawStoneFloor(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  strength: number
) {
  const h = tileHash(x, y)
  const shades = [P.stoneDark, P.stoneMid, P.stoneLight, P.stoneHi]
  ctx.fillStyle = shades[Math.floor(h * shades.length)]
  ctx.fillRect(px, py, TILE, TILE)

  const row = y % 2
  for (let r = 0; r < 4; r++) {
    const by = py + r * 2 * U + 1
    const offs = (r + row) % 2 === 0 ? 0 : TILE / 2
    for (let c = -1; c < 3; c++) {
      const bx = px + offs + c * (TILE / 2) + 1
      ctx.fillStyle = r % 2 === 0 ? P.stoneLight : P.stoneMid
      ctx.globalAlpha = 0.35 * strength
      ctx.fillRect(bx, by, TILE / 2 - 2, 2 * U - 2)
    }
  }
  ctx.globalAlpha = 1

  ctx.strokeStyle = P.mortar
  ctx.lineWidth = 1
  ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1)

  if (tileHash(x * 5, y * 3) > 0.72) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(px + 3 * U, py + 2 * U, U, U)
  }
  if (tileHash(x * 2, y * 9) > 0.82) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(px + U, py + 5 * U, U, U)
  }
}

function drawCarpet(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = P.carpetDark
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = P.carpet
  ctx.fillRect(px + U, py + U, TILE - 2 * U, TILE - 2 * U)
  ctx.fillStyle = P.carpetLight
  ctx.fillRect(px + 2 * U, py + 2 * U, TILE - 4 * U, TILE - 4 * U)
  ctx.fillStyle = P.carpetTrim
  ctx.fillRect(px, py, TILE, U / 2)
  ctx.fillRect(px, py + TILE - U / 2, TILE, U / 2)
  ctx.fillRect(px, py, U / 2, TILE)
  ctx.fillRect(px + TILE - U / 2, py, U / 2, TILE)
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(px + (i + 1) * 2 * U, py + U, U / 2, TILE - 2 * U)
  }
}

function drawWall(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, at: TileAt) {
  ctx.fillStyle = P.mortar
  ctx.fillRect(px, py, TILE, TILE)
  for (let r = 0; r < 4; r++) {
    const offs = r % 2 === 0 ? 0 : TILE / 2
    for (let c = -1; c < 2; c++) {
      ctx.fillStyle = (r + c + x) % 3 === 0 ? P.stoneLight : P.stoneMid
      ctx.fillRect(px + offs + c * TILE + 1, py + r * 2 * U + 1, TILE / 2 - 2, 2 * U - 2)
    }
  }
  if (at(x, y - 1) !== '#') {
    ctx.fillStyle = P.stoneHi
    ctx.fillRect(px, py, TILE, U)
    ctx.fillStyle = 'rgba(255,220,180,0.08)'
    ctx.fillRect(px, py + U, TILE, U / 2)
  }
  if (at(x, y + 1) !== '#') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(px, py + TILE - U, TILE, U)
  }
}

function drawWoodFence(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, at: TileAt) {
  const postL = px + U
  const postR = px + TILE - 3 * U
  const railY = py + 2 * U

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(px, py + TILE - U, TILE, U)

  for (const postX of [postL, postR]) {
    ctx.fillStyle = P.woodDark
    ctx.fillRect(postX, railY, 2 * U, 5 * U)
    ctx.fillStyle = P.woodMid
    ctx.fillRect(postX + U / 4, railY, U, 5 * U)
    ctx.fillStyle = P.woodHi
    ctx.fillRect(postX, railY, U / 2, 5 * U)
    ctx.fillStyle = P.woodDark
    ctx.fillRect(postX + 1.5 * U, railY + 4 * U, U / 2, U)
  }

  const horiz = at(x - 1, y) === 'f' || at(x + 1, y) === 'f'
  if (horiz) {
    drawWoodRail(ctx, px, railY, TILE, 2 * U)
    drawWoodRail(ctx, px, railY + 3 * U, TILE, U * 1.2)
  } else {
    drawWoodRail(ctx, px, railY, TILE, 2 * U)
  }
}

function drawWoodRail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = P.woodDark
  ctx.fillRect(x, y + h - U / 3, w, U / 3)
  ctx.fillStyle = P.woodMid
  ctx.fillRect(x, y, w, h - U / 3)
  ctx.fillStyle = P.woodHi
  ctx.fillRect(x, y, w, U / 2)
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(x, y + h - U / 2, w, U / 4)
}

function drawSlime(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, t: number) {
  const pulse = 0.5 + 0.5 * Math.sin(t / 900 + x * 0.4 + y * 0.3)
  const flow = Math.sin(t / 1200 + y * 0.8) * U * 0.3

  ctx.fillStyle = P.slimeDark
  ctx.fillRect(px + U, py + 2 * U, TILE - 2 * U, TILE - 4 * U)
  ctx.fillStyle = P.slimeMid
  ctx.fillRect(px + 1.5 * U, py + 2.5 * U + flow, TILE - 3 * U, TILE - 5 * U)
  ctx.fillStyle = `rgba(82,183,136,${0.35 + pulse * 0.35})`
  ctx.fillRect(px + 2 * U, py + 3 * U + flow, TILE - 4 * U, TILE - 6 * U)
  ctx.fillStyle = P.slimeHi
  ctx.globalAlpha = 0.25 + pulse * 0.35
  ctx.fillRect(px + 3 * U, py + 3.5 * U + flow, TILE - 6 * U, U)
  ctx.globalAlpha = 1

  if (tileHash(x + t * 0.001, y) > 0.6) {
    ctx.fillStyle = 'rgba(149,213,178,0.5)'
    ctx.fillRect(px + 4 * U, py + 4 * U - ((t / 40) % (3 * U)), U / 2, U / 2)
  }
}

function drawTorchBase(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  drawStoneFloor(ctx, px, py, x, y, 0.5)
  ctx.fillStyle = P.woodDark
  ctx.fillRect(px + 3 * U, py + 4 * U, 2 * U, 3 * U)
  ctx.fillStyle = P.woodMid
  ctx.fillRect(px + 3.2 * U, py + 4 * U, U, 3 * U)
  ctx.fillStyle = P.stoneDark
  ctx.fillRect(px + 2.8 * U, py + 5.5 * U, 2.4 * U, U / 2)
}

function drawTorchFlame(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, t: number) {
  const flicker = 0.7 + 0.3 * Math.sin(t / 80 + x)
  const sway = Math.sin(t / 120 + y) * U * 0.15
  const cx = px + 4 * U + sway
  const cy = py + 2.5 * U

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE * 1.6)
  g.addColorStop(0, `rgba(255,232,163,${0.6 * flicker})`)
  g.addColorStop(0.3, `rgba(255,179,71,${0.34 * flicker})`)
  g.addColorStop(0.65, `rgba(232,148,58,${0.14 * flicker})`)
  g.addColorStop(1, 'rgba(255,140,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(px - TILE * 1.1, py - TILE * 1.0, TILE * 3.2, TILE * 3.2)

  ctx.fillStyle = P.torch
  ctx.fillRect(cx - U, cy, 2 * U, 2.5 * U)
  ctx.fillStyle = P.torchCore
  ctx.fillRect(cx - U * 0.6, cy - U * 0.3, 1.2 * U, 1.5 * U)
}

function drawBanner(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = P.woodMid
  ctx.fillRect(px + 3.5 * U, py + U, U, 6 * U)
  ctx.fillStyle = P.bannerRed
  ctx.fillRect(px + U, py + 2 * U, 5 * U, 4 * U)
  ctx.fillStyle = P.bannerGold
  ctx.fillRect(px + U, py + 2 * U, 5 * U, U)
  ctx.fillRect(px + 2 * U, py + 4 * U, U, 2 * U)
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(px + 5 * U, py + 2 * U, U / 2, 4 * U)
}

function drawChest(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = P.chestWood
  ctx.fillRect(px + U, py + 3 * U, 6 * U, 4 * U)
  ctx.fillStyle = P.woodDark
  ctx.fillRect(px + U, py + 3 * U, 6 * U, U)
  ctx.fillStyle = P.chestGold
  ctx.fillRect(px + 3 * U, py + 4.5 * U, 2 * U, U)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(px + U, py + 6.5 * U, 6 * U, U / 2)
}

function drawPot(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = P.pot
  ctx.fillRect(px + 2 * U, py + 4 * U, 4 * U, 3 * U)
  ctx.fillStyle = P.potHi
  ctx.fillRect(px + 2.5 * U, py + 4.2 * U, 3 * U, U)
  ctx.fillStyle = P.woodMid
  ctx.fillRect(px + 3 * U, py + 3 * U, 2 * U, U)
}

function drawSign(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = P.woodMid
  ctx.fillRect(px + 3.5 * U, py + 3 * U, U, 4 * U)
  ctx.fillStyle = P.woodLight
  ctx.fillRect(px + U, py + U, 6 * U, 3 * U)
  ctx.fillStyle = P.carpetTrim
  ctx.fillRect(px + 2 * U, py + 2 * U, 4 * U, U)
}

function drawStation(ctx: CanvasRenderingContext2D, s: Station, t: number) {
  const px = s.cx * TILE
  const py = s.cy * TILE
  if (s.type === 'dungeon') drawPortal(ctx, px, py, t)
  else if (s.type === 'workbench') drawAnvil(ctx, px, py)
  else if (s.type === 'market') drawMarketStall(ctx, px, py, t)
  else drawArmorStand(ctx, px, py)
}

function drawPortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const R = TILE * 1.5
  const pulse = 0.5 + 0.5 * Math.sin(t / 350)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = P.slimeDark
  octagon(ctx, R)
  ctx.fill()
  ctx.fillStyle = `rgba(45,106,79,${0.35 + pulse * 0.3})`
  octagon(ctx, R * 0.82)
  ctx.fill()
  ctx.strokeStyle = P.slimeGlow
  ctx.lineWidth = 2
  octagon(ctx, R * 0.82)
  ctx.stroke()
  ctx.fillStyle = `rgba(149,213,178,${0.5 + pulse * 0.4})`
  ctx.fillRect(-2, -R * 0.45, 4, R * 0.9)
  ctx.fillRect(-R * 0.45, -2, R * 0.9, 4)
  ctx.restore()
}

function octagon(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r * 0.62
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawMarketStall(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  ctx.fillStyle = P.woodDark
  ctx.fillRect(cx - 5 * U, cy + U, 10 * U, 5 * U)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? P.carpet : P.carpetLight
    ctx.fillRect(cx - 5 * U + i * 2 * U, cy - 3 * U, 2 * U, 3 * U)
  }
  ctx.fillStyle = P.woodMid
  ctx.fillRect(cx - 5 * U, cy - 3 * U, U, 9 * U)
  ctx.fillRect(cx + 4 * U, cy - 3 * U, U, 9 * U)
  const pulse = 0.5 + 0.5 * Math.sin(t / 300)
  ctx.fillStyle = `rgba(201,162,39,${0.5 + pulse * 0.5})`
  ctx.save()
  ctx.translate(cx, cy - 6 * U)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-1.5 * U, -1.5 * U, 3 * U, 3 * U)
  ctx.restore()
}

function drawAnvil(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = P.stoneDark
  ctx.fillRect(cx - 3 * U, cy + 2 * U, 6 * U, 3 * U)
  ctx.fillStyle = P.stoneMid
  ctx.fillRect(cx - 4 * U, cy - 2 * U, 8 * U, 3 * U)
  ctx.fillStyle = P.stoneLight
  ctx.fillRect(cx - 5 * U, cy - 3 * U, 4 * U, 2 * U)
  ctx.fillStyle = P.stoneHi
  ctx.fillRect(cx - 5 * U, cy - 3 * U, 4 * U, U / 2)
  ctx.fillStyle = P.torch
  ctx.fillRect(cx + 2 * U, cy - 5 * U, U, 2 * U)
}

function drawArmorStand(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = P.woodDark
  ctx.fillRect(cx - 3 * U, cy + 4 * U, 6 * U, U)
  ctx.fillStyle = P.woodMid
  ctx.fillRect(cx - U, cy - 4 * U, 2 * U, 8 * U)
  ctx.fillStyle = P.stoneMid
  ctx.fillRect(cx - 4 * U, cy - 3 * U, 8 * U, 4 * U)
  ctx.fillStyle = P.stoneLight
  ctx.fillRect(cx - 4 * U, cy - 3 * U, 8 * U, U)
  ctx.fillStyle = P.stoneHi
  ctx.fillRect(cx - U, cy - 6 * U, 2 * U, 2 * U)
}
