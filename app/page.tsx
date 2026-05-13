import Nav from './components/Nav'
import Hero from './components/Hero'
import WaveSection from './components/WaveSection'
import ProjectsSection from './components/ProjectsSection'
import SuggestSection from './components/SuggestSection'
import Footer from './components/Footer'
import CursorTrail from './components/CursorTrail'

export default function ProjectsPage() {
  return (
    <>
      <CursorTrail />
      <Nav />
      <Hero />
      <WaveSection />
      <ProjectsSection />
      <SuggestSection />
      <Footer />
    </>
  )
}
