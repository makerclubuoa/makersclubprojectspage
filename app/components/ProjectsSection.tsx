'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { type Project } from '@/lib/projects'
import Pagination from '@/app/components/Pagination'
import CustomSelect from '@/app/components/CustomSelect'
import ProjectCard from '@/app/components/ProjectCard'
import { container, emptyState } from '@/lib/ui'

/* ── Desktop (lg+) filter row ─────────────────────────
   Unchanged: one inline row of pills. There's room for it above 1024px. */
const PILL_BASE =
  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-black text-[11.5px] font-semibold tracking-[0.04em] uppercase transition-[transform,background-color,color,box-shadow] duration-200 max-w-full'
const SELECT_WRAP =
  'inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-black bg-white text-[11.5px] font-semibold text-ink tracking-[0.04em] uppercase'
const SELECT_LABEL = 'whitespace-nowrap shrink-0 text-ink-2 text-[10px] font-bold'
const COUNT_PILL =
  'inline-flex items-center px-3.5 py-1 rounded-full border-2 border-black bg-black text-white text-[11px] font-bold tracking-[0.1em] uppercase whitespace-nowrap'

/* ── Mobile (<lg) ─────────────────────────────────────
   Trying to fit five controls into the bar itself never worked at phone width —
   inline they were unusably cramped, stacked they filled the screen before a
   single project appeared. So the bar collapses to one summary row and the
   controls move into a bottom sheet: room for full-size targets, and the
   archive stays visible behind it.

   The sheet deliberately uses only pills and a toggle — no CustomSelect. Its
   dropdown is absolutely positioned, and inside the sheet's scrolling body it
   would be clipped by the scroll container. */
const SHEET_TRIGGER =
  'flex flex-1 min-w-0 items-center justify-between gap-2 px-4 py-3 rounded-full border-2 border-black bg-white text-[12px] font-bold tracking-[0.08em] uppercase text-ink shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow] duration-100'
const SHEET_SECTION_H =
  'text-[11px] font-bold tracking-[0.14em] uppercase text-ink-2 mb-2.5'
// Wraps, so a long category name can never be sliced off at the screen edge.
const SHEET_PILL =
  'inline-flex items-center gap-2 max-w-full px-3.5 py-2 rounded-full border-2 border-black text-[12.5px] font-semibold tracking-[0.02em] text-left transition-colors duration-150'
