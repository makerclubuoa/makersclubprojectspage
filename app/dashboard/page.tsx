'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import Pagination from '@/app/components/Pagination'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { resolvePublicName, type Project } from '@/lib/projects'
import {
  container, seclabel, seclabelNum, seclabelBar,
  submitHero, submitHeroTitle, submitHeroSub, submitMain,
  modalBackdrop, modal, modalLabel, modalTitle, modalWarn, modalActions,
  btn, btnGradient, btnArr,
  form, formInner, formFig, formActions, formActionsSmall,
  field, fieldLabel, fieldInput,
  emptyState, emptyStateMono,
  dashTable, dashRow, dashRowMain, dashRowTitle, dashRowMeta,
  dashStatus, dashStatusLive, dashStatusDraft, dashStatusRejected, dashStatusLiked, dashStatusComaker,
  dashRowEdit, dashRowDelete,
} from '@/lib/ui'

function statusLabel(status: string | null, featured: boolean | null) {
  const s = status?.toUpperCase()
  if (!status) return { text: featured ? 'Live · Featured' : 'Live', cls: dashStatusLive }
  if (s === 'DRAFT') return { text: 'Pending review', cls: dashStatusDraft }
  if (s === 'REJECTED') return { text: 'Rejected', cls: dashStatusRejected }
  return { text: status, cls: 'border-rule' }
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [myProjects, setMyProjects] = useState<(Project & { _role: 'owner' | 'co-maker' })[]>([])
  const [likedProjects, setLikedProjects] = useState<Project[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [unlikingId, setUnlikingId] = useState<string | null>(null)
  const [myPage, setMyPage] = useState(1)
  const [likedPage, setLikedPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Profile settings
  const [publicName, setPublicName] = useState('')
  const [namePreference, setNamePreference] = useState<'name' | 'public_name'>('name')
  const [creditConsented, setCreditConsented] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [pendingPreference, setPendingPreference] = useState<'name' | 'public_name' | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setPageSize(mq.matches ? 5 : 12)
    const handler = (e: MediaQueryListEvent) => setPageSize(e.matches ? 5 : 12)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!profile) return
    setPublicName(profile.public_name ?? '')
    setNamePreference((profile.name_preference as 'name' | 'public_name') ?? 'name')
    setCreditConsented(profile.credit_consented ?? false)
  }, [profile])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    async function load() {
      setDataLoading(true)
      const [{ data: mine }, { data: coMakerOf }, { data: likeRows }] = await Promise.all([
        supabase
          .from('Projects')
          .select('*')
          .eq('submitted_by', user!.id)
          .order('date', { ascending: false }),
        supabase
          .from('Projects')
          .select('*')
          .contains('maker_ids', [user!.id])
          .neq('submitted_by', user!.id)
          .order('date', { ascending: false }),
        supabase
          .from('user_likes')
          .select('project_id')
          .eq('user_id', user!.id),
      ])

      const owned = (mine ?? []).map((p: Project) => ({ ...p, _role: 'owner' as const }))
      const coMade = (coMakerOf ?? []).map((p: Project) => ({ ...p, _role: 'co-maker' as const }))
      setMyProjects([...owned, ...coMade])

      if (likeRows && likeRows.length > 0) {
        const ids = likeRows.map((r: { project_id: string }) => r.project_id)
        const { data: liked } = await supabase
          .from('Projects')
          .select('*')
          .in('id', ids)
        setLikedProjects((liked ?? []) as Project[])
      } else {
        setLikedProjects([])
      }

      setDataLoading(false)
    }
    load()
  }, [user])

  function requestNamePreference(pref: 'name' | 'public_name') {
    if (pref === namePreference) return
    setPendingPreference(pref)
    setShowNameModal(true)
  }

  function confirmNamePreference() {
    if (pendingPreference) setNamePreference(pendingPreference)
    setPendingPreference(null)
    setShowNameModal(false)
  }

  async function saveProfile() {
    if (!user) return
    setUsernameError(null)
    const trimmed = publicName.trim()
    if (trimmed) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('public_name', trimmed)
        .neq('id', user.id)
        .maybeSingle()
      if (existing) {
        setUsernameError('That username is already taken.')
        return
      }
    }
    setProfileSaving(true)
    setProfileSaved(false)
    await supabase.from('profiles').update({
      public_name: trimmed || null,
      name_preference: namePreference,
      credit_consented: creditConsented,
    }).eq('id', user.id)
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function handleDelete(id: string) {
    const p = myProjects.find(p => p.id === id)
    if (p?._role !== 'owner') return
    if (!confirm('Remove this project? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('Projects').delete().eq('id', id).eq('submitted_by', user!.id)
    setMyProjects(prev => prev.filter(p => p.id !== id))
    setDeletingId(null)
  }

  async function handleUnlike(projectId: string) {
    setUnlikingId(projectId)
    await supabase.rpc('toggle_like', { p_project_id: projectId })
    setLikedProjects(prev => prev.filter(p => p.id !== projectId))
    setUnlikingId(null)
  }

  if (loading || !user) return null

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? ''

  return (
    <>
      <CursorTrail />
      <Nav />

      <header className={submitHero}>
        <div className={container}>
          <div className={`${seclabel} mb-6`}>
            <span className={seclabelNum}>[06]</span>
            <span>Dashboard_</span>
            <span className={seclabelBar} />
          </div>
          <h1 className={submitHeroTitle}>
            Hey, <em className="text-ink">{displayName}.</em>
          </h1>
          <p className={submitHeroSub}>Your submissions and liked projects.</p>
        </div>
      </header>

      {/* Name preference modal */}
      {showNameModal && (
        <div className={modalBackdrop} onClick={() => setShowNameModal(false)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            <p className={modalLabel}>Confirm change</p>
            <p className={modalTitle}>
              Switch to showing your <em className="not-italic text-ink-2">{pendingPreference === 'public_name' ? 'username' : 'real name'}</em>?
            </p>
            <p className="text-[13px] text-ink-2 m-0 mb-1">
              Project detail pages will show you as <strong>
                {pendingPreference === 'public_name'
                  ? (publicName.trim() || profile?.display_name)
                  : profile?.display_name}
              </strong> going forward.
            </p>
            <p className={modalWarn}>Remember to hit Save after closing this.</p>
            <div className={modalActions}>
              <button className={btn} onClick={() => setShowNameModal(false)}>Cancel</button>
              <button className={btnGradient} onClick={confirmNamePreference}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <main className={submitMain}>
        <div className={container}>

          {/* Profile settings */}
          <div className={`${seclabel} mb-6`}>
            <span className={seclabelNum}>00</span>
            <span>Profile_</span>
            <span className={seclabelBar} />
          </div>

          <div className={`${form} mb-12`}>
            <div className={formInner}>
              <span className={formFig}>FIG.02 — EVENT PROPOSAL FORM</span>

              <div className={field}>
                <label className={fieldLabel}>
                  Legal name
                  <span className="font-normal normal-case tracking-normal text-muted">read-only</span>
                </label>
                <input className={`${fieldInput} opacity-50`} type="text" value={profile?.display_name ?? ''} disabled />
              </div>

              <div className={field}>
                <label className={fieldLabel}>
                  Public username
                  <span className="font-normal normal-case tracking-normal">optional — alias shown instead of your name</span>
                </label>
                <input
                  className={fieldInput}
                  type="text"
                  placeholder="e.g. maker_ib, tinkerer42, or leave blank"
                  value={publicName}
                  onChange={e => { setPublicName(e.target.value); setUsernameError(null); if (namePreference === 'public_name' && !e.target.value.trim()) setNamePreference('name') }}
                />
                {usernameError && (
                  <span className="text-[11px] text-[#e53] mt-1">{usernameError}</span>
                )}
              </div>

              <div className={field}>
                <label className={fieldLabel}>Show me as</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    className={`px-3.5 py-[7px] border border-rule text-xs tracking-[0.06em] cursor-pointer ${namePreference === 'name' ? 'bg-ink text-paper' : 'bg-paper text-ink-2'}`}
                    onClick={() => requestNamePreference('name')}
                  >
                    My name · <em className="not-italic opacity-70">{profile?.display_name}</em>
                  </button>
                  <button
                    type="button"
                    className={`px-3.5 py-[7px] border border-rule text-xs tracking-[0.06em] ${namePreference === 'public_name' ? 'bg-ink text-paper' : 'bg-paper text-ink-2'} ${publicName.trim() ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'}`}
                    onClick={() => publicName.trim() && requestNamePreference('public_name')}
                  >
                    My username · <em className="not-italic opacity-70">{publicName.trim() || '—'}</em>
                  </button>
                </div>
                {!publicName.trim() && (
                  <span className="text-[11px] text-muted mt-1.5">Set a username above to enable this option.</span>
                )}
              </div>

              <div className={`${field} mb-0`}>
                <label className="flex flex-col gap-1.5 normal-case tracking-normal text-[13px] text-ink">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={creditConsented}
                      onChange={e => setCreditConsented(e.target.checked)}
                      className="w-auto m-0"
                    />
                    <span>Show my name on projects</span>
                  </span>
                  <span className="text-[11px] text-muted pl-6">
                    Controls whether your {namePreference === 'public_name' && publicName.trim() ? 'username' : 'name'} appears publicly on projects you submit or are added to as a co-maker. Leave unchecked to stay anonymous.
                  </span>
                </label>
              </div>

              <div className={formActions}>
                <span className={formActionsSmall}>
                  Currently showing as: <strong>{resolvePublicName({ display_name: profile?.display_name, public_name: profile?.public_name, name_preference: profile?.name_preference })}</strong>
                </span>
                <button type="button" className={btnGradient} onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved' : 'Save profile'} <span className={btnArr}>→</span>
                </button>
              </div>

            </div>
          </div>

          {/* My Projects */}
          <div className={`${seclabel} mb-6`}>
            <span className={seclabelNum}>01</span>
            <span>My_submissions</span>
            <span className={seclabelBar} />
            <Link href="/submit" className="inline-flex items-center gap-2.5 rounded-full font-semibold border border-transparent bg-accent text-white hover:opacity-85 active:scale-[0.97] px-3 py-[5px] text-[11px] [transition:transform_0.12s_ease,background_0.2s,color_0.2s,border-color_0.2s,opacity_0.2s]">
              + New
            </Link>
          </div>

          {dataLoading ? (
            <div className={emptyState}><span className={emptyStateMono}>Loading…</span></div>
          ) : myProjects.length === 0 ? (
            <div className={emptyState}>
              <div className={emptyStateMono}>_ no submissions yet</div>
              <p className="mt-2">
                <Link href="/submit" className="underline">Submit your first project →</Link>
              </p>
            </div>
          ) : (() => {
            const myTotalPages = Math.ceil(myProjects.length / pageSize)
            const myPaginated = myProjects.slice((myPage - 1) * pageSize, myPage * pageSize)
            return (
              <>
                <div className={dashTable}>
                  {myPaginated.map(p => {
                    const { text, cls } = statusLabel(p.status, p.Featured)
                    const isOwner = p._role === 'owner'
                    return (
                      <div key={p.id} className={dashRow}>
                        <div className={dashRowMain}>
                          <Link href={`/projects/${p.id}`} className={dashRowTitle}>{p.title}</Link>
                          <span className={dashRowMeta}>
                            {p.category}
                            {p.date && <> · {new Date(p.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                          </span>
                        </div>
                        {isOwner ? (
                          <span className={`${dashStatus} ${cls}`}>{text}</span>
                        ) : (
                          <span className={`${dashStatus} ${dashStatusComaker}`}>Co-maker</span>
                        )}
                        <Link href={`/projects/${p.id}/edit`} className={dashRowEdit}>Edit</Link>
                        {isOwner && (
                          <button
                            className={dashRowDelete}
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            title="Remove project"
                          >
                            {deletingId === p.id ? '…' : '✕ Remove'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                <Pagination page={myPage} totalPages={myTotalPages} onChange={setMyPage} />
              </>
            )
          })()}

          {/* Liked Projects */}
          <div className={`${seclabel} mt-16 mb-6`}>
            <span className={seclabelNum}>02</span>
            <span>Liked_</span>
            <span className={seclabelBar} />
          </div>

          {dataLoading ? (
            <div className={emptyState}><span className={emptyStateMono}>Loading…</span></div>
          ) : likedProjects.length === 0 ? (
            <div className={emptyState}>
              <div className={emptyStateMono}>_ nothing liked yet</div>
              <p className="mt-2">
                <Link href="/projects" className="underline">Browse projects →</Link>
              </p>
            </div>
          ) : (() => {
            const likedTotalPages = Math.ceil(likedProjects.length / pageSize)
            const likedPaginated = likedProjects.slice((likedPage - 1) * pageSize, likedPage * pageSize)
            return (
              <>
                <div className={`${dashTable} mb-4`}>
                  {likedPaginated.map(p => (
                    <div key={p.id} className={dashRow}>
                      <div className={dashRowMain}>
                        <Link href={`/projects/${p.id}`} className={dashRowTitle}>{p.title}</Link>
                        <span className={dashRowMeta}>
                          {p.category}
                          {p.makers && p.makers.length > 0 && <> · {p.makers.join(', ')}</>}
                        </span>
                      </div>
                      <span className={`${dashStatus} ${dashStatusLiked}`}>♥ {p.likes ?? 0}</span>
                      <button
                        className={dashRowDelete}
                        onClick={() => handleUnlike(p.id)}
                        disabled={unlikingId === p.id}
                        title="Unlike"
                      >
                        {unlikingId === p.id ? '…' : '♡ Unlike'}
                      </button>
                    </div>
                  ))}
                </div>
                <Pagination page={likedPage} totalPages={likedTotalPages} onChange={setLikedPage} />
              </>
            )
          })()}

        </div>
      </main>

      <Footer />
    </>
  )
}
