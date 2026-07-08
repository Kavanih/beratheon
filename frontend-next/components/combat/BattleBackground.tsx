'use client'

import { useEffect, useRef } from 'react'
import { BATTLE_TILE } from '@/lib/battleRoomMap'
import { paintBattleViewport } from '@/lib/hallRenderer'

/** Full-bleed dungeon tile floor behind the entire battle screen. */
export default function BattleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    let raf = 0
    const draw = (t: number) => {
      const cw = canvas.width
      const ch = canvas.height
      if (cw > 0 && ch > 0) {
        paintBattleViewport(ctx, cw, ch, BATTLE_TILE, t)
        const vg = ctx.createRadialGradient(
          cw / 2,
          ch * 0.5,
          Math.min(cw, ch) * 0.08,
          cw / 2,
          ch * 0.5,
          Math.max(cw, ch) * 0.78
        )
        vg.addColorStop(0, 'rgba(0,0,0,0)')
        vg.addColorStop(1, 'rgba(0,0,0,0.35)')
        ctx.fillStyle = vg
        ctx.fillRect(0, 0, cw, ch)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full crisp" aria-hidden />
}
