import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThirdwebProvider } from '@/components/ThirdwebProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NovaAgent - AI Shopping Concierge',
  description: 'Experience the future of shopping with AI agents and blockchain security',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  )
}