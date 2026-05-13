'use client'

import { useEffect, useRef } from 'react'

const VB_W = 1600
const VB_H = 900
const NUM_LINES = 44
const LOOP_W = VB_W

const STOPS: [number, number, number][] = [
  [86, 125, 255],
  [159, 66, 209],
  [240, 74, 185],
  [255, 37, 199],
  [255, 60, 109],
  [255, 133, 106],
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
function gradAt(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t))
  const seg = t * (STOPS.length - 1)
  const i = Math.floor(seg)
  const f = seg - i
  const a = STOPS[i]
  const b = STOPS[Math.min(i + 1, STOPS.length - 1)]
  return [lerp(a[0], b[0], f) | 0, lerp(a[1], b[1], f) | 0, lerp(a[2], b[2], f) | 0]
}

function makeWavePath(amp: number, freq: number, phase: number, y: number): string {
  const totalW = LOOP_W * 2
  const step = 16
  let d = `M -50 ${y.toFixed(1)}`
  for (let x = -50; x <= totalW + 50; x += step) {
    const yy =
      y +
      Math.sin((x / VB_W) * Math.PI * 2 * freq + phase) * amp +
      Math.sin((x / VB_W) * Math.PI * 2 * freq * 2.4 + phase * 1.6) * (amp * 0.28)
    d += ` L ${x} ${yy.toFixed(1)}`
  }
  return d
}

export default function WaveSection() {
  const groupRef = useRef<SVGGElement>(null)
  const readoutRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    interface LineData {
      y: number
      ampBase: number
      freq: number
      phase: number
      colorT: number
      speed: number
      alpha: number
      el: SVGGElement
      path: SVGPathElement
    }

    const lineData: LineData[] = []

    for (let i = 0; i < NUM_LINES; i++) {
      const t = i / (NUM_LINES - 1)
      const y = VB_H * 0.5 + (t - 0.5) * VB_H * 0.36
      const edgeFall = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2.2)
      const line = {
        y,
        ampBase: 70 * Math.max(0.15, edgeFall),
        freq: 1.4 + (i % 5) * 0.08 + t * 0.4,
        phase: t * Math.PI * 2 * 0.9 + Math.random() * 0.3,
        colorT: t,
        speed: 1 + t * 0.6,
        alpha: 0.32 + (1 - Math.abs(t - 0.5) * 2) * 0.55,
      }

      const [r, g, b] = gradAt(line.colorT)
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke', `rgba(${r},${g},${b},${line.alpha.toFixed(3)})`)
      path.setAttribute('fill', 'none')
      path.setAttribute(
        'stroke-width',
        (0.9 + (1 - Math.abs(line.colorT - 0.5) * 2) * 0.7).toFixed(2),
      )
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('d', makeWavePath(line.ampBase, line.freq, line.phase, line.y))

      const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      wrap.appendChild(path)
      group.appendChild(wrap)

      lineData.push({ ...line, el: wrap, path })
    }

    const waveT0 = performance.now()
    let scrollEnergy = 0

    function updateScrollEnergy() {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const total = section.offsetHeight + vh * 0.5
      const seen = -rect.top + vh * 0.25
      scrollEnergy = Math.max(0, Math.min(1, seen / total))
    }

    let rafId: number

    function tick(now: number) {
      updateScrollEnergy()
      const dt = (now - waveT0) / 1000
      const speedScale = 1 + scrollEnergy * 1.8
      const ampScale = 0.7 + scrollEnergy * 1.6

      lineData.forEach((L, i) => {
        const drift = ((dt * 70 * L.speed * speedScale) % LOOP_W)
        L.el.setAttribute('transform', `translate(${-drift.toFixed(2)},0)`)
        if (i % 2 === Math.floor(dt * 30) % 2) {
          const amp = L.ampBase * ampScale
          const phase = L.phase + dt * 0.6 * (1 + L.colorT * 0.4)
          L.path.setAttribute('d', makeWavePath(amp, L.freq, phase, L.y))
        }
      })

      const readout = readoutRef.current
      if (readout) {
        readout.textContent = `amp ${(0.42 * ampScale).toFixed(2)} · phase ${(dt * 0.6 % 6.28).toFixed(3)} · ƒ 0.18Hz`
      }

      const caption = captionRef.current
      if (caption) {
        const k = 1 - Math.abs(scrollEnergy - 0.5) * 2
        caption.style.opacity = String(Math.max(0.2, Math.min(1, 0.35 + k)))
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      group.innerHTML = ''
    }
  }, [])

  return (
    <section className="wave" id="wave" ref={sectionRef}>
      <div className="wave__inner">
        <svg
          className="wave__svg"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <g ref={groupRef} />
        </svg>

        <div className="wave__label">
          <span className="bar" />
          [02] / TRANSITION · WAVE_FIELD
        </div>
        <div className="wave__readout" ref={readoutRef}>
          amp 0.42 · phase 0.000 · ƒ 0.18Hz
        </div>

        <div className="wave__caption" ref={captionRef}>
          <h2>
            Made with <em className="gradient-text">care.</em>
          </h2>
          <p>Scroll on — twelve projects from our members, sorted however you like.</p>
        </div>
      </div>
    </section>
  )
}
