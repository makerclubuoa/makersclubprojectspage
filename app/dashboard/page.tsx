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

function statusLabel(status: string | null, featured: boolean | null) {
  const s = status?.toUpperCase()
  if (!status) return { text: featured ? 'Live · Featured' : 'Live', cls: 'dash-status--live' }
  if (s === 'DRAFT') return { text: 'Pending review', cls: 'dash-status--draft' }
  if (s === 'REJECTED') return { text: 'Rejected', cls: 'dash-status--rejected' }
  return { text: status, cls: '' }
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [myProjects, setMyProjects] = useState<Project[]>([])
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
      const [{ data: mine }, { data: likeRows }] = await Promise.all([
        supabase
          .from('Projects')
          .select('*')
          .eq('submitted_by', user!.id)
          .order('date', { ascending: false }),
        supabase
          .from('user_likes')
          .select('project_id')
          .eq('user_id', user!.id),
      ])

      setMyProjects((mine ?? []) as Project[])

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

      <header className="submit-hero">
        <div className="container">
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span className="num">[06]</span>
            <span>Dashboard_</span>
            <span className="bar" />
          </div>
          <h1 className="submit-hero__title">
            Hey, <em className="gradient-text">{displayName}.</em>
          </h1>
          <p className="submit-hero__sub">Your submissions and liked projects.</p>
        </div>
      </header>

      {/* Name preference modal */}
      {showNameModal && (
        <div className="modal-backdrop" onClick={() => setShowNameModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal__label">Confirm change</p>
            <p className="modal__title">
              Switch to showing your <em>{pendingPreference === 'public_name' ? 'username' : 'real name'}</em>?
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 4px' }}>
              Project detail pages will show you as <strong>
                {pendingPreference === 'public_name'
                  ? (publicName.trim() || profile?.display_name)
                  : profile?.display_name}
              </strong> going forward.
            </p>
            <p className="modal__warn">Remember to hit Save after closing this.</p>
            <div className="modal__actions">
              <button className="btn" onClick={() => setShowNameModal(false)}>Cancel</button>
              <button className="btn btn--gradient" onClick={confirmNamePreference}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <main className="submit-main">
        <div className="container">

          {/* Profile settings */}
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span className="num">00</span>
            <span>Profile_</span>
            <span className="bar" />
          </div>

          <div className="form" style={{ marginBottom: 48 }}>
            <div className="form__inner">

              <div className="field">
                <label>
                  Legal name
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)' }}>read-only</span>
                </label>
                <input type="text" value={profile?.display_name ?? ''} disabled style={{ opacity: 0.5 }} />
              </div>

              <div className="field">
                <label>
                  Public username
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional — alias shown instead of your name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. maker_ib, tinkerer42, or leave blank"
                  value={publicName}
                  onChange={e => { setPublicName(e.target.value); setUsernameError(null); if (namePreference === 'public_name' && !e.target.value.trim()) setNamePreference('name') }}
                />
                {usernameError && (
                  <span style={{ fontSize: 11, color: 'var(--error, #e53)', marginTop: 4 }}>{usernameError}</span>
                )}
              </div>

              <div className="field">
                <label>Show me as</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className={`typepick button${namePreference === 'name' ? ' is-on' : ''}`}
                    style={{ padding: '7px 14px', border: '1px solid var(--rule)', background: namePreference === 'name' ? 'var(--ink)' : 'var(--paper)', color: namePreference === 'name' ? 'var(--paper)' : 'var(--ink-2)', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}
                    onClick={() => requestNamePreference('name')}
                  >
                    My name · <em style={{ fontStyle: 'normal', opacity: 0.7 }}>{profile?.display_name}</em>
                  </button>
                  <button
                    type="button"
                    style={{ padding: '7px 14px', border: '1px solid var(--rule)', background: namePreference === 'public_name' ? 'var(--ink)' : 'var(--paper)', color: namePreference === 'public_name' ? 'var(--paper)' : 'var(--ink-2)', fontSize: 12, letterSpacing: '0.06em', cursor: publicName.trim() ? 'pointer' : 'not-allowed', opacity: publicName.trim() ? 1 : 0.4 }}
                    onClick={() => publicName.trim() && requestNamePreference('public_name')}
                  >
                    My username · <em style={{ fontStyle: 'normal', opacity: 0.7 }}>{publicName.trim() || '—'}</em>
                  </button>
                </div>
                {!publicName.trim() && (
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Set a username above to enable this option.</span>
                )}
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--ink)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={creditConsented}
                      onChange={e => setCreditConsented(e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Credit me on collaborative projects</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', paddingLeft: 24 }}>
                    When someone adds you as a co-maker, your {namePreference === 'public_name' && publicName.trim() ? 'username' : 'name'} will appear publicly on that project. Leave unchecked to stay anonymous.
                  </span>
                </label>
              </div>

              <div className="form__actions">
                <span className="small">
                  Currently showing as: <strong>{resolvePublicName({ display_name: profile?.display_name, public_name: profile?.public_name, name_preference: profile?.name_preference })}</strong>
                </span>
                <button type="button" className="btn btn--gradient" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved' : 'Save profile'} <span className="arr">→</span>
                </button>
              </div>

            </div>
          </div>

          {/* My Projects */}
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span className="num">01</span>
            <span>My_submissions</span>
            <span className="bar" />
            <Link href="/submit" className="btn btn--ghost" style={{ padding: '5px 12px', fontSize: 11 }}>
              + New
            </Link>
          </div>

          {dataLoading ? (
            <div className="empty-state"><span className="mono">Loading…</span></div>
          ) : myProjects.length === 0 ? (
            <div className="empty-state">
              <div className="mono">_ no submissions yet</div>
              <p style={{ marginTop: 8 }}>
                <Link href="/submit" style={{ textDecoration: 'underline' }}>Submit your first project →</Link>
              </p>
            </div>
          ) : (() => {
            const myTotalPages = Math.ceil(myProjects.length / pageSize)
            const myPaginated = myProjects.slice((myPage - 1) * pageSize, myPage * pageSize)
            return (
              <>
                <div className="dash-table">
                  {myPaginated.map(p => {
                    const { text, cls } = statusLabel(p.status, p.Featured)
                    return (
                      <div key={p.id} className="dash-row">
                        <div className="dash-row__main">
                          <Link href={`/projects/${p.id}`} className="dash-row__title">{p.title}</Link>
                          <span className="dash-row__meta">
                            {p.category}
                            {p.date && <> · {new Date(p.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                          </span>
                        </div>
                        <span className={`dash-status ${cls}`}>{text}</span>
                        <Link href={`/projects/${p.id}/edit`} className="dash-row__edit">Edit</Link>
                        <button
                          className="dash-row__delete"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          title="Remove project"
                        >
                          {deletingId === p.id ? '…' : '✕ Remove'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <Pagination page={myPage} totalPages={myTotalPages} onChange={setMyPage} />
              </>
            )
          })()}

          {/* Liked Projects */}
          <div className="seclabel" style={{ marginTop: 64, marginBottom: 24 }}>
            <span className="num">02</span>
            <span>Liked_</span>
            <span className="bar" />
          </div>

          {dataLoading ? (
            <div className="empty-state"><span className="mono">Loading…</span></div>
          ) : likedProjects.length === 0 ? (
            <div className="empty-state">
              <div className="mono">_ nothing liked yet</div>
              <p style={{ marginTop: 8 }}>
                <Link href="/" style={{ textDecoration: 'underline' }}>Browse projects →</Link>
              </p>
            </div>
          ) : (() => {
            const likedTotalPages = Math.ceil(likedProjects.length / pageSize)
            const likedPaginated = likedProjects.slice((likedPage - 1) * pageSize, likedPage * pageSize)
            return (
              <>
                <div className="dash-table" style={{ marginBottom: 16 }}>
                  {likedPaginated.map(p => (
                    <div key={p.id} className="dash-row">
                      <div className="dash-row__main">
                        <Link href={`/projects/${p.id}`} className="dash-row__title">{p.title}</Link>
                        <span className="dash-row__meta">
                          {p.category}
                          {p.makers && p.makers.length > 0 && <> · {p.makers.join(', ')}</>}
                        </span>
                      </div>
                      <span className="dash-status dash-status--liked">♥ {p.likes ?? 0}</span>
                      <button
                        className="dash-row__delete"
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
