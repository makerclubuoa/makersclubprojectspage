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

      <main className="submit-main">
        <div className="container">

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
          ) : (
            <div className="dash-table">
              {myProjects.map(p => {
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
          )}

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
          ) : (
            <div className="dash-table" style={{ marginBottom: 80 }}>
              {likedProjects.map(p => (
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
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