const ACTIVE_CHIP =
  'inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full border-2 border-black bg-accent text-white text-[11px] font-bold tracking-[0.04em] uppercase max-w-full'

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
  const [sheetOpen, setSheetOpen] = useState(false)
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

  function resetFilters(e?: React.MouseEvent) {
    e?.preventDefault()
    setCat('All')
    setTool('All tools')
    setSort('newest')
    setFeatured(false)
    setPage(1)
  }

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most loved' },
    { value: 'az', label: 'A — Z' },
  ]

  // Everything currently narrowing the list, as removable chips. With the
  // controls behind a sheet these are the only on-screen record of what's
  // applied, so each one has to be clearable without reopening the sheet.
  const activeChips: { key: string; label: string; clear: () => void }[] = [
    ...(cat !== 'All'
      ? [{ key: 'cat', label: cat, clear: () => setCat('All') }]
      : []),
    ...(tool !== 'All tools'
      ? [{ key: 'tool', label: tool, clear: () => setTool('All tools') }]
      : []),
    ...(featured
      ? [{ key: 'featured', label: 'Featured', clear: () => setFeatured(false) }]
      : []),
    ...(sort !== 'newest'
      ? [
          {
            key: 'sort',
            label: SORT_OPTIONS.find(o => o.value === sort)?.label ?? sort,
            clear: () => setSort('newest'),
          },
        ]
      : []),
  ]

  // Body scroll lock while the sheet is up, and close it if the viewport grows
  // past lg — where the sheet doesn't exist and the inline row takes over.
  useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const mq = window.matchMedia('(min-width: 1024px)')
    const onWide = (e: MediaQueryListEvent) => e.matches && setSheetOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false)
    if (mq.matches) setSheetOpen(false)
    mq.addEventListener('change', onWide)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      mq.removeEventListener('change', onWide)
      document.removeEventListener('keydown', onKey)
    }
  }, [sheetOpen])

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
      <div className="relative z-10 bg-white border-b-4" id="projects">
        <div className={container}>
          {/* ── Desktop (lg+): the original inline row ───────────── */}
          <div className="hidden lg:flex items-center gap-3 flex-wrap py-3">
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map(c => (
                <button
                  key={c}
                  className={`${PILL_BASE} ${c === cat ? 'bg-accent text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-ink hover:bg-paper-2'}${bouncingPill === c ? ' animate-[pillBounce_0.45s_cubic-bezier(0.34,1.56,0.64,1)]' : ''}`}
                  onClick={() => handleCatClick(c)}
                >
                  <span>{c}</span>
                  <span className="text-[10.5px] opacity-70 tracking-normal">{categoryCount(c)}</span>
                </button>
              ))}
            </div>

            <div className="w-[3px] h-[22px] bg-black" />

            <div className={SELECT_WRAP}>
              <label className={SELECT_LABEL}>Made with</label>
              <CustomSelect
                variant="filter"
                value={tool}
                onChange={v => { setTool(v); setPage(1) }}
                options={allTools.map(t => ({ value: t, label: t }))}
              />
            </div>

            <div className={SELECT_WRAP}>
              <label className={SELECT_LABEL}>Sort</label>
              <CustomSelect
                variant="filter"
                value={sort}
                onChange={v => { setSort(v); setPage(1) }}
                options={SORT_OPTIONS}
              />
            </div>

            <button
              className={`inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border-2 border-black text-[11.5px] font-semibold tracking-[0.04em] uppercase bg-white text-ink ${featured ? 'shadow-[2px_2px_0px_0px_#000]' : ''}`}
              onClick={() => { setFeatured(f => !f); setPage(1) }}
            >
              <span className={`shrink-0 relative w-7 h-4 rounded-full border-2 border-black transition-[background-color] duration-200 after:content-[''] after:absolute after:left-px after:top-px after:w-2.5 after:h-2.5 after:rounded-full after:transition-[transform,background-color] after:duration-200 ${featured ? 'bg-pop-magenta after:translate-x-3 after:bg-white' : 'bg-paper-2 after:bg-black/30'}`} />
              Featured only
            </button>

            <div className={`${COUNT_PILL} ml-auto`}>
              {filtered.length}&nbsp;·&nbsp;{tool !== 'All tools' ? tool : cat === 'All' ? 'results' : cat}
            </div>
          </div>

          {/* ── Mobile (<lg): summary row + active chips ──────────── */}
          <div className="lg:hidden flex flex-col gap-2 py-2.5">
            <div className="flex items-center gap-2">
              <button
                className={SHEET_TRIGGER}
                onClick={() => setSheetOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span aria-hidden>⚙</span>
                  <span className="truncate">Filter &amp; sort</span>
                </span>
                {activeChips.length > 0 && (
                  <span className="shrink-0 grid place-items-center min-w-[20px] h-5 px-1 rounded-full bg-accent text-white text-[10px] font-bold">
                    {activeChips.length}
                  </span>
                )}
              </button>
              <span className="shrink-0 text-[12px] font-bold tracking-[0.06em] uppercase text-ink-2">
                {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeChips.map(chip => (
                  <span key={chip.key} className={ACTIVE_CHIP}>
                    <span className="min-w-0 truncate">{chip.label}</span>
                    <button
                      onClick={() => { chip.clear(); setPage(1) }}
                      aria-label={`Remove ${chip.label} filter`}
                      className="shrink-0 grid place-items-center w-5 h-5 rounded-full text-[11px] leading-none hover:bg-black/20"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <button
                  className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-2 underline"
                  onClick={resetFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter sheet ───────────────────────────────────
          Anchored to the bottom of the viewport with its own scrolling body
          and a pinned footer, so the apply button is always reachable no
          matter how many categories or tools there are. */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[900] lg:hidden" role="dialog" aria-modal="true" aria-label="Filter and sort projects">
          <button
            className="absolute inset-0 w-full h-full bg-black/55 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t-4 border-black bg-white">
            <header className="flex items-center justify-between gap-3 border-b-2 border-black/10 px-4 py-3">
              <h2 className="m-0 text-[15px] font-bold tracking-[0.02em] text-ink">
                Filter &amp; sort
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="grid place-items-center w-9 h-9 -mr-1 rounded-full border-2 border-black bg-white text-sm font-bold"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-6">
              <section>
                <h3 className={SHEET_SECTION_H}>Category</h3>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map(c => (
                    <button
                      key={c}
                      className={`${SHEET_PILL} ${c === cat ? 'bg-accent text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-ink'}`}
                      onClick={() => { setCat(c); setPage(1) }}
                      aria-pressed={c === cat}
                    >
                      <span className="min-w-0">{c}</span>
                      <span className="shrink-0 text-[11px] opacity-70">{categoryCount(c)}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className={SHEET_SECTION_H}>Made with</h3>
                <div className="flex flex-wrap gap-2">
                  {allTools.map(t => (
                    <button
                      key={t}
                      className={`${SHEET_PILL} ${t === tool ? 'bg-pop-violet text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-ink'}`}
                      onClick={() => { setTool(t); setPage(1) }}
                      aria-pressed={t === tool}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className={SHEET_SECTION_H}>Sort by</h3>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      className={`${SHEET_PILL} ${o.value === sort ? 'bg-pop-blue text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-ink'}`}
                      onClick={() => { setSort(o.value); setPage(1) }}
                      aria-pressed={o.value === sort}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] border-2 border-black bg-white px-4 py-3 text-left"
                  onClick={() => { setFeatured(f => !f); setPage(1) }}
                  aria-pressed={featured}
                >
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] font-bold text-ink">Featured only</span>
                    <span className="text-[11.5px] font-medium text-ink-2">
                      Just the picks we&rsquo;ve highlighted
                    </span>
                  </span>
                  <span className={`shrink-0 relative w-11 h-6 rounded-full border-2 border-black transition-[background-color] duration-200 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:rounded-full after:transition-[transform,background-color] after:duration-200 ${featured ? 'bg-pop-magenta after:translate-x-5 after:bg-white' : 'bg-paper-2 after:bg-black/30'}`} />
                </button>
              </section>
            </div>

            <footer className="flex items-center gap-2.5 border-t-2 border-black/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-2 underline disabled:opacity-40"
                onClick={resetFilters}
                disabled={activeChips.length === 0}
              >
                Clear all
              </button>
              <button
                className="flex-1 rounded-full border-2 border-black bg-accent px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow] duration-100"
                onClick={() => setSheetOpen(false)}
              >
                Show {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Cards */}
      <section className="pt-10 pb-20 max-[640px]:pt-5 max-[640px]:pb-12">
        <div className={container}>

          {filtered.length === 0 ? (
            <div className={emptyState}>
              <div>Nothing here yet</div>
              <p className="mt-2">
                Try a different filter,{' '}
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
