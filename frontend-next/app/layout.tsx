import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Beratheon — Pixel Dungeon Crawler',
  description: 'Programmable dungeon economy on Stacks. Pixel combat, crafting, and FlowVault treasury routing.',
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
