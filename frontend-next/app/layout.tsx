import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Beratheon — Pixel Dungeon Crawler on Stacks',
  description:
    'Beratheon is a pixel dungeon RPG on Stacks where players play, stake, and earn together. FlowVault Lock/Hold/Split gates Dungetron and Gigamarket; on-chain items, username NFTs, and STX trading — built continuously.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark text-gray-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
