'use client'

import { useEffect, useState } from 'react'
import BrandCrest from './BrandCrest'

const MOBILE_QUERY = '(max-width: 768px)'

export default function MobileDesktopGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const sync = () => setBlocked(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (blocked) {
    return (
      <div className="mobile-gate">
        <div className="mobile-gate-inner">
          <div className="mobile-gate-logo">
            <BrandCrest size={120} />
          </div>
          <h1 className="mobile-gate-title">Switch to desktop</h1>
          <p className="mobile-gate-copy">
            Beratheon is a keyboard-first pixel dungeon on Stacks. Hall exploration, card combat, gear crafting,
            and Gigamarket work best on a larger screen.
          </p>
          <p className="mobile-gate-hint">Open <strong>beratheon.vercel.app</strong> on a laptop or desktop.</p>
        </div>
      </div>
    )
  }

  return children
}
