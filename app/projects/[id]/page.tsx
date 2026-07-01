import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import LikeButton from '@/app/components/LikeButton'
import CommentsSection from '@/app/components/CommentsSection'
import { fetchProject, fetchProjects, fetchAllIds, fetchMakerDisplay, categoryColor } from '@/lib/projects'
import {
  container, seclabel, seclabelNum, seclabelBar, seclabelDot,
  btnGhost, btnGradient, btnArr, ph, phLabel,
} from '@/lib/ui'

const crossCls =
  "absolute w-[18px] h-[18px] pointer-events-none before:content-[''] before:absolute before:bg-ink before:opacity-50 before:left-0 before:right-0 before:top-1/2 before:h-px after:content-[''] after:absolute after:bg-ink after:opacity-50 after:top-0 after:bottom-0 after:left-1/2 after:w-px"

// BOM table cells (was .pd-bom …)
const BOM_TH = 'text-left px-3.5 py-2.5 text-[10px] tracking-[0.12em] uppercase text-muted bg-paper-2 border-b border-rule font-medium'
const BOM_TD = 'px-3.5 py-[11px] border-b border-dashed border-rule align-top'
const BOM_TD_NUM = 'px-3.5 py-[11px] border-b border-dashed border-rule align-top text-sm w-20'
const BOM_TF = 'px-3.5 py-3 text-[11px] tracking-[0.1em] uppercase border-t border-rule bg-paper-2 text-ink-2'
const BOM_TF_TOTAL = 'px-3.5 py-3 border-t border-rule bg-paper-2 text-ink text-[17px]'

// Sidebar table-of-contents links (was .pd-toc a / .ix)
const TOC_LINK = 'flex gap-2.5 text-[11.5px] py-[5px] text-ink-2 tracking-[0.06em] uppercase no-underline transition-colors duration-200 hover:text-ink'
const TOC_IX = 'text-muted w-6 shrink-0 text-[11px]'
const SPEC_ROW = 'flex justify-between gap-3 text-xs pb-[7px] border-b border-dashed border-rule last-of-type:border-b-0'
const SPEC_H = 'text-[10px] font-semibold tracking-[0.14em] uppercase mt-4 mb-2.5 text-muted'
const SPEC_K = 'text-muted tracking-[0.06em] uppercase text-[10.5px]'
const SPEC_V = 'text-[13px] text-right'
const FRAME = 'border border-rule p-1 bg-paper relative'
const FRAME_INNER = 'border border-dashed border-rule p-[18px] relative'
const FRAME_FIG = 'absolute -top-[9px] left-[14px] bg-paper px-2 text-[10px] tracking-[0.12em] text-muted'

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-NZ', opts ?? { month: 'short', year: 'numeric' }).toUpperCase()
}

