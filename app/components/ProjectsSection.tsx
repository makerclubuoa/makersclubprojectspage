'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PROJECTS, CATEGORIES, ALL_TOOLS, type Project } from '@/lib/projects'

const TRAIL_COLORS = ['#567dff', '#9f42d1', '#f04ab9', '#ff25c7', '#ff3c6d', '#ff856a']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }).toUpperCase()
}

function burst(x: number, y: number) {
  for (let i = 0; i < 22; i++) {
    const d = document.createElement('span')
    d.className = 'trail-dot'
    const c = TRAIL_COLORS[i % TRAIL_COLORS.length]
    const s = 4 + Math.random() * 10
    d.style.cssText = `width:${s}px;height:${s}px;left:${x}px;top:${y}px;background:${c};opacity:1;transition:opacity 1.2s ease, transform 1.2s cubic-bezier(.2,.7,.3,1)`
    document.body.appendChild(d)
    const ang = (i / 22) * Math.PI * 2
    const dist = 80 + Math.random() * 60
    requestAnimationFrame(() => {
      d.style.opacity = '0'
      d.style.transform = `translate(-50%,-50%) translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(.2)`
    })
    setTimeout(() => d.remove(), 1300)
  }
}

function applyFilters(
  cat: string,
  tool: string,
  sort: string,
  featured: boolean,
): Project[] {
  let out = PROJECTS.slice()
  if (cat !== 'All') out = out.filter(p => p.category === cat)
  if (tool !== 'All tools') out = out.filter(p => p.tools.includes(tool))
  if (featured) out = out.filter(p => p.featured)
  if (sort === 'newest') out.sort((a, b) => b.date.localeCompare(a.date))
  if (sort === 'popular') out.sort((a, b) => b.loves - a.loves)
  if (sort === 'az') out.sort((a, b) => a.title.localeCompare(b.title))
  return out
}

function ProjectCard({ project, index, total }: { project: Project; index: number; total: number }) {
  const [squishing, setSquishing] = useState(false)
  const cardRef = useRef<HTMLAnchorElement>(null)

  const idx = String(index + 1).padStart(3, '0')
  const totalStr = String(total).padStart(3, '0')

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    setSquishing(true)
    burst(e.clientX, e.clientY)
    setTimeout(() => {
      setSquishing(false)
    }, 200)
  }

  return (
    <a
      ref={cardRef}
      className={`card reveal${squishing ? ' is-squishing' : ''}`}
      href={`/projects/${project.id}`}
      onClick={handleClick}
      onMouseDown={() => setSquishing(true)}
      onMouseUp={() => setSquishing(false)}
      onMouseLeave={() => setSquishing(false)}
      style={{ transitionDelay: `${Math.min(index * 28, 240)}ms` }}
    >
      <div className="card__id">
        {idx} / {totalStr}
      </div>
      <div className="card__media">
        <div
          className="ph"
          style={{ backgroundImage: project.color }}
        >
          <span className="ph__label">[ {project.title} ]</span>
        </div>
        <div className="badges">
          <span className="badge">{project.category}</span>
          {project.featured && (
            <span className="badge badge--featured">★ FEATURED</span>
          )}
        </div>
      </div>
      <div className="card__body">
        <div className="card__num">PRJ_{project.id.toUpperCase()}</div>
        <h4 className="card__title">{project.title}</h4>
        <p className="card__blurb">{project.blurb}</p>
        <div className="tags">
          {project.tools.slice(0, 3).map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
        <div className="card__meta">
          <span className="card__makers">
            <span className="avatar-stack">
              {project.makers.map((m, i) => (
                <span
                  key={i}
                  className="avatar"
                  style={{ background: project.color }}
                />
              ))}
            </span>
            <span>{project.makers.join(' + ')}</span>
          </span>
          <span>
            {formatDate(project.date)} · ♥{project.loves}
          </span>
        </div>
      </div>
    </a>
  )
}

export default function ProjectsSection() {
  const [cat, setCat] = useState('All')
  const [tool, setTool] = useState('All tools')
  const [sort, setSort] = useState('newest')
  const [featured, setFeatured] = useState(false)
  const [bouncingPill, setBouncingPill] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = applyFilters(cat, tool, sort, featured)

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -6% 0px' },
    )
    const reveals = gridRef.current?.querySelectorAll('.reveal') ?? []
    reveals.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [filtered])

  function handleCatClick(c: string) {
    setCat(c)
    setBouncingPill(c)
    setTimeout(() => setBouncingPill(null), 500)
  }

  function resetFilters(e: React.MouseEvent) {
    e.preventDefault()
    setCat('All')
    setTool('All tools')
    setSort('newest')
    setFeatured(false)
  }

  const categoryCount = useCallback(
    (c: string) =>
      c === 'All'
        ? PROJECTS.length
        : PROJECTS.filter(p => p.category === c).length,
    [],
  )

  return (
    <>
      {/* Filter bar */}
      <div className="filterbar" id="projects">
        <div className="container">
          <div className="filterbar__row">
            <div className="pills">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`pill${c === cat ? ' is-active is-gradient' : ''}${bouncingPill === c ? ' is-bouncing' : ''}`}
                  onClick={() => handleCatClick(c)}
                >
                  <span>{c}</span>
                  <span className="count">{String(categoryCount(c)).padStart(2, '0')}</span>
                </button>
              ))}
            </div>

            <div className="filter-divider" />

            <div className="select">
              <label>Made_with</label>
              <select value={tool} onChange={e => setTool(e.target.value)}>
                {ALL_TOOLS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="select">
              <label>Sort</label>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="popular">Most loved</option>
                <option value="az">A — Z</option>
              </select>
            </div>

            <button
              className={`toggle${featured ? ' is-on' : ''}`}
              onClick={() => setFeatured(f => !f)}
            >
              <span className="toggle__sw" />
              Featured only
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="grid-section">
        <div className="container">
          <div className="grid-header">
            <h3>// {cat === 'All' ? 'All projects' : cat}</h3>
            <div className="meta">
              <b>{String(filtered.length).padStart(2, '0')}</b>&nbsp;·&nbsp;results
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="mono">_ no matches</div>
              <p style={{ marginTop: 8 }}>
                Try a different filter —{' '}
                <a href="#" onClick={resetFilters} style={{ textDecoration: 'underline' }}>
                  show everything
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="grid" ref={gridRef}>
              {filtered.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} total={filtered.length} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
