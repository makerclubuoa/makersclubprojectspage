'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/components/AuthProvider'

interface LikeButtonProps {
  projectId: string
  initialLikes: number
}

export default function LikeButton({ projectId, initialLikes }: LikeButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(initialLikes)
  const [loading, setLoading] = useState(false)

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
    if (!user) { router.push('/login'); return }
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
    <button
      className={`like-btn${liked ? ' like-btn--active' : ''}`}
      onClick={handleLike}
      disabled={loading}
      title={user ? (liked ? 'Unlike this project' : 'Like this project') : 'Sign in to like'}
    >
      <span className="like-btn__heart">♥</span>
      <span className="like-btn__count">{likes}</span>
      <span className="like-btn__label">{liked ? 'Liked' : 'Like'}</span>
    </button>
  )
}
