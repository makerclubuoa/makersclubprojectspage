'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID_COLS = 18
const GRID_ROWS = 22
const GRID_WIDTH = 20
const GRID_DEPTH = 34

// Club gradient stops: #567dff → #9f42d1 → #f04ab9 → #ff25c7 → #ff3c6d → #ff856a
const GRAD_STOPS: [number, number, number][] = [
  [86, 125, 255],
  [159, 66, 209],
  [240, 74, 185],
  [255, 37, 199],
  [255, 60, 109],
  [255, 133, 106],
]

function gradAt(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t))
  const seg = t * (GRAD_STOPS.length - 1)
  const i = Math.floor(seg)
  const f = seg - i
  const a = GRAD_STOPS[i]
  const b = GRAD_STOPS[Math.min(i + 1, GRAD_STOPS.length - 1)]
  return [
    (a[0] + (b[0] - a[0]) * f) / 255,
    (a[1] + (b[1] - a[1]) * f) / 255,
    (a[2] + (b[2] - a[2]) * f) / 255,
  ]
}

// One segment per gradient stop-pair so every colour in the club palette shows clearly
const H_SEGS = GRAD_STOPS.length - 1  // 5 segments: blue→violet→pink→magenta→red→orange

function buildGridGroup() {
  const positions: number[] = []
  const colors: number[] = []

  // Horizontal lines: broken into H_SEGS segments so each stop colour is a vertex
  for (let row = 0; row <= GRID_ROWS; row++) {
    const z = -(row / GRID_ROWS) * GRID_DEPTH
    for (let s = 0; s < H_SEGS; s++) {
      const t0 = s / H_SEGS
      const t1 = (s + 1) / H_SEGS
      const x0 = (t0 - 0.5) * GRID_WIDTH
      const x1 = (t1 - 0.5) * GRID_WIDTH
      positions.push(x0, 0, z,  x1, 0, z)
      const [r0, g0, b0] = gradAt(t0)
      const [r1, g1, b1] = gradAt(t1)
      colors.push(r0, g0, b0,  r1, g1, b1)
    }
  }

  // Vertical lines: solid colour sampled at each column's x position
  for (let col = 0; col <= GRID_COLS; col++) {
    const t = col / GRID_COLS
    const x = (t - 0.5) * GRID_WIDTH
    const [cr, cg, cb] = gradAt(t)
    positions.push(x, 0, 0,  x, 0, -GRID_DEPTH)
    colors.push(cr, cg, cb,  cr, cg, cb)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 })
  const mesh = new THREE.LineSegments(geo, mat)
  const group = new THREE.Group()
  group.add(mesh)

  return { group, mat }
}

