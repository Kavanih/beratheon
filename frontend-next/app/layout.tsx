import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Beratheon — Pixel Dungeon Crawler on Stacks',
  description:
    'Beratheon is a pixel dungeon RPG on Stacks — battle through Dungetron, forge gear at the Workbench, and trade on-chain items and materials on Gigamarket, backed by username NFTs and STX trading. Built continuously.',
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
