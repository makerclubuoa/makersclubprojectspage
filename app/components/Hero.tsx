'use client'

import { useEffect, useRef } from 'react'
import type { Project } from '@/lib/projects'
import ProjectCard from './ProjectCard'

const MAX_CARDS = 7
const SCROLL_H  = '140vh'
const SPEED     = 14 // degrees per second idle rotation

function arcParams() {
  const w = window.innerWidth
  if (w < 640)  return { arcR: 200, arcSpan: 90  }
  if (w < 1024) return { arcR: 450, arcSpan: 130 }
  return              { arcR: 700, arcSpan: 160 }
}

function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }

export default function Hero({
  projectCount,
  projects = [],
}: {
  projectCount: number
  projects?: Project[]
}) {
  const sectionRef  = useRef<HTMLElement>(null)
  const slotRefs    = useRef<(HTMLDivElement | null)[]>([])
  const cardPs      = projects.slice(0, MAX_CARDS)
  const n           = Math.max(1, cardPs.length)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let offset       = 0
    let lastTime     = 0
    let rafId: number
    // Angles frozen at the moment the user starts scrolling — null when idle
    let frozenAngles: number[] | null = null

    function scrollProgress() {
      const { top, height } = section!.getBoundingClientRect()
      const room = height - window.innerHeight
      if (room <= 0) return 0
      return Math.max(0, Math.min(1, -top / room))
    }

    function idleAngle(i: number, arcSpan: number, spacing: number, halfWrap: number, wrapRange: number) {
      const raw = -arcSpan / 2 + spacing * i - offset
      return ((raw + halfWrap) % wrapRange + wrapRange) % wrapRange - halfWrap
    }

    function animate(time: number) {
      const dt = lastTime ? (time - lastTime) / 1000 : 0
      lastTime = time

      const p = scrollProgress()
      const { arcR, arcSpan } = arcParams()
      const spacing   = n > 1 ? arcSpan / (n - 1) : arcSpan
      // Wrap zone is 1.5 card-spacings beyond the visible arc on each side so
      // the jump always happens well off-screen.
      const halfWrap  = arcSpan / 2 + spacing * 1.5
      const wrapRange = halfWrap * 2

      if (p === 0) {
        // Idle: rotate continuously and clear any frozen state
        offset += SPEED * dt
        frozenAngles = null
      } else if (!frozenAngles) {
        // First scroll frame: snapshot current idle positions
        frozenAngles = Array.from({ length: n }, (_, i) =>
          idleAngle(i, arcSpan, spacing, halfWrap, wrapRange)
        )
      }

      slotRefs.current.forEach((el, i) => {
        if (!el) return

        if (!frozenAngles) {
          // ── Idle rotation ──────────────────────────────────────────────
          const angle = idleAngle(i, arcSpan, spacing, halfWrap, wrapRange)
          // Fade to fully transparent near the wrap edges
          const visibleHalf = arcSpan / 2
          const fade = Math.max(0, 1 - Math.abs(angle) / visibleHalf)
          el.style.transform = `rotateY(${angle}deg) translateZ(-${arcR}px)`
          el.style.opacity   = String(0.55 * fade)
        } else {
          // ── Scroll peel-off from frozen positions ──────────────────────
          const base   = frozenAngles[i]
          const stagger = (i / n) * 0.32
          const cardP  = easeInOut(Math.max(0, Math.min(1, (p - stagger) / (1 - stagger + 0.001))))
          const angle  = base  * (1 - cardP)
          const curZ   = -arcR * (1 - cardP)
          const curY   = cardP * 115
          const visibleHalf = arcSpan / 2
          const fade   = Math.max(0, 1 - Math.abs(base) / visibleHalf)
          const opacity = Math.max(0, 0.55 * fade - cardP * 0.25)
          el.style.transform = `rotateY(${angle}deg) translateZ(${curZ}px) translateY(${curY}vh)`
          el.style.opacity   = String(opacity)
        }
      })

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [n])

  return (
    <section ref={sectionRef} style={{ height: SCROLL_H }} className="hero-section">
      <div className="hero-sticky">
        {/* ── background grid texture (reuses the existing body::before approach) ── */}

        <div className="container hero-sticky__inner">

          {/* ── hero text ── */}
          <div className="hero__lead">
            <div className="hero__eyebrow">
              <span className="pip" />
              <span>Student-run · University of Auckland · est. 2020</span>
            </div>
            <h1 className="hero__title">
              Everything
              <br />
              we&rsquo;ve ever
              <br />
              <em>made.</em>
            </h1>
            <p className="hero__sub">
              Maker Club is a student-run club at the University of Auckland. This is everything
              we&rsquo;ve built, baked, soldered, woven, printed, coded, sanded and sewn together.
              Borrow ideas. Make your own.
            </p>
            <div className="hero__cta-row">
              <a className="btn btn--primary" href="#projects">
                See the projects <span className="arr">→</span>
              </a>
              <a className="btn btn--ghost" href="/submit">
                Submit a project
              </a>
            </div>
          </div>

          {/* ── stats ── */}
          <div className="hero__spec">
            <div className="spec-cell">
              <div className="k"><span>Members</span><span>01</span></div>
              <div className="v">1,278<small>total</small></div>
            </div>
            <div className="spec-cell">
              <div className="k"><span>New in 2026</span><span>02</span></div>
              <div className="v">300</div>
            </div>
            <div className="spec-cell">
              <div className="k"><span>Projects logged</span><span>03</span></div>
              <div className="v">{projectCount}</div>
            </div>
            <div className="spec-cell">
              <div className="k"><span>Open hours</span><span>04</span></div>
              <div className="v">FRI<small>2 — 4 pm</small></div>
            </div>
          </div>
        </div>

        {/* ── 3-D carousel ── */}
        <div className="hero-carousel-scene">
          <div className="hero-carousel-track">
            {cardPs.map((p, i) => (
              <div
                key={p.id}
                ref={el => { slotRefs.current[i] = el }}
                className="hero-card-slot"
                style={{ opacity: 0.55 }}
              >
                <ProjectCard project={p} />
              </div>
            ))}
          </div>
        </div>

        {/* side fades so card wraps are invisible */}
        <div className="hero-side-fade" />
        {/* bottom fade so the carousel blends into the page below */}
        <div className="hero-bottom-fade" />
      </div>
    </section>
  )
}
