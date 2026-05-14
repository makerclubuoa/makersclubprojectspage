'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/components/AuthProvider'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [user, loading, router])

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) setError(error.message)
  }

  if (loading) return null

  return (
    <>
      <CursorTrail />
      <Nav />
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px' }}>
        <div className="form form--login" style={{ maxWidth: 420, width: '100%' }}>
          <div className="form__inner">
            <div className="seclabel" style={{ marginBottom: 28 }}>
              <span className="num">[05]</span>
              <span>Sign_in</span>
              <span className="bar" />
            </div>

            {sent ? (
              <div className="submit-success">
                <div className="submit-success__icon">✉</div>
                <h2>// Check your inbox.</h2>
                <p>
                  We sent a magic link to <strong>{email}</strong>. Click it to finish signing in.
                </p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--ink-2)', marginBottom: 28, fontSize: 13, lineHeight: 1.65 }}>
                  Sign in to like projects and submit your own to the archive.
                </p>

                <form onSubmit={handleMagicLink}>
                  <div className="field">
                    <label>
                      Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p style={{ color: '#ff3c6d', fontSize: 12, marginBottom: 12, letterSpacing: '0.04em' }}>
                      {error}
                    </p>
                  )}
                  <button
                    className="btn btn--gradient"
                    type="submit"
                    disabled={sending}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                  >
                    {sending ? 'Sending…' : 'Send magic link'} <span className="arr">→</span>
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                  or
                  <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                </div>

                <button
                  className="btn btn--ghost"
                  onClick={handleGoogle}
                  style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                >
                  Continue with Google
                </button>

                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 20, lineHeight: 1.5, letterSpacing: '0.04em' }}>
                  No passwords stored. Magic link or Google sign-in via Supabase Auth.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
