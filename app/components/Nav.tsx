'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/app/components/AuthProvider'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()

  useEffect(() => {
    const mode = document.body.dataset.mode
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = mode === 'dark' || (!mode && sysDark)
    setDark(isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.body.dataset.mode = next ? 'dark' : 'light'
    document.documentElement.style.colorScheme = next ? 'dark' : 'light'
  }

  function close() { setMenuOpen(false) }

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? ''

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}${menuOpen ? ' nav--open' : ''}`} id="nav">
      <a className="nav__brand" href="https://makeuoa.nz" onClick={close}>
        <Image src="/logo.png" alt="" width={26} height={26} style={{ borderRadius: 4 }} />
        <span>UoA Maker Club</span>
        <span className="slash">/ projects</span>
      </a>

      <button
        className="nav__hamburger"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
        <a href="https://makeuoa.nz/about/" onClick={close}>About</a>
        <a href="https://makeuoa.nz/code-of-conduct/" onClick={close}>Code of conduct</a>
        <a href="https://makeuoa.nz/tag/updates/" onClick={close}>Updates</a>
        <a href="https://vend.makeuoa.nz/" onClick={close}>Vending machine</a>
        <Link href="/" onClick={close}>Projects</Link>
        <Link href="/submit" className="nav__submit-link" onClick={close}>Submit</Link>

        <div className="nav__theme-toggle">
          <button
            className={`nav__theme-btn${!dark ? ' is-active' : ''}`}
            onClick={toggleDark}
            aria-label="Light mode"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
            </svg>
          </button>
          <button
            className={`nav__theme-btn${dark ? ' is-active' : ''}`}
            onClick={toggleDark}
            aria-label="Dark mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </div>

        {!loading && (
          user ? (
            <>
              {user.email === 'makerclubuoa@gmail.com' && (
                <Link href="/admin" className="nav__auth" onClick={close}>Admin</Link>
              )}
              <Link href="/dashboard" className="nav__auth nav__user-name" onClick={close}>{displayName}</Link>
              <button className="nav__auth" onClick={() => { signOut(); close() }}>Sign out</button>
            </>
          ) : (
            <Link href="/login" className="nav__auth" onClick={close}>Sign in</Link>
          )
        )}
      </div>
    </nav>
  )
}
