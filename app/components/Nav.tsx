'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/components/AuthProvider'

const NAVLINK =
  'text-ink px-[11px] py-1.5 rounded-full transition-colors duration-150 whitespace-nowrap hover:bg-paper-2 max-md:px-6 max-md:py-4 max-md:rounded-none max-md:text-base max-md:font-medium max-md:text-left max-md:w-full max-md:border-b max-md:border-rule max-md:last:border-b-0'
const NAVAUTH =
  'text-ink px-3 py-[7px] rounded-full font-[550] text-sm transition-opacity duration-200 whitespace-nowrap hover:opacity-70'
const HBAR = 'block w-5 h-[1.5px] bg-ink rounded-[2px] transition-[transform,opacity] duration-200'

export default function Nav() {
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved === 'dark' || (!saved && sysDark)
    setDark(isDark)
    document.body.dataset.mode = isDark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
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
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  function close() { setMenuOpen(false) }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'makerclubuoa@gmail.com').split(',').map(e => e.trim())
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? ''

  const themeBtn = (active: boolean) =>
    `flex items-center justify-center w-7 h-7 rounded-full transition-[background,color,box-shadow] duration-200 ${active ? 'bg-paper text-ink shadow-[0_1px_4px_rgba(0,0,0,0.15)]' : 'bg-transparent text-muted'}`

  const SunIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  )
  const MoonIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )

  const ThemeToggle = () => (
    <div className="inline-flex items-center bg-paper-2 rounded-full p-[3px] gap-0.5">
      <button className={themeBtn(!dark)} onClick={toggleDark} aria-label="Light mode"><SunIcon /></button>
      <button className={themeBtn(dark)} onClick={toggleDark} aria-label="Dark mode"><MoonIcon /></button>
    </div>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-8 py-3.5 bg-paper border-b border-rule text-[15px] max-md:grid-cols-[1fr_auto] max-md:px-5 max-md:overflow-visible" id="nav">

      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button className="hidden max-md:flex flex-col justify-center gap-[5px] cursor-pointer p-1.5 shrink-0" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span className={`${HBAR}${menuOpen ? ' translate-y-[6.5px] rotate-45' : ''}`} />
          <span className={`${HBAR}${menuOpen ? ' opacity-0' : ''}`} />
          <span className={`${HBAR}${menuOpen ? ' -translate-y-[6.5px] -rotate-45' : ''}`} />
        </button>
        <a className="flex items-center gap-3" href="https://makeuoa.nz">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/aumc-logo.svg" alt="UoA Maker Club" className="h-8 w-auto block dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_h_w.svg" alt="UoA Maker Club" className="h-8 w-auto hidden dark:block" />
        </a>
      </div>

      {/* Center: nav links (mobile drawer) */}
      <div className={`flex gap-0.5 items-center justify-center text-[15px] font-medium max-md:absolute max-md:top-full max-md:left-0 max-md:right-0 max-md:h-[calc(100svh-58px)] max-md:bg-paper max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:pb-6 max-md:overflow-y-auto max-md:border-t max-md:border-rule ${menuOpen ? 'max-md:flex' : 'max-md:hidden'}`}>
        <a href="https://makeuoa.nz/about/" className={NAVLINK} onClick={close}>About</a>
        <a href="https://makeuoa.nz/code-of-conduct/" className={NAVLINK} onClick={close}>Code of conduct</a>
        <a href="https://makeuoa.nz/tag/updates/" className={NAVLINK} onClick={close}>Updates</a>
        <a href="https://vend.makeuoa.nz/" className={NAVLINK} onClick={close}>Vending machine</a>
        <Link href="/projects" className={NAVLINK} onClick={close}>Projects</Link>
        <Link href="/submit" className="hidden max-md:block max-md:mx-5 max-md:mt-3 max-md:px-5 max-md:py-3.5 max-md:rounded-base max-md:bg-ink max-md:text-paper max-md:font-semibold max-md:text-center max-md:whitespace-nowrap" onClick={close}>Submit a project</Link>

        {/* Mobile-only footer inside the drawer */}
        <div className="hidden max-md:flex max-md:items-center max-md:gap-3 max-md:px-6 max-md:py-4 max-md:mt-auto max-md:border-t max-md:border-rule">
          <ThemeToggle />
          {!loading && (
            user ? (
              <>
                <Link href="/dashboard" className="text-ink px-2 py-[7px] rounded-full font-[550] text-sm transition-opacity duration-200 hover:opacity-70 max-w-[14ch] truncate" onClick={close}>{displayName}</Link>
                <button className={NAVAUTH} onClick={() => { signOut(); close() }}>Sign out</button>
              </>
            ) : (
              <Link href="/login" className={NAVAUTH} onClick={close}>Sign in</Link>
            )
          )}
        </div>
      </div>

      {/* Right: theme toggle + auth */}
      <div className="flex items-center gap-2 justify-end max-md:hidden">
        <ThemeToggle />
        {!loading && (
          user ? (
            <>
              {adminEmails.includes(user.email ?? '') && (
                <Link href="/admin" className={NAVAUTH} onClick={close}>Admin</Link>
              )}
              <Link href="/dashboard" className="text-ink px-2 py-[7px] rounded-full font-[550] text-sm transition-opacity duration-200 hover:opacity-70 max-w-[14ch] truncate" onClick={close}>{displayName}</Link>
              <button className={NAVAUTH} onClick={() => { signOut(); close() }}>Sign out</button>
              <Link href="/submit" className="bg-ink text-paper px-4 py-[7px] rounded-full font-semibold text-sm transition-opacity duration-200 hover:opacity-80" onClick={close}>Submit a project</Link>
            </>
          ) : (
            <>
              <Link href="/login" className={NAVAUTH} onClick={close}>Sign in</Link>
              <Link href="/submit" className="bg-ink text-paper px-4 py-[7px] rounded-full font-semibold text-sm transition-opacity duration-200 hover:opacity-80" onClick={close}>Submit a project</Link>
            </>
          )
        )}
      </div>
    </nav>
  )
}
