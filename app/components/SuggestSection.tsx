'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/components/AuthProvider'
import CustomSelect from '@/app/components/CustomSelect'

const HINTS = [
  'Intro to Arduino',
  'Crochet meetup',
  'Sourdough night',
  'Laser cutter 101',
  'Resin casting',
  'Solder & snacks',
]

const TYPES = ['Workshop', 'Meetup', 'Hackathon', 'Open hours', 'Show & tell', 'Other']

function flashField(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.animate(
    [{ borderBottomColor: 'var(--rule)' }, { borderBottomColor: '#ff25c7' }, { borderBottomColor: 'var(--rule)' }],
    { duration: 600, iterations: 2 },
  )
}

export default function SuggestSection() {
  const { user, profile, loading } = useAuth()
  const [idea, setIdea] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [detail, setDetail] = useState('')
  const [size, setSize] = useState('~ 10 — 20 people')
  const [helpRun, setHelpRun] = useState('Maybe — ask me')
  const [eventType, setEventType] = useState('Workshop')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.display_name && !name) setName(profile.display_name)
    if (profile?.email && !contact) setContact(profile.email)
  }, [profile])

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!idea.trim()) { flashField('f-idea'); return }
    if (!name.trim()) { flashField('f-name'); return }
    setSubmitting(true)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'suggestion',
        idea: idea.trim(),
        eventType,
        name: name.trim(),
        contact: contact.trim(),
        detail: detail.trim(),
        size,
        helpRun,
        userEmail: user?.email,
      }),
    })
    setSubmitting(false)
    setSent(true)
  }

  const left = (
    <div>
      <h2>What should we <em>make</em> next?</h2>
      <p>
        We run nine-or-so workshops every semester — soldering, sewing, sourdough,
        screen-printing, whatever the members are into. Tell us what you&rsquo;d show up for
        and we&rsquo;ll do our best to make it happen.
      </p>
      <p style={{ color: 'var(--muted)' }}>
        Submissions go to the committee inbox. We read every one. The most-asked-for ideas
        turn into actual events within a few weeks.
      </p>
      <div className="suggest__hints">
        {HINTS.map(h => (
          <button key={h} onClick={() => setIdea(h)}>{h}</button>
        ))}
      </div>
      <div className="suggest__stats">
        <div><div className="k">Suggestions / sem</div><div className="v">63</div></div>
        <div><div className="k">Run from yours</div><div className="v">17</div></div>
        <div><div className="k">Next review</div><div className="v">Tue 19</div></div>
      </div>
    </div>
  )

  return (
    <section className="suggest" id="suggest">
      <span className="cross cross--tl" />
      <span className="cross cross--tr" />
      <span className="cross cross--bl" />
      <span className="cross cross--br" />
      <div className="container">
        <div className="seclabel" style={{ marginBottom: 36 }}>
          <span className="num">[03]</span>
          <span>Suggest_</span>
          <span className="dotline" />
          <span>OPEN SUBMISSION · ROLLING</span>
        </div>

        <div className="suggest__grid">
          {left}

          {/* Sign-in gate */}
          {!loading && !user && (
            <div className="form">
              <div className="form__inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, textAlign: 'center' }}>
                <p className="mono" style={{ color: 'var(--muted)' }}>_ sign in to send a suggestion</p>
                <Link href="/login" className="btn btn--gradient">
                  Sign in <span className="arr">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* Success state */}
          {!loading && user && sent && (
            <div className="form">
              <div className="form__inner" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 300, gap: 12 }}>
                <p style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.05em' }}><b>// Filed.</b></p>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Cheers — your idea&rsquo;s in the queue. We review submissions every Tuesday at 7pm.
                  If something looks promising we&rsquo;ll reach out about running it together.
                </p>
                <button className="btn btn--ghost" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => { setSent(false); setIdea(''); setDetail('') }}>
                  Send another →
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {!loading && user && !sent && (
            <div className="form">
              <div className="form__inner">
                <div className="field">
                  <label>Event idea <span className="req">*</span></label>
                  <input id="f-idea" type="text" placeholder="e.g. Intro to soldering" value={idea} onChange={e => setIdea(e.target.value)} />
                </div>

                <div className="field">
                  <label>Type</label>
                  <div className="typepick">
                    {TYPES.map(t => (
                      <button key={t} className={eventType === t ? 'is-on' : ''} onClick={() => setEventType(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="field__row">
                  <div className="field">
                    <label>You are <span className="req">*</span></label>
                    <input id="f-name" type="text" placeholder="Name or handle" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Reach you at</label>
                    <input type="text" placeholder="@discord or email · optional" value={contact} onChange={e => setContact(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label>Tell us more</label>
                  <textarea
                    placeholder="What would happen at this event? What would we need? Anyone in particular who should run it?"
                    value={detail}
                    onChange={e => setDetail(e.target.value)}
                  />
                </div>

                <div className="field__row">
                  <div className="field">
                    <label>Best size</label>
                    <CustomSelect
                      value={size}
                      onChange={setSize}
                      options={[
                        { value: '~ 5 — 10 people', label: '~ 5 — 10 people' },
                        { value: '~ 10 — 20 people', label: '~ 10 — 20 people' },
                        { value: '~ 20 — 40 people', label: '~ 20 — 40 people' },
                        { value: '40+ (event-event)', label: '40+ (event-event)' },
                      ]}
                    />
                  </div>
                  <div className="field">
                    <label>Could you help run it?</label>
                    <CustomSelect
                      value={helpRun}
                      onChange={setHelpRun}
                      options={[
                        { value: 'No, just wanna come', label: 'No, just wanna come' },
                        { value: 'Maybe — ask me', label: 'Maybe — ask me' },
                        { value: 'Yes, count me in', label: 'Yes, count me in' },
                      ]}
                    />
                  </div>
                </div>

                <div className="form__actions">
                  <span className="small">By submitting you agree we may post your idea (anonymously) on the Journal.</span>
                  <button className="btn btn--gradient" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send it'} <span className="arr">→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
