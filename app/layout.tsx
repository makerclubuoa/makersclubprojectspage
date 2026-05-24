import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/app/components/AuthProvider'

export const metadata: Metadata = {
  title: 'PROJECTS · MAKER CLUB',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
