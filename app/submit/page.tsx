'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { CATEGORIES } from '@/lib/projects'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import CustomSelect from '@/app/components/CustomSelect'

const SUBMIT_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

const TOOL_SUGGESTIONS = [
  'Arduino', 'Raspberry Pi', '3D printer', 'Laser cutter', 'Soldering iron',
  'Sewing machine', 'Crochet hook', 'Vinyl cutter', 'KiCad', 'Fusion 360',
  'Inkscape', 'Figma', 'p5.js', 'Python', 'Swift', 'React', 'Oven',
]

type LogEntry = { date: string; title: string; body: string; milestone: boolean; tag: string }
type BomRow   = { item: string; desc: string; qty: string; unit_cost: string; src: string }

const emptyLog  = (): LogEntry => ({ date: '', title: '', body: '', milestone: false, tag: '' })
const emptyBom  = (): BomRow  => ({ item: '', desc: '', qty: '1', unit_cost: '', src: '' })

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

  // Required
  const [title, setTitle]       = useState('')
  const [blurb, setBlurb]       = useState('')

  // Basic optional
  const [category, setCategory]             = useState(SUBMIT_CATEGORIES[0])
  const [otherCategory, setOtherCategory]   = useState('')
  const [description, setDescription]       = useState('')
  const [startDate, setStartDate]           = useState('')
  const [buildTime, setBuildTime]           = useState('')
  const [github, setGithub]                 = useState('')
  const [demo, setDemo]                     = useState('')
  const [contact, setContact]               = useState('')

  // Makers
  const [coMakers, setCoMakers]                   = useState<Array<{ id: string; display_name: string }>>([])
  const [coMakerSearch, setCoMakerSearch]         = useState('')
  const [coMakerResults, setCoMakerResults]       = useState<Array<{ id: string; display_name: string; email: string | null }>>([])
  const [showCoMakerDropdown, setShowCoMakerDropdown] = useState(false)

  // Tools
  const [tools, setTools]       = useState<string[]>([])
  const [otherTool, setOtherTool] = useState('')

  // Cover image
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Gallery images
  const [galleryFiles, setGalleryFiles]       = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  // Build log
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  // BOM
  const [bomRows, setBomRows] = useState<BomRow[]>([])

  // Retro
  const [retroWins, setRetroWins]   = useState('')
  const [retroFixes, setRetroFixes] = useState('')

  // Submit state
  const [sent, setSent]             = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Stats
  const [statsTotal, setStatsTotal]         = useState<number | null>(null)
  const [statsThisYear, setStatsThisYear]   = useState<number | null>(null)

  useEffect(() => {
    supabase.from('Projects').select('id', { count: 'exact', head: true })
      .or('status.is.null,and(status.neq.DRAFT,status.neq.REJECTED)')
      .then(({ count }) => setStatsTotal(count))
    supabase.from('Projects').select('id', { count: 'exact', head: true })
      .or('status.is.null,and(status.neq.DRAFT,status.neq.REJECTED)')
      .gte('date', '2026-01-01')
      .then(({ count }) => setStatsThisYear(count))
  }, [])

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

  // ── Makers ──────────────────────────────────────────
  function addCoMaker(r: { id: string; display_name: string; email: string | null }) {
    setCoMakers(prev => [...prev, { id: r.id, display_name: r.display_name ?? r.email?.split('@')[0] ?? 'Unknown' }])
    setCoMakerSearch(''); setCoMakerResults([]); setShowCoMakerDropdown(false)
  }
  function removeCoMaker(id: string) { setCoMakers(prev => prev.filter(m => m.id !== id)) }

  // ── Cover image ──────────────────────────────────────
  function handleImageChange(file: File | null) {
    if (!file) { setImageFile(null); setImagePreview(null); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Gallery images ───────────────────────────────────
  function addGalleryFiles(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files)
    setGalleryFiles(prev => [...prev, ...arr])
    arr.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => setGalleryPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(file)
    })
  }
  function removeGalleryFile(i: number) {
    setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))
    setGalleryPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Tools ────────────────────────────────────────────
  function toggleTool(t: string) { setTools(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]) }
  function commitOtherTool() {
    const v = otherTool.trim()
    if (v && !tools.includes(v)) setTools(prev => [...prev, v])
    setOtherTool('')
  }

  // ── Build log ────────────────────────────────────────
  function updateLog(i: number, field: keyof LogEntry, value: string | boolean) {
    setLogEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  // ── BOM ──────────────────────────────────────────────
  function updateBom(i: number, field: keyof BomRow, value: string) {
    setBomRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  // ── Validation flash ─────────────────────────────────
  function flashField(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    el.animate(
      [{ borderBottomColor: 'var(--rule)' }, { borderBottomColor: '#ff25c7' }, { borderBottomColor: 'var(--rule)' }],
      { duration: 600, iterations: 2 },
    )
  }

  // ── Submit ───────────────────────────────────────────
  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!title.trim()) { flashField('f-title'); return }
    if (!blurb.trim()) { flashField('f-blurb'); return }
    setSubmitting(true)
    setSubmitError('')

    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    const id   = `${slug}-${Date.now().toString(36)}`

    // Cover image
    let imageUrl: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${id}/cover.${ext}`
      const { error: uploadError } = await supabase.storage.from('Project Images').upload(path, imageFile, { upsert: true })
      if (uploadError) { setSubmitError(`Cover upload failed: ${uploadError.message}`); setSubmitting(false); return }
      const { data: { publicUrl } } = supabase.storage.from('Project Images').getPublicUrl(path)
      imageUrl = publicUrl
    }

    // Gallery images
    const galleryUrls: string[] = []
    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i]
      const ext  = file.name.split('.').pop()
      const path = `${id}/gallery/${i}.${ext}`
      const { error: gErr } = await supabase.storage.from('Project Images').upload(path, file, { upsert: true })
      if (gErr) { setSubmitError(`Gallery image ${i + 1} failed: ${gErr.message}`); setSubmitting(false); return }
      const { data: { publicUrl } } = supabase.storage.from('Project Images').getPublicUrl(path)
      galleryUrls.push(publicUrl)
    }

    // Parse retro
    const retro_wins  = retroWins.split('\n').map(l => l.trim()).filter(Boolean)
    const retro_fixes = retroFixes.split('\n').map(l => l.trim()).filter(Boolean)

    // Parse build log
    const build_log = logEntries
      .filter(e => e.title.trim())
      .map(e => ({
        date:      e.date || new Date().toISOString().split('T')[0],
        title:     e.title.trim(),
        body:      e.body.trim(),
        milestone: e.milestone,
        tag:       e.tag.trim() || undefined,
      }))

    // Parse BOM
    const bom = bomRows
      .filter(r => r.item.trim())
      .map(r => ({
        item:      r.item.trim(),
        desc:      r.desc.trim() || undefined,
        qty:       parseFloat(r.qty) || 1,
        unit_cost: parseFloat(r.unit_cost) || 0,
        src:       r.src.trim() || undefined,
      }))

    const { error } = await supabase.from('Projects').insert({
      id,
      title:       title.trim(),
      category:    category === 'Other' ? (otherCategory.trim() || 'Other') : category,
      blurb:       blurb.trim(),
      description: description.trim() || null,
      tools:       tools.length > 0 ? tools : null,
      makers:      [profile?.display_name ?? user!.email!.split('@')[0], ...coMakers.map(m => m.display_name)],
      github:      github.trim() || null,
      image:       imageUrl,
      status:      'DRAFT',
      date:        new Date().toISOString().split('T')[0],
      likes:       0,
      submitted_by: user!.id,
      start_date:  startDate || null,
      build_time:  buildTime.trim() || null,
      gallery_images: galleryUrls.length > 0 ? galleryUrls : null,
      build_log:   build_log.length > 0 ? build_log : null,
      bom:         bom.length > 0 ? bom : null,
      retro_wins:  retro_wins.length > 0 ? retro_wins : null,
      retro_fixes: retro_fixes.length > 0 ? retro_fixes : null,
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

  return (
    <>
      <CursorTrail />
      <Nav />

      <header className="submit-hero">
        <div className="container">
          <Link href="/" className="project-back">← Back to projects</Link>
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

      <main className="submit-main">
        <div className="container">
          <div className="submit-layout">

            {/* ── Left: info ───────────────────── */}
            <div className="submit-info">
              <div className="seclabel" style={{ marginBottom: 28 }}>
                <span className="num">01</span>
                <span>What_we_archive</span>
                <span className="bar" />
              </div>
              <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.7, maxWidth: '46ch' }}>
                We log everything our members make — solo or group, finished or still in progress. Hardware, software, food, textiles, art. If you made it, it belongs here.
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
                <div><div className="k">In the archive</div><div className="v">{statsTotal ?? '—'}</div></div>
                <div><div className="k">Added this year</div><div className="v">{statsThisYear ?? '—'}</div></div>
                <div><div className="k">Members</div><div className="v">1,278</div></div>
              </div>
            </div>

            {/* ── Right: form ──────────────────── */}
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

                    {/* ── THE BASICS ──────────────────── */}
                    <div className="seclabel" style={{ marginBottom: 18 }}>
                      <span className="num">A</span><span>The_basics</span><span className="bar" />
                    </div>

                    {/* Title */}
                    <div className="field">
                      <label>Project title <span className="req">*</span></label>
                      <input id="f-title" type="text" placeholder="e.g. Quokka Macropad"
                        value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    {/* Category */}
                    <div className="field">
                      <label>Category</label>
                      <CustomSelect
                        value={category}
                        onChange={v => { setCategory(v); if (v !== 'Other') setOtherCategory('') }}
                        options={[...SUBMIT_CATEGORIES.map(c => ({ value: c, label: c })), { value: 'Other', label: 'Other…' }]}
                      />
                      {category === 'Other' && (
                        <input type="text" placeholder="Describe the category"
                          value={otherCategory} onChange={e => setOtherCategory(e.target.value)}
                          style={{ marginTop: 8 }} autoFocus />
                      )}
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
                        <input type="text" placeholder="Search for a co-maker by name…"
                          value={coMakerSearch}
                          onChange={e => { setCoMakerSearch(e.target.value); setShowCoMakerDropdown(true) }}
                          onFocus={() => setShowCoMakerDropdown(true)}
                          onBlur={() => setTimeout(() => setShowCoMakerDropdown(false), 150)} />
                        {showCoMakerDropdown && coMakerSearch.trim() && (
                          <div className="makers-dropdown">
                            {coMakerResults.length > 0 ? coMakerResults.map(r => (
                              <button key={r.id} type="button" className="makers-dropdown__item" onMouseDown={() => addCoMaker(r)}>
                                <span className="makers-dropdown__name">{r.display_name}</span>
                                <span className="makers-dropdown__email">{r.email}</span>
                              </button>
                            )) : <div className="makers-dropdown__empty">No users found</div>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* One-liner */}
                    <div className="field">
                      <label>
                        One-line description <span className="req">*</span>
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>max 140 chars</span>
                      </label>
                      <input id="f-blurb" type="text" maxLength={140}
                        placeholder="What did you make and what's interesting about it?"
                        value={blurb} onChange={e => setBlurb(e.target.value)} />
                    </div>

                    {/* Story */}
                    <div className="field">
                      <label>Tell the full story</label>
                      <textarea placeholder="How did it start? What was hard? What are you proud of? Anything goes."
                        value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 120 }} />
                    </div>

                    {/* Start date + build time */}
                    <div className="field__row">
                      <div className="field">
                        <label>When did it start?</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>How long did it take?</label>
                        <input type="text" placeholder="e.g. ~3 weeks"
                          value={buildTime} onChange={e => setBuildTime(e.target.value)} />
                      </div>
                    </div>

                    {/* Cover image */}
                    <div className="field">
                      <label>Cover photo</label>
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
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => handleImageChange(e.target.files?.[0] ?? null)} />
                        {imagePreview && (
                          <button type="button" className="img-upload__remove"
                            onClick={e => { e.preventDefault(); handleImageChange(null) }}>
                            ✕ Remove
                          </button>
                        )}
                      </label>
                    </div>

                    {/* Tools */}
                    <div className="field">
                      <label>Tools &amp; materials used</label>
                      <div className="tool-tags">
                        {TOOL_SUGGESTIONS.map(t => (
                          <button key={t} type="button"
                            className={`tool-tag${tools.includes(t) ? ' tool-tag--on' : ''}`}
                            onClick={() => toggleTool(t)}>{t}</button>
                        ))}
                        {tools.filter(t => !TOOL_SUGGESTIONS.includes(t)).map(t => (
                          <button key={t} type="button"
                            className="tool-tag tool-tag--on tool-tag--custom"
                            onClick={() => toggleTool(t)}>{t}</button>
                        ))}
                        <span className="tool-tag-other">
                          <input type="text" placeholder="Other…" value={otherTool}
                            onChange={e => setOtherTool(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitOtherTool() } }} />
                          {otherTool.trim() && <button type="button" onClick={commitOtherTool}>+</button>}
                        </span>
                      </div>
                    </div>

                    {/* ── BUILD LOG ───────────────────── */}
                    <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                      <span className="num">B</span><span>Build_log</span><span className="bar" />
                      <span>optional · timeline of your process</span>
                    </div>

                    {logEntries.length > 0 && (
                      <div className="dyn-list">
                        {logEntries.map((entry, i) => (
                          <div key={i} className="dyn-row">
                            <button type="button" className="dyn-row__remove" onClick={() => setLogEntries(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                            <div className="dyn-row__cols dyn-row__cols--3">
                              <div className="field" style={{ margin: 0 }}>
                                <label>Date</label>
                                <input type="date" value={entry.date} onChange={e => updateLog(i, 'date', e.target.value)} />
                              </div>
                              <div className="field" style={{ margin: 0 }}>
                                <label>Title</label>
                                <input type="text" placeholder="e.g. First prototype"
                                  value={entry.title} onChange={e => updateLog(i, 'title', e.target.value)} />
                              </div>
                              <div className="field" style={{ margin: 0 }}>
                                <label>Tag</label>
                                <input type="text" placeholder="e.g. Prototype"
                                  value={entry.tag} onChange={e => updateLog(i, 'tag', e.target.value)} />
                              </div>
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Notes</label>
                              <textarea placeholder="What happened at this stage?"
                                value={entry.body} onChange={e => updateLog(i, 'body', e.target.value)}
                                style={{ minHeight: 64 }} />
                            </div>
                            <label className="dyn-row__milestone">
                              <input type="checkbox" checked={entry.milestone}
                                onChange={e => updateLog(i, 'milestone', e.target.checked)} />
                              Mark as milestone
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" className="dyn-add" onClick={() => setLogEntries(prev => [...prev, emptyLog()])}>
                      + Add log entry
                    </button>

                    {/* ── GALLERY ─────────────────────── */}
                    <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                      <span className="num">C</span><span>Gallery</span><span className="bar" />
                      <span>optional · process photos</span>
                    </div>

                    {galleryPreviews.length > 0 && (
                      <div className="gallery-grid" style={{ marginBottom: 8 }}>
                        {galleryPreviews.map((src, i) => (
                          <div key={i} className="gallery-thumb">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Gallery ${i + 1}`} />
                            <button type="button" className="gallery-thumb__remove" onClick={() => removeGalleryFile(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="gallery-upload">
                      ↑ Add photos
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => addGalleryFiles(e.target.files)} />
                    </label>

                    {/* ── BOM ─────────────────────────── */}
                    <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                      <span className="num">D</span><span>Bill_of_materials</span><span className="bar" />
                      <span>optional · what did it cost?</span>
                    </div>

                    {bomRows.length > 0 && (
                      <div className="dyn-list">
                        {bomRows.map((row, i) => (
                          <div key={i} className="dyn-row">
                            <button type="button" className="dyn-row__remove" onClick={() => setBomRows(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                            <div className="dyn-row__cols dyn-row__cols--4">
                              <div className="field" style={{ margin: 0 }}>
                                <label>Item</label>
                                <input type="text" placeholder="e.g. Arduino Pro Mini"
                                  value={row.item} onChange={e => updateBom(i, 'item', e.target.value)} />
                              </div>
                              <div className="field" style={{ margin: 0 }}>
                                <label>Qty</label>
                                <input type="number" min="1" value={row.qty}
                                  onChange={e => updateBom(i, 'qty', e.target.value)} />
                              </div>
                              <div className="field" style={{ margin: 0 }}>
                                <label>Unit cost $</label>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                  value={row.unit_cost} onChange={e => updateBom(i, 'unit_cost', e.target.value)} />
                              </div>
                              <div className="field" style={{ margin: 0 }}>
                                <label>Source</label>
                                <input type="text" placeholder="e.g. Jaycar"
                                  value={row.src} onChange={e => updateBom(i, 'src', e.target.value)} />
                              </div>
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Description</label>
                              <input type="text" placeholder="e.g. With pin headers"
                                value={row.desc} onChange={e => updateBom(i, 'desc', e.target.value)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" className="dyn-add" onClick={() => setBomRows(prev => [...prev, emptyBom()])}>
                      + Add item
                    </button>

                    {/* ── RETRO ───────────────────────── */}
                    <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                      <span className="num">E</span><span>What_we_learned</span><span className="bar" />
                      <span>optional · one item per line</span>
                    </div>
                    <div className="field__row">
                      <div className="field">
                        <label>What worked <span style={{ color: '#22c55e' }}>[ + ]</span></label>
                        <textarea placeholder={'Pin headers saved hours of debugging.\nPair-building at open hours was faster.'} value={retroWins}
                          onChange={e => setRetroWins(e.target.value)} style={{ minHeight: 100 }} />
                      </div>
                      <div className="field">
                        <label>What we&rsquo;d change <span style={{ color: 'var(--pop-red)' }}>[ - ]</span></label>
                        <textarea placeholder={'Should have ordered the PCB earlier.\nNeeds a service hatch.'} value={retroFixes}
                          onChange={e => setRetroFixes(e.target.value)} style={{ minHeight: 100 }} />
                      </div>
                    </div>

                    {/* ── LINKS + CONTACT ─────────────── */}
                    <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                      <span className="num">F</span><span>Links_</span><span className="bar" />
                    </div>
                    <div className="field__row">
                      <div className="field">
                        <label>GitHub / source</label>
                        <input type="url" placeholder="https://github.com/…"
                          value={github} onChange={e => setGithub(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Demo / site</label>
                        <input type="url" placeholder="https://…"
                          value={demo} onChange={e => setDemo(e.target.value)} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Reach you at</label>
                      <input type="text" placeholder="@discord, email, or Instagram — optional"
                        value={contact} onChange={e => setContact(e.target.value)} />
                    </div>

                    {submitError && (
                      <p style={{ color: '#ff3c6d', fontSize: 12, marginTop: 8, letterSpacing: '0.04em' }}>
                        {submitError}
                      </p>
                    )}
                    <div className="form__actions">
                      <span className="small">We&rsquo;ll review within a couple of days and add it to the archive.</span>
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
