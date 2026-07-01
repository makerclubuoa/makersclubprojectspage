'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { type Project } from '@/lib/projects'
import Pagination from '@/app/components/Pagination'
import CustomSelect from '@/app/components/CustomSelect'
import ProjectCard from '@/app/components/ProjectCard'
import { container, emptyState } from '@/lib/ui'

const PILL_BASE =
  'inline-flex items-center gap-2 px-3 py-[7px] rounded-[4px] border text-[11.5px] font-medium tracking-[0.06em] uppercase transition-[transform,background-color,color,border-color,box-shadow] duration-200'
const SELECT_WRAP =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-rule bg-paper text-[11.5px] text-ink-2 tracking-[0.06em] uppercase max-[640px]:w-full max-[640px]:justify-between'

function applyFilters(
  projects: Project[],
  cat: string,
  tool: string,
  sort: string,
  featured: boolean,
): Project[] {
  let out = projects.slice()
  if (cat !== 'All') out = out.filter(p => p.category === cat)
  if (tool !== 'All tools') out = out.filter(p => (p.tools ?? []).includes(tool))
  if (featured) out = out.filter(p => p.Featured === true)
  if (sort === 'newest') out.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  if (sort === 'popular') out.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
  if (sort === 'az') out.sort((a, b) => a.title.localeCompare(b.title))
  return out
}

export default function ProjectsSection({
  projects,
  allTools,
  allCategories,
  makerDisplays = {},
}: {
  projects: Project[]
  allTools: string[]
  allCategories: string[]
  makerDisplays?: Record<string, { names: string[]; anonCount: number }>
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [cat, setCat] = useState(() => searchParams.get('cat') ?? 'All')
  const [tool, setTool] = useState(() => searchParams.get('tool') ?? 'All tools')
  const [sort, setSort] = useState(() => searchParams.get('sort') ?? 'newest')
  const [featured, setFeatured] = useState(() => searchParams.get('featured') === '1')
  const [bouncingPill, setBouncingPill] = useState<string | null>(null)
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') ?? '1', 10))
  const [pageSize, setPageSize] = useState(12)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (cat !== 'All') params.set('cat', cat)
    if (tool !== 'All tools') params.set('tool', tool)
    if (sort !== 'newest') params.set('sort', sort)
    if (featured) params.set('featured', '1')
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [cat, tool, sort, featured, page])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setPageSize(mq.matches ? 5 : 12)
    const handler = (e: MediaQueryListEvent) => setPageSize(e.matches ? 5 : 12)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const filtered = applyFilters(projects, cat, tool, sort, featured)
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

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
    setPage(1)
    setBouncingPill(c)
    setTimeout(() => setBouncingPill(null), 500)
  }

  function handleToolClick(t: string) {
    setTool(prev => prev === t ? 'All tools' : t)
    setPage(1)
  }

  function resetFilters(e: React.MouseEvent) {
    e.preventDefault()
    setCat('All')
    setTool('All tools')
    setSort('newest')
    setFeatured(false)
    setPage(1)
  }

  function handlePageChange(p: number) {
    setPage(p)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const categoryCount = useCallback(
    (c: string) =>
      c === 'All'
        ? projects.length
        : projects.filter(p => p.category === c).length,
    [projects],
  )

  return (
    <>
      {/* Grid */}
      <section className="pt-[97px] pb-6 max-[640px]:pt-20" id="projects">
        <div className={container}>
          <div className="flex items-baseline justify-between mb-5 select-none cursor-default">
            <h3 className="text-[28px] m-0 font-bold tracking-[-0.03em] max-[640px]:text-xl">{tool !== 'All tools' ? tool : cat === 'All' ? 'All Projects' : cat}</h3>
            <div className="text-muted text-[11px] tracking-[0.1em] uppercase">
              <b className="text-ink font-normal">{String(filtered.length).padStart(2, '0')}</b>&nbsp;·&nbsp;results
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="relative z-10 bg-paper border-y border-rule py-3 max-[640px]:py-2">
        <div className={container}>
          <div className="flex items-center gap-3 flex-wrap max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-1.5">
            <div className="flex gap-1.5 flex-wrap">
              {allCategories.map(c => (
                <button
                  key={c}
                  className={`${PILL_BASE} ${c === cat ? 'bg-accent text-white border-transparent' : 'bg-paper text-ink-2 border-rule hover:text-ink hover:border-ink'}${bouncingPill === c ? ' animate-[pillBounce_0.45s_cubic-bezier(0.34,1.56,0.64,1)]' : ''}`}
                  onClick={() => handleCatClick(c)}
                >
                  <span>{c}</span>
                  <span className="text-[10.5px] opacity-70 tracking-normal">{String(categoryCount(c)).padStart(2, '0')}</span>
                </button>
              ))}
            </div>

            <div className="w-px h-[22px] bg-rule max-[1024px]:hidden" />

            <div className={SELECT_WRAP}>
              <label className="text-muted text-[10px]">Made with</label>
              <CustomSelect
                variant="filter"
                value={tool}
                onChange={v => { setTool(v); setPage(1) }}
                options={allTools.map(t => ({ value: t, label: t }))}
              />
            </div>

            <div className={SELECT_WRAP}>
              <label className="text-muted text-[10px]">Sort</label>
              <CustomSelect
                variant="filter"
                value={sort}
                onChange={v => { setSort(v); setPage(1) }}
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'popular', label: 'Most loved' },
                  { value: 'az', label: 'A — Z' },
                ]}
              />
            </div>

            <button
              className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[4px] border text-[11.5px] tracking-[0.06em] uppercase bg-paper max-[640px]:w-full max-[640px]:justify-between ${featured ? 'text-ink border-ink' : 'text-ink-2 border-rule'}`}
              onClick={() => { setFeatured(f => !f); setPage(1) }}
            >
              <span className={`relative w-7 h-4 rounded-[2px] border transition-[background-color,border-color] duration-200 after:content-[''] after:absolute after:left-px after:top-px after:w-3 after:h-3 after:transition-[transform,background-color] after:duration-200 ${featured ? 'bg-ink border-transparent after:translate-x-3 after:bg-white' : 'bg-paper-2 border-rule after:bg-paper-3'}`} />
              Featured only
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <section className="pt-10 pb-20 max-[640px]:pt-5 max-[640px]:pb-12">
        <div className={container}>

          {filtered.length === 0 ? (
            <div className={emptyState}>
              <div>Nothing here yet</div>
              <p className="mt-2">
                Try a different filter —{' '}
                <a href="#" onClick={resetFilters} className="underline">
                  show everything
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-[18px] grid-cols-3 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1" ref={gridRef}>
                {paginated.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} onCatClick={handleCatClick} onToolClick={handleToolClick} makerDisplay={makerDisplays[p.id]} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            </>
          )}
        </div>
      </section>
    </>
  )
}
