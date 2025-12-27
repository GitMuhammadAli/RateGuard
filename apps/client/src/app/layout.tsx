import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RateGuard - API Rate Limiting Made Simple',
  description: 'Protect your APIs with intelligent rate limiting. Monitor usage, prevent abuse, and scale with confidence.',
  keywords: ['API', 'rate limiting', 'gateway', 'security', 'monitoring'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}

