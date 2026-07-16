'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/components/AuthProvider'
import { modalBackdrop, modal, modalLabel, modalTitle, modalActions, btnGhost, btnGradient } from '@/lib/ui'

interface LikeButtonProps {
  projectId: string
  initialLikes: number
}

export default function LikeButton({ projectId, initialLikes }: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(initialLikes)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!user) { setLiked(false); return }
    supabase
      .from('user_likes')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data))
  }, [user, projectId])

  async function handleLike() {
    if (!user) { setShowModal(true); return }
    if (loading) return
    setLoading(true)
    const { data, error } = await supabase.rpc('toggle_like', { p_project_id: projectId })
    if (!error && data) {
      const result = data as { liked: boolean; likes: number }
      setLiked(result.liked)
      setLikes(result.likes)
    }
    setLoading(false)
  }

  return (
    <>
      <button
        className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full border-2 border-black text-xs font-bold tracking-[0.08em] uppercase cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[background-color,color,transform,box-shadow] duration-150 disabled:opacity-60 disabled:cursor-default ${liked ? 'bg-pop-magenta text-white' : 'bg-white text-ink hover:text-pop-magenta'}`}
        onClick={handleLike}
        disabled={loading}
        title={user ? (liked ? 'Unlike this project' : 'Like this project') : 'Sign in to like'}
      >
        <span className={`text-sm leading-none transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]${liked ? ' scale-125' : ''}`}>♥</span>
        <span className="text-sm">{likes}</span>
        <span className="text-[10px] opacity-70">{liked ? 'Liked' : 'Like'}</span>
      </button>

      {showModal && (
        <div className={modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            <p className={modalLabel}>Sign in required</p>
            <p className={modalTitle}>You need an account to <em className="not-italic text-ink-2">love</em> a project.</p>
            <div className={modalActions}>
              <button className={btnGhost} onClick={() => setShowModal(false)}>Cancel</button>
              <Link href="/login" className={btnGradient}>Sign in →</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
