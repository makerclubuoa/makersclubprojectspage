'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { useAuth } from '@/app/components/AuthProvider'

const ADMIN_EMAIL = 'makerclubuoa@gmail.com'

// WIREFRAME ONLY. Compose / edit a post and (later) send it as a newsletter.
// TODO: load existing posts, wire Save -> Supabase `posts`, Send -> /api/newsletter.
export default function AdminPostsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (user.email !== ADMIN_EMAIL) { router.replace('/'); return }
  }, [user, loading, router])

  if (loading || !user || user.email !== ADMIN_EMAIL) return null

  return (
    <>
      <CursorTrail />
      <Nav />
      <main className="container" style={{ minHeight: '70vh', padding: '80px 20px', maxWidth: 760 }}>
        <h1>// Posts</h1>
        <p style={{ opacity: 0.6 }}>Wireframe — authoring + newsletter send not wired yet.</p>

        {/* TODO: list existing posts with edit/delete + status (draft/published) */}

        <form
          style={{ display: 'grid', gap: 12, marginTop: 24 }}
          onSubmit={e => { e.preventDefault(); /* TODO: save to Supabase posts */ }}
        >
          <input placeholder="Title" value={title}
            onChange={e => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) }} />
          <input placeholder="slug" value={slug} onChange={e => setSlug(e.target.value)} />
          <textarea placeholder="Body (HTML / rich text — editor TBD)" rows={14} value={body} onChange={e => setBody(e.target.value)} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit">Save draft {/* TODO */}</button>
            <button type="button" /* TODO: publish */>Publish</button>
            <button type="button" /* TODO: POST /api/newsletter */>Send as newsletter</button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  )
}
