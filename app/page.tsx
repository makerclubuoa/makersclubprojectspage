import { Suspense } from 'react'
import Nav from './components/Nav'
import ProjectsSection from './components/ProjectsSection'
import Footer from './components/Footer'
import CTACarousel from './components/CTACarousel'
import Link from 'next/link'
import { fetchProjects, fetchMakerDisplay } from '@/lib/projects'

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
      <div className="footer__cta">
        <div className="container footer__cta-inner">
          <div className="footer__cta-text">
            <h4>Got a thing you <em style={{ fontStyle: 'normal' }}>made</em>?</h4>
            <p>Submissions are open all the time. Half-finished, broken, or weird is welcome — that&rsquo;s usually where the good stuff is.</p>
            <Link href="/submit" className="btn btn--dark">Submit a project</Link>
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
