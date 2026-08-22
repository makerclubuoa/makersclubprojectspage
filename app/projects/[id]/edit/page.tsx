'use client'

import { useState, useEffect, useRef, use, Suspense } from 'react'
import Link from 'next/link'
import AccessibleModal from '@/app/components/AccessibleModal'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Screentone from '@/app/components/global/Screentone'
import penNib from '@/public/doodle-pen-nib.png'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, resolvePublicName, type Project } from '@/lib/projects'
import { compressForUpload, imageFileError } from '@/lib/image-compress'
import CustomSelect from '@/app/components/CustomSelect'
import MediaUploader, { draftFromStored, uploadMediaDrafts, type DraftMedia } from '@/app/components/MediaUploader'
import {
  secHead, secHeadRow, secHint,
  pageWrap, pageBand, pageBandTitle, pageBandDoodle, submitMain,
  form, formInner, formFig, formActions,
  field, fieldTight, fieldLabel, fieldReq, fieldInput, fieldTextarea, fieldRow,
  btnGhost, btnGradient, btnDanger, btnArr,
  modalLabel, modalTitle, modalActions,
  makersChips, makersChip, makersChipAdd, makersChipRemove,
  makersSearch, makersDropdown, makersDropdownItem, makersDropdownName, makersDropdownEmail, makersDropdownEmpty,
  imgUploadBase, imgUploadIdle, imgUploadPreview, imgUploadInner, imgUploadIcon, imgUploadHint, imgUploadRemove,
  toolTags, toolTag, toolTagOn, toolTagOther, toolTagOtherInput, toolTagOtherBtn,
  dynList, dynRow, dynRowRemove, dynRowCols3, dynRowCols4, dynRowMilestone, dynRowMilestoneInput, dynAdd,
  galleryUpload, galleryGrid, galleryThumb, galleryThumbImg, galleryThumbRemove,
} from '@/lib/ui'

export const dynamic = 'force-dynamic'

