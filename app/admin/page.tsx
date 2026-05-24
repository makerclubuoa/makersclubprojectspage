'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { useAuth } from '@/app/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/projects'
import Pagination from '@/app/components/Pagination'

const ADMIN_EMAIL = 'makerclubuoa@gmail.com'

type Filter = 'all' | 'pending' | 'live' | 'featured' | 'rejected'

function statusLabel(status: string | null, featured: boolean | null) {
  if (status === 'DRAFT') return { text: 'Pending', cls: 'dash-status--draft' }
  if (status === 'REJECTED') return { text: 'Rejected', cls: 'dash-status--rejected' }
  if (status === 'APPROVED') return { text: featured ? 'Live · Featured' : 'Live', cls: 'dash-status--live' }
  return { text: status ?? '—', cls: '' }
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [actingId, setActingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, setPending] = useState<{
    id: string
    title: string
    label: string
    action: () => Promise<void>
  } | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setPageSize(mq.matches ? 5 : 12)
    const handler = (e: MediaQueryListEvent) => setPageSize(e.matches ? 5 : 12)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (user.email !== ADMIN_EMAIL) { router.replace('/'); return }
  }, [user, loading, router])

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return
    async function load() {
      setDataLoading(true)
      const { data } = await supabase
        .from('Projects')
        .select('*')
        .order('date', { ascending: false })
      setProjects((data ?? []) as Project[])
      setDataLoading(false)
    }
    load()
  }, [user])

  function sendNotify(projectId: string, change: 'approved' | 'rejected' | 'featured') {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'status-change', projectId, change }),
    })
  }

  async function adminUpdate(id: string, payload: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/update-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error ?? 'Unknown error')
    }
  }

  async function toggleFeatured(id: string, featured: boolean) {
    setActingId(id)
    setActionError(null)
    try {
      await adminUpdate(id, { Featured: featured })
      setProjects(prev => prev.map(p => p.id === id ? { ...p, Featured: featured } : p))
      if (featured) sendNotify(id, 'featured')
    } catch (e) {
      setActionError((e as Error).message)
    }
    setActingId(null)
  }

  async function setStatus(id: string, status: string, change?: 'approved' | 'rejected') {
    setActingId(id)
    setActionError(null)
    try {
      await adminUpdate(id, { status })
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      if (change) sendNotify(id, change)
    } catch (e) {
      setActionError((e as Error).message)
    }
    setActingId(null)
  }

  async function handleDelete(id: string, title: string) {
    setActingId(id)
    setActionError(null)
    try {
      await adminUpdate(id, { _delete: true })
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      setActionError((e as Error).message)
    }
    setActingId(null)
  }

  async function confirmPending() {
    if (!pending) return
    setPending(null)
    await pending.action()
  }

  if (loading || !user) return null

  const isLive = (p: Project) => p.status === 'APPROVED'

  const counts: Record<Filter, number> = {
    all: projects.length,
    pending: projects.filter(p => p.status === 'DRAFT').length,
    live: projects.filter(isLive).length,
    featured: projects.filter(p => p.Featured === true).length,
    rejected: projects.filter(p => p.status === 'REJECTED').length,
  }

  const visible = filter === 'all' ? projects
    : filter === 'pending' ? projects.filter(p => p.status === 'DRAFT')
    : filter === 'live' ? projects.filter(isLive)
    : filter === 'featured' ? projects.filter(p => p.Featured === true)
    : projects.filter(p => p.status === 'REJECTED')

  const totalPages = Math.ceil(visible.length / pageSize)
  const paginated = visible.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <CursorTrail />
      <Nav />

      <header className="submit-hero">
        <div className="container">
          <div className="seclabel" style={{ marginBottom: 24 }}>
            <span className="num">[08]</span>
            <span>Admin_</span>
            <span className="bar" />
          </div>
          <h1 className="submit-hero__title">
            All <em className="gradient-text">submissions</em>
          </h1>
          <p className="submit-hero__sub">Approve, feature, reject, or delete any project.</p>
        </div>
      </header>

      <main className="submit-main">
        <div className="container">

          {actionError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'color-mix(in oklab, var(--pop-red) 10%, var(--paper))', border: '1px solid var(--pop-red)', color: 'var(--pop-red)', fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              Error: {actionError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'live', 'featured', 'rejected'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1) }}
                className={`btn ${filter === f ? 'btn--gradient' : 'btn--ghost'}`}
                style={{ padding: '5px 14px', fontSize: 11 }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          {dataLoading ? (
            <div className="empty-state"><span className="mono">Loading…</span></div>
          ) : visible.length === 0 ? (
            <div className="empty-state"><span className="mono">_ nothing here</span></div>
          ) : (
            <>
            <div className="dash-table">
              {paginated.map(p => {
                const live = isLive(p)
                const featured = p.Featured === true
                const isRejected = p.status === 'REJECTED'
                const isDraftOrRejected = p.status === 'DRAFT' || isRejected
                const { text, cls } = statusLabel(p.status, p.Featured)
                const busy = actingId === p.id
                return (
                  <div key={p.id} className="dash-row" style={{ flexWrap: 'wrap', gap: '6px 0', alignItems: 'center' }}>
                    <div className="dash-row__main">
                      <Link href={`/projects/${p.id}`} className="dash-row__title">{p.title}</Link>
                      <span className="dash-row__meta">
                        {p.category}
                        {p.date && <> · {new Date(p.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                        {p.makers && p.makers.length > 0 && <> · {p.makers.join(', ')}</>}
                      </span>
                    </div>

                    <span className={`dash-status ${cls}`}>{text}</span>

                    <Link href={`/projects/${p.id}/edit?from=admin`} className="dash-row__edit">Edit</Link>

                    {isDraftOrRejected && (
                      <button
                        className="dash-row__edit"
                        style={{ color: 'var(--pop-blue)' }}
                        onClick={() => setPending({ id: p.id, title: p.title, label: 'Approve', action: () => setStatus(p.id, 'APPROVED', 'approved') })}
                        disabled={busy}
                      >
                        {busy ? '…' : '✓ Approve'}
                      </button>
                    )}

                    {live && !featured && (
                      <button
                        className="dash-row__edit"
                        style={{ color: 'var(--pop-violet)' }}
                        onClick={() => setPending({ id: p.id, title: p.title, label: 'Feature', action: () => toggleFeatured(p.id, true) })}
                        disabled={busy}
                      >
                        {busy ? '…' : '★ Feature'}
                      </button>
                    )}

                    {live && featured && (
                      <button
                        className="dash-row__edit"
                        style={{ color: 'var(--pop-blue)' }}
                        onClick={() => setPending({ id: p.id, title: p.title, label: 'Un-feature', action: () => toggleFeatured(p.id, false) })}
                        disabled={busy}
                      >
                        {busy ? '…' : '★ Un-feature'}
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        className="dash-row__delete"
                        onClick={() => setPending({ id: p.id, title: p.title, label: 'Reject', action: () => setStatus(p.id, 'REJECTED', 'rejected') })}
                        disabled={busy}
                      >
                        {busy ? '…' : '✕ Reject'}
                      </button>
                    )}

                    <button
                      className="dash-row__delete"
                      onClick={() => setPending({ id: p.id, title: p.title, label: 'Delete', action: () => handleDelete(p.id, p.title) })}
                      disabled={busy}
                    >
                      {busy ? '…' : 'Delete'}
                    </button>
                  </div>
                )
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}

        </div>
      </main>

      <Footer />

      {pending && (
        <div className="modal-backdrop" onClick={() => setPending(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal__label">Confirm action</p>
            <p className="modal__title">
              {pending.label} <em>"{pending.title}"</em>?
            </p>
            {pending.label === 'Delete' && (
              <p className="modal__warn">This cannot be undone.</p>
            )}
            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setPending(null)}>Cancel</button>
              <button
                className={`btn ${pending.label === 'Delete' || pending.label === 'Reject' ? 'btn--danger' : 'btn--gradient'}`}
                onClick={confirmPending}
              >
                {pending.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
