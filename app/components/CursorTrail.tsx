'use client'

import { useEffect } from 'react'

export default function CursorTrail() {
  useEffect(() => {
    let lastTrail = 0

    function onMove(e: PointerEvent) {
      const now = performance.now()
      if (now - lastTrail < 40) return
      lastTrail = now

      const d = document.createElement('span')
      d.className = 'trail-dot'
      const s = 3 + Math.random() * 3
      d.style.cssText = `
        width:${s}px;height:${s}px;
        left:${e.clientX}px;top:${e.clientY}px;
        background:currentColor;
        border-radius:50%;
        opacity:.25;
        transition:opacity .4s ease, transform .4s ease;
      `
      document.body.appendChild(d)
      requestAnimationFrame(() => {
        d.style.opacity = '0'
        d.style.transform = `translate(-50%,-50%) scale(0)`
      })
      setTimeout(() => d.remove(), 420)
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return null
}