const CONTAINER_760 = 'max-w-[760px] mx-auto px-7 max-[640px]:px-4 relative z-[1]'
const BACK_LINK = 'inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-ink-2 mb-2 no-underline transition-colors duration-200 hover:text-pop-magenta'

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
  const [website, setWebsite]           = useState('')

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

  // Music & video
  const [mediaDrafts, setMediaDrafts] = useState<DraftMedia[]>([])

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
  const [showRemoveSelfModal, setShowRemoveSelfModal] = useState(false)
  const [pendingRemoveId, setPendingRemoveId]         = useState<string | null>(null)

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(`/projects/${id}/edit`)}`)
  }, [user, loading, router, id])

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
      const isMaker = data.submitted_by === user!.id || (data.maker_ids ?? []).includes(user!.id)
      if (user!.email !== 'makerclubuoa@gmail.com' && !isMaker) { setNotAllowed(true); setFetching(false); return }

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
      setWebsite(data.website ?? '')
      // Load real profiles for submitted_by + maker_ids
      const submittedBy = data.submitted_by as string | null
      const makerIds = (data.maker_ids ?? []) as string[]
      const allIds = Array.from(new Set([...(submittedBy ? [submittedBy] : []), ...makerIds]))
      let realProfiles: CoMakerProfile[] = []
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email, public_name, name_preference, credit_consented')
          .in('id', allIds)
        realProfiles = (profiles ?? []) as CoMakerProfile[]
      }
      // Order: submitted_by first, then remaining maker_ids
      const orderedProfiles: CoMakerProfile[] = []
      if (submittedBy) {
        const found = realProfiles.find(p => p.id === submittedBy)
        if (found) orderedProfiles.push(found)
      }
      for (const mid of makerIds) {
        if (!orderedProfiles.some(p => p.id === mid)) {
          const found = realProfiles.find(p => p.id === mid)
          if (found) orderedProfiles.push(found)
        }
      }
      // Legacy names: strings in `makers` with no matching real profile
      const realNameSet = new Set(orderedProfiles.map(p => resolvePublicName(p).toLowerCase()))
      const legacyEntries = (data.makers ?? [])
        .filter((n: string) => !realNameSet.has(n.toLowerCase()))
        .map((n: string) => ({ id: `name:${n}`, display_name: n, email: null, public_name: null, name_preference: null, credit_consented: true }))
      setCoMakers([...orderedProfiles, ...legacyEntries])
      setTools(data.tools ?? [])
      setImagePreview(data.image ?? null)
      setExistingGallery(data.gallery_images ?? [])
      setMediaDrafts((data.media ?? []).map(draftFromStored))

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
      const search = coMakerSearch.replace(/[,()%]/g, ' ').trim()
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email, public_name, name_preference, credit_consented')
        .or(`display_name.ilike.%${search}%,public_name.ilike.%${search}%,email.ilike.%${search}%`)
        .neq('id', user?.id ?? '')
        .limit(6)
      setCoMakerResults(
        (data ?? []).filter((r: { id: string }) => !coMakers.some(m => m.id === r.id))
      )
    }, 250)
    return () => clearTimeout(timer)
  }, [coMakerSearch, coMakers, user])

  const isAdmin = user?.email === 'makerclubuoa@gmail.com'
  const isProjectOwner = project?.submitted_by === user?.id

  function canRemoveMaker(makerId: string): boolean {
    if (isAdmin || isProjectOwner) return true
    if (makerId.startsWith('name:')) return false
    return makerId === user?.id
  }

  function handleRemoveMaker(makerId: string) {
    if (makerId === user?.id) {
      setPendingRemoveId(makerId)
      setShowRemoveSelfModal(true)
      return
    }
    setCoMakers(prev => prev.filter(m => m.id !== makerId))
  }

  function confirmRemoveSelf() {
    if (pendingRemoveId) setCoMakers(prev => prev.filter(m => m.id !== pendingRemoveId))
    setPendingRemoveId(null)
    setShowRemoveSelfModal(false)
  }

  function addCoMaker(r: { id: string; display_name: string; email: string | null; public_name: string | null; name_preference: string | null; credit_consented: boolean }) {
    setCoMakers(prev => [...prev, r])
    setCoMakerSearch(''); setCoMakerResults([]); setShowCoMakerDropdown(false)
  }

  function handleImageChange(file: File | null) {
    if (!file) return
    const fileError = imageFileError(file)
    if (fileError) { setSaveError(fileError); return }
    setSaveError('')
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

  async function addGalleryFiles(files: FileList | null) {
    if (!files) return
    const picked = Array.from(files)
    const invalid = picked.map(imageFileError).find(Boolean)
    if (invalid) { setSaveError(invalid); return }
    const arr = picked.slice(0, Math.max(0, 40 - existingGallery.length - newGalleryFiles.length))
    setSaveError('')
    setNewGalleryFiles(prev => [...prev, ...arr])
    const previews = await Promise.all(arr.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = event => resolve(event.target?.result as string)
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
      reader.readAsDataURL(file)
    })))
    setNewGalleryPreviews(prev => [...prev, ...previews])
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
    const fileError = imageFileError(file)
    if (fileError) { setSaveError(fileError); return }
    setSaveError('')
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
    // `required` catches empty inputs natively, but a field holding only spaces
    // satisfies it and would then fail here with no explanation at all.
    const blank = [
      !title.trim() && 'a project title',
      !blurb.trim() && 'a one-line description',
    ].filter(Boolean) as string[]
    if (blank.length > 0) {
      setSaveError(`Please add ${blank.join(' and ')} before saving.`)
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaveError('Your session expired. Sign in and try again.')
      return
    }
    setSaving(true)
    setSaveError('')

    const uploadedImagePaths: string[] = []
    const cleanupUploads = async (mediaPaths: string[] = []) => {
      await Promise.all([
        uploadedImagePaths.length
          ? supabase.storage.from('Project Images').remove(uploadedImagePaths)
          : Promise.resolve(),
        mediaPaths.length
          ? supabase.storage.from('Project Media').remove(mediaPaths)
          : Promise.resolve(),
      ])
    }

    let imageUrl: string | null | undefined = undefined

    if (clearImage) {
      imageUrl = null
    } else if (imageFile) {
      const shrunk = await compressForUpload(imageFile, 'cover')
      const path = `${id}/cover-${Date.now()}.${shrunk.ext}`
      const { error: uploadError } = await supabase.storage
        .from('Project Images')
        .upload(path, shrunk.blob, { upsert: true, contentType: shrunk.contentType })
      if (uploadError) {
        setSaveError(`Image upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }
      uploadedImagePaths.push(path)
      const { data: { publicUrl } } = supabase.storage
        .from('Project Images')
        .getPublicUrl(path)
      imageUrl = publicUrl
    }

    const uploadedGalleryUrls: string[] = []
    for (let i = 0; i < newGalleryFiles.length; i++) {
      const file = newGalleryFiles[i]
      const shrunk = await compressForUpload(file, 'inline')
      const path = `${id}/gallery/${Date.now()}-${i}.${shrunk.ext}`
      const { error: gErr } = await supabase.storage
        .from('Project Images')
        .upload(path, shrunk.blob, { upsert: true, contentType: shrunk.contentType })
      if (gErr) { await cleanupUploads(); setSaveError(`Gallery image ${i + 1} failed: ${gErr.message}`); setSaving(false); return }
      uploadedImagePaths.push(path)
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
        const shrunk = await compressForUpload(file, 'inline')
        const path = `${id}/log/${Date.now()}-${i}.${shrunk.ext}`
        const { error: lErr } = await supabase.storage.from('Project Images').upload(path, shrunk.blob, { upsert: true, contentType: shrunk.contentType })
        if (lErr) { await cleanupUploads(); setSaveError(`Log image ${i + 1} failed: ${lErr.message}`); setSaving(false); return }
        uploadedImagePaths.push(path)
        const { data: { publicUrl } } = supabase.storage.from('Project Images').getPublicUrl(path)
        logImageUrls.push(publicUrl)
      } else {
        logImageUrls.push(logEntries[i].image || null)
      }
    }

    const build_log = logEntries
      .map((entry, originalIndex) => ({ entry, originalIndex }))
      .filter(({ entry }) => entry.title.trim())
      .map(({ entry: e, originalIndex }) => ({
        date:      e.date || new Date().toISOString().split('T')[0],
        title:     e.title.trim(),
        body:      e.body.trim(),
        milestone: e.milestone,
        tag:       e.tag.trim() || undefined,
        image:     logImageUrls[originalIndex] || undefined,
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

    const { media, error: mediaError, uploadedPaths: uploadedMediaPaths } = await uploadMediaDrafts(id, mediaDrafts)
    if (mediaError) { await cleanupUploads(); setSaveError(mediaError); setSaving(false); return }

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
      website:        website.trim() || null,
      image:          imageUrl !== undefined ? imageUrl : (project?.image ?? null),
      start_date:     startDate || null,
      build_time:     buildTime.trim() || null,
      gallery_images: galleryImages.length > 0 ? galleryImages : null,
      media,
      build_log:      build_log.length > 0 ? build_log : null,
      bom:            bom.length > 0 ? bom : null,
      retro_wins:     retro_wins.length > 0 ? retro_wins : null,
      retro_fixes:    retro_fixes.length > 0 ? retro_fixes : null,
    }
    let response: Response
    let result: { error?: string }
    try {
      response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ project: update }),
      })
      result = await response.json()
    } catch {
      await cleanupUploads(uploadedMediaPaths)
      setSaving(false)
      setSaveError('Could not reach the server. Try saving again.')
      return
    }

    setSaving(false)
    if (!response.ok) { await cleanupUploads(uploadedMediaPaths); setSaveError(result.error ?? 'Could not save project'); return }
    router.push(backHref)
  }

  if (loading || fetching) return null

  if (notAllowed) {
    return (
      <div className={pageWrap}>
        <main className="min-h-dvh flex items-center justify-center p-10">
          <div className="text-center bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] px-10 py-12">
            <p className="font-semibold mb-5">You can only edit your own projects.</p>
            <Link href="/dashboard" className={btnGhost}>← Back to dashboard</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={pageWrap}>
      <div className="pt-20">

      <header className={pageBand}>
        <Screentone />
        <Image src={penNib} alt="" className={`${pageBandDoodle} -rotate-6 -bottom-4`} />
        <Link href={backHref} className={`${BACK_LINK} relative z-[1]`}>
          {backLabel}
        </Link>
        <h1 className={`${pageBandTitle} text-pop-violet`}>
          Edit, {project?.title}
        </h1>
      </header>

      <main className={submitMain}>
        <div className={CONTAINER_760}>
          <form className={form} onSubmit={handleSave}>
            <div className={formInner}>
              <span className={formFig}>Edit project</span>

              <h3 className={`${secHead} text-pop-blue mb-[18px] mt-1`}>The Basics</h3>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-title">Project title <span className={fieldReq}>*</span></label>
                <input id="edit-title" className={fieldInput} type="text" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-category">Category</label>
                <CustomSelect
                  id="edit-category"
                  value={category}
                  onChange={v => { setCategory(v); if (v !== 'Other') setOtherCategory('') }}
                  options={[...EDIT_CATEGORIES.map(c => ({ value: c, label: c })), { value: 'Other', label: 'Other…' }]}
                />
                {category === 'Other' && (
                  <input id="edit-category-other" aria-label="Other project category" className={`${fieldInput} mt-2`} type="text" placeholder="Describe the category"
                    value={otherCategory} onChange={e => setOtherCategory(e.target.value)}
                    autoFocus />
                )}
              </div>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-co-makers">Makers / contributors</label>
                <div className={makersChips}>
                  {coMakers.map(m => (
                    <span key={m.id} className={makersChip}>
                      {m.id.startsWith('name:') ? m.display_name : resolvePublicName(m)}
                      {canRemoveMaker(m.id) && (
                        <button type="button" className={makersChipRemove} onClick={() => handleRemoveMaker(m.id)} aria-label={`Remove ${m.display_name} as a maker`}>✕</button>
                      )}
                    </span>
                  ))}
                  {!coMakers.some(m => m.id === user?.id) && (
                    <button type="button" className={makersChipAdd}
                      onClick={() => setCoMakers(prev => [...prev, {
                        id: user!.id,
                        display_name: profile?.display_name ?? user!.email?.split('@')[0] ?? '',
                        email: user!.email ?? null,
                        public_name: profile?.public_name ?? null,
                        name_preference: profile?.name_preference ?? null,
                        credit_consented: profile?.credit_consented ?? true,
                      }])}>
                      + Add me
                    </button>
                  )}
                </div>
                <div className={makersSearch} data-comaker-picker onBlur={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setShowCoMakerDropdown(false)
                }}>
                  <input id="edit-co-makers" className={fieldInput} type="text" placeholder="Search for a maker by name, username, or email… They must have an account to be added" autoComplete="off"
                    value={coMakerSearch}
                    onChange={e => { setCoMakerSearch(e.target.value); setShowCoMakerDropdown(true) }}
                    onFocus={() => setShowCoMakerDropdown(true)}
                    role="combobox" aria-autocomplete="list"
                    aria-expanded={showCoMakerDropdown && !!coMakerSearch.trim()}
                    aria-controls="edit-co-maker-results"
                    onKeyDown={event => {
                      if (event.key === 'ArrowDown' && coMakerResults.length > 0) {
                        event.preventDefault()
                        document.getElementById('edit-co-maker-option-0')?.focus()
                      } else if (event.key === 'Escape') setShowCoMakerDropdown(false)
                    }} />
                  {showCoMakerDropdown && coMakerSearch.trim() && (
                    <div className={makersDropdown} id="edit-co-maker-results" role="listbox" aria-label="Matching co-makers">
                      {coMakerResults.length > 0 ? coMakerResults.map((r, resultIndex) => (
                        <button id={`edit-co-maker-option-${resultIndex}`} key={r.id} type="button" className={makersDropdownItem} onClick={() => addCoMaker(r)} role="option" aria-selected="false">
                          <span className={makersDropdownName}>{r.display_name}</span>
                          <span className={makersDropdownEmail}>{r.email ?? (r.credit_consented ? 'can be credited' : 'will appear anonymous')}</span>
                        </button>
                      )) : <div className={makersDropdownEmpty}>No users found</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-blurb">
                  One-line description <span className={fieldReq}>*</span>
                  <span className="font-normal normal-case tracking-normal">max 140 chars</span>
                </label>
                <input id="edit-blurb" className={fieldInput} type="text" maxLength={140} value={blurb} onChange={e => setBlurb(e.target.value)} required />
              </div>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-description">Full story</label>
                <textarea
                  id="edit-description"
                  className={`${fieldTextarea} min-h-[140px]`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className={fieldRow}>
                <div className={field}>
                  <label className={fieldLabel} htmlFor="edit-start-date">When did it start?</label>
                  <input id="edit-start-date" className={fieldInput} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className={field}>
                  <label className={fieldLabel} htmlFor="edit-build-time">How long did it take?</label>
                  <input id="edit-build-time" className={fieldInput} type="text" placeholder="e.g. ~3 weeks"
                    value={buildTime} onChange={e => setBuildTime(e.target.value)} />
                </div>
              </div>

              <div className={field}>
                <span className={fieldLabel} id="edit-cover-label">Project photo</span>
                <label
                  className={`${imgUploadBase} ${imagePreview ? imgUploadPreview : imgUploadIdle}`}
                  style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleImageChange(e.dataTransfer.files[0] ?? null) }}
                  aria-labelledby="edit-cover-label"
                >
                  {!imagePreview && (
                    <span className={imgUploadInner}>
                      <span className={imgUploadIcon}>↑</span>
                      <span>Drop an image or click to browse</span>
                      <span className={imgUploadHint}>JPG, PNG, WEBP · max 5 MB</span>
                    </span>
                  )}
                  <input
                    aria-labelledby="edit-cover-label"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
                  />
                  {imagePreview && (
                    <button type="button" className={`${imgUploadRemove} top-2 right-2`} onClick={handleClearImage}>
                      ✕ Remove
                    </button>
                  )}
                </label>
              </div>

              <div className={field}>
                <span className={fieldLabel}>Tools &amp; materials used</span>
                <div className={toolTags}>
                  {TOOL_SUGGESTIONS.map(t => (
                    <button key={t} type="button"
                      className={tools.includes(t) ? toolTagOn : toolTag}
                      onClick={() => toggleTool(t)} aria-pressed={tools.includes(t)}>{t}</button>
                  ))}
                  {tools.filter(t => !TOOL_SUGGESTIONS.includes(t)).map(t => (
                    <button key={t} type="button"
                      className={toolTagOn}
                      onClick={() => toggleTool(t)} aria-pressed="true">{t}</button>
                  ))}
                  <span className={toolTagOther}>
                    <input className={toolTagOtherInput} type="text" placeholder="Other…" value={otherTool} aria-label="Add another tool or material"
                      onChange={e => setOtherTool(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitOtherTool() } }} />
                    {otherTool.trim() && <button type="button" className={toolTagOtherBtn} onClick={commitOtherTool} aria-label="Add tool or material">+</button>}
                  </span>
                </div>
              </div>

              {/* BUILD LOG */}
              <div className={`${secHeadRow} mt-8 mb-[18px]`}>
                <h3 className={`${secHead} text-pop-violet`}>Build Log</h3>
                <span className={secHint}>optional · timeline of your process</span>
              </div>

              {logEntries.length > 0 && (
                <div className={dynList}>
                  {logEntries.map((entry, i) => (
                    <div key={i} className={dynRow}>
                      <button type="button" className={dynRowRemove} aria-label={`Remove build log entry ${i + 1}`} onClick={() => {
                        setLogEntries(prev => prev.filter((_, idx) => idx !== i))
                        setLogEntryFiles(prev => prev.filter((_, idx) => idx !== i))
                        setLogEntryPreviews(prev => prev.filter((_, idx) => idx !== i))
                      }}>✕</button>
                      <div className={dynRowCols3}>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-log-${i}-date`}>Date</label>
                          <input id={`edit-log-${i}-date`} className={fieldInput} type="date" value={entry.date} onChange={e => updateLog(i, 'date', e.target.value)} />
                        </div>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-log-${i}-title`}>Title</label>
                          <input id={`edit-log-${i}-title`} className={fieldInput} type="text" placeholder="e.g. First prototype"
                            value={entry.title} onChange={e => updateLog(i, 'title', e.target.value)} />
                        </div>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-log-${i}-tag`}>Tag</label>
                          <input id={`edit-log-${i}-tag`} className={fieldInput} type="text" placeholder="e.g. Prototype"
                            value={entry.tag} onChange={e => updateLog(i, 'tag', e.target.value)} />
                        </div>
                      </div>
                      <div className={fieldTight}>
                        <label className={fieldLabel} htmlFor={`edit-log-${i}-notes`}>Notes</label>
                        <textarea id={`edit-log-${i}-notes`} className={`${fieldTextarea} min-h-[64px]`} placeholder="What happened at this stage?"
                          value={entry.body} onChange={e => updateLog(i, 'body', e.target.value)} />
                      </div>
                      <label className={dynRowMilestone}>
                        <input className={dynRowMilestoneInput} type="checkbox" checked={entry.milestone}
                          onChange={e => updateLog(i, 'milestone', e.target.checked)} />
                        Mark as milestone
                      </label>
                      <div className={`${fieldTight} mt-2`}>
                        <span className={fieldLabel}>Photo <span className="font-normal normal-case tracking-normal">optional</span></span>
                        {logEntryPreviews[i] ? (
                          <div className="relative inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logEntryPreviews[i]!} alt="Log entry" className="max-w-full max-h-[200px] block rounded" />
                            <button type="button" className={`${imgUploadRemove} top-1.5 right-1.5`} onClick={() => removeLogImage(i)} aria-label={`Remove photo from build log entry ${i + 1}`}>✕ Remove</button>
                          </div>
                        ) : (
                          <label className={`${galleryUpload} inline-flex`}>
                            ↑ Add photo
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => handleLogImageChange(i, e.target.files?.[0] ?? null)} />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className={dynAdd} onClick={() => {
                setLogEntries(prev => [...prev, emptyLog()])
                setLogEntryFiles(prev => [...prev, null])
                setLogEntryPreviews(prev => [...prev, null])
              }}>
                + Add log entry
              </button>

              {/* GALLERY */}
              <div className={`${secHeadRow} mt-8 mb-[18px]`}>
                <h3 className={`${secHead} text-pop-magenta`}>Gallery</h3>
                <span className={secHint}>optional · process photos</span>
              </div>

              {(existingGallery.length > 0 || newGalleryPreviews.length > 0) && (
                <div className={galleryGrid}>
                  {existingGallery.map((url, i) => (
                    <div key={url} className={galleryThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${i + 1}`} className={galleryThumbImg} />
                      <button type="button" className={galleryThumbRemove} onClick={() => removeExistingGallery(url)} aria-label={`Remove gallery photo ${i + 1}`}>✕</button>
                    </div>
                  ))}
                  {newGalleryPreviews.map((src, i) => (
                    <div key={i} className={galleryThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`New ${i + 1}`} className={galleryThumbImg} />
                      <button type="button" className={galleryThumbRemove} onClick={() => removeNewGallery(i)} aria-label={`Remove new gallery photo ${i + 1}`}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <label className={galleryUpload}>
                ↑ Add photos
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => addGalleryFiles(e.target.files)} />
              </label>

              {/* MUSIC & VIDEO */}
              <div className={`${secHeadRow} mt-8 mb-[18px]`}>
                <h3 className={`${secHead} text-pop-blue`}>Music &amp; Video</h3>
                <span className={secHint}>optional · plays on cards</span>
              </div>
              <MediaUploader items={mediaDrafts} onChange={setMediaDrafts} />

              {/* BOM */}
              <div className={`${secHeadRow} mt-8 mb-[18px]`}>
                <h3 className={`${secHead} text-pop-pink`}>Bill of Materials</h3>
                <span className={secHint}>optional · what did it cost?</span>
              </div>

              {bomRows.length > 0 && (
                <div className={dynList}>
                  {bomRows.map((row, i) => (
                    <div key={i} className={dynRow}>
                      <button type="button" className={dynRowRemove} aria-label={`Remove bill of materials row ${i + 1}`} onClick={() => setBomRows(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                      <div className={dynRowCols4}>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-bom-${i}-item`}>Item</label>
                          <input id={`edit-bom-${i}-item`} className={fieldInput} type="text" placeholder="e.g. Arduino Pro Mini"
                            value={row.item} onChange={e => updateBom(i, 'item', e.target.value)} />
                        </div>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-bom-${i}-qty`}>Qty</label>
                          <input id={`edit-bom-${i}-qty`} className={fieldInput} type="number" min="1" value={row.qty}
                            onChange={e => updateBom(i, 'qty', e.target.value)} />
                        </div>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-bom-${i}-cost`}>Unit cost $</label>
                          <input id={`edit-bom-${i}-cost`} className={fieldInput} type="number" min="0" step="0.01" placeholder="0.00"
                            value={row.unit_cost} onChange={e => updateBom(i, 'unit_cost', e.target.value)} />
                        </div>
                        <div className={fieldTight}>
                          <label className={fieldLabel} htmlFor={`edit-bom-${i}-source`}>Source</label>
                          <input id={`edit-bom-${i}-source`} className={fieldInput} type="text" placeholder="e.g. Jaycar"
                            value={row.src} onChange={e => updateBom(i, 'src', e.target.value)} />
                        </div>
                      </div>
                      <div className={fieldTight}>
                        <label className={fieldLabel} htmlFor={`edit-bom-${i}-description`}>Description</label>
                        <input id={`edit-bom-${i}-description`} className={fieldInput} type="text" placeholder="e.g. With pin headers"
                          value={row.desc} onChange={e => updateBom(i, 'desc', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className={dynAdd} onClick={() => setBomRows(prev => [...prev, emptyBom()])}>
                + Add item
              </button>

              {/* RETRO */}
              <div className={`${secHeadRow} mt-8 mb-[18px]`}>
                <h3 className={`${secHead} text-pop-red`}>What We Learned</h3>
                <span className={secHint}>optional · one item per line</span>
              </div>
              <div className={fieldRow}>
                <div className={field}>
                  <label className={fieldLabel} htmlFor="edit-retro-wins">What worked <span className="text-[#22c55e]">[ + ]</span></label>
                  <textarea
                    id="edit-retro-wins"
                    className={`${fieldTextarea} min-h-[100px]`}
                    placeholder={'Pin headers saved hours of debugging.\nPair-building at open hours was faster.'}
                    value={retroWins} onChange={e => setRetroWins(e.target.value)} />
                </div>
                <div className={field}>
                  <label className={fieldLabel} htmlFor="edit-retro-fixes">What we&rsquo;d change <span className="text-pop-red">[ - ]</span></label>
                  <textarea
                    id="edit-retro-fixes"
                    className={`${fieldTextarea} min-h-[100px]`}
                    placeholder={'Should have ordered the PCB earlier.\nNeeds a service hatch.'}
                    value={retroFixes} onChange={e => setRetroFixes(e.target.value)} />
                </div>
              </div>

              {/* LINKS */}
              <h3 className={`${secHead} text-pop-orange mt-8 mb-[18px]`}>Links</h3>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-github">GitHub / source</label>
                <input
                  id="edit-github"
                  className={fieldInput}
                  type="url"
                  placeholder="https://github.com/…"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                />
              </div>

              <div className={field}>
                <label className={fieldLabel} htmlFor="edit-website">Demo / site</label>
                <input
                  id="edit-website"
                  className={fieldInput}
                  type="url"
                  placeholder="https://…"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              {saveError && (
                <p className="text-pop-red text-xs tracking-[0.04em]">{saveError}</p>
              )}

              <div className={formActions}>
                <Link href={backHref} className={btnGhost}>Cancel</Link>
                <button className={btnGradient} type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'} <span className={btnArr}>→</span>
                </button>
              </div>

            </div>
          </form>
        </div>
      </main>

      {showRemoveSelfModal && (
        <AccessibleModal onClose={() => setShowRemoveSelfModal(false)} labelledBy="remove-self-title">
            <p className={modalLabel}>Remove yourself?</p>
            <p className={modalTitle} id="remove-self-title">Are you sure you want to remove yourself from this project&apos;s makers list?</p>
            <div className={modalActions}>
              <button className={btnGhost} onClick={() => setShowRemoveSelfModal(false)}>Cancel</button>
              <button className={btnDanger} onClick={confirmRemoveSelf}>Remove me</button>
            </div>
        </AccessibleModal>
      )}
      </div>
    </div>
  )
}
