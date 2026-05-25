'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/components/AuthProvider'

interface Comment {
  id: string
  user_id: string
  author_name: string
  body: string
  created_at: string
}

interface Props {
  projectId: string
  projectTitle: string
  projectOwnerId: string | null
  sectionNum: string
}

const ADMIN_EMAIL = 'makerclubuoa@gmail.com'

function fmtCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CommentsSection({ projectId, projectTitle, projectOwnerId, sectionNum }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSignIn, setShowSignIn] = useState(false)
  const [reported, setReported] = useState<Set<string>>(new Set())
  const [confirmReport, setConfirmReport] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/comments?project_id=${projectId}`)
      .then(r => r.json())
      .then(d => { if (d.comments) setComments(d.comments) })
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { setShowSignIn(true); return }
    if (!body.trim()) return
    setSubmitting(true)
    setSubmitError(null)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setSubmitting(false); setShowSignIn(true); return }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ project_id: projectId, body: body.trim() }),
    })
    const data = await res.json()
    if (res.ok && data.comment) {
      setComments(prev => [...prev, data.comment])
      setBody('')
    } else {
      setSubmitError(data.error ?? 'Failed to post comment')
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    if (confirmDelete !== commentId) { setConfirmDelete(commentId); return }
    setConfirmDelete(null)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function handleReport(comment: Comment) {
    if (confirmReport !== comment.id) {
      setConfirmReport(comment.id)
      return
    }
    setConfirmReport(null)
    setReported(prev => new Set(prev).add(comment.id))
    await fetch('/api/comments/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment_id: comment.id,
        project_id: projectId,
        project_title: projectTitle,
        comment_body: comment.body,
        author_name: comment.author_name,
      }),
    })
  }

  return (
    <section className="pd-section" id="comments">
      <div className="seclabel">
        <span className="num">{sectionNum}</span>
        <span>Comments</span>
        <span className="bar" />
        <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
      </div>

      <div className="pd-comments">
        {loading && <p className="pd-comments__empty">Loading...</p>}

        {!loading && comments.length === 0 && (
          <p className="pd-comments__empty">No comments yet. Be the first!</p>
        )}

        {comments.map(c => {
          const canDelete = !!user && (
            c.user_id === user.id ||
            user.id === projectOwnerId ||
            user.email === ADMIN_EMAIL
          )
          return (
          <div key={c.id} className="pd-comment">
            <div className="pd-comment__meta">
              <span className="pd-comment__author">{c.author_name}</span>
              <span className="pd-comment__date">{fmtCommentDate(c.created_at)}</span>
              <span style={{ flex: 1 }} />
              {canDelete && (
                confirmDelete === c.id ? (
                  <span className="pd-comment__confirm">
                    Delete?{' '}
                    <button onClick={() => handleDelete(c.id)}>Yes</button>
                    {' / '}
                    <button onClick={() => setConfirmDelete(null)}>No</button>
                  </span>
                ) : (
                  <button className="pd-comment__report" onClick={() => handleDelete(c.id)}>
                    Delete
                  </button>
                )
              )}
              {reported.has(c.id) ? (
                <span className="pd-comment__reported">Reported</span>
              ) : confirmReport === c.id ? (
                <span className="pd-comment__confirm">
                  Flag?{' '}
                  <button onClick={() => handleReport(c)}>Yes</button>
                  {' / '}
                  <button onClick={() => setConfirmReport(null)}>No</button>
                </span>
              ) : (
                <button className="pd-comment__report" onClick={() => handleReport(c)}>
                  Report
                </button>
              )}
            </div>
            <p className="pd-comment__body">{c.body}</p>
          </div>
          )
        })}

        <form className="pd-comment-form" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="pd-comment-form__input"
            placeholder={user ? 'Leave a comment…' : 'Sign in to leave a comment'}
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={1000}
            rows={3}
            onClick={() => { if (!user) setShowSignIn(true) }}
            readOnly={!user}
          />
          <div className="pd-comment-form__footer">
            {submitError && <span className="pd-comment-form__error">{submitError}</span>}
            <span style={{ flex: 1 }} />
            <span className="pd-comment-form__count">{body.length}/1000</span>
            {user ? (
              <button
                type="submit"
                className="btn btn--gradient"
                disabled={submitting || !body.trim()}
              >
                {submitting ? 'Posting…' : 'Post comment'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--gradient"
                onClick={() => setShowSignIn(true)}
              >
                Sign in to comment
              </button>
            )}
          </div>
        </form>
      </div>

      {showSignIn && (
        <div className="modal-backdrop" onClick={() => setShowSignIn(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal__label">Sign in required</p>
            <p className="modal__title">You need an account to leave a comment.</p>
            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setShowSignIn(false)}>Cancel</button>
              <Link href="/login" className="btn btn--gradient">Sign in →</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
