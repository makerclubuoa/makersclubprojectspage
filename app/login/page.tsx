'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/components/AuthProvider'
import { form, formInner, formFig, seclabel, seclabelNum, seclabelBar, field, fieldLabel, fieldReq, fieldInput, btnGradient, btnArr } from '@/lib/ui'

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

    // Open signup: Supabase creates the user on first sign-in (shouldCreateUser
    // defaults true); the post-login ensure-ghost sync mirrors them into Ghost.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (loading) return null

  return (
    <>
      <CursorTrail />
      <Nav />
      <main className="min-h-[80vh] flex items-center justify-center px-5 py-[100px]">
        <div className={`${form} max-w-[420px] w-full`}>
          <div className={formInner}>
            <span className={formFig}>FIG.05 — ACCOUNT</span>
            <div className={`${seclabel} mb-7`}>
              <span className={seclabelNum}>[05]</span>
              <span>Sign_in</span>
              <span className={seclabelBar} />
            </div>

            {sent ? (
              <div className="border border-pop-magenta py-12 px-9 text-center bg-[color-mix(in_oklab,var(--pop-magenta)_7%,var(--paper))]">
                <div className="text-[36px] text-pop-magenta mb-4">✉</div>
                <h2 className="text-[32px] font-normal mt-0 mb-3">// Check your inbox.</h2>
                <p className="text-ink-2 text-sm max-w-[44ch] mx-auto leading-[1.6]">
                  We sent a magic link to <strong>{email}</strong>. Click it to finish signing in.
                </p>
              </div>
            ) : (
              <>
                <p className="text-ink-2 mb-7 text-[13px] leading-[1.65]">
                  Sign in to like projects and submit your own to the archive. Maker Club members only.
                </p>

                <form onSubmit={handleMagicLink}>
                  <div className={field}>
                    <label className={fieldLabel}>
                      Email <span className={fieldReq}>*</span>
                    </label>
                    <input
                      className={fieldInput}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-pop-red text-xs mb-3 tracking-[0.04em]">
                      {error}
                    </p>
                  )}
                  <button
                    className={`${btnGradient} w-full justify-center flex`}
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? 'Checking…' : 'Send magic link'} <span className={btnArr}>→</span>
                  </button>
                </form>

                <p className="text-[11px] text-muted mt-5 leading-[1.5] tracking-[0.04em]">
                  No password needed. We&rsquo;ll send a one-click sign-in link to your inbox.{' '}
                  <a href="https://makeuoa.nz" className="text-ink-2 underline">Not a member yet?</a>
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