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
    setDark(mode === 'dark' || (!mode && sysDark))
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
  }

  function close() { setMenuOpen(false) }

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? ''

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}${menuOpen ? ' nav--open' : ''}`} id="nav">
      <a className="nav__brand" href="https://makeuoa.nz" onClick={close}>
        <Image src="/logo.png" alt="" width={26} height={26} style={{ borderRadius: 4 }} />
        <span>MAKE_UOA</span>
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
        <Link href="/submit" className="nav__submit-link" onClick={close}>Submit_</Link>
        <button className="nav__mode-btn" onClick={() => { toggleDark(); close() }}>
          {dark ? 'Light_' : 'Dark_'}
        </button>
        {!loading && (
          user ? (
            <>
              {user.email === 'makerclubuoa@gmail.com' && (
                <Link href="/admin" className="nav__mode-btn" onClick={close}>Admin_</Link>
              )}
              <Link href="/dashboard" className="nav__auth nav__user-name" onClick={close}>{displayName}</Link>
              <button className="nav__mode-btn" onClick={() => { signOut(); close() }}>Sign_out</button>
            </>
          ) : (
            <Link href="/login" className="nav__auth" onClick={close}>Sign_in</Link>
          )
        )}
      </div>
    </nav>
  )
}