export default function Hero({ projectCount }: { projectCount: number }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    function isDark() { return document.body.dataset.mode === 'dark' }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(62, mount.clientWidth / mount.clientHeight, 0.1, 55)
    camera.position.set(0, 1.8, 1.2)
    camera.lookAt(0, 0.3, -12)

    const { group: g1, mat: gMat1 } = buildGridGroup()
    const { group: g2, mat: gMat2 } = buildGridGroup()
    scene.add(g1)
    scene.add(g2)

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starCount = 900
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 80
      starPos[i * 3 + 1] = Math.random() * 16 + 3
      starPos[i * 3 + 2] = -Math.random() * 50 - 2
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 1 })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // Sun
    const sunGroup = new THREE.Group()
    sunGroup.position.set(0, 2.0, -24)
    ;[
      { r: 2.8, c: 0xff2d78, op: 0.06 },
      { r: 2.2, c: 0xff2d78, op: 0.11 },
      { r: 1.6, c: 0xff5577, op: 0.22 },
      { r: 1.2, c: 0xff8899, op: 0.42 },
      { r: 0.88, c: 0xffbbcc, op: 1.0 },
    ].forEach(({ r, c, op }) => {
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, side: THREE.DoubleSide })
      sunGroup.add(new THREE.Mesh(new THREE.CircleGeometry(r, 64), m))
    })
    for (let i = -9; i <= 9; i++) {
      const y = i * 0.085
      if (Math.abs(y) >= 0.86) continue
      const lm = new THREE.MeshBasicMaterial({ color: 0x040006, transparent: true, opacity: 0.9 })
      const lmesh = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.024), lm)
      lmesh.position.set(0, y, 0.01)
      sunGroup.add(lmesh)
    }
    scene.add(sunGroup)

    // Horizon glow
    const hGeo = new THREE.PlaneGeometry(50, 3.5)
    const hMat = new THREE.MeshBasicMaterial({ color: 0xcc00ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
    const horizonMesh = new THREE.Mesh(hGeo, hMat)
    horizonMesh.position.set(0, 1.0, -23)
    scene.add(horizonMesh)

    function applyMode(dark: boolean) {
      // Grid opacity — colours are baked as vertex colours, only opacity varies per mode
      gMat1.opacity = dark ? 0.58 : 0.42
      gMat2.opacity = dark ? 0.58 : 0.42

      hMat.opacity = dark ? 0.06 : 0.05
      stars.visible = dark

      // Sun: always visible, scan-line colour swaps to match background
      sunGroup.visible = true
      sunGroup.children.forEach((child, i) => {
        const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
        if (i < 5) {
          const cols = dark
            ? [0xff2d78, 0xff2d78, 0xff5577, 0xff8899, 0xffbbcc]
            : [0xf04ab9, 0xf04ab9, 0xf566c2, 0xf888cc, 0xffc0dd]
          const ops = dark
            ? [0.06, 0.11, 0.22, 0.42, 1.0]
            : [0.04, 0.08, 0.16, 0.32, 0.72]
          m.color.setHex(cols[i])
          m.opacity = ops[i]
        } else {
          m.color.setHex(dark ? 0x1d1d1d : 0xece8df)
          m.opacity = 0.88
        }
      })

      scene.fog = dark
        ? new THREE.Fog(0x1d1d1d, 18, 44)
        : new THREE.Fog(0xece8df, 20, 42)
    }

    applyMode(isDark())

    const obs = new MutationObserver(() => applyMode(isDark()))
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-mode'] })

    function onResize() {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    function getScrollProgress() {
      const hero = heroRef.current
      if (!hero) return 0
      const rect = hero.getBoundingClientRect()
      const scrollable = hero.offsetHeight - window.innerHeight
      if (scrollable <= 0) return 0
      return Math.max(0, Math.min(1, -rect.top / scrollable))
    }

    let t = 0
    let rafId: number
    function tick() {
      t += 0.016
      const scroll = getScrollProgress()
      const speed = 1.3 * (1 + scroll * 0.6)
      const shift = (t * speed) % GRID_DEPTH
      g1.position.z = shift
      g2.position.z = shift - GRID_DEPTH

      const pulse = 1 + Math.sin(t * 1.1) * 0.01
      sunGroup.scale.set(pulse, pulse, 1)

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      obs.disconnect()
      window.removeEventListener('resize', onResize)
      // Explicitly lose the context so the GPU slot is freed immediately,
      // preventing "context loss blocked" on rapid remounts (StrictMode / HMR).
      renderer.getContext().getExtension('WEBGL_lose_context')?.loseContext()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <header className="hero hero--synth" ref={heroRef}>
      <div ref={mountRef} className="hero__canvas" />
      <div className="hero__canvas-fade" />
      <span className="cross cross--tl" />
      <span className="cross cross--tr" />
      <span className="cross cross--bl" />
      <span className="cross cross--br" />
      <div className="container">
        <div className="seclabel" style={{ marginBottom: 48 }}>
          <span className="num">[01]</span>
          <span>Archive_</span>
          <span className="bar" />
          <span>STATUS: ONLINE · UPDATED MAY 2026</span>
        </div>

        <div className="hero__grid">
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

          <div className="hero__spec">
            <div className="spec-cell">
              <div className="k">
                <span>Members</span>
                <span>01</span>
              </div>
              <div className="v">
                1,278<small>total</small>
              </div>
            </div>
            <div className="spec-cell">
              <div className="k">
                <span>New in 2026</span>
                <span>02</span>
              </div>
              <div className="v">300</div>
            </div>
            <div className="spec-cell">
              <div className="k">
                <span>Projects logged</span>
                <span>03</span>
              </div>
              <div className="v">{projectCount}</div>
            </div>
            <div className="spec-cell">
              <div className="k">
                <span>Open hours</span>
                <span>04</span>
              </div>
              <div className="v">
                FRI<small>2 — 4 pm</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
