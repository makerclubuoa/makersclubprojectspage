'use client'

import { useRouter } from 'next/navigation'
import { categoryColor, type Project } from '@/lib/projects'

const TRAIL_COLORS = ['#567dff', '#9f42d1', '#f04ab9', '#ff25c7', '#ff3c6d', '#ff856a']

export function burst(x: number, y: number) {
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

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }).toUpperCase()
}

export default function ProjectCard({
  project,
  onCatClick,
  onToolClick,
}: {
  project: Project
  onCatClick?: (cat: string) => void
  onToolClick?: (tool: string) => void
}) {
  const router = useRouter()
  const color = categoryColor(project.category)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    burst(e.clientX, e.clientY)
    router.push(`/projects/${project.id}`)
  }

  return (
    <a className="card reveal" href={`/projects/${project.id}`} onClick={handleClick}>
      <div className="card__media">
        <div
          className="ph"
          style={{ backgroundImage: project.image ? `url(${project.image})` : color }}
        >
          {!project.image && <span className="ph__label">[ {project.title} ]</span>}
        </div>
        <div className="badges">
          <button
            className="badge badge--btn"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onCatClick?.(project.category ?? '') }}
          >
            {project.category}
          </button>
          {project.Featured === true && (
            <span className="badge badge--featured">★ FEATURED</span>
          )}
        </div>
      </div>
      <div className="card__body">
        <h4 className="card__title">{project.title}</h4>
        <p className="card__blurb">{project.blurb}</p>
        <div className="tags">
          {(project.tools ?? []).slice(0, 3).map(t => (
            <button
              key={t}
              className="tag tag--btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToolClick?.(t) }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="card__meta">
          <span className="card__makers">
            <span className="avatar-stack">
              {(project.makers ?? []).map((m, i) => (
                <span key={i} className="avatar" style={{ background: color }} />
              ))}
            </span>
            <span>{(project.makers ?? []).join(' + ')}</span>
          </span>
          <span>
            {project.date ? formatDate(project.date) : ''}
            {project.likes != null ? ` · ♥${project.likes}` : ''}
          </span>
        </div>
      </div>
    </a>
  )
}
