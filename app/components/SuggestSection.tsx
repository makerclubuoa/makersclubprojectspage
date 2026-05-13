'use client'

import { useState } from 'react'

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
    [
      { borderBottomColor: 'var(--rule)' },
      { borderBottomColor: '#ff25c7' },
      { borderBottomColor: 'var(--rule)' },
    ],
    { duration: 600, iterations: 2 },
  )
}

export default function SuggestSection() {
  const [idea, setIdea] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [detail, setDetail] = useState('')
  const [size, setSize] = useState('~ 10 — 20 people')
  const [helpRun, setHelpRun] = useState('Maybe — ask me')
  const [eventType, setEventType] = useState('Workshop')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!idea.trim()) { flashField('f-idea'); return }
    if (!name.trim()) { flashField('f-name'); return }

    // Celebration burst
    const TRAIL_COLORS = ['#567dff', '#9f42d1', '#f04ab9', '#ff25c7', '#ff3c6d', '#ff856a']
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('span')
      d.className = 'trail-dot'
      const c = TRAIL_COLORS[i % TRAIL_COLORS.length]
      const s = 4 + Math.random() * 10
      const x = e.clientX, y = e.clientY
      d.style.cssText = `width:${s}px;height:${s}px;left:${x}px;top:${y}px;background:${c};opacity:1;transition:opacity 1.2s ease, transform 1.2s cubic-bezier(.2,.7,.3,1)`
      document.body.appendChild(d)
      const ang = (i / 22) * Math.PI * 2
      const dist = 80 + Math.random() * 60
      requestAnimationFrame(() => {
        d.style.opacity = '0'
        d.style.transform = `translate(-50%,-50%) translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(.2)`
      })
      setTimeout(() => d.remove(), 1300)
    }
    setSent(true)
  }

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
          <div>
            <h2>
              What should we <em>make</em> next?
            </h2>
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
                <button key={h} onClick={() => setIdea(h)}>
                  {h}
                </button>
              ))}
            </div>

            <div className="suggest__stats">
              <div>
                <div className="k">Suggestions / sem</div>
                <div className="v">63</div>
              </div>
              <div>
                <div className="k">Run from yours</div>
                <div className="v">17</div>
              </div>
              <div>
                <div className="k">Next review</div>
                <div className="v">Tue 19</div>
              </div>
            </div>
          </div>

          <div className={`form${sent ? ' is-sent' : ''}`}>
            <div className="form__inner">
              <div className="field">
                <label>
                  Event idea <span className="req">*</span>
                </label>
                <input
                  id="f-idea"
                  type="text"
                  placeholder="e.g. Intro to soldering"
                  value={idea}
                  onChange={e => setIdea(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Type</label>
                <div className="typepick">
                  {TYPES.map(t => (
                    <button
                      key={t}
                      className={eventType === t ? 'is-on' : ''}
                      onClick={() => setEventType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field__row">
                <div className="field">
                  <label>
                    You are <span className="req">*</span>
                  </label>
                  <input
                    id="f-name"
                    type="text"
                    placeholder="Name or handle"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Reach you at</label>
                  <input
                    type="text"
                    placeholder="@discord or email · optional"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
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
                  <select value={size} onChange={e => setSize(e.target.value)}>
                    <option>~ 5 — 10 people</option>
                    <option>~ 10 — 20 people</option>
                    <option>~ 20 — 40 people</option>
                    <option>40+ (event-event)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Could you help run it?</label>
                  <select value={helpRun} onChange={e => setHelpRun(e.target.value)}>
                    <option>No, just wanna come</option>
                    <option>Maybe — ask me</option>
                    <option>Yes, count me in</option>
                  </select>
                </div>
              </div>

              <div className="form__actions">
                <span className="small">
                  By submitting you agree we may post your idea (anonymously) on the Journal.
                </span>
                <button className="btn btn--gradient" onClick={handleSubmit}>
                  Send it <span className="arr">→</span>
                </button>
              </div>
            </div>

            <div className="form__success">
              <b>// Filed.</b>
              Cheers — your idea&rsquo;s in the queue. We review submissions every Tuesday at 7pm.
              If something looks promising we&rsquo;ll reach out about running it together.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
