'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID_COLS = 24
const GRID_ROWS = 32
const GRID_WIDTH = 20
const GRID_DEPTH = 40

export default function WaveSection() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050008)
    scene.fog = new THREE.Fog(0x050008, 18, 42)

    // Camera
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 1.6, 0)
    camera.lookAt(0, 0.5, -10)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    // --- Stars ---
    const starGeo = new THREE.BufferGeometry()
    const starCount = 1200
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 80
      starPos[i * 3 + 1] = Math.random() * 20 + 2
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 80
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true })
    scene.add(new THREE.Points(starGeo, starMat))

    // --- Sun (layered circles for glow) ---
    const sunGroup = new THREE.Group()
    sunGroup.position.set(0, 2.2, -22)
    const sunLayers = [
      { r: 2.8, color: 0xff2d78, opacity: 0.08 },
      { r: 2.2, color: 0xff2d78, opacity: 0.12 },
      { r: 1.6, color: 0xff5577, opacity: 0.25 },
      { r: 1.2, color: 0xff7777, opacity: 0.5 },
      { r: 0.9, color: 0xffaacc, opacity: 1.0 },
    ]
    sunLayers.forEach(({ r, color, opacity }) => {
      const geo = new THREE.CircleGeometry(r, 64)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide })
      sunGroup.add(new THREE.Mesh(geo, mat))
    })
    // Horizontal scan lines cutting through sun
    for (let i = -8; i <= 8; i++) {
      if (i === 0) continue
      const y = i * 0.09
      const lineGeo = new THREE.PlaneGeometry(1.8, 0.03)
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x050008, transparent: true, opacity: 0.85 })
      const line = new THREE.Mesh(lineGeo, lineMat)
      line.position.set(0, y, 0.01)
      if (Math.abs(y) < 0.9) sunGroup.add(line)
    }
    scene.add(sunGroup)

    // --- Horizon glow ---
    const horizonGeo = new THREE.PlaneGeometry(40, 3)
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0xcc00ff,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
    })
    const horizon = new THREE.Mesh(horizonGeo, horizonMat)
    horizon.position.set(0, 1.0, -21)
    scene.add(horizon)

    // --- Grid ---
    function buildGrid(zOffset: number) {
      const group = new THREE.Group()
      const matH = new THREE.LineBasicMaterial({ color: 0xff00cc, transparent: true, opacity: 0.55 })
      const matV = new THREE.LineBasicMaterial({ color: 0x8800ff, transparent: true, opacity: 0.65 })

      // Horizontal lines (rows)
      for (let row = 0; row <= GRID_ROWS; row++) {
        const t = row / GRID_ROWS
        const z = -t * GRID_DEPTH + zOffset
        const pts = [
          new THREE.Vector3(-GRID_WIDTH / 2, 0, z),
          new THREE.Vector3(GRID_WIDTH / 2, 0, z),
        ]
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), matH))
      }

      // Vertical lines (cols)
      for (let col = 0; col <= GRID_COLS; col++) {
        const x = (col / GRID_COLS - 0.5) * GRID_WIDTH
        const pts = [
          new THREE.Vector3(x, 0, zOffset),
          new THREE.Vector3(x, 0, zOffset - GRID_DEPTH),
        ]
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), matV))
      }

      return group
    }

    const grid1 = buildGrid(2)
    const grid2 = buildGrid(2 - GRID_DEPTH)
    scene.add(grid1)
    scene.add(grid2)

    // --- Mountains silhouette ---
    function makeMountain(color: number, points: number[], zPos: number, yOff: number) {
      const shape = new THREE.Shape()
      shape.moveTo(points[0], yOff)
      for (let i = 0; i < points.length; i++) {
        shape.lineTo(i - points.length / 2, points[i] + yOff)
      }
      shape.lineTo(points.length - points.length / 2, yOff)
      shape.closePath()
      const geo = new THREE.ShapeGeometry(shape)
      const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.z = zPos
      mesh.position.y = -0.01
      mesh.scale.x = 2.2
      return mesh
    }

    const mtnPts1 = [0.3, 0.7, 1.4, 2.1, 1.5, 0.9, 1.8, 2.8, 2.0, 1.1, 0.5, 1.3, 2.4, 1.7, 0.8, 0.2]
    const mtnPts2 = [0.1, 0.5, 1.0, 0.7, 1.6, 2.2, 1.3, 0.6, 1.9, 1.4, 0.8, 1.1, 0.4, 0.9, 0.3, 0.1]
    scene.add(makeMountain(0x1a0033, mtnPts1, -16, 0))
    scene.add(makeMountain(0x0d0022, mtnPts2, -14, 0))

    // Resize handler
    function onResize() {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Animation
    const SCROLL_SPEED = 1.25
    let rafId: number

    function getScrollProgress() {
      const section = sectionRef.current
      if (!section) return 0
      const rect = section.getBoundingClientRect()
      const total = section.offsetHeight - window.innerHeight
      return Math.max(0, Math.min(1, -rect.top / total))
    }

    let t = 0
    function tick() {
      t += 0.016

      const scroll = getScrollProgress()
      const speed = SCROLL_SPEED * (1 + scroll * 1.2)

      // Scroll both grids forward, wrap when past viewer
      const shift = (t * speed) % GRID_DEPTH
      grid1.position.z = shift
      grid2.position.z = shift - GRID_DEPTH

      // Subtle sun pulse
      const pulse = 1 + Math.sin(t * 1.2) * 0.012
      sunGroup.scale.set(pulse, pulse, 1)

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <section className="wave synthwave" id="wave" ref={sectionRef}>
      <div className="wave__inner">
        <div ref={mountRef} className="synthwave__canvas" />

        <div className="synthwave__label">
          <span className="bar" />
          [02] / TRANSITION · SYNTHWAVE
        </div>

        <div className="synthwave__readout">
          84 BPM · 1984 · NEON_GRID
        </div>

        <div className="synthwave__caption">
          <h2>
            Made with <em className="synthwave-gradient-text">care.</em>
          </h2>
          <p>Scroll on — twelve projects from our members, sorted however you like.</p>
        </div>
      </div>
    </section>
  )
}
