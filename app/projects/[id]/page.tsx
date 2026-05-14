import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import LikeButton from '@/app/components/LikeButton'
import { fetchProject, fetchProjects, fetchAllIds, categoryColor } from '@/lib/projects'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateStaticParams() {
  const ids = await fetchAllIds()
  return ids.map(id => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await fetchProject(id)
  return { title: project ? `${project.title} · MAKE_UOA` : 'Project · MAKE_UOA' }
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, allProjects] = await Promise.all([fetchProject(id), fetchProjects()])
  if (!project) notFound()

  const color = categoryColor(project.category)
  const idx = allProjects.findIndex(p => p.id === id)
  const prev = idx > 0 ? allProjects[idx - 1] : null
  const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : null

  return (
    <>
      <CursorTrail />
      <Nav />

      {/* Project hero banner */}
      <header
        className="project-hero"
        style={{
          backgroundImage: project.image
            ? `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.6)), url(${project.image})`
            : color,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container">
          <Link href="/#projects" className="project-back">
            ← All projects
          </Link>
          <div className="project-hero__badges">
            <span className="badge">{project.category}</span>
            {project.status?.toLowerCase() === 'featured' && (
              <span className="badge badge--featured">★ FEATURED</span>
            )}
          </div>
          <h1 className="project-hero__title">{project.title}</h1>
          <p className="project-hero__blurb">{project.blurb}</p>
          <div className="project-hero__meta">
            <span>{(project.makers ?? []).join(' + ')}</span>
            {project.date && (
              <>
                <span className="sep">·</span>
                <span>{formatDate(project.date)}</span>
              </>
            )}
            {project.likes != null && (
              <>
                <span className="sep">·</span>
                <span>♥ {project.likes}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="project-content">
        <div className="container">
          <div className="project-layout">

            {/* Article */}
            <article className="project-article">
              <div className="seclabel" style={{ marginBottom: 32 }}>
                <span className="num">[01]</span>
                <span>About_</span>
                <span className="bar" />
              </div>

              <div className="project-description">
                {(project.description ?? '').split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="seclabel" style={{ marginTop: 56, marginBottom: 24 }}>
                <span className="num">[02]</span>
                <span>Tools_used</span>
                <span className="bar" />
              </div>
              <div className="project-tools">
                {(project.tools ?? []).map(t => (
                  <div key={t} className="project-tool">
                    <span className="project-tool__icon">_</span>
                    {t}
                  </div>
                ))}
              </div>

              {/* Prev/next nav */}
              <div className="project-nav">
                {prev ? (
                  <Link href={`/projects/${prev.id}`} className="project-nav__item project-nav__item--prev">
                    <span className="project-nav__dir">← Prev</span>
                    <span className="project-nav__name">{prev.title}</span>
                  </Link>
                ) : <div />}
                {next ? (
                  <Link href={`/projects/${next.id}`} className="project-nav__item project-nav__item--next">
                    <span className="project-nav__dir">Next →</span>
                    <span className="project-nav__name">{next.title}</span>
                  </Link>
                ) : <div />}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="project-sidebar">
              <div className="project-meta-card">
                <div className="project-meta-card__header">FIG.01 — PROJECT RECORD</div>

                <div className="project-meta-card__row">
                  <span className="k">ID</span>
                  <span className="v">PRJ_{project.id.toUpperCase()}</span>
                </div>
                <div className="project-meta-card__row">
                  <span className="k">Category</span>
                  <span className="v">{project.category}</span>
                </div>
                {project.date && (
                  <div className="project-meta-card__row">
                    <span className="k">Date</span>
                    <span className="v">{formatDate(project.date)}</span>
                  </div>
                )}
                {project.likes != null && (
                  <div className="project-meta-card__row">
                    <span className="k">Likes</span>
                    <span className="v">♥ {project.likes}</span>
                  </div>
                )}
                <div className="project-meta-card__row">
                  <span className="k">Makers</span>
                  <span className="v">{(project.makers ?? []).join(', ')}</span>
                </div>
                <div className="project-meta-card__row">
                  <span className="k">Status</span>
                  <span className="v">{project.status ?? '—'}</span>
                </div>

                {project.github && (
                  <div className="project-meta-card__links">
                    <a href={project.github} className="project-meta-link" target="_blank" rel="noopener noreferrer">
                      View on GitHub <span className="arr">↗</span>
                    </a>
                  </div>
                )}

                <div style={{ padding: '16px 16px 0' }}>
                  <LikeButton projectId={project.id} initialLikes={project.likes ?? 0} />
                </div>

                {/* Colour swatch */}
                <div className="project-meta-swatch" style={{ backgroundImage: color }} />

                <Link href="/#projects" className="btn btn--ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 20, display: 'flex' }}>
                  ← All projects
                </Link>

                <Link href="/submit" className="btn btn--gradient" style={{ width: '100%', justifyContent: 'center', marginTop: 10, display: 'flex' }}>
                  Submit yours <span className="arr">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
