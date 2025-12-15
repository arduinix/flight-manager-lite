import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppThemeProvider } from './theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flight Manager Lite',
  description: 'Model rocket payload and flight management tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppThemeProvider>
          {children}
        </AppThemeProvider>
      </body>
    </html>
  )
}

