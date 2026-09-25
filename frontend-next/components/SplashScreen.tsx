'use client'

import { useEffect, useState } from 'react'

const MIN_VISIBLE_MS = 1300
const FADE_MS = 400

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in')

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPhase('out'), MIN_VISIBLE_MS)
    return () => window.clearTimeout(fadeTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'out') return
    const doneTimer = window.setTimeout(() => setPhase('done'), FADE_MS)
    return () => window.clearTimeout(doneTimer)
  }, [phase])

  return (
    <>
      {phase !== 'done' && (
        <div className={`splash-gate ${phase === 'out' ? 'splash-gate--out' : ''}`}>
          <div className="splash-inner">
            <div className="splash-wordmark-wrap">
              <span className="splash-wordmark-outline">BERATHEON</span>
              <span className="splash-wordmark-face">BERATHEON</span>
            </div>
            <div className="splash-rule" />
            <span className="splash-tagline">Pixel Dungeon RPG · On Stacks</span>
            <span className="splash-loading">Loading</span>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
