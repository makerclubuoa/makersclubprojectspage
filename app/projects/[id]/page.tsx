import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import CursorTrail from '@/app/components/CursorTrail'
import LikeButton from '@/app/components/LikeButton'
import { fetchProject, fetchProjects, fetchAllIds, categoryColor } from '@/lib/projects'

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-NZ', opts ?? { month: 'short', year: 'numeric' }).toUpperCase()
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

  // Status
  const status = (project.status ?? 'DRAFT').toUpperCase()
  const statusIsShipped = status === 'SHIPPED' || status === 'FEATURED'
  const statusIsWip = status === 'WIP' || status === 'DRAFT'

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

  const makers = project.makers ?? []

  return (
    <>
      <CursorTrail />
      <Nav />

      {/* ── HERO ─────────────────────────────────────── */}
      <header className="pd-hero">
        <span className="cross cross--tl" style={{ top: 96, left: 28 }} />
        <span className="cross cross--tr" style={{ top: 96, right: 28 }} />
        <div className="container">

          <div className="pd-crumbs">
            <span><span className="num">{prjNum}</span></span>
            <span className="sep">/</span>
            <span>{project.category ?? '—'}_</span>
            <span className="sep">/</span>
            <span>STARTED {startedDate}</span>
            <span className="sep">/</span>
            <span>LOGGED {loggedDate}</span>
            {project.build_time && (
              <>
                <span className="sep">/</span>
                <span>BUILD {project.build_time.toUpperCase()}</span>
              </>
            )}
            <span style={{ flex: 1 }} />
            <span className={`status${statusIsShipped ? ' status--shipped' : statusIsWip ? ' status--wip' : ''}`}>
              <span className="pip" />
              {status}
            </span>
          </div>

          <div className="pd-hero__grid">
            {/* Left */}
            <div>
              <h1 className="pd-title">{project.title}</h1>
              {project.blurb && <p className="pd-blurb">{project.blurb}</p>}

              {makers.length > 0 && (
                <div className="pd-makers">
                  <span className="avatar-stack">
                    {makers.map((_, i) => (
                      <span key={i} className="avatar" style={{ background: color }} />
                    ))}
                  </span>
                  <div className="pd-makers__text">
                    <b>{makers.join(' + ')}</b>
                    <small>
                      {makers.length} member{makers.length !== 1 ? 's' : ''} · {loggedDate}
                    </small>
                  </div>
                </div>
              )}

              <div className="pd-quickmeta">
                <div>
                  <b>{project.likes ?? 0}</b>
                  <span>loves</span>
                </div>
                <div>
                  <b>{String((project.tools ?? []).length).padStart(2, '0')}</b>
                  <span>tools used</span>
                </div>
                {hasBOM && (
                  <div>
                    <b>{String(bomItems.length).padStart(2, '0')}</b>
                    <span>BOM parts</span>
                  </div>
                )}
                {hasBOM && bomTotal > 0 && (
                  <div>
                    <b>${bomTotal.toFixed(0)}</b>
                    <span>est. cost</span>
                  </div>
                )}
              </div>

              <div className="pd-actions">
                <LikeButton projectId={project.id} initialLikes={project.likes ?? 0} />
                {hasBuildLog && (
                  <a className="btn btn--ghost" href="#log">Build log ↓</a>
                )}
                {hasBOM && (
                  <a className="btn btn--ghost" href="#bom">BOM ↓</a>
                )}
                <Link href="/#projects" className="btn btn--ghost" style={{ marginLeft: 'auto' }}>
                  ← All projects
                </Link>
              </div>
            </div>

            {/* Right: cover */}
            <div className="pd-cover">
              <span className="pd-cover__fig">FIG.01 — {project.title.toUpperCase().slice(0, 24)}</span>
              <div className="pd-cover__inner">
                {project.image ? (
                  <div
                    className="ph"
                    style={{ backgroundImage: `url(${project.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                ) : (
                  <div className="ph" style={{ backgroundImage: color }}>
                    <span className="ph__label">[ {project.title} ]</span>
                  </div>
                )}
              </div>
              <div className="pd-cover__scale">10cm · 20cm · 30cm · 40cm · 50cm</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────── */}
      <main>
        <div className="container">
          <div className="pd-layout">

            {/* ── MAIN COLUMN ─────────────────────── */}
            <div className="pd-main">

              {/* [01] Story */}
              {hasStory && (
                <section className="pd-section" id="story">
                  <div className="seclabel">
                    <span className="num">{storyNum}</span>
                    <span>Story_</span>
                    <span className="bar" />
                    <span>Long-form write-up</span>
                  </div>
                  <h2>The <em>story</em></h2>
                  <div className="pd-body">
                    {(project.description ?? '').split('\n\n').filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* [02] Build log */}
              {hasBuildLog && (
                <section className="pd-section" id="log">
                  <div className="seclabel">
                    <span className="num">{logNum}</span>
                    <span>Build_log</span>
                    <span className="bar" />
                    <span>{(project.build_log ?? []).length} entries</span>
                  </div>
                  <h2>Build <em>log</em></h2>
                  <div className="pd-log">
                    {(project.build_log ?? []).map((entry, i) => (
                      <div key={i} className={`pd-log__row${entry.milestone ? ' is-milestone' : ''}`}>
                        <div className="pd-log__date">
                          {entry.date}
                          {entry.week_label && <small>{entry.week_label}</small>}
                        </div>
                        <div className="pd-log__dot"><span /></div>
                        <div className="pd-log__body">
                          <h4>{entry.title}</h4>
                          <p>{entry.body}</p>
                          {entry.tag && <span className="pd-log__tag">{entry.tag}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* [03] Gallery */}
              {hasGallery && (
                <section className="pd-section" id="gallery">
                  <div className="seclabel">
                    <span className="num">{galleryNum}</span>
                    <span>Gallery_</span>
                    <span className="bar" />
                    <span>{(project.gallery_images ?? []).length} images</span>
                  </div>
                  <h2>Gallery</h2>
                  <div className="pd-gallery">
                    {(project.gallery_images ?? []).map((src, i) => (
                      <div key={i} className="pd-gallery__item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Gallery image ${i + 1}`} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* [04] Bill of materials */}
              {hasBOM && (
                <section className="pd-section" id="bom">
                  <div className="seclabel">
                    <span className="num">{bomNum}</span>
                    <span>Bill_of_materials</span>
                    <span className="bar" />
                    <span>Materials &amp; sources</span>
                  </div>
                  <h2>Bill of <em>materials</em></h2>
                  <div className="pd-bom">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="num-cell">Qty</th>
                          <th className="num-cell">Unit</th>
                          <th className="num-cell">Total</th>
                          <th style={{ width: 120 }}>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomItems.map((item, i) => {
                          const total = (item.unit_cost ?? 0) * (item.qty ?? 1)
                          return (
                            <tr key={i}>
                              <td>
                                <div className="nm">{item.item}</div>
                                {item.desc && <div className="desc">{item.desc}</div>}
                              </td>
                              <td className="num-cell">{String(item.qty ?? 1).padStart(2, '0')}</td>
                              <td className="num-cell">{item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '—'}</td>
                              <td className="num-cell">{total ? `$${total.toFixed(2)}` : '—'}</td>
                              <td>{item.src ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total cost</td>
                          <td className="num-cell" />
                          <td className="num-cell" />
                          <td className="total-cell">${bomTotal.toFixed(2)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              )}

              {/* [05] Retro */}
              {hasRetro && (
                <section className="pd-section" id="retro">
                  <div className="seclabel">
                    <span className="num">{retroNum}</span>
                    <span>What_we_learned</span>
                    <span className="bar" />
                    <span>Honest notes</span>
                  </div>
                  <h2>What we&apos;d do <em>differently</em></h2>
                  <div className="pd-retro">
                    {(project.retro_wins ?? []).length > 0 && (
                      <div className="pd-retro__col win">
                        <h4><span>Worked</span><span className="sym">[ + ]</span></h4>
                        <ul>
                          {(project.retro_wins ?? []).map((w, i) => (
                            <li key={i}><span className="ix">{String(i + 1).padStart(2, '0')}</span><span>{w}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(project.retro_fixes ?? []).length > 0 && (
                      <div className="pd-retro__col fix">
                        <h4><span>We&apos;d change</span><span className="sym">[ - ]</span></h4>
                        <ul>
                          {(project.retro_fixes ?? []).map((w, i) => (
                            <li key={i}><span className="ix">{String(i + 1).padStart(2, '0')}</span><span>{w}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* [06] Kudos */}
              {hasKudos && (
                <section className="pd-section" id="kudos">
                  <div className="seclabel">
                    <span className="num">{kudosNum}</span>
                    <span>Shout_outs</span>
                    <span className="dotline" />
                    <span>From the club</span>
                  </div>
                  <h2>From the <em>club</em></h2>
                  <div className="pd-kudos">
                    {(project.kudos ?? []).map((k, i) => (
                      <div key={i} className="pd-kudo">
                        <p>{k.text}</p>
                        <div className="kudo-who">
                          <span className="av" />
                          <span><b>{k.who}</b>{k.role ? ` · ${k.role}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Related */}
              {hasRelated && (
                <section className="pd-section" id="related">
                  <div className="seclabel">
                    <span className="num">{relatedNum}</span>
                    <span>More_from_the_archive</span>
                    <span className="bar" />
                    <span>Three picks</span>
                  </div>
                  <h2>More from the <em>archive</em></h2>
                  <div className="pd-related">
                    {related.map(r => (
                      <Link key={r.id} href={`/projects/${r.id}`} className="pd-rcard">
                        <div
                          className="pd-rcard__img"
                          style={{ backgroundImage: r.image ? `url(${r.image})` : categoryColor(r.category) }}
                        >
                          {!r.image && (
                            <div className="ph"><span className="ph__label">[ {r.title} ]</span></div>
                          )}
                        </div>
                        <h5>{r.title}</h5>
                        <p>{r.category} · {(r.makers ?? []).join(' + ')}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Prev / Next */}
              {(prev || next) && (
                <nav className="pd-pn">
                  {prev ? (
                    <Link href={`/projects/${prev.id}`} className="prev">
                      <small>← Previous</small>
                      <b>{prev.title}</b>
                    </Link>
                  ) : <div />}
                  {next ? (
                    <Link href={`/projects/${next.id}`} className="next">
                      <small>Next →</small>
                      <b>{next.title}</b>
                    </Link>
                  ) : <div />}
                </nav>
              )}
            </div>

            {/* ── SIDEBAR ─────────────────────────── */}
            <aside>
              <div className="pd-side__sticky">

                {/* TOC */}
                <div className="pd-frame">
                  <div className="pd-frame__inner pd-toc">
                    <span className="pd-frame__fig">CONTENTS</span>
                    {hasStory    && <a href="#story">   <span className="ix">{storyNum}</span>   Story</a>}
                    {hasBuildLog && <a href="#log">     <span className="ix">{logNum}</span>      Build log</a>}
                    {hasGallery  && <a href="#gallery"> <span className="ix">{galleryNum}</span>  Gallery</a>}
                    {hasBOM      && <a href="#bom">     <span className="ix">{bomNum}</span>      Bill of materials</a>}
                    {hasRetro    && <a href="#retro">   <span className="ix">{retroNum}</span>    What we learned</a>}
                    {hasKudos    && <a href="#kudos">   <span className="ix">{kudosNum}</span>    Shout-outs</a>}
                    {hasRelated  && <a href="#related"> <span className="ix">{relatedNum}</span>  More archive</a>}
                  </div>
                </div>

                {/* Spec */}
                <div className="pd-frame">
                  <div className="pd-frame__inner">
                    <span className="pd-frame__fig">FIG.A — SPEC</span>
                    <p className="pd-spec-h">At a glance</p>
                    {project.category && (
                      <div className="pd-spec-row">
                        <span className="k">Category</span>
                        <span className="v">{project.category}</span>
                      </div>
                    )}
                    {project.start_date && (
                      <div className="pd-spec-row">
                        <span className="k">Started</span>
                        <span className="v">{fmtDate(project.start_date)}</span>
                      </div>
                    )}
                    {project.date && (
                      <div className="pd-spec-row">
                        <span className="k">Logged</span>
                        <span className="v">{fmtDate(project.date)}</span>
                      </div>
                    )}
                    {project.build_time && (
                      <div className="pd-spec-row">
                        <span className="k">Build time</span>
                        <span className="v">{project.build_time}</span>
                      </div>
                    )}
                    {makers.length > 0 && (
                      <div className="pd-spec-row">
                        <span className="k">Members</span>
                        <span className="v">{makers.join(', ')}</span>
                      </div>
                    )}
                    <div className="pd-spec-row">
                      <span className="k">Loves</span>
                      <span className="v">♥ {project.likes ?? 0}</span>
                    </div>
                    <div className="pd-spec-row">
                      <span className="k">Status</span>
                      <span className="v">{status}</span>
                    </div>

                    {(project.tools ?? []).length > 0 && (
                      <>
                        <p className="pd-spec-h">Made with</p>
                        <div className="pd-side-tags">
                          {(project.tools ?? []).map(t => (
                            <span key={t} className="pd-side-tag">{t}</span>
                          ))}
                        </div>
                      </>
                    )}

                    {(project.github) && (
                      <>
                        <p className="pd-spec-h">Links</p>
                        {project.github && (
                          <a href={project.github} className="pd-side-link" target="_blank" rel="noopener noreferrer">
                            <span>GitHub ↗</span>
                            <small>source</small>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Submit CTA */}
                <Link href="/submit" className="btn btn--gradient" style={{ justifyContent: 'center' }}>
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
