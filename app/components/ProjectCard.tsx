'use client'

import { useRouter } from 'next/navigation'
import { categoryColor, type Project } from '@/lib/projects'

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }).toUpperCase()
}

export default function ProjectCard({
  project,
  onCatClick,
  onToolClick,
  makerDisplay,
}: {
  project: Project
  onCatClick?: (cat: string) => void
  onToolClick?: (tool: string) => void
  makerDisplay?: { names: string[]; anonCount: number }
}) {
  const router = useRouter()
  const color = categoryColor(project.category)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
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
          {(project.tools ?? []).length > 3 && (
            <span className="tag tag--more">+{(project.tools ?? []).length - 3}</span>
          )}
        </div>
        <div className="card__meta">
          <span className="card__makers">
            {(() => {
              const names = makerDisplay ? makerDisplay.names : (project.makers ?? [])
              const anon = makerDisplay ? makerDisplay.anonCount : (project.anon_count ?? 0)
              const total = names.length + anon
              const label = [...names, ...(anon > 0 ? [`+${anon} Makers`] : [])].join(' + ')
              return (
                <>
                  <span className="avatar-stack">
                    {Array.from({ length: total }).map((_, i) => (
                      <span key={i} className="avatar" style={{ background: color }} />
                    ))}
                  </span>
                  <span>{label}</span>
                </>
              )
            })()}
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
