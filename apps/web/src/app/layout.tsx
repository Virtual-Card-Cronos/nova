import type { Metadata } from 'next'
import { ThirdwebProvider } from '@/components/ThirdwebProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'NovaAgent - AI Shopping Concierge',
  description: 'Experience the future of shopping with AI agents and blockchain security',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  )
}