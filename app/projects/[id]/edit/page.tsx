'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, type Project } from '@/lib/projects'
import CustomSelect from '@/app/components/CustomSelect'

const EDIT_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

const TOOL_SUGGESTIONS = [
  'Arduino', 'Raspberry Pi', '3D printer', 'Laser cutter', 'Soldering iron',
  'Sewing machine', 'Crochet hook', 'Vinyl cutter', 'KiCad', 'Fusion 360',
  'Inkscape', 'Figma', 'p5.js', 'Python', 'Swift', 'React', 'Oven',
]

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [notAllowed, setNotAllowed] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(EDIT_CATEGORIES[0])
  const [blurb, setBlurb] = useState('')
  const [description, setDescription] = useState('')
  const [toolsRaw, setToolsRaw] = useState('')
  const [github, setGithub] = useState('')

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [clearImage, setClearImage] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
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
      setCategory(data.category ?? EDIT_CATEGORIES[0])
      setBlurb(data.blurb ?? '')
      setDescription(data.description ?? '')
      setToolsRaw((data.tools ?? []).join(', '))
      setGithub(data.github ?? '')
      setImagePreview(data.image ?? null)
      setFetching(false)
    }
    load()
  }, [user, id, router])

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

  function addTool(t: string) {
    const current = toolsRaw.trim()
    if (!current) { setToolsRaw(t); return }
    const arr = current.split(',').map(s => s.trim())
    if (!arr.includes(t)) setToolsRaw([...arr, t].join(', '))
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

    const update: Record<string, unknown> = {
      title: title.trim(),
      category,
      blurb: blurb.trim(),
      description: description.trim() || null,
      tools: toolsRaw ? toolsRaw.split(',').map(s => s.trim()).filter(Boolean) : null,
      github: github.trim() || null,
    }
    if (imageUrl !== undefined) update.image = imageUrl

    const isAdmin = user!.email === 'makerclubuoa@gmail.com'
    let query = supabase.from('Projects').update(update).eq('id', id)
    if (!isAdmin) query = query.eq('submitted_by', user!.id)
    const { error } = await query

    setSaving(false)
    if (error) { setSaveError(error.message); return }
    router.push('/dashboard')
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
          <Link href="/dashboard" className="project-back" style={{ color: 'var(--muted)' }}>
            ← Dashboard
          </Link>
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span className="num">[07]</span>
            <span>Edit_</span>
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

              <div className="field">
                <label>Project title <span className="req">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="field">
                <label>Category</label>
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  options={EDIT_CATEGORIES.map(c => ({ value: c, label: c }))}
                />
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
                <Link href="/dashboard" className="btn btn--ghost">Cancel</Link>
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
