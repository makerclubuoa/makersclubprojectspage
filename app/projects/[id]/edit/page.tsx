'use client'

import { useState, useEffect, useRef, use, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, resolvePublicName, type Project } from '@/lib/projects'
import CustomSelect from '@/app/components/CustomSelect'

const EDIT_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

const TOOL_SUGGESTIONS = [
  'Arduino', 'Raspberry Pi', '3D printer', 'Laser cutter', 'Soldering iron',
  'Sewing machine', 'Crochet hook', 'Vinyl cutter', 'KiCad', 'Fusion 360',
  'Inkscape', 'Figma', 'p5.js', 'Python', 'Swift', 'React', 'Oven',
]

type LogEntry = { date: string; title: string; body: string; milestone: boolean; tag: string; image: string }
type BomRow   = { item: string; desc: string; qty: string; unit_cost: string; src: string }

const emptyLog = (): LogEntry => ({ date: '', title: '', body: '', milestone: false, tag: '', image: '' })
const emptyBom = (): BomRow  => ({ item: '', desc: '', qty: '1', unit_cost: '', src: '' })

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <EditForm params={params} />
    </Suspense>
  )
}

function EditForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'
  const backHref  = fromAdmin ? '/admin' : '/dashboard'
  const backLabel = fromAdmin ? '← Admin' : '← Dashboard'

  const [project, setProject]     = useState<Project | null>(null)
  const [notAllowed, setNotAllowed] = useState(false)
  const [fetching, setFetching]   = useState(true)

  // Basic
  const [title, setTitle]               = useState('')
  const [category, setCategory]         = useState(EDIT_CATEGORIES[0])
  const [otherCategory, setOtherCategory] = useState('')
  const [blurb, setBlurb]               = useState('')
  const [description, setDescription]   = useState('')
  const [startDate, setStartDate]       = useState('')
  const [buildTime, setBuildTime]       = useState('')
  const [github, setGithub]             = useState('')

  // Makers
  type CoMakerProfile = { id: string; display_name: string; email: string | null; public_name: string | null; name_preference: string | null; credit_consented: boolean }
  const [coMakers, setCoMakers]                       = useState<CoMakerProfile[]>([])
  const [coMakerSearch, setCoMakerSearch]             = useState('')
  const [coMakerResults, setCoMakerResults]           = useState<CoMakerProfile[]>([])
  const [showCoMakerDropdown, setShowCoMakerDropdown] = useState(false)

  // Tools
  const [tools, setTools]         = useState<string[]>([])
  const [otherTool, setOtherTool] = useState('')

  // Cover image
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [clearImage, setClearImage]     = useState(false)

  // Gallery
  const [existingGallery, setExistingGallery]       = useState<string[]>([])
  const [newGalleryFiles, setNewGalleryFiles]       = useState<File[]>([])
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([])

  // Build log
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [logEntryFiles, setLogEntryFiles] = useState<(File | null)[]>([])
  const [logEntryPreviews, setLogEntryPreviews] = useState<(string | null)[]>([])

  // BOM
  const [bomRows, setBomRows] = useState<BomRow[]>([])

  // Retro
  const [retroWins, setRetroWins]   = useState('')
  const [retroFixes, setRetroFixes] = useState('')

  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user || hasFetched.current) return
    hasFetched.current = true
    async function load() {
      const { data } = await supabase
        .from('Projects')
        .select('*')
        .eq('id', id)
        .single()

      if (!data) { router.replace('/dashboard'); return }
      const isAdmin = user!.email === 'makerclubuoa@gmail.com'
      if (!isAdmin && data.submitted_by !== user!.id) { setNotAllowed(true); setFetching(false); return }

      setProject(data as Project)
      setTitle(data.title ?? '')

      const cat = data.category ?? EDIT_CATEGORIES[0]
      if (EDIT_CATEGORIES.includes(cat)) {
        setCategory(cat)
      } else {
        setCategory('Other')
        setOtherCategory(cat)
      }

      setBlurb(data.blurb ?? '')
      setDescription(data.description ?? '')
      setStartDate(data.start_date ?? '')
      setBuildTime(data.build_time ?? '')
      setGithub(data.github ?? '')
      setCoMakers((data.makers ?? []).map((name: string) => ({ id: `name:${name}`, display_name: name, email: null, public_name: null, name_preference: null, credit_consented: true })))
      setTools(data.tools ?? [])
      setImagePreview(data.image ?? null)
      setExistingGallery(data.gallery_images ?? [])

      if (data.build_log) {
        const entries = data.build_log.map((e: { date?: string; title?: string; body?: string; milestone?: boolean; tag?: string; image?: string }) => ({
          date:      e.date ?? '',
          title:     e.title ?? '',
          body:      e.body ?? '',
          milestone: e.milestone ?? false,
          tag:       e.tag ?? '',
          image:     e.image ?? '',
        }))
        setLogEntries(entries)
        setLogEntryFiles(entries.map(() => null))
        setLogEntryPreviews(entries.map((e: LogEntry) => e.image || null))
      }

      if (data.bom) {
        setBomRows(data.bom.map((r: { item?: string; desc?: string; qty?: number; unit_cost?: number; src?: string }) => ({
          item:      r.item ?? '',
          desc:      r.desc ?? '',
          qty:       String(r.qty ?? 1),
          unit_cost: r.unit_cost != null ? String(r.unit_cost) : '',
          src:       r.src ?? '',
        })))
      }

      setRetroWins((data.retro_wins ?? []).join('\n'))
      setRetroFixes((data.retro_fixes ?? []).join('\n'))
      setFetching(false)
    }
    load()
  }, [user, id, router])

  useEffect(() => {
    if (!coMakerSearch.trim()) { setCoMakerResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email, public_name, name_preference, credit_consented')
        .or(`display_name.ilike.%${coMakerSearch}%,public_name.ilike.%${coMakerSearch}%`)
        .neq('id', user?.id ?? '')
        .limit(6)
      setCoMakerResults(
        (data ?? []).filter((r: { id: string }) => !coMakers.some(m => m.id === r.id))
      )
    }, 250)
    return () => clearTimeout(timer)
  }, [coMakerSearch, coMakers, user])

  function addCoMaker(r: { id: string; display_name: string; email: string | null; public_name: string | null; name_preference: string | null; credit_consented: boolean }) {
    setCoMakers(prev => [...prev, r])
    setCoMakerSearch(''); setCoMakerResults([]); setShowCoMakerDropdown(false)
  }
  function removeCoMaker(id: string) { setCoMakers(prev => prev.filter(m => m.id !== id)) }

  function handleImageChange(file: File | null) {
    if (!file) return
    setImageFile(file)
    setClearImage(false)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleClearImage(e: React.MouseEvent) {
    e.preventDefault()
    setImageFile(null)
    setImagePreview(null)
    setClearImage(true)
  }

  function toggleTool(t: string) {
    setTools(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function commitOtherTool() {
    const v = otherTool.trim()
    if (v && !tools.includes(v)) setTools(prev => [...prev, v])
    setOtherTool('')
  }

  function addGalleryFiles(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files)
    setNewGalleryFiles(prev => [...prev, ...arr])
    arr.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => setNewGalleryPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(file)
    })
  }
  function removeExistingGallery(url: string) {
    setExistingGallery(prev => prev.filter(u => u !== url))
  }
  function removeNewGallery(i: number) {
    setNewGalleryFiles(prev => prev.filter((_, idx) => idx !== i))
    setNewGalleryPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateLog(i: number, field: keyof LogEntry, value: string | boolean) {
    setLogEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  function handleLogImageChange(i: number, file: File | null) {
    if (!file) return
    setLogEntryFiles(prev => prev.map((f, idx) => idx === i ? file : f))
    const reader = new FileReader()
    reader.onload = e => setLogEntryPreviews(prev => prev.map((p, idx) => idx === i ? e.target?.result as string : p))
    reader.readAsDataURL(file)
  }
  function removeLogImage(i: number) {
    setLogEntryFiles(prev => prev.map((f, idx) => idx === i ? null : f))
    setLogEntryPreviews(prev => prev.map((p, idx) => idx === i ? null : p))
    updateLog(i, 'image', '')
  }

  function updateBom(i: number, field: keyof BomRow, value: string) {
    setBomRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !blurb.trim()) return
    setSaving(true)
    setSaveError('')

    let imageUrl: string | null | undefined = undefined

    if (clearImage) {
      imageUrl = null
    } else if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${id}/cover.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('Project Images')
        .upload(path, imageFile, { upsert: true })
      if (uploadError) {
        setSaveError(`Image upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage
        .from('Project Images')
        .getPublicUrl(path)
      imageUrl = publicUrl
    }

    const uploadedGalleryUrls: string[] = []
    for (let i = 0; i < newGalleryFiles.length; i++) {
      const file = newGalleryFiles[i]
      const ext  = file.name.split('.').pop()
      const path = `${id}/gallery/${Date.now()}-${i}.${ext}`
      const { error: gErr } = await supabase.storage
        .from('Project Images')
        .upload(path, file, { upsert: true })
      if (gErr) { setSaveError(`Gallery image ${i + 1} failed: ${gErr.message}`); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage
        .from('Project Images')
        .getPublicUrl(path)
      uploadedGalleryUrls.push(publicUrl)
    }
    const galleryImages = [...existingGallery, ...uploadedGalleryUrls]

    const retro_wins  = retroWins.split('\n').map(l => l.trim()).filter(Boolean)
    const retro_fixes = retroFixes.split('\n').map(l => l.trim()).filter(Boolean)

    const logImageUrls: (string | null)[] = []
    for (let i = 0; i < logEntries.length; i++) {
      const file = logEntryFiles[i]
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${id}/log/${Date.now()}-${i}.${ext}`
        const { error: lErr } = await supabase.storage.from('Project Images').upload(path, file, { upsert: true })
        if (lErr) { setSaveError(`Log image ${i + 1} failed: ${lErr.message}`); setSaving(false); return }
        const { data: { publicUrl } } = supabase.storage.from('Project Images').getPublicUrl(path)
        logImageUrls.push(publicUrl)
      } else {
        logImageUrls.push(logEntries[i].image || null)
      }
    }

    const build_log = logEntries
      .filter(e => e.title.trim())
      .map((e, i) => ({
        date:      e.date || new Date().toISOString().split('T')[0],
        title:     e.title.trim(),
        body:      e.body.trim(),
        milestone: e.milestone,
        tag:       e.tag.trim() || undefined,
        image:     logImageUrls[i] || undefined,
      }))

    const bom = bomRows
      .filter(r => r.item.trim())
      .map(r => ({
        item:      r.item.trim(),
        desc:      r.desc.trim() || undefined,
        qty:       parseFloat(r.qty) || 1,
        unit_cost: parseFloat(r.unit_cost) || 0,
        src:       r.src.trim() || undefined,
      }))

    const finalCategory = category === 'Other' ? (otherCategory.trim() || 'Other') : category

    // Resolve maker names: real profile entries (id not prefixed with 'name:') honour consent
    const realCoMakers = coMakers.filter(m => !m.id.startsWith('name:'))
    const submitterDisplayName = (profile?.display_name ?? '').toLowerCase()
    const legacyNames = coMakers
      .filter(m => m.id.startsWith('name:'))
      .map(m => m.display_name)
      .filter(n => n.toLowerCase() !== submitterDisplayName)
    const consentedNames = realCoMakers.filter(m => m.credit_consented).map(m => resolvePublicName(m))
    const anonCount = realCoMakers.filter(m => !m.credit_consented).length
    const makerNames = [...legacyNames, ...consentedNames]

    const update: Record<string, unknown> = {
      title:          title.trim(),
      category:       finalCategory,
      blurb:          blurb.trim(),
      description:    description.trim() || null,
      tools:          tools.length > 0 ? tools : null,
      makers:         makerNames.length > 0 ? makerNames : null,
      maker_ids:      realCoMakers.length > 0 ? realCoMakers.map(m => m.id) : null,
      anon_count:     anonCount,
      github:         github.trim() || null,
      start_date:     startDate || null,
      build_time:     buildTime.trim() || null,
      gallery_images: galleryImages.length > 0 ? galleryImages : null,
      build_log:      build_log.length > 0 ? build_log : null,
      bom:            bom.length > 0 ? bom : null,
      retro_wins:     retro_wins.length > 0 ? retro_wins : null,
      retro_fixes:    retro_fixes.length > 0 ? retro_fixes : null,
    }
    if (imageUrl !== undefined) update.image = imageUrl

    const isAdmin = user!.email === 'makerclubuoa@gmail.com'
    let query = supabase.from('Projects').update(update).eq('id', id)
    if (!isAdmin) query = query.eq('submitted_by', user!.id)
    const { error } = await query

    setSaving(false)
    if (error) { setSaveError(error.message); return }
    router.push(backHref)
  }

  if (loading || fetching) return null

  if (notAllowed) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>You can only edit your own projects.</p>
            <Link href="/dashboard" className="btn btn--ghost">← Back to dashboard</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <CursorTrail />
      <Nav />

      <header className="submit-hero">
        <div className="container">
          <Link href={backHref} className="project-back" style={{ color: 'var(--muted)' }}>
            {backLabel}
          </Link>
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span>Edit</span>
            <span className="bar" />
          </div>
          <h1 className="submit-hero__title">
            Edit <em className="gradient-text">{project?.title}</em>
          </h1>
        </div>
      </header>

      <main className="submit-main">
        <div className="container" style={{ maxWidth: 760 }}>
          <form className="form form--submit" onSubmit={handleSave}>
            <div className="form__inner">

              <div className="seclabel" style={{ marginBottom: 18 }}>
                <span className="num">A</span><span>The basics</span><span className="bar" />
              </div>

              <div className="field">
                <label>Project title <span className="req">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="field">
                <label>Category</label>
                <CustomSelect
                  value={category}
                  onChange={v => { setCategory(v); if (v !== 'Other') setOtherCategory('') }}
                  options={[...EDIT_CATEGORIES.map(c => ({ value: c, label: c })), { value: 'Other', label: 'Other…' }]}
                />
                {category === 'Other' && (
                  <input type="text" placeholder="Describe the category"
                    value={otherCategory} onChange={e => setOtherCategory(e.target.value)}
                    style={{ marginTop: 8 }} autoFocus />
                )}
              </div>

              <div className="field">
                <label>Makers / contributors</label>
                <div className="makers-chips">
                  {coMakers.map(m => (
                    <span key={m.id} className="makers-chip">
                      {m.display_name}
                      <button type="button" className="makers-chip__remove" onClick={() => removeCoMaker(m.id)}>✕</button>
                    </span>
                  ))}
                  {(() => {
                    const myName = profile?.display_name ?? user?.email?.split('@')[0] ?? ''
                    const alreadyIn = coMakers.some(m => m.display_name === myName)
                    return !alreadyIn && myName ? (
                      <button type="button" className="makers-chip makers-chip--add"
                        onClick={() => setCoMakers(prev => [...prev, { id: `name:${myName}`, display_name: myName, email: null, public_name: null, name_preference: null, credit_consented: true }])}>
                        + Add me
                      </button>
                    ) : null
                  })()}
                </div>
                <div className="makers-search">
                  <input type="text" placeholder="Search for a maker by name… They must have an account to be added" autoComplete="off"
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

              <div className="field">
                <label>
                  One-line description <span className="req">*</span>
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>max 140 chars</span>
                </label>
                <input type="text" maxLength={140} value={blurb} onChange={e => setBlurb(e.target.value)} required />
              </div>

              <div className="field">
                <label>Full story</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ minHeight: 140 }}
                />
              </div>

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
                    <button type="button" className="img-upload__remove" onClick={handleClearImage}>
                      ✕ Remove
                    </button>
                  )}
                </label>
              </div>

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

              {/* BUILD LOG */}
              <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                <span className="num">B</span><span>Build log</span><span className="bar" />
                <span>optional · timeline of your process</span>
              </div>

              {logEntries.length > 0 && (
                <div className="dyn-list">
                  {logEntries.map((entry, i) => (
                    <div key={i} className="dyn-row">
                      <button type="button" className="dyn-row__remove" onClick={() => {
                        setLogEntries(prev => prev.filter((_, idx) => idx !== i))
                        setLogEntryFiles(prev => prev.filter((_, idx) => idx !== i))
                        setLogEntryPreviews(prev => prev.filter((_, idx) => idx !== i))
                      }}>✕</button>
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
                      <div className="field" style={{ margin: '8px 0 0' }}>
                        <label>Photo <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span></label>
                        {logEntryPreviews[i] ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logEntryPreviews[i]!} alt="Log entry" style={{ maxWidth: '100%', maxHeight: 200, display: 'block', borderRadius: 4 }} />
                            <button type="button" className="img-upload__remove" style={{ position: 'absolute', top: 6, right: 6 }} onClick={() => removeLogImage(i)}>✕ Remove</button>
                          </div>
                        ) : (
                          <label className="gallery-upload" style={{ display: 'inline-flex' }}>
                            ↑ Add photo
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={e => handleLogImageChange(i, e.target.files?.[0] ?? null)} />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="dyn-add" onClick={() => {
                setLogEntries(prev => [...prev, emptyLog()])
                setLogEntryFiles(prev => [...prev, null])
                setLogEntryPreviews(prev => [...prev, null])
              }}>
                + Add log entry
              </button>

              {/* GALLERY */}
              <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                <span className="num">C</span><span>Gallery</span><span className="bar" />
                <span>optional · process photos</span>
              </div>

              {(existingGallery.length > 0 || newGalleryPreviews.length > 0) && (
                <div className="gallery-grid" style={{ marginBottom: 8 }}>
                  {existingGallery.map((url, i) => (
                    <div key={url} className="gallery-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${i + 1}`} />
                      <button type="button" className="gallery-thumb__remove" onClick={() => removeExistingGallery(url)}>✕</button>
                    </div>
                  ))}
                  {newGalleryPreviews.map((src, i) => (
                    <div key={i} className="gallery-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`New ${i + 1}`} />
                      <button type="button" className="gallery-thumb__remove" onClick={() => removeNewGallery(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="gallery-upload">
                ↑ Add photos
                <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => addGalleryFiles(e.target.files)} />
              </label>

              {/* BOM */}
              <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                <span className="num">D</span><span>Bill of materials</span><span className="bar" />
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

              {/* RETRO */}
              <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                <span className="num">E</span><span>What we learned</span><span className="bar" />
                <span>optional · one item per line</span>
              </div>
              <div className="field__row">
                <div className="field">
                  <label>What worked <span style={{ color: '#22c55e' }}>[ + ]</span></label>
                  <textarea
                    placeholder={'Pin headers saved hours of debugging.\nPair-building at open hours was faster.'}
                    value={retroWins} onChange={e => setRetroWins(e.target.value)} style={{ minHeight: 100 }} />
                </div>
                <div className="field">
                  <label>What we&rsquo;d change <span style={{ color: 'var(--pop-red)' }}>[ - ]</span></label>
                  <textarea
                    placeholder={'Should have ordered the PCB earlier.\nNeeds a service hatch.'}
                    value={retroFixes} onChange={e => setRetroFixes(e.target.value)} style={{ minHeight: 100 }} />
                </div>
              </div>

              {/* LINKS */}
              <div className="seclabel" style={{ margin: '28px 0 18px' }}>
                <span className="num">F</span><span>Links</span><span className="bar" />
              </div>

              <div className="field">
                <label>GitHub / source</label>
                <input
                  type="url"
                  placeholder="https://github.com/…"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                />
              </div>

              {saveError && (
                <p style={{ color: '#ff3c6d', fontSize: 12, letterSpacing: '0.04em' }}>{saveError}</p>
              )}

              <div className="form__actions">
                <Link href={backHref} className="btn btn--ghost">Cancel</Link>
                <button className="btn btn--gradient" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'} <span className="arr">→</span>
                </button>
              </div>

            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  )
}
