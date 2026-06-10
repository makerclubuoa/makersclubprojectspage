import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import PostCard from '@/app/components/PostCard'
import { fetchPosts } from '@/lib/posts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Blog · MAKE_UOA' }

export default async function BlogPage() {
  const posts = await fetchPosts()

  return (
    <>
      <CursorTrail />
      <Nav />
      <main className="container" style={{ minHeight: '70vh', padding: '80px 20px' }}>
        <header style={{ marginBottom: 40 }}>
          <h1>// Blog</h1>
          <p>Posts and updates from the Makers Club. {/* TODO: copy + hero styling */}</p>
        </header>

        {posts.length === 0 ? (
          // Empty state until the Ghost → posts migration runs.
          <p style={{ opacity: 0.6 }}>No posts yet.</p>
        ) : (
          <div className="post-grid">{/* TODO: grid styling in globals.css */}
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
