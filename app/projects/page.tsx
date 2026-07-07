import { Suspense } from 'react'
import Nav from '../components/Nav'
import ProjectsSection from '../components/ProjectsSection'
import Footer from '../components/Footer'
import CTACarousel from '../components/CTACarousel'
import Link from 'next/link'
import { fetchProjects, fetchMakerDisplay } from '@/lib/projects'
import { container, btnDark } from '@/lib/ui'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await fetchProjects()

  const makerDisplays = Object.fromEntries(
    await Promise.all(projects.map(async p => [p.id, await fetchMakerDisplay(p)]))
  )

  const allTools = (() => {
    const s = new Set<string>()
    projects.forEach(p => (p.tools ?? []).forEach(t => s.add(t)))
    return ['All tools', ...[...s].sort()]
  })()

  const allCategories = [
    'All',
    ...[...new Set(projects.map(p => p.category).filter(Boolean) as string[])].sort(),
  ]

  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <ProjectsSection projects={projects} allTools={allTools} allCategories={allCategories} makerDisplays={makerDisplays} />
      </Suspense>
      <div className="py-20 bg-paper-2 text-ink">
        <div className={`${container} flex items-center gap-16 max-[900px]:flex-col max-[900px]:gap-10`}>
          <div className="flex-[0_0_380px] max-[900px]:flex-none">
            <h4 className="text-[clamp(24px,3vw,36px)] mt-0 mb-3.5 font-bold leading-[1.15] text-ink">Got a thing you <em className="not-italic">made</em>?</h4>
            <p className="opacity-65 max-w-[44ch] text-[15px] leading-[1.6] text-ink mt-0 mb-7">Submissions are open all the time. Half-finished, broken, or weird is welcome — that&rsquo;s usually where the good stuff is.</p>
            <Link href="/submit" className={btnDark}>Submit a project</Link>
          </div>
          <CTACarousel
            images={projects.filter(p => p.image).slice(0, 8).map(p => ({
              id: p.id,
              src: p.image!,
              alt: p.title,
            }))}
          />
        </div>
      </div>
      <Footer />
    </>
  )
}
