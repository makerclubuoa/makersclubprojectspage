'use client'

import { useEffect } from 'react'

const TRAIL_COLORS = ['#567dff', '#9f42d1', '#f04ab9', '#ff25c7', '#ff3c6d', '#ff856a']

export default function CursorTrail() {
  useEffect(() => {
    let lastTrail = 0
    let trailIx = 0

    function onMove(e: PointerEvent) {
      const now = performance.now()
      if (now - lastTrail < 24) return
      lastTrail = now

      const d = document.createElement('span')
      d.className = 'trail-dot'
      const c = TRAIL_COLORS[(trailIx++) % TRAIL_COLORS.length]
      const s = 5 + Math.random() * 9
      d.style.cssText = `
        width:${s + 6}px;height:${s + 6}px;
        left:${e.clientX}px;top:${e.clientY}px;
        background:
          linear-gradient(${c}, ${c}) center/100% 1px no-repeat,
          linear-gradient(${c}, ${c}) center/1px 100% no-repeat;
        opacity:.85;
        transition:opacity .9s ease, transform .9s cubic-bezier(.2,.7,.3,1);
      `
      document.body.appendChild(d)
      requestAnimationFrame(() => {
        d.style.opacity = '0'
        d.style.transform = `translate(-50%,-50%) translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30 - 10}px) scale(.3) rotate(${(Math.random() - 0.5) * 60}deg)`
      })
      setTimeout(() => d.remove(), 950)
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return null
}
