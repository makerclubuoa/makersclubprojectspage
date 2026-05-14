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
        <a href="https://makeuoa.nz">About</a>
        <Link href="/" className="active">Projects</Link>
        <a href="#suggest">Workshops</a>
        <a href="#">Journal</a>
        <Link href="/submit" className="nav__submit-link">Submit_</Link>
        <button className="nav__mode-btn" onClick={toggleDark}>
          {dark ? 'Light_' : 'Dark_'}
        </button>
        {!loading && (
          user ? (
            <>
              <span className="nav__user-name">{displayName}</span>
              <button className="nav__mode-btn" onClick={signOut}>Sign_out</button>
            </>
          ) : (
            <Link href="/login" className="nav__auth">Sign_in</Link>
          )
        )}
        <a className="nav__cta" href="https://makeuoa.nz">Join_</a>
      </div>
    </nav>
  )
}