export const dynamic = 'force-dynamic'

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

  // Related projects: same category first, then shared tools, then random
  const others = allProjects.filter(p => p.id !== id)
  const sameCategory = others.filter(p => p.category === project.category)
  const sharedTools = others.filter(
    p => p.category !== project.category && (p.tools ?? []).some(t => (project.tools ?? []).includes(t))
  )
  const pool = [
    ...sameCategory.slice(0, 2),
    ...sharedTools.slice(0, 3 - Math.min(2, sameCategory.length)),
  ]
  const related = pool.length < 3
    ? [...pool, ...others.filter(p => !pool.includes(p)).slice(0, 3 - pool.length)]
    : pool.slice(0, 3)

  const [{ names: makerNames, anonCount: makerAnonCount }, ...relatedDisplays] = await Promise.all([
    fetchMakerDisplay(project),
    ...related.map(r => fetchMakerDisplay(r)),
  ])
  const relatedMakerDisplays = Object.fromEntries(related.map((r, i) => [r.id, relatedDisplays[i]]))
  const totalMakers = makerNames.length + makerAnonCount
  const makerDisplayStr = [
    ...makerNames,
    ...(makerAnonCount > 0 ? [`+${makerAnonCount} others`] : []),
  ].join(' + ')

  // Status

  // Dates
  const loggedDate = project.date ? fmtDate(project.date) : '—'
  const startedDate = project.start_date
    ? fmtDate(project.start_date)
    : project.date ? fmtDate(project.date) : '—'

  const prjNum = `PRJ_${String(idx + 1).padStart(3, '0')}`

  // BOM totals
  const bomItems = project.bom ?? []
  const bomTotal = bomItems.reduce((s, x) => s + (x.unit_cost ?? 0) * (x.qty ?? 1), 0)

  // Which sections exist?
  const hasStory = !!project.description
  const hasBuildLog = (project.build_log ?? []).length > 0
  const hasGallery = (project.gallery_images ?? []).length > 0
  const hasBOM = bomItems.length > 0
  const hasRetro = (project.retro_wins ?? []).length > 0 || (project.retro_fixes ?? []).length > 0
  const hasKudos = (project.kudos ?? []).length > 0
  const hasRelated = related.length > 0

  // Compute section numbers
  let n = 0
  const sn = () => `[${String(++n).padStart(2, '0')}]`
  const storyNum    = hasStory    ? sn() : null
  const logNum      = hasBuildLog ? sn() : null
  const galleryNum  = hasGallery  ? sn() : null
  const bomNum      = hasBOM      ? sn() : null
  const retroNum    = hasRetro    ? sn() : null
  const kudosNum    = hasKudos    ? sn() : null
  const relatedNum  = hasRelated  ? sn() : null
  const commentsNum = sn()

  return (
    <>
      <CursorTrail />
      <Nav />

      {/* ── HERO ─────────────────────────────────────── */}
      <header className="relative pt-[104px] pb-14 border-b border-rule">
        <span className={crossCls} style={{ top: 96, left: 28 }} />
        <span className={crossCls} style={{ top: 96, right: 28 }} />
        <div className={container}>

          <div className="flex flex-wrap items-center gap-[18px] text-[11px] tracking-[0.14em] uppercase text-muted mb-8 py-2 border-y border-rule max-[640px]:gap-2.5 max-[640px]:text-[10px]">
            <span>{project.category ?? '—'}</span>
            <span className="text-rule">/</span>
            <span>STARTED {startedDate}</span>
            <span className="text-rule">/</span>
            <span>LOGGED {loggedDate}</span>
            {project.build_time && (
              <>
                <span className="text-rule">/</span>
                <span>BUILD {project.build_time.toUpperCase()}</span>
              </>
            )}
            <span className="flex-1" />
          </div>

          <div className="grid grid-cols-[1.05fr_1fr] gap-12 items-end max-[980px]:grid-cols-1 max-[980px]:gap-8">
            {/* Left */}
            <div>
              <h1 className="text-[clamp(40px,5.8vw,86px)] font-normal tracking-[-0.01em] leading-[0.94] mt-0 mb-[18px] [text-wrap:balance]">{project.title}</h1>
              {project.blurb && <p className="text-base text-ink-2 max-w-[52ch] mt-0 mb-6 leading-[1.6]">{project.blurb}</p>}

              {totalMakers > 0 && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex">
                    {Array.from({ length: totalMakers }).map((_, i) => (
                      <span key={i} className={`w-7 h-7 rounded-full border-[3px] border-paper inline-block${i > 0 ? ' -ml-1.5' : ''}`} style={{ background: color }} />
                    ))}
                  </span>
                  <div className="text-[12.5px]">
                    <b className="font-medium">{makerDisplayStr}</b>
                    <small className="block text-muted text-[10px] tracking-[0.08em] uppercase mt-0.5">
                      {totalMakers} member{totalMakers !== 1 ? 's' : ''} · {loggedDate}
                    </small>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap border border-rule">
                <div className="px-4 py-3.5 border-r border-rule flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                  <b className="block font-normal text-[22px] leading-none tracking-[-0.005em] mb-[5px]">{project.likes ?? 0}</b>
                  <span className="block text-[10px] tracking-[0.1em] uppercase text-muted">loves</span>
                </div>
                <div className="px-4 py-3.5 border-r border-rule flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                  <b className="block font-normal text-[22px] leading-none tracking-[-0.005em] mb-[5px]">{String((project.tools ?? []).length).padStart(2, '0')}</b>
                  <span className="block text-[10px] tracking-[0.1em] uppercase text-muted">tools used</span>
                </div>
                {hasBOM && (
                  <div className="px-4 py-3.5 border-r border-rule flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                    <b className="block font-normal text-[22px] leading-none tracking-[-0.005em] mb-[5px]">{String(bomItems.length).padStart(2, '0')}</b>
                    <span className="block text-[10px] tracking-[0.1em] uppercase text-muted">BOM parts</span>
                  </div>
                )}
                {hasBOM && bomTotal > 0 && (
                  <div className="px-4 py-3.5 border-r border-rule flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                    <b className="block font-normal text-[22px] leading-none tracking-[-0.005em] mb-[5px]">${bomTotal.toFixed(0)}</b>
                    <span className="block text-[10px] tracking-[0.1em] uppercase text-muted">est. cost</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 items-center mt-5 flex-wrap">
                <LikeButton projectId={project.id} initialLikes={project.likes ?? 0} />
                {hasBuildLog && (
                  <a className={btnGhost} href="#log">Build log ↓</a>
                )}
                {hasBOM && (
                  <a className={btnGhost} href="#bom">BOM ↓</a>
                )}
                <Link href="/#projects" className={`${btnGhost} ml-auto`}>
                  ← All Projects
                </Link>
              </div>
            </div>

            {/* Right: cover */}
            <div className="aspect-[4/5] relative border border-rule p-1 bg-paper max-[980px]:aspect-[4/3]">
              <span className="absolute -top-[9px] left-[14px] bg-paper px-2 text-[10px] tracking-[0.12em] text-muted z-[2]">FIG.01 — {project.title.toUpperCase().slice(0, 24)}</span>
              <div className="relative w-full h-full overflow-hidden">
                {project.image ? (
                  <div
                    className={`${ph} inset-0`}
                    style={{ backgroundImage: `url(${project.image})` }}
                  />
                ) : (
                  <div className={ph} style={{ backgroundImage: color }}>
                    <span className={phLabel}>[ {project.title} ]</span>
                  </div>
                )}
              </div>
              <div className="absolute right-[-1px] top-[-1px] bottom-[-1px] w-6 border-l border-rule flex flex-col justify-between py-2 text-[8px] tracking-[0.05em] text-muted [writing-mode:vertical-rl] rotate-180 items-center">10cm · 20cm · 30cm · 40cm · 50cm</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────── */}
      <main>
        <div className={container}>
          <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-14 pt-[52px] pb-20 items-start max-[980px]:grid-cols-1 max-[980px]:gap-10">

            {/* ── MAIN COLUMN ─────────────────────── */}
            <div className="min-w-0">

              {/* [01] Story */}
              {hasStory && (
                <section className="mb-[60px]" id="story">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{storyNum}</span>
                    <span>Story</span>
                    <span className={seclabelBar} />
                    <span>Long-form write-up</span>
                  </div>
                  <div>
                    {(project.description ?? '').split('\n\n').filter(Boolean).map((para, i) => (
                      <p key={i} className="text-[14.5px] text-ink-2 mt-0 mb-[18px] max-w-[62ch] leading-[1.75]">{para}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* [02] Build log */}
              {hasBuildLog && (
                <section className="mb-[60px]" id="log">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{logNum}</span>
                    <span>Build log</span>
                    <span className={seclabelBar} />
                    <span>{(project.build_log ?? []).length} entries</span>
                  </div>
                  <div className="relative">
                    {(project.build_log ?? []).map((entry, i) => (
                      <div key={i} className="group grid grid-cols-[110px_32px_minmax(0,1fr)] gap-[18px] py-[18px] border-t border-dashed border-rule items-start last:border-b last:border-dashed last:border-rule max-[720px]:grid-cols-[80px_24px_1fr]">
                        <div className="text-sm leading-[1.3] pt-1">
                          {entry.date}
                          {entry.week_label && <small className="block text-muted text-[10px] tracking-[0.1em] uppercase mt-0.5">{entry.week_label}</small>}
                        </div>
                        <div className="relative pt-2 flex justify-center before:content-[''] before:absolute before:top-[14px] before:bottom-[-100%] before:left-1/2 before:w-px before:bg-rule group-last:before:hidden">
                          <span className={`relative z-[1] w-2.5 h-2.5 rounded-full block border-[1.5px] ${entry.milestone ? 'bg-ink border-transparent shadow-[0_0_0_3px_color-mix(in_oklab,var(--pop-magenta)_18%,transparent)]' : 'bg-paper border-ink'}`} />
                        </div>
                        <div>
                          <h4 className="text-[17px] font-normal m-0 mb-1.5 tracking-[-0.005em]">{entry.title}</h4>
                          <p className="m-0 text-[13.5px] text-ink-2 leading-[1.6] max-w-[56ch]">{entry.body}</p>
                          {entry.tag && <span className="inline-block mt-2 px-[7px] py-0.5 bg-paper-2 text-[10px] tracking-[0.06em] text-ink-2">{entry.tag}</span>}
                          {entry.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.image} alt={entry.title} className="block mt-3 max-w-full max-h-[320px] rounded object-cover" loading="lazy" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* [03] Gallery */}
              {hasGallery && (
                <section className="mb-[60px]" id="gallery">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{galleryNum}</span>
                    <span>Gallery</span>
                    <span className={seclabelBar} />
                    <span>{(project.gallery_images ?? []).length} images</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-[720px]:grid-cols-2">
                    {(project.gallery_images ?? []).map((src, i) => (
                      <div key={i} className={`relative border border-rule p-[3px] bg-paper overflow-hidden ${i === 0 ? 'col-span-2 row-span-2 aspect-square max-[720px]:row-span-1 max-[720px]:aspect-[4/3]' : 'aspect-[4/3]'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Gallery image ${i + 1}`} loading="lazy" className="w-full h-full object-cover block" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* [04] Bill of materials */}
              {hasBOM && (
                <section className="mb-[60px]" id="bom">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{bomNum}</span>
                    <span>Bill of materials</span>
                    <span className={seclabelBar} />
                    <span>Materials &amp; sources</span>
                  </div>
                  <div className="border border-rule bg-paper max-[720px]:overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr>
                          <th className={BOM_TH}>Item</th>
                          <th className={BOM_TH}>Qty</th>
                          <th className={BOM_TH}>Unit</th>
                          <th className={BOM_TH}>Total</th>
                          <th className={`${BOM_TH} w-[120px]`}>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomItems.map((item, i) => {
                          const total = (item.unit_cost ?? 0) * (item.qty ?? 1)
                          return (
                            <tr key={i} className="[&:last-child>td]:border-b-0">
                              <td className={BOM_TD}>
                                <div className="font-medium text-ink">{item.item}</div>
                                {item.desc && <div className="text-muted text-[11.5px] mt-0.5">{item.desc}</div>}
                              </td>
                              <td className={BOM_TD_NUM}>{String(item.qty ?? 1).padStart(2, '0')}</td>
                              <td className={BOM_TD_NUM}>{item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '—'}</td>
                              <td className={BOM_TD_NUM}>{total ? `$${total.toFixed(2)}` : '—'}</td>
                              <td className={BOM_TD}>{item.src ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className={BOM_TF}>Total cost</td>
                          <td className={`${BOM_TF} w-20`} />
                          <td className={`${BOM_TF} w-20`} />
                          <td className={BOM_TF_TOTAL}>${bomTotal.toFixed(2)}</td>
                          <td className={BOM_TF} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              )}

              {/* [05] Retro */}
              {hasRetro && (
                <section className="mb-[60px]" id="retro">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{retroNum}</span>
                    <span>What we learned</span>
                    <span className={seclabelBar} />
                    <span>Honest notes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1">
                    {(project.retro_wins ?? []).length > 0 && (
                      <div className="border border-rule p-1 bg-paper">
                        <h4 className="flex items-center justify-between px-3.5 py-2.5 m-0 text-[10.5px] tracking-[0.14em] uppercase text-muted bg-paper-2"><span>Worked</span><span className="font-mono text-[#22c55e]">[ + ]</span></h4>
                        <ul className="list-none m-0 p-3.5">
                          {(project.retro_wins ?? []).map((w, i) => (
                            <li key={i} className="grid grid-cols-[24px_1fr] gap-2 py-[9px] border-b border-dashed border-rule last:border-b-0 text-[13.5px] text-ink-2 leading-[1.55]"><span className="text-muted text-xs">{String(i + 1).padStart(2, '0')}</span><span>{w}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(project.retro_fixes ?? []).length > 0 && (
                      <div className="border border-rule p-1 bg-paper">
                        <h4 className="flex items-center justify-between px-3.5 py-2.5 m-0 text-[10.5px] tracking-[0.14em] uppercase text-muted bg-paper-2"><span>We&apos;d change</span><span className="font-mono text-pop-red">[ - ]</span></h4>
                        <ul className="list-none m-0 p-3.5">
                          {(project.retro_fixes ?? []).map((w, i) => (
                            <li key={i} className="grid grid-cols-[24px_1fr] gap-2 py-[9px] border-b border-dashed border-rule last:border-b-0 text-[13.5px] text-ink-2 leading-[1.55]"><span className="text-muted text-xs">{String(i + 1).padStart(2, '0')}</span><span>{w}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* [06] Kudos */}
              {hasKudos && (
                <section className="mb-[60px]" id="kudos">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{kudosNum}</span>
                    <span>Shout outs</span>
                    <span className={seclabelDot} />
                    <span>From the club</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
                    {(project.kudos ?? []).map((k, i) => (
                      <div key={i} className="border border-rule p-4 bg-paper flex flex-col gap-2.5">
                        <p className="m-0 text-[13.5px] text-ink leading-[1.6] before:content-['//_'] before:text-muted">{k.text}</p>
                        <div className="flex items-center gap-2.5 text-[10.5px] tracking-[0.08em] uppercase text-muted pt-2 border-t border-dashed border-rule">
                          <span className="w-[22px] h-[22px] rounded-full bg-ink inline-block shrink-0" />
                          <span><b className="text-ink font-medium tracking-[0.04em]">{k.who}</b>{k.role ? ` · ${k.role}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <CommentsSection projectId={project.id} projectTitle={project.title} projectOwnerId={project.submitted_by ?? null} sectionNum={commentsNum} />

              {/* Related */}
              {hasRelated && (
                <section className="mb-[60px]" id="related">
                  <div className={seclabel}>
                    <span className={seclabelNum}>{relatedNum}</span>
                    <span>More from the archive</span>
                    <span className={seclabelBar} />
                    <span>Three picks</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-[980px]:grid-cols-2 max-[720px]:grid-cols-1">
                    {related.map(r => (
                      <Link key={r.id} href={`/projects/${r.id}`} className="group border border-rule bg-paper flex flex-col no-underline text-inherit overflow-hidden [transition:transform_0.2s_ease,box-shadow_0.2s,border-color_0.2s] hover:-translate-y-0.5 hover:border-ink hover:[box-shadow:var(--rcard-shadow)]">
                        <div
                          className="aspect-[4/3] relative overflow-hidden bg-cover bg-center border-b border-rule"
                          style={{ backgroundImage: r.image ? `url(${r.image})` : categoryColor(r.category) }}
                        >
                          {!r.image && (
                            <div className={ph}><span className={phLabel}>[ {r.title} ]</span></div>
                          )}
                        </div>
                        <h5 className="text-[15px] font-bold mx-[14px] mt-3 mb-1 tracking-[-0.01em]">{r.title}</h5>
                        <p className="mx-[14px] mt-0 mb-[14px] text-muted text-[10.5px] tracking-[0.06em] uppercase">{r.category} · {[
                          ...(relatedMakerDisplays[r.id]?.names ?? r.makers ?? []),
                          ...((relatedMakerDisplays[r.id]?.anonCount ?? 0) > 0 ? [`+${relatedMakerDisplays[r.id].anonCount} others`] : []),
                        ].join(' + ')}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* ── SIDEBAR ─────────────────────────── */}
            <aside>
              <div className="sticky top-20 flex flex-col gap-4 max-[980px]:static">

                {/* TOC */}
                <div className={FRAME}>
                  <div className={FRAME_INNER}>
                    <span className={FRAME_FIG}>CONTENTS</span>
                    {hasStory    && <a href="#story" className={TOC_LINK}><span className={TOC_IX}>{storyNum}</span>Story</a>}
                    {hasBuildLog && <a href="#log" className={TOC_LINK}><span className={TOC_IX}>{logNum}</span>Build log</a>}
                    {hasGallery  && <a href="#gallery" className={TOC_LINK}><span className={TOC_IX}>{galleryNum}</span>Gallery</a>}
                    {hasBOM      && <a href="#bom" className={TOC_LINK}><span className={TOC_IX}>{bomNum}</span>Bill of materials</a>}
                    {hasRetro    && <a href="#retro" className={TOC_LINK}><span className={TOC_IX}>{retroNum}</span>What we learned</a>}
                    {hasKudos    && <a href="#kudos" className={TOC_LINK}><span className={TOC_IX}>{kudosNum}</span>Shout-outs</a>}
                    {hasRelated  && <a href="#related" className={TOC_LINK}><span className={TOC_IX}>{relatedNum}</span>More archive</a>}
                    <a href="#comments" className={TOC_LINK}><span className={TOC_IX}>{commentsNum}</span>Comments</a>
                  </div>
                </div>

                {/* Spec */}
                <div className={FRAME}>
                  <div className={FRAME_INNER}>
                    <span className={FRAME_FIG}>FIG.A — SPEC</span>
                    <p className={SPEC_H}>At a glance</p>
                    {project.category && (
                      <div className={SPEC_ROW}>
                        <span className={SPEC_K}>Category</span>
                        <span className={SPEC_V}>{project.category}</span>
                      </div>
                    )}
                    {project.start_date && (
                      <div className={SPEC_ROW}>
                        <span className={SPEC_K}>Started</span>
                        <span className={SPEC_V}>{fmtDate(project.start_date)}</span>
                      </div>
                    )}
                    {project.date && (
                      <div className={SPEC_ROW}>
                        <span className={SPEC_K}>Logged</span>
                        <span className={SPEC_V}>{fmtDate(project.date)}</span>
                      </div>
                    )}
                    {project.build_time && (
                      <div className={SPEC_ROW}>
                        <span className={SPEC_K}>Build time</span>
                        <span className={SPEC_V}>{project.build_time}</span>
                      </div>
                    )}
                    {totalMakers > 0 && (
                      <div className={SPEC_ROW}>
                        <span className={SPEC_K}>Members</span>
                        <span className={SPEC_V}>{makerDisplayStr.replace(/ \+ /g, ', ')}</span>
                      </div>
                    )}
                    <div className={SPEC_ROW}>
                      <span className={SPEC_K}>Loves</span>
                      <span className={SPEC_V}>♥ {project.likes ?? 0}</span>
                    </div>

                    {(project.tools ?? []).length > 0 && (
                      <>
                        <p className={SPEC_H}>Made with</p>
                        <div className="flex flex-wrap gap-[5px] mt-2">
                          {(project.tools ?? []).map(t => (
                            <span key={t} className="px-2 py-1 bg-paper-2 border border-rule-2 text-[11px] text-ink-2">{t}</span>
                          ))}
                        </div>
                      </>
                    )}

                    {(project.github) && (
                      <>
                        <p className={SPEC_H}>Links</p>
                        {project.github && (
                          <a href={project.github} className="flex justify-between py-[9px] border-b border-dashed border-rule last:border-b-0 text-xs text-pop-blue no-underline tracking-[0.04em] transition-colors duration-200 hover:text-pop-violet" target="_blank" rel="noopener noreferrer">
                            <span>GitHub ↗</span>
                            <small className="text-muted text-[10px] tracking-[0.08em] uppercase">source</small>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Submit CTA */}
                <Link href="/submit" className={`${btnGradient} justify-center`}>
                  Submit yours <span className={btnArr}>→</span>
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
