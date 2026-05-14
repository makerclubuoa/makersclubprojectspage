'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/app/components/AuthProvider'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(false)
  const { user, profile, loading, signOut } = useAuth()

  useEffect(() => {
    const mode = document.body.dataset.mode
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(mode === 'dark' || (!mode && sysDark))
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.body.dataset.mode = next ? 'dark' : 'light'
  }

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? ''

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
      <a className="nav__brand" href="https://makeuoa.nz">
        <Image src="/logo.png" alt="" width={26} height={26} style={{ borderRadius: 4 }} />
        <span>MAKE_UOA</span>
        <span className="slash">/ projects</span>
      </a>
      <div className="nav__links">
        <a href="https://makeuoa.nz/about/">About</a>
        <a href="https://makeuoa.nz/code-of-conduct/">Code of conduct</a>
        <a href="https://makeuoa.nz/tag/updates/">Updates</a>
        <a href="https://vend.makeuoa.nz/">Vending machine</a>
        <Link href="/">Projects</Link>
        <Link href="/submit" className="nav__submit-link">Submit_</Link>
        <button className="nav__mode-btn" onClick={toggleDark}>
          {dark ? 'Light_' : 'Dark_'}
        </button>
        {!loading && (
          user ? (
            <>
              {user.email === 'makerclubuoa@gmail.com' && (
                <Link href="/admin" className="nav__mode-btn">Admin_</Link>
              )}
              <Link href="/dashboard" className="nav__auth nav__user-name">{displayName}</Link>
              <button className="nav__mode-btn" onClick={signOut}>Sign_out</button>
            </>
          ) : (
            <Link href="/login" className="nav__auth">Sign_in</Link>
          )
        )}
      </div>
    </nav>
  )
}
