import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LikeButton from "@/app/components/LikeButton";
import CommentsSection from "@/app/components/CommentsSection";
import {
  fetchProject,
  fetchProjects,
  fetchAllIds,
  fetchMakerDisplay,
  categoryColor,
  categoryPopText,
} from "@/lib/projects";
import { embedUrl, formatClock, providerLabel } from "@/lib/media";
import {
  container,
  pageWrap,
  holt,
  secHead,
  secHeadRow,
  secHint,
  btnGhost,
  btnGradient,
  btnArr,
  ph,
  phLabel,
} from "@/lib/ui";

// White comic card used for every content section on the gradient.
const SECTION =
  "relative bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-6 md:p-8 mb-10";

// Chip used in the hero meta row.
const META_CHIP =
  "inline-flex items-center px-3 py-0.5 rounded-full border-2 border-black bg-white text-[10.5px] font-bold tracking-[0.08em] uppercase";

// BOM table cells
const BOM_TH =
  "text-left px-3.5 py-2.5 text-[10px] font-bold tracking-[0.12em] uppercase text-ink bg-paper-2 border-b-2 border-black";
const BOM_TD = "px-3.5 py-[11px] border-b border-black/10 align-top";
const BOM_TD_NUM =
  "px-3.5 py-[11px] border-b border-black/10 align-top text-sm w-20";
const BOM_TF =
  "px-3.5 py-3 text-[11px] font-bold tracking-[0.1em] uppercase border-t-2 border-black bg-paper-2 text-ink";
const BOM_TF_TOTAL =
  "px-3.5 py-3 border-t-2 border-black bg-paper-2 text-ink font-bold text-[17px]";

// Sidebar table-of-contents links
const TOC_LINK =
  "flex items-center gap-2.5 text-[12px] font-bold py-[5px] text-ink no-underline transition-colors duration-200 hover:text-pop-magenta";
const TOC_DOTS = [
  "bg-pop-blue",
  "bg-pop-violet",
  "bg-pop-magenta",
  "bg-pop-pink",
  "bg-pop-red",
  "bg-pop-orange",
];
const SPEC_ROW =
  "flex justify-between gap-3 text-xs font-medium pb-[7px] border-b border-black/10 last-of-type:border-b-0";
const SPEC_H = `${holt} text-base text-pop-violet mt-4 mb-2.5`;
const SPEC_K =
  "text-ink-2 font-semibold tracking-[0.06em] uppercase text-[10.5px]";
const SPEC_V = "text-[13px] font-semibold text-right";
const FRAME =
  "bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-[18px] pt-6 relative";
const FRAME_FIG =
  "absolute -top-[15px] left-[14px] z-10 bg-pop-blue text-white border-2 border-black rounded-full px-3.5 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase -rotate-2 shadow-[2px_2px_0px_0px_#000]";

