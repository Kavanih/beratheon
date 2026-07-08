'use client'

import { useEffect, useRef, useState } from 'react'
import { drawCharacter, Look, NOOB_LOOK } from './Character'
import { HALL_PALETTE } from '@/lib/hallMap'
import {
  drawPlayerShadow,
  HALL_STATIONS,
  isWallTile,
  MAP_H,
  MAP_W,
  paintHallAnimated,
  paintHallStatic,
  TILE,
  U,
  type Station,
} from '@/lib/hallRenderer'

export default function HubWorld({
  onEnterDungeon,
  onOpenWorkbench,
  onOpenGear,
  onOpenMarket,
  playerName,
  look = NOOB_LOOK,
}: {
  onEnterDungeon: () => void
  onOpenWorkbench: () => void
  onOpenGear: () => void
  onOpenMarket: () => void
  playerName: string
  look?: Look
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pos = useRef({ x: 15, y: 17 })
  const dir = useRef<'up' | 'down' | 'left' | 'right'>('down')
  const keys = useRef<Record<string, boolean>>({})
  const cam = useRef({ x: 0, y: 0 })
  const lookRef = useRef(look)
  lookRef.current = look
  const [nearStation, setNearStation] = useState<Station | null>(null)
  const nearRef = useRef<Station | null>(null)

  const actionsRef = useRef({ onEnterDungeon, onOpenWorkbench, onOpenGear, onOpenMarket })
  actionsRef.current = { onEnterDungeon, onOpenWorkbench, onOpenGear, onOpenMarket }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = MAP_W * TILE
    mapCanvas.height = MAP_H * TILE
    paintHallStatic(mapCanvas.getContext('2d')!)

    const resize = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const blocked = (nx: number, ny: number) => {
      const hw = 0.3
      const hh = 0.2
      const corners = [
        [nx - hw, ny - hh],
        [nx + hw, ny - hh],
        [nx - hw, ny + hh],
        [nx + hw, ny + hh],
      ]
      return corners.some(([cx, cy]) => isWallTile(Math.floor(cx), Math.floor(cy)))
    }

    const trigger = () => {
      const s = nearRef.current
      if (!s) return
      if (s.type === 'dungeon') actionsRef.current.onEnterDungeon()
      else if (s.type === 'workbench') actionsRef.current.onOpenWorkbench()
      else if (s.type === 'market') actionsRef.current.onOpenMarket()
      else actionsRef.current.onOpenGear()
    }

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase()
      keys.current[k] = down
      if (down && (k === 'e' || k === 'enter' || k === ' ')) trigger()
    }
    const kd = (e: KeyboardEvent) => onKey(e, true)
    const ku = (e: KeyboardEvent) => onKey(e, false)
    const clearKeys = () => {
      keys.current = {}
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', clearKeys)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearKeys()
    })

    let raf = 0
    const speed = 0.09
    const loop = () => {
      const t = performance.now()
      let dx = 0
      let dy = 0
      if (keys.current['w'] || keys.current['arrowup']) dy -= 1
      if (keys.current['s'] || keys.current['arrowdown']) dy += 1
      if (keys.current['a'] || keys.current['arrowleft']) dx -= 1
      if (keys.current['d'] || keys.current['arrowright']) dx += 1
      const moving = dx !== 0 || dy !== 0
      if (moving) {
        if (Math.abs(dx) > Math.abs(dy)) dir.current = dx < 0 ? 'left' : 'right'
        else dir.current = dy < 0 ? 'up' : 'down'
        const len = Math.hypot(dx, dy) || 1
        const tx = pos.current.x + (dx / len) * speed
        const ty = pos.current.y + (dy / len) * speed
        if (!blocked(tx, pos.current.y)) pos.current.x = tx
        if (!blocked(pos.current.x, ty)) pos.current.y = ty
      }

      let best: Station | null = null
      let bestD = 1.6
      for (const s of HALL_STATIONS) {
        const d = Math.hypot(s.cx - pos.current.x, s.cy - pos.current.y)
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
      if (best !== nearRef.current) {
        nearRef.current = best
        setNearStation(best)
      }

      const targetX = pos.current.x * TILE - canvas.width / 2
      const targetY = pos.current.y * TILE - canvas.height / 2
      cam.current.x += (targetX - cam.current.x) * 0.12
      cam.current.y += (targetY - cam.current.y) * 0.12
      cam.current.x = Math.max(0, Math.min(MAP_W * TILE - canvas.width, cam.current.x))
      cam.current.y = Math.max(0, Math.min(MAP_H * TILE - canvas.height, cam.current.y))
      if (MAP_W * TILE < canvas.width) cam.current.x = (MAP_W * TILE - canvas.width) / 2
      if (MAP_H * TILE < canvas.height) cam.current.y = (MAP_H * TILE - canvas.height) / 2

      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = HALL_PALETTE.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(-Math.round(cam.current.x), -Math.round(cam.current.y))
      ctx.drawImage(mapCanvas, 0, 0)
      paintHallAnimated(ctx, t)

      const wx = pos.current.x * TILE
      const wy = pos.current.y * TILE
      drawPlayerShadow(ctx, wx, wy + 1.6 * U)
      drawCharacter(ctx, wx, wy + 1.6 * U, TILE / 7.5, dir.current, t / 260, moving, lookRef.current)

      ctx.font = '10px "Silkscreen", monospace'
      ctx.textAlign = 'center'
      const nx = wx
      const ny = wy - 15 * U
      const w = ctx.measureText(playerName).width + 10
      ctx.fillStyle = 'rgba(26,20,16,0.88)'
      ctx.fillRect(nx - w / 2, ny - 11, w, 13)
      ctx.strokeStyle = HALL_PALETTE.woodMid
      ctx.strokeRect(nx - w / 2, ny - 11, w, 13)
      ctx.fillStyle = '#d4c4a8'
      ctx.fillText(playerName, nx, ny)
      ctx.restore()

      const g = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.height * 0.25,
        canvas.width / 2,
        canvas.height / 2,
        canvas.height * 0.85
      )
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, 'rgba(0,0,0,0.62)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', clearKeys)
    }
  }, [playerName])

  return (
    <div className="hub-world relative h-full w-full overflow-hidden" style={{ background: HALL_PALETTE.bg }}>
      <canvas ref={canvasRef} className="hub-canvas h-full w-full crisp" />

      <div className="pointer-events-none absolute left-3 top-3 pixel-panel px-3 py-2 font-silk text-[9px] text-parchment/70">
        <div className="mb-1 text-gold">EXPLORE THE HALL</div>
        <div>MOVE&nbsp;&nbsp;<span className="text-gold">WASD / ARROWS</span></div>
        <div>ACT&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gold">E / SPACE</span></div>
      </div>

      {nearStation && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => {
              if (nearStation.type === 'dungeon') onEnterDungeon()
              else if (nearStation.type === 'workbench') onOpenWorkbench()
              else if (nearStation.type === 'market') onOpenMarket()
              else onOpenGear()
            }}
            className="pixel-btn pixel-btn-gold animate-popin px-5 py-3 font-silk text-[12px]"
          >
            <span className="mr-2 rounded border border-black/30 bg-black/20 px-1.5 py-0.5">E</span>
            {nearStation.prompt}
          </button>
        </div>
      )}
    </div>
  )
}
