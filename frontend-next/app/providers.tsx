'use client'

import { WalletProvider } from '@/context/WalletProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
