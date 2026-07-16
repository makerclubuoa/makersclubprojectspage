'use client'

import { useRouter } from 'next/navigation'
import { categoryColor, type Project } from '@/lib/projects'

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }).toUpperCase()
}

const BADGE = 'px-2.5 py-0.5 rounded-full border-2 border-black text-white text-[10px] font-bold tracking-[0.08em] uppercase backdrop-blur-[4px]'
const TAG = 'px-2 py-0.5 rounded-full border border-black/25 bg-paper-2 text-[10px] font-semibold tracking-[0.04em]'

// Washi-tape strips pinned to the card tops, mirroring the homepage's
// featured-project previews.
const TAPES = [
  '-top-2 left-5 -rotate-6 bg-pop-red',
  '-top-2 left-1/2 -translate-x-1/2 rotate-3 bg-pop-violet',
  '-top-2 right-5 rotate-6 bg-pop-blue',
  '-top-2 left-8 rotate-2 bg-pop-orange',
  '-top-2 right-8 -rotate-3 bg-pop-magenta',
]

export default function ProjectCard({
  project,
  index = 0,
  onCatClick,
  onToolClick,
  makerDisplay,
}: {
  project: Project
  index?: number
  onCatClick?: (cat: string) => void
  onToolClick?: (tool: string) => void
  makerDisplay?: { names: string[]; anonCount: number }
}) {
  const router = useRouter()
  const color = categoryColor(project.category)

  // Bento layout — mirrors the old `.bento > .card:nth-child()` rules, keyed
  // off the card's position in the grid (nth-child(k) === index k-1).
  const wide = index % 7 === 0 // was 7n+1 — spans 2 cols, 16/9 media
  const tall = index % 7 === 4 // was 7n+5 — spans 2 rows, media fills height
  const rotate = wide || tall // wide/tall cards stay flat
    ? 0
    : index % 5 === 1 ? 0.5 : index % 5 === 3 ? -0.4 : 0

  const media = wide ? 'aspect-[16/9]' : tall ? 'flex-1 aspect-auto' : 'aspect-[4/3]'

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    router.push(`/projects/${project.id}`)
  }

  return (
    <a
      className={`reveal relative flex flex-col bg-white outline-solid outline-3 outline-black cursor-pointer will-change-transform [transition:transform_0.35s_cubic-bezier(0.2,0.9,0.3,1.2),box-shadow_0.35s_ease] [transform:rotate(var(--card-rotate))] hover:[transform:translateY(-4px)_rotate(var(--card-rotate))] hover:shadow-[6px_6px_0px_0px_#000] max-[640px]:[transform:none] ${wide ? 'col-span-2' : ''} ${tall ? 'row-span-2' : ''} max-[640px]:col-span-1 max-[640px]:row-span-1`}
      style={{ '--card-rotate': `${rotate}deg` } as React.CSSProperties}
      href={`/projects/${project.id}`}
      onClick={handleClick}
    >
      <div className={`absolute z-10 w-16 h-5 outline-2 outline-black ${TAPES[index % TAPES.length]}`} />
      <div className={`${media} relative overflow-hidden bg-paper-2 border-b-[3px] border-black`}>
        <div
          className="absolute inset-0 flex items-end justify-start p-2.5 text-[10px] tracking-[0.04em] text-white/[0.92] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:[background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0_6px,transparent_6px_14px)]"
          style={{ backgroundImage: project.image ? `url(${project.image})` : color }}
        >
          {!project.image && <span className="relative z-[1] opacity-95 uppercase">{project.title}</span>}
        </div>
        <div className="absolute left-2.5 top-2.5 flex gap-1.5 z-[2]">
          <button
            className={`${BADGE} bg-black/[0.78] border-0 cursor-pointer transition-opacity duration-150 hover:opacity-75`}
            onClick={e => { e.preventDefault(); e.stopPropagation(); onCatClick?.(project.category ?? '') }}
          >
            {project.category}
          </button>
          {project.Featured === true && (
            <span className={`${BADGE} bg-accent inline-flex items-center gap-[5px]`}>★ FEATURED</span>
          )}
        </div>
      </div>
      <div className={`p-4 pb-[18px] flex flex-col gap-2 ${tall ? 'flex-none' : 'flex-1'}`}>
        <h4 className="text-[18px] leading-[1.2] font-bold tracking-[-0.02em] m-0 max-[640px]:text-[16px]">{project.title}</h4>
        <p className="text-ink-2 text-[13px] m-0 leading-[1.55]">{project.blurb}</p>
        <div className="flex flex-wrap gap-1">
          {(project.tools ?? []).slice(0, 3).map(t => (
            <button
              key={t}
              className={`${TAG} text-ink-2 border-0 cursor-pointer transition-colors duration-150 hover:bg-ink hover:text-paper`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToolClick?.(t) }}
            >
              {t}
            </button>
          ))}
          {(project.tools ?? []).length > 3 && (
            <span className={`${TAG} text-muted pointer-events-none`}>+{(project.tools ?? []).length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t-2 border-black/10 text-[10.5px] font-semibold text-ink-2 tracking-[0.06em] uppercase">
          <span className="flex items-center gap-2">
            {(() => {
              const names = makerDisplay ? makerDisplay.names : (project.makers ?? [])
              const anon = makerDisplay ? makerDisplay.anonCount : (project.anon_count ?? 0)
              const total = names.length + anon
              const label = [...names, ...(anon > 0 ? [`+${anon} Makers`] : [])].join(' + ')
              return (
                <>
                  <span className="flex">
                    {Array.from({ length: total }).map((_, i) => (
                      <span key={i} className={`w-[18px] h-[18px] rounded-full border-2 border-black inline-block${i > 0 ? ' -ml-1.5' : ''}`} style={{ background: color }} />
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
