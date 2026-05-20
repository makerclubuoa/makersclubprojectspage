'use client'

import { useEffect, useRef } from 'react'

type V3 = [number, number, number]
type Edge = [number, number]

function rx(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c]
}
function ry(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c]
}
function rz(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0]*c - v[1]*s, v[0]*s + v[1]*c, v[2]]
}
function proj(v: V3, fov: number, cx: number, cy: number, sc: number): [number, number, number] {
  const f = fov / (fov + v[2])
  return [cx + v[0]*f*sc, cy + v[1]*f*sc, v[2]]
}

function makeIcosahedron() {
  const φ = (1 + Math.sqrt(5)) / 2
  const raw: V3[] = [
    [0,1,φ],[0,-1,φ],[0,1,-φ],[0,-1,-φ],
    [1,φ,0],[-1,φ,0],[1,-φ,0],[-1,-φ,0],
    [φ,0,1],[-φ,0,1],[φ,0,-1],[-φ,0,-1],
  ]
  const n = Math.sqrt(1 + φ*φ)
  const v = raw.map(p => [p[0]/n, p[1]/n, p[2]/n] as V3)
  const el = 2/n, eps = 0.02
  const e: Edge[] = []
  for (let i = 0; i < v.length; i++)
    for (let j = i+1; j < v.length; j++) {
      const d = Math.hypot(v[i][0]-v[j][0], v[i][1]-v[j][1], v[i][2]-v[j][2])
      if (Math.abs(d - el) < eps) e.push([i, j])
    }
  return { v, e }
}

function makeTorus(R = 0.65, r = 0.22, rings = 14, segs = 8) {
  const v: V3[] = [], e: Edge[] = []
  for (let i = 0; i < rings; i++) {
    const θ = (i/rings) * Math.PI*2
    for (let j = 0; j < segs; j++) {
      const φ = (j/segs) * Math.PI*2
      v.push([(R + r*Math.cos(φ))*Math.cos(θ), r*Math.sin(φ), (R + r*Math.cos(φ))*Math.sin(θ)])
      e.push([i*segs+j, i*segs+(j+1)%segs])
      e.push([i*segs+j, ((i+1)%rings)*segs+j])
    }
  }
  return { v, e }
}

function makeOctahedron() {
  return {
    v: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]] as V3[],
    e: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]] as Edge[]
  }
}

function makeDiamond() {
  return {
    v: [[0,1.3,0],[0,-0.7,0],[0.6,0.2,0],[-0.6,0.2,0],[0,0.2,0.6],[0,0.2,-0.6]] as V3[],
    e: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]] as Edge[]
  }
}

interface Shape {
  v: V3[]; e: Edge[]; color: string
  px: number; py: number; sc: number
  ax: number; ay: number; az: number
  vx: number; vy: number; vz: number
  fp: number; fa: number; fov: number
}

export default function Hero({ projectCount }: { projectCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const ico = makeIcosahedron()
    const tor = makeTorus()
    const oct = makeOctahedron()
    const dia = makeDiamond()

    const shapes: Shape[] = [
      { ...ico, color:'#4d6fff', px:0.54, py:0.52, sc:105, ax:0.3,  ay:0.5,  az:0.1, vx:0.003, vy:0.007, vz:0.002, fp:0,   fa:9,  fov:4 },
      { ...tor, color:'#bb44cc', px:0.70, py:0.38, sc:85,  ax:0.8,  ay:1.2,  az:0.4, vx:0.005, vy:0.004, vz:0.006, fp:1.5, fa:11, fov:4 },
      { ...oct, color:'#bb7722', px:0.80, py:0.50, sc:75,  ax:0.2,  ay:0.7,  az:0.3, vx:0.004, vy:0.006, vz:0.003, fp:3.0, fa:8,  fov:4 },
      { ...dia, color:'#8844bb', px:0.76, py:0.66, sc:65,  ax:0.5,  ay:0.9,  az:0.1, vx:0.006, vy:0.003, vz:0.005, fp:2.0, fa:7,  fov:4 },
    ]

    let w = 0, h = 0

    function resize() {
      w = canvas!.offsetWidth
      h = canvas!.offsetHeight
      canvas!.width = w * devicePixelRatio
      canvas!.height = h * devicePixelRatio
      ctx.resetTransform()
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function drawGrid(dark: boolean) {
      const vpX = w * 0.5
      const horizon = h * 0.38
      const gc = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
      ctx.strokeStyle = gc
      ctx.lineWidth = 0.8
      const span = w * 1.4
      const cols = 24
      for (let i = 0; i <= cols; i++) {
        const bx = vpX - span/2 + (span/cols)*i
        ctx.beginPath()
        ctx.moveTo(vpX, horizon)
        ctx.lineTo(bx, h + 10)
        ctx.stroke()
      }
      const rows = 16
      for (let i = 1; i <= rows; i++) {
        const y = horizon + (h - horizon) * Math.pow(i/rows, 0.45)
        const s = (y - horizon) / (h - horizon) * span / 2
        ctx.beginPath()
        ctx.moveTo(vpX - s, y)
        ctx.lineTo(vpX + s, y)
        ctx.stroke()
      }
    }

    function drawShape(s: Shape, t: number) {
      const fy = Math.sin(t * 0.0008 + s.fp) * s.fa
      const cx = s.px * w
      const cy = s.py * h + fy
      s.ax += s.vx; s.ay += s.vy; s.az += s.vz
      const pts = s.v.map(p => {
        let q = rx(p, s.ax); q = ry(q, s.ay); q = rz(q, s.az)
        return proj(q, s.fov, cx, cy, s.sc)
      })
      ctx.strokeStyle = s.color
      ctx.lineWidth = 1
      s.e.forEach(([a, b]) => {
        const az = (pts[a][2] + pts[b][2]) / 2
        ctx.globalAlpha = Math.max(0.15, Math.min(0.9, 0.5 + az * 0.5))
        ctx.beginPath()
        ctx.moveTo(pts[a][0], pts[a][1])
        ctx.lineTo(pts[b][0], pts[b][1])
        ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    let raf: number
    function frame(t: number) {
      ctx.clearRect(0, 0, w, h)
      const dark = document.documentElement.dataset.mode === 'dark' ||
        (!document.documentElement.dataset.mode &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      drawGrid(dark)
      shapes.forEach(s => drawShape(s, t))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <section className="hero-section">
      <div className="hero-sticky">
        <canvas ref={canvasRef} className="hero-canvas" />

        <div className="container hero-sticky__inner">
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

        <div className="hero-side-fade" />
        <div className="hero-bottom-fade" />
      </div>
    </section>
  )
}
