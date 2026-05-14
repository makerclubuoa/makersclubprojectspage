'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { CATEGORIES } from '@/lib/projects'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'

const SUBMIT_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

const TOOL_SUGGESTIONS = [
  'Arduino', 'Raspberry Pi', '3D printer', 'Laser cutter', 'Soldering iron',
  'Sewing machine', 'Crochet hook', 'Vinyl cutter', 'KiCad', 'Fusion 360',
  'Inkscape', 'Figma', 'p5.js', 'Python', 'Swift', 'React', 'Oven',
]

function burst(x: number, y: number) {
  const COLORS = ['#567dff', '#9f42d1', '#f04ab9', '#ff25c7', '#ff3c6d', '#ff856a']
  for (let i = 0; i < 22; i++) {
    const d = document.createElement('span')
    d.className = 'trail-dot'
    const c = COLORS[i % COLORS.length]
    const s = 4 + Math.random() * 10
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
}

export default function SubmitPage() {
  const { user, profile, loading } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(SUBMIT_CATEGORIES[0])
  const [blurb, setBlurb] = useState('')
  const [description, setDescription] = useState('')
  const [toolsRaw, setToolsRaw] = useState('')
  const [coMakers, setCoMakers] = useState<Array<{ id: string; display_name: string }>>([])
  const [coMakerSearch, setCoMakerSearch] = useState('')
  const [coMakerResults, setCoMakerResults] = useState<Array<{ id: string; display_name: string; email: string | null }>>([])
  const [showCoMakerDropdown, setShowCoMakerDropdown] = useState(false)
  const [github, setGithub] = useState('')
  const [demo, setDemo] = useState('')
  const [contact, setContact] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (profile?.email && !contact) setContact(profile.email)
  }, [profile])

  useEffect(() => {
    if (!coMakerSearch.trim()) { setCoMakerResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .ilike('display_name', `%${coMakerSearch}%`)
        .neq('id', user?.id ?? '')
        .limit(6)
      setCoMakerResults(
        (data ?? []).filter((r: { id: string }) => !coMakers.some(m => m.id === r.id))
      )
    }, 250)
    return () => clearTimeout(timer)
  }, [coMakerSearch, coMakers, user])

  function addCoMaker(r: { id: string; display_name: string; email: string | null }) {
    setCoMakers(prev => [...prev, { id: r.id, display_name: r.display_name ?? r.email?.split('@')[0] ?? 'Unknown' }])
    setCoMakerSearch('')
    setCoMakerResults([])
    setShowCoMakerDropdown(false)
  }

  function removeCoMaker(id: string) {
    setCoMakers(prev => prev.filter(m => m.id !== id))
  }

  function handleImageChange(file: File | null) {
    if (!file) { setImageFile(null); setImagePreview(null); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function flashField(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    el.animate(
      [{ borderBottomColor: 'var(--rule)' }, { borderBottomColor: '#ff25c7' }, { borderBottomColor: 'var(--rule)' }],
      { duration: 600, iterations: 2 },
    )
  }

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!title.trim()) { flashField('f-title'); return }
    if (!blurb.trim()) { flashField('f-blurb'); return }
    setSubmitting(true)
    setSubmitError('')
    const slug = title.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
    const id = `${slug}-${Date.now().toString(36)}`

    let imageUrl: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${id}/cover.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('Project Images')
        .upload(path, imageFile, { upsert: true })
      if (uploadError) {
        setSubmitError(`Image upload failed: ${uploadError.message}`)
        setSubmitting(false)
        return
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('Project Images')
        .getPublicUrl(path)
      imageUrl = publicUrl
    }

    const { error } = await supabase.from('Projects').insert({
      id,
      title: title.trim(),
      category,
      blurb: blurb.trim(),
      description: description.trim() || null,
      tools: toolsRaw ? toolsRaw.split(',').map(s => s.trim()).filter(Boolean) : null,
      makers: [
        profile?.display_name ?? user!.email!.split('@')[0],
        ...coMakers.map(m => m.display_name),
      ],
      github: github.trim() || null,
      image: imageUrl,
      status: 'DRAFT',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      submitted_by: user!.id,
    })
    setSubmitting(false)
    if (error) { setSubmitError(error.message); return }

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new-post',
        projectId: id,
        projectTitle: title.trim(),
        projectBlurb: blurb.trim(),
        projectCategory: category,
        makers: [profile?.display_name ?? user!.email!.split('@')[0], ...coMakers.map(m => m.display_name)],
      }),
    })

    burst(e.clientX, e.clientY)
    setSent(true)
  }

  function addTool(t: string) {
    const current = toolsRaw.trim()
    if (!current) { setToolsRaw(t); return }
    const arr = current.split(',').map(s => s.trim())
    if (!arr.includes(t)) setToolsRaw([...arr, t].join(', '))
  }

  return (
    <>
      <CursorTrail />
      <Nav />

      {/* Page hero */}
      <header className="submit-hero">
        <div className="container">
          <Link href="/" className="project-back">
            ← Back to projects
          </Link>
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span className="num">[04]</span>
            <span>Submit_</span>
            <span className="bar" />
            <span>OPEN · ROLLING</span>
          </div>
          <h1 className="submit-hero__title">
            Add your thing<br />to the <em className="gradient-text">archive.</em>
          </h1>
          <p className="submit-hero__sub">
            Half-finished counts. Weird is good. Fill in what you know and we&rsquo;ll sort the rest.
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="submit-main">
        <div className="container">
          <div className="submit-layout">

            {/* Left: info */}
            <div className="submit-info">
              <div className="seclabel" style={{ marginBottom: 28 }}>
                <span className="num">01</span>
                <span>What_we_archive</span>
                <span className="bar" />
              </div>
              <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.7, maxWidth: '46ch' }}>
                We log everything members make — solo or group, finished or still in progress. Hardware, software, food, textiles, art. If you made it at Make_UoA or because of it, it belongs here.
              </p>

              <div className="submit-checklist">
                {[
                  'Made by a member (current or former)',
                  'Made during or inspired by an open hours / workshop',
                  'Any category, any finish level',
                  'Solo or group projects both welcome',
                ].map(item => (
                  <div key={item} className="submit-checklist__item">
                    <span className="submit-checklist__tick">✓</span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="seclabel" style={{ marginBottom: 20, marginTop: 48 }}>
                <span className="num">02</span>
                <span>Stats_</span>
                <span className="bar" />
              </div>
              <div className="submit-stats">
                <div><div className="k">In the archive</div><div className="v">48</div></div>
                <div><div className="k">Added this year</div><div className="v">34</div></div>
                <div><div className="k">Avg review</div><div className="v">2 days</div></div>
              </div>
            </div>

            {/* Right: form or auth gate */}
            <div>
              {!loading && !user ? (
                <div className="submit-gate">
                  <div className="submit-gate__icon">⚿</div>
                  <h2>Sign in to submit</h2>
                  <p>You need an account to add a project to the archive. It only takes a second.</p>
                  <Link href="/login" className="btn btn--gradient" style={{ display: 'inline-flex', marginTop: 20 }}>
                    Sign in <span className="arr">→</span>
                  </Link>
                </div>
              ) : sent ? (
                <div className="submit-success">
                  <div className="submit-success__icon">★</div>
                  <h2>// Filed.</h2>
                  <p>
                    Your project is in the queue. We review submissions every Tuesday — if anything&rsquo;s unclear we&rsquo;ll reach out on the contact you provided.
                  </p>
                  <Link href="/" className="btn btn--gradient" style={{ display: 'inline-flex', marginTop: 24 }}>
                    Back to projects <span className="arr">→</span>
                  </Link>
                </div>
              ) : (
                <div className="form">
                  <div className="form__inner">
                    {/* Title */}
                    <div className="field">
                      <label>
                        Project title <span className="req">*</span>
                      </label>
                      <input
                        id="f-title"
                        type="text"
                        placeholder="e.g. Quokka Macropad"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div className="field">
                      <label>Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}>
                        {SUBMIT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Makers */}
                    <div className="field">
                      <label>Makers / contributors</label>
                      <div className="makers-chips">
                        <span className="makers-chip makers-chip--you">
                          {profile?.display_name ?? user?.email?.split('@')[0]}
                          <span className="makers-chip__tag">you</span>
                        </span>
                        {coMakers.map(m => (
                          <span key={m.id} className="makers-chip">
                            {m.display_name}
                            <button type="button" className="makers-chip__remove" onClick={() => removeCoMaker(m.id)}>✕</button>
                          </span>
                        ))}
                      </div>
                      <div className="makers-search">
                        <input
                          type="text"
                          placeholder="Search for a co-maker by name…"
                          value={coMakerSearch}
                          onChange={e => { setCoMakerSearch(e.target.value); setShowCoMakerDropdown(true) }}
                          onFocus={() => setShowCoMakerDropdown(true)}
                          onBlur={() => setTimeout(() => setShowCoMakerDropdown(false), 150)}
                        />
                        {showCoMakerDropdown && coMakerSearch.trim() && (
                          <div className="makers-dropdown">
                            {coMakerResults.length > 0 ? coMakerResults.map(r => (
                              <button key={r.id} type="button" className="makers-dropdown__item" onMouseDown={() => addCoMaker(r)}>
                                <span className="makers-dropdown__name">{r.display_name}</span>
                                <span className="makers-dropdown__email">{r.email}</span>
                              </button>
                            )) : (
                              <div className="makers-dropdown__empty">No users found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Blurb */}
                    <div className="field">
                      <label>
                        One-line description <span className="req">*</span>
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>max 140 chars</span>
                      </label>
                      <input
                        id="f-blurb"
                        type="text"
                        maxLength={140}
                        placeholder="What did you make and what's interesting about it?"
                        value={blurb}
                        onChange={e => setBlurb(e.target.value)}
                      />
                    </div>

                    {/* Description */}
                    <div className="field">
                      <label>Tell the full story</label>
                      <textarea
                        placeholder="How did it start? What was hard? What are you proud of? Anything goes."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        style={{ minHeight: 120 }}
                      />
                    </div>

                    {/* Image */}
                    <div className="field">
                      <label>Project photo</label>
                      <label
                        className={`img-upload${imagePreview ? ' img-upload--has-preview' : ''}`}
                        style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleImageChange(e.dataTransfer.files[0] ?? null) }}
                      >
                        {!imagePreview && (
                          <span className="img-upload__inner">
                            <span className="img-upload__icon">↑</span>
                            <span>Drop an image or click to browse</span>
                            <span className="img-upload__hint">JPG, PNG, WEBP · max 5 MB</span>
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
                        />
                        {imagePreview && (
                          <button
                            type="button"
                            className="img-upload__remove"
                            onClick={e => { e.preventDefault(); handleImageChange(null) }}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </label>
                    </div>

                    {/* Tools */}
                    <div className="field">
                      <label>Tools & materials used</label>
                      <input
                        type="text"
                        placeholder="e.g. Arduino, 3D printer, Soldering iron"
                        value={toolsRaw}
                        onChange={e => setToolsRaw(e.target.value)}
                      />
                      <div className="field__hints">
                        {TOOL_SUGGESTIONS.map(t => (
                          <button key={t} type="button" onClick={() => addTool(t)}>+ {t}</button>
                        ))}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="field__row">
                      <div className="field">
                        <label>GitHub / source</label>
                        <input
                          type="url"
                          placeholder="https://github.com/…"
                          value={github}
                          onChange={e => setGithub(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Demo / site</label>
                        <input
                          type="url"
                          placeholder="https://…"
                          value={demo}
                          onChange={e => setDemo(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="field">
                      <label>Reach you at</label>
                      <input
                        type="text"
                        placeholder="@discord, email, or Instagram — optional"
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                      />
                    </div>

                    {submitError && (
                      <p style={{ color: '#ff3c6d', fontSize: 12, marginTop: 8, letterSpacing: '0.04em' }}>
                        {submitError}
                      </p>
                    )}
                    <div className="form__actions">
                      <span className="small">
                        We&rsquo;ll review within a couple of days and add it to the archive.
                      </span>
                      <button className="btn btn--gradient" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit it'} <span className="arr">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
