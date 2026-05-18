import Nav from './components/Nav'
import Hero from './components/Hero'
import ProjectsSection from './components/ProjectsSection'
import SuggestSection from './components/SuggestSection'
import Footer from './components/Footer'
import CursorTrail from './components/CursorTrail'
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
      <Hero projectCount={projects.length} />
      <ProjectsSection projects={projects} allTools={allTools} />
      <SuggestSection />
      <Footer />
    </>
  )
}
