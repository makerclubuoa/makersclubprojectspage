'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  display_name: string | null
  email: string | null
  public_name: string | null
  name_preference: string | null
  credit_consented: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, email, public_name, name_preference, credit_consented')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }

  // Mirror the signed-in user into Ghost (two-way sync during the Ghost transition).
  // Idempotent server-side; guarded here so it runs at most once per browser session.
  async function ensureGhostSync(session: Session) {
    const key = `ghost-synced-${session.user.id}`
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return
    try {
      await fetch('/api/auth/ensure-ghost', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1')
    } catch {
      // best-effort; will retry on next login
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        ensureGhostSync(session)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        ensureGhostSync(session)
      } else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
