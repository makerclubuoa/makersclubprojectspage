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
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var s=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&s)){document.body.dataset.mode='dark';document.documentElement.style.colorScheme='dark';}else{document.body.dataset.mode='light';}})()` }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
