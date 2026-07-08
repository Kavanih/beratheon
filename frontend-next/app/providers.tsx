'use client'

import { WalletProvider } from '@/context/WalletProvider'
import MobileDesktopGate from '@/components/MobileDesktopGate'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <MobileDesktopGate>{children}</MobileDesktopGate>
    </WalletProvider>
  )
}
