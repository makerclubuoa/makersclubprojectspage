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
  const s = status?.toUpperCase()
  if (s === 'DRAFT') return { text: 'Pending', cls: 'dash-status--draft' }
  if (s === 'REJECTED') return { text: 'Rejected', cls: 'dash-status--rejected' }
  return { text: featured ? 'Live · Featured' : 'Live', cls: 'dash-status--live' }
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [actingId, setActingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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

  async function toggleFeatured(id: string, featured: boolean) {
    setActingId(id)
    setActionError(null)
    const { error } = await supabase.from('Projects').update({ Featured: featured }).eq('id', id)
    if (error) {
      setActionError(error.message)
    } else {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, Featured: featured } : p))
      if (featured) sendNotify(id, 'featured')
    }
    setActingId(null)
  }

  async function setStatus(id: string, status: string | null, change?: 'approved' | 'rejected') {
    setActingId(id)
    setActionError(null)
    const { error } = await supabase.from('Projects').update({ status }).eq('id', id)
    if (error) {
      setActionError(error.message)
    } else {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      if (change) sendNotify(id, change)
    }
    setActingId(null)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setActingId(id)
    setActionError(null)
    const { error } = await supabase.from('Projects').delete().eq('id', id)
    if (error) {
      setActionError(error.message)
    } else {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
    setActingId(null)
  }

  if (loading || !user) return null

  const isLive = (p: Project) => !p.status

  const counts: Record<Filter, number> = {
    all: projects.length,
    pending: projects.filter(p => p.status?.toUpperCase() === 'DRAFT').length,
    live: projects.filter(isLive).length,
    featured: projects.filter(p => p.Featured === true).length,
    rejected: projects.filter(p => p.status?.toUpperCase() === 'REJECTED').length,
  }

  const visible = filter === 'all' ? projects
    : filter === 'pending' ? projects.filter(p => p.status?.toUpperCase() === 'DRAFT')
    : filter === 'live' ? projects.filter(isLive)
    : filter === 'featured' ? projects.filter(p => p.Featured === true)
    : projects.filter(p => p.status?.toUpperCase() === 'REJECTED')

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
                const isRejected = p.status?.toUpperCase() === 'REJECTED'
                const isDraftOrRejected = p.status?.toUpperCase() === 'DRAFT' || isRejected
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

                    <Link href={`/projects/${p.id}/edit`} className="dash-row__edit">Edit</Link>

                    {isDraftOrRejected && (
                      <button
                        className="dash-row__edit"
                        style={{ color: 'var(--pop-blue)' }}
                        onClick={() => setStatus(p.id, null, 'approved')}
                        disabled={busy}
                      >
                        {busy ? '…' : '✓ Approve'}
                      </button>
                    )}

                    {live && !featured && (
                      <button
                        className="dash-row__edit"
                        style={{ color: 'var(--pop-violet)' }}
                        onClick={() => toggleFeatured(p.id, true)}
                        disabled={busy}
                      >
                        {busy ? '…' : '★ Feature'}
                      </button>
                    )}

                    {live && featured && (
                      <button
                        className="dash-row__edit"
                        style={{ color: 'var(--pop-blue)' }}
                        onClick={() => toggleFeatured(p.id, false)}
                        disabled={busy}
                      >
                        {busy ? '…' : '★ Un-feature'}
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        className="dash-row__delete"
                        onClick={() => setStatus(p.id, 'REJECTED', 'rejected')}
                        disabled={busy}
                      >
                        {busy ? '…' : '✕ Reject'}
                      </button>
                    )}

                    <button
                      className="dash-row__delete"
                      onClick={() => handleDelete(p.id, p.title)}
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
    </>
  )
}
