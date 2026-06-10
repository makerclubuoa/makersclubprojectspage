import Link from 'next/link'
import type { Post } from '@/lib/posts'

// Wireframe card for the blog list. Styling TODO — reuse the .card system from
// ProjectCard / globals.css once the visual design is decided.
export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="post-card">
      {post.feature_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.feature_image} alt="" className="post-card__media" />
      )}
      <div className="post-card__body">
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        {post.published_at && (
          <time style={{ opacity: 0.6, fontSize: 13 }}>
            {new Date(post.published_at).toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' })}
          </time>
        )}
      </div>
    </Link>
  )
}
