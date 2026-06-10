import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import { fetchPost, fetchAllSlugs } from '@/lib/posts'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const slugs = await fetchAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await fetchPost(slug)
  return { title: post ? `${post.title} · MAKE_UOA` : 'Post · MAKE_UOA' }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await fetchPost(slug)
  if (!post) notFound()

  return (
    <>
      <CursorTrail />
      <Nav />
      <main className="container" style={{ minHeight: '70vh', padding: '80px 20px', maxWidth: 760 }}>
        <Link href="/blog" className="project-back">← Back to blog</Link>

        <article>
          <header style={{ margin: '24px 0' }}>
            <h1>{post.title}</h1>
            <div style={{ opacity: 0.6, fontSize: 14 }}>
              {post.published_at && fmtDate(post.published_at)}
              {post.author && ` · ${post.author}`}
            </div>
          </header>

          {post.feature_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.feature_image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 24 }} />
          )}

          {/* TODO: sanitize HTML before rendering (migrated Ghost content is trusted,
              but sanitize defensively — e.g. a sanitizer in lib/posts or at migration time). */}
          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: post.html ?? '' }}
          />
        </article>
      </main>
      <Footer />
    </>
  )
}