// Chip bullets for the retro lists (matches the submit-page ticks).
const RETRO_CHIP =
  "inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-black text-white text-[10px] font-bold shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]";

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso)
    .toLocaleDateString("en-NZ", opts ?? { month: "short", year: "numeric" })
    .toUpperCase();
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const ids = await fetchAllIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await fetchProject(id);
  return {
    title: project ? `${project.title} | Maker Club` : "Project | Maker Club",
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, allProjects] = await Promise.all([
    fetchProject(id),
    fetchProjects(),
  ]);
  if (!project) notFound();

  const color = categoryColor(project.category);
  const titleColor = categoryPopText(project.category);

  // Related projects: same category first, then shared tools, then random
  const others = allProjects.filter((p) => p.id !== id);
  const sameCategory = others.filter((p) => p.category === project.category);
  const sharedTools = others.filter(
    (p) =>
      p.category !== project.category &&
      (p.tools ?? []).some((t) => (project.tools ?? []).includes(t)),
  );
  const pool = [
    ...sameCategory.slice(0, 2),
    ...sharedTools.slice(0, 3 - Math.min(2, sameCategory.length)),
  ];
  const related =
    pool.length < 3
      ? [
          ...pool,
          ...others.filter((p) => !pool.includes(p)).slice(0, 3 - pool.length),
        ]
      : pool.slice(0, 3);

  const [{ names: makerNames, anonCount: makerAnonCount }, ...relatedDisplays] =
    await Promise.all([
      fetchMakerDisplay(project),
      ...related.map((r) => fetchMakerDisplay(r)),
    ]);
  const relatedMakerDisplays = Object.fromEntries(
    related.map((r, i) => [r.id, relatedDisplays[i]]),
  );
  const totalMakers = makerNames.length + makerAnonCount;
  const makerDisplayStr = [
    ...makerNames,
    ...(makerAnonCount > 0 ? [`+${makerAnonCount} others`] : []),
  ].join(" + ");

  // Dates
  const loggedDate = project.date ? fmtDate(project.date) : "—";
  const startedDate = project.start_date
    ? fmtDate(project.start_date)
    : project.date
      ? fmtDate(project.date)
      : "—";

  // BOM totals
  const bomItems = project.bom ?? [];
  const bomTotal = bomItems.reduce(
    (s, x) => s + (x.unit_cost ?? 0) * (x.qty ?? 1),
    0,
  );

  // Which sections exist?
  const hasStory = !!project.description;
  const mediaItems = project.media ?? [];
  const hasMedia = mediaItems.length > 0;
  const hasBuildLog = (project.build_log ?? []).length > 0;
  const hasGallery = (project.gallery_images ?? []).length > 0;
  const hasBOM = bomItems.length > 0;
  const hasRetro =
    (project.retro_wins ?? []).length > 0 ||
    (project.retro_fixes ?? []).length > 0;
  const hasKudos = (project.kudos ?? []).length > 0;
  const hasRelated = related.length > 0;

  const tocEntries = [
    ...(hasStory ? [{ href: "#story", label: "Story" }] : []),
    ...(hasMedia ? [{ href: "#media", label: "Listen & watch" }] : []),
    ...(hasBuildLog ? [{ href: "#log", label: "Build log" }] : []),
    ...(hasGallery ? [{ href: "#gallery", label: "Gallery" }] : []),
    ...(hasBOM ? [{ href: "#bom", label: "Bill of materials" }] : []),
    ...(hasRetro ? [{ href: "#retro", label: "What we learned" }] : []),
    ...(hasKudos ? [{ href: "#kudos", label: "Shout-outs" }] : []),
    { href: "#comments", label: "Comments" },
    ...(hasRelated
      ? [{ href: "#related", label: "More from the archive" }]
      : []),
  ];

  return (
    <div className={pageWrap}>
      <div className="pt-20">
        {/* ── HERO ─────────────────────────────────────── */}
        <header className="border-y-4 bg-white py-10">
          <div className={container}>
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className={`${META_CHIP} bg-black text-black`}>
                {project.category ?? "—"}
              </span>
              <span className={META_CHIP}>Started {startedDate}</span>
              <span className={META_CHIP}>Logged {loggedDate}</span>
              {project.build_time && (
                <span className={META_CHIP}>
                  Build {project.build_time.toUpperCase()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-[1.05fr_1fr] gap-12 items-center max-[980px]:grid-cols-1 max-[980px]:gap-10">
              {/* Left */}
              <div>
                <h1
                  className={`${holt} text-white text-[clamp(26px,4vw,48px)] leading-[1.2] mt-0 mb-[18px] [text-wrap:balance]`}
                >
                  {project.title}
                </h1>
                {project.blurb && (
                  <p className="text-lg font-semibold max-w-[52ch] mt-0 mb-6 leading-[1.5]">
                    {project.blurb}
                  </p>
                )}

                {totalMakers > 0 && (
                  <div className="flex items-center gap-3 mb-5">
                    <span className="flex">
                      {Array.from({ length: totalMakers }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-7 h-7 rounded-full border-2 border-black inline-block${i > 0 ? " -ml-1.5" : ""}`}
                          style={{ background: color }}
                        />
                      ))}
                    </span>
                    <div className="text-[12.5px]">
                      <b className="font-bold">{makerDisplayStr}</b>
                      <small className="block text-ink-2 font-semibold text-[10px] tracking-[0.08em] uppercase mt-0.5">
                        {totalMakers} member{totalMakers !== 1 ? "s" : ""} ·{" "}
                        {loggedDate}
                      </small>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap border-2 border-black rounded-[6px] overflow-hidden shadow-[4px_4px_0px_0px_#000]">
                  <div className="px-4 py-3.5 border-r-2 border-black flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                    <b className="block font-bold text-[22px] leading-none mb-[5px]">
                      {project.likes ?? 0}
                    </b>
                    <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-ink-2">
                      loves
                    </span>
                  </div>
                  <div className="px-4 py-3.5 border-r-2 border-black flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                    <b className="block font-bold text-[22px] leading-none mb-[5px]">
                      {(project.tools ?? []).length}
                    </b>
                    <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-ink-2">
                      tools used
                    </span>
                  </div>
                  {hasBOM && (
                    <div className="px-4 py-3.5 border-r-2 border-black flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                      <b className="block font-bold text-[22px] leading-none mb-[5px]">
                        {bomItems.length}
                      </b>
                      <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-ink-2">
                        parts
                      </span>
                    </div>
                  )}
                  {hasBOM && bomTotal > 0 && (
                    <div className="px-4 py-3.5 border-r-2 border-black flex-1 min-w-[90px] last:border-r-0 max-[480px]:flex-[1_1_calc(50%-1px)] max-[480px]:min-w-0">
                      <b className="block font-bold text-[22px] leading-none mb-[5px]">
                        ${bomTotal.toFixed(0)}
                      </b>
                      <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-ink-2">
                        est. cost
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 items-center mt-6 flex-wrap">
                  <LikeButton
                    projectId={project.id}
                    initialLikes={project.likes ?? 0}
                  />
                  {hasBuildLog && (
                    <a className={btnGhost} href="#log">
                      Build log ↓
                    </a>
                  )}
                  {hasBOM && (
                    <a className={btnGhost} href="#bom">
                      BOM ↓
                    </a>
                  )}
                  <Link href="/projects" className={`${btnGhost} ml-auto`}>
                    ← All Projects
                  </Link>
                </div>
              </div>

              {/* Right: cover, polaroid style */}
              <div className="relative rotate-2 max-[980px]:rotate-0 justify-self-center w-full max-w-[440px]">
                <div className="absolute -top-3 left-10 z-20 w-20 h-6 outline-2 outline-black bg-pop-pink -rotate-6" />
                <div className="aspect-[4/5] relative bg-white outline-solid outline-3 outline-black p-4 pb-12 max-[980px]:aspect-[4/3]">
                  <div className="relative w-full h-full overflow-hidden outline-2 outline-black">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 980px) 100vw, 440px"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className={ph} style={{ backgroundImage: color }}>
                        <span className={phLabel}>{project.title}</span>
                      </div>
                    )}
                  </div>
                  <p className="absolute bottom-2.5 left-4 right-4 m-0 text-sm font-semibold text-ink-2 text-center whitespace-nowrap overflow-hidden text-ellipsis">
                    {project.title}
                  </p>
                </div>
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
                {/* Story */}
                {hasStory && (
                  <section className={SECTION} id="story">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-white`}>The Story</h3>
                      <span className={secHint}>the full write-up</span>
                    </div>
                    <div>
                      {(project.description ?? "")
                        .split("\n\n")
                        .filter(Boolean)
                        .map((para, i) => (
                          <p
                            key={i}
                            className="text-[14.5px] font-medium text-ink mt-0 mb-[18px] max-w-[62ch] leading-[1.75]"
                          >
                            {para}
                          </p>
                        ))}
                    </div>
                  </section>
                )}

                {/* Music & video */}
                {hasMedia && (
                  <section className={SECTION} id="media">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-pop-blue`}>
                        Listen &amp; Watch
                      </h3>
                      <span className={secHint}>
                        {mediaItems.length}{" "}
                        {mediaItems.length === 1 ? "track" : "tracks"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3.5">
                      {mediaItems.map((m, i) => (
                        <div
                          key={i}
                          className="border-2 border-black rounded-[6px] bg-paper-2 p-3.5"
                        >
                          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2.5">
                            <h4 className="text-[15px] font-bold m-0 flex items-center gap-2">
                              <span
                                className="text-pop-violet"
                                aria-hidden
                              >
                                {m.kind === "video" ? "▶" : "♪"}
                              </span>
                              {m.title || project.title}
                            </h4>
                            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-ink-2">
                              {m.provider ? providerLabel(m.provider) : "Audio"}
                              {m.preview_start > 0
                                ? ` · card preview from ${formatClock(m.preview_start)}`
                                : ""}
                            </span>
                          </div>
                          {m.provider ? (
                            // Linked video: the provider carries the bandwidth,
                            // and lazy loading keeps it off the initial render.
                            <div className="relative w-full aspect-video border-2 border-black rounded-[4px] overflow-hidden bg-black">
                              <iframe
                                src={embedUrl(m) ?? undefined}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                title={m.title || project.title}
                              />
                            </div>
                          ) : (
                            // preload="none" keeps the file off the wire until
                            // somebody presses play.
                            <audio
                              className="w-full"
                              controls
                              preload="none"
                              src={m.url}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Build log */}
                {hasBuildLog && (
                  <section className={SECTION} id="log">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-pop-violet`}>
                        Build Log
                      </h3>
                      <span className={secHint}>
                        {(project.build_log ?? []).length} entries
                      </span>
                    </div>
                    <div className="relative">
                      {(project.build_log ?? []).map((entry, i) => (
                        <div
                          key={i}
                          className="group grid grid-cols-[110px_32px_minmax(0,1fr)] gap-[18px] py-[18px] border-t-2 border-black/10 items-start last:border-b-2 last:border-black/10 max-[720px]:grid-cols-[80px_24px_1fr]"
                        >
                          <div className="text-sm font-semibold leading-[1.3] pt-1">
                            {entry.date}
                            {entry.week_label && (
                              <small className="block text-ink-2 text-[10px] font-bold tracking-[0.1em] uppercase mt-0.5">
                                {entry.week_label}
                              </small>
                            )}
                          </div>
                          <div className="relative pt-2 flex justify-center before:content-[''] before:absolute before:top-[14px] before:bottom-[-100%] before:left-1/2 before:w-[2px] before:bg-black/20 group-last:before:hidden">
                            <span
                              className={`relative z-[1] w-3 h-3 rounded-full block border-2 border-black ${entry.milestone ? "bg-pop-magenta shadow-[2px_2px_0px_0px_#000]" : "bg-white"}`}
                            />
                          </div>
                          <div>
                            <h4 className="text-[17px] font-bold m-0 mb-1.5">
                              {entry.title}
                            </h4>
                            <p className="m-0 text-[13.5px] font-medium text-ink-2 leading-[1.6] max-w-[56ch]">
                              {entry.body}
                            </p>
                            {entry.tag && (
                              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full border border-black/25 bg-paper-2 text-[10px] font-semibold tracking-[0.06em]">
                                {entry.tag}
                              </span>
                            )}
                            {entry.image && (
                              <div className="relative mt-3 w-full max-w-[560px] h-[320px] border-2 border-black overflow-hidden">
                                <Image
                                  src={entry.image}
                                  alt={entry.title}
                                  fill
                                  sizes="(max-width: 720px) 100vw, 560px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Gallery */}
                {hasGallery && (
                  <section className={SECTION} id="gallery">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-white`}>Gallery</h3>
                      <span className={secHint}>
                        {(project.gallery_images ?? []).length} photos
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-2">
                      {(project.gallery_images ?? []).map((src, i) => (
                        <div
                          key={i}
                          className={`relative bg-white outline-solid outline-2 outline-black p-1 overflow-visible ${i === 0 ? "col-span-2 row-span-2 aspect-square max-[720px]:row-span-1 max-[720px]:aspect-[4/3]" : "aspect-[4/3]"} ${i % 3 === 1 ? "rotate-1" : i % 3 === 2 ? "-rotate-1" : ""}`}
                        >
                          <div className="relative w-full h-full">
                            <Image
                              src={src}
                              alt={`Gallery image ${i + 1}`}
                              fill
                              sizes={
                                i === 0
                                  ? "(max-width: 720px) 100vw, 60vw"
                                  : "(max-width: 720px) 50vw, 30vw"
                              }
                              className="object-cover"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Bill of materials */}
                {hasBOM && (
                  <section className={SECTION} id="bom">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-pop-pink`}>
                        Bill of Materials
                      </h3>
                      <span className={secHint}>parts &amp; sources</span>
                    </div>
                    <div className="border-2 border-black rounded-[6px] bg-white overflow-hidden max-[720px]:overflow-x-auto">
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
                            const total =
                              (item.unit_cost ?? 0) * (item.qty ?? 1);
                            return (
                              <tr
                                key={i}
                                className="[&:last-child>td]:border-b-0"
                              >
                                <td className={BOM_TD}>
                                  <div className="font-bold text-ink">
                                    {item.item}
                                  </div>
                                  {item.desc && (
                                    <div className="text-ink-2 text-[11.5px] mt-0.5">
                                      {item.desc}
                                    </div>
                                  )}
                                </td>
                                <td className={BOM_TD_NUM}>{item.qty ?? 1}</td>
                                <td className={BOM_TD_NUM}>
                                  {item.unit_cost
                                    ? `$${item.unit_cost.toFixed(2)}`
                                    : "—"}
                                </td>
                                <td className={BOM_TD_NUM}>
                                  {total ? `$${total.toFixed(2)}` : "—"}
                                </td>
                                <td className={BOM_TD}>{item.src ?? "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td className={BOM_TF}>Total cost</td>
                            <td className={`${BOM_TF} w-20`} />
                            <td className={`${BOM_TF} w-20`} />
                            <td className={BOM_TF_TOTAL}>
                              ${bomTotal.toFixed(2)}
                            </td>
                            <td className={BOM_TF} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </section>
                )}

                {/* Retro */}
                {hasRetro && (
                  <section className={SECTION} id="retro">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-pop-red`}>
                        What We Learned
                      </h3>
                      <span className={secHint}>honest notes</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1">
                      {(project.retro_wins ?? []).length > 0 && (
                        <div className="border-2 border-black rounded-[6px] overflow-hidden bg-white">
                          <h4 className="flex items-center gap-2.5 px-3.5 py-2.5 m-0 text-[11px] font-bold tracking-[0.14em] uppercase bg-paper-2 border-b-2 border-black">
                            <span className={`${RETRO_CHIP} bg-pop-blue`}>
                              ✓
                            </span>
                            <span>What worked</span>
                          </h4>
                          <ul className="list-none m-0 p-3.5">
                            {(project.retro_wins ?? []).map((w, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 py-[9px] border-b border-black/10 last:border-b-0 text-[13.5px] font-medium text-ink leading-[1.55]"
                              >
                                <span className="w-2.5 h-2.5 mt-1.5 rounded-full border-2 border-black bg-pop-blue shrink-0" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(project.retro_fixes ?? []).length > 0 && (
                        <div className="border-2 border-black rounded-[6px] overflow-hidden bg-white">
                          <h4 className="flex items-center gap-2.5 px-3.5 py-2.5 m-0 text-[11px] font-bold tracking-[0.14em] uppercase bg-paper-2 border-b-2 border-black">
                            <span className={`${RETRO_CHIP} bg-pop-red`}>
                              ✕
                            </span>
                            <span>We&apos;d change</span>
                          </h4>
                          <ul className="list-none m-0 p-3.5">
                            {(project.retro_fixes ?? []).map((w, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 py-[9px] border-b border-black/10 last:border-b-0 text-[13.5px] font-medium text-ink leading-[1.55]"
                              >
                                <span className="w-2.5 h-2.5 mt-1.5 rounded-full border-2 border-black bg-pop-red shrink-0" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Kudos */}
                {hasKudos && (
                  <section className={SECTION} id="kudos">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-pop-orange`}>
                        Shout Outs
                      </h3>
                      <span className={secHint}>from the club</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
                      {(project.kudos ?? []).map((k, i) => (
                        <div
                          key={i}
                          className="border-2 border-black rounded-[6px] p-4 bg-paper-2 flex flex-col gap-2.5"
                        >
                          <p className="m-0 text-[13.5px] font-medium text-ink leading-[1.6] before:content-['“'] before:font-bold before:text-pop-orange before:mr-0.5 after:content-['”'] after:font-bold after:text-pop-orange after:ml-0.5">
                            {k.text}
                          </p>
                          <div className="flex items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-ink-2 pt-2 border-t-2 border-black/10">
                            <span className="w-[22px] h-[22px] rounded-full bg-ink border-2 border-black inline-block shrink-0" />
                            <span>
                              <b className="text-ink font-bold tracking-[0.04em]">
                                {k.who}
                              </b>
                              {k.role ? ` · ${k.role}` : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <CommentsSection
                  projectId={project.id}
                  projectTitle={project.title}
                  projectOwnerId={project.submitted_by ?? null}
                />

                {/* Related */}
                {hasRelated && (
                  <section className={SECTION} id="related">
                    <div className={`${secHeadRow} mb-5`}>
                      <h3 className={`${secHead} text-white`}>
                        More From the Archive
                      </h3>
                      <span className={secHint}>three picks</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 max-[980px]:grid-cols-2 max-[720px]:grid-cols-1">
                      {related.map((r) => (
                        <Link
                          key={r.id}
                          href={`/projects/${r.id}`}
                          className="group border-2 border-black bg-white flex flex-col no-underline text-inherit [transition:transform_0.2s_ease,box-shadow_0.2s] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                        >
                          <div
                            className="aspect-[4/3] relative overflow-hidden bg-cover bg-center border-b-2 border-black"
                            style={
                              r.image
                                ? undefined
                                : { backgroundImage: categoryColor(r.category) }
                            }
                          >
                            {r.image ? (
                              <Image
                                src={r.image}
                                alt={r.title}
                                fill
                                sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 25vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className={ph}>
                                <span className={phLabel}>{r.title}</span>
                              </div>
                            )}
                          </div>
                          <h5 className="text-[15px] font-bold mx-[14px] mt-3 mb-1">
                            {r.title}
                          </h5>
                          <p className="mx-[14px] mt-0 mb-[14px] text-ink-2 text-[10.5px] font-semibold tracking-[0.06em] uppercase">
                            {r.category} ·{" "}
                            {[
                              ...(relatedMakerDisplays[r.id]?.names ??
                                r.makers ??
                                []),
                              ...((relatedMakerDisplays[r.id]?.anonCount ?? 0) >
                              0
                                ? [
                                    `+${relatedMakerDisplays[r.id].anonCount} others`,
                                  ]
                                : []),
                            ].join(" + ")}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* ── SIDEBAR ─────────────────────────── */}
              <aside>
                <div className="sticky top-20 flex flex-col gap-6 max-[980px]:static">
                  {/* TOC */}
                  <div className={FRAME}>
                    <span className={FRAME_FIG}>On this page</span>
                    {tocEntries.map((entry, i) => (
                      <a
                        key={entry.href}
                        href={entry.href}
                        className={TOC_LINK}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full border-2 border-black shrink-0 ${TOC_DOTS[i % TOC_DOTS.length]}`}
                        />
                        {entry.label}
                      </a>
                    ))}
                  </div>

                  {/* Spec */}
                  <div className={FRAME}>
                    <span className={`${FRAME_FIG} bg-pop-violet`}>
                      At a glance
                    </span>
                    {project.category && (
                      <div className={`${SPEC_ROW} mt-2`}>
                        <span className={SPEC_K}>Category</span>
                        <span className={SPEC_V}>{project.category}</span>
                      </div>
                    )}
                    {project.start_date && (
                      <div className={SPEC_ROW}>
                        <span className={SPEC_K}>Started</span>
                        <span className={SPEC_V}>
                          {fmtDate(project.start_date)}
                        </span>
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
                        <span className={SPEC_V}>
                          {makerDisplayStr.replace(/ \+ /g, ", ")}
                        </span>
                      </div>
                    )}
                    <div className={SPEC_ROW}>
                      <span className={SPEC_K}>Loves</span>
                      <span className={SPEC_V}>♥ {project.likes ?? 0}</span>
                    </div>

                    {(project.tools ?? []).length > 0 && (
                      <>
                        <p className={SPEC_H}>Made with</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(project.tools ?? []).map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-0.5 rounded-full border border-black/25 bg-paper-2 text-[11px] font-semibold text-ink-2"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {project.github && (
                      <>
                        {project.github && (
                          <a
                            href={project.github}
                            className="flex justify-between py-[9px] border-b border-black/10 last:border-b-0 text-xs font-bold text-pop-blue no-underline tracking-[0.04em] transition-colors duration-200 hover:text-pop-violet"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>Link ↗</span>
                            <small className="text-ink-2 text-[10px] font-semibold tracking-[0.08em] uppercase">
                              source
                            </small>
                          </a>
                        )}
                      </>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <Link
                    href="/submit"
                    className={`${btnGradient} justify-center`}
                  >
                    Submit yours <span className={btnArr}>→</span>
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
