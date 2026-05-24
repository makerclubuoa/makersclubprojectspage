import Nav from './components/Nav'
import Hero from './components/Hero'
import ProjectsSection from './components/ProjectsSection'
import SuggestSection from './components/SuggestSection'
import Footer from './components/Footer'
import CursorTrail from './components/CursorTrail'
import Link from 'next/link'
import { fetchProjects } from '@/lib/projects'

export default async function ProjectsPage() {
  const projects = await fetchProjects()

  const allTools = (() => {
    const s = new Set<string>()
    projects.forEach(p => (p.tools ?? []).forEach(t => s.add(t)))
    return ['All tools', ...[...s].sort()]
  })()

  return (
    <>
      <CursorTrail />
      <Nav />
      <Hero projectCount={projects.length} projects={projects} />
      <ProjectsSection projects={projects} allTools={allTools} />
      <div className="footer__cta">
        <div className="container footer__cta-inner">
          <div className="footer__cta-text">
            <h4>Got a thing you <em style={{ fontStyle: 'normal' }}>made</em>?</h4>
            <p>Submissions are open all the time. Half-finished, broken, or weird is welcome — that&rsquo;s usually where the good stuff is.</p>
            <Link href="/submit" className="btn btn--dark">Submit a project</Link>
          </div>
          <div className="footer__cta-grid">
            {projects.filter(p => p.image).slice(0, 4).map(p => (
              <img key={p.id} src={p.image!} alt={p.title} className="footer__cta-img" />
            ))}
          </div>
        </div>
      </div>
      <SuggestSection />
      <Footer />
    </>
  )
}
