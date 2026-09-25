'use client'

import { WalletProvider } from '@/context/WalletProvider'
import MobileDesktopGate from '@/components/MobileDesktopGate'
import SplashScreen from '@/components/SplashScreen'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <SplashScreen>
        <MobileDesktopGate>{children}</MobileDesktopGate>
      </SplashScreen>
    </WalletProvider>
  )
}
