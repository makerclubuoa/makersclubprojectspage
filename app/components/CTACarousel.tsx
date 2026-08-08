'use client'

import Image from 'next/image'

// Each tile renders ~200px wide, so these go through next/image rather than
// pulling the full-size cover eight times over.
// Spacing lives on the tile, not as a flex `gap` on the track. The scroll-up /
// scroll-down keyframes translate the track by exactly -50%, which is only
// seamless when the duplicated half is self-contained — a gap between the two
// copies isn't included in that 50%, so the loop visibly jumped each cycle.
const TILE =
  'relative w-full aspect-[4/3] rounded-[10px] overflow-hidden shrink-0 mb-3 max-[640px]:mb-2'
const SIZES = '(max-width: 900px) 45vw, 220px'

export default function CTACarousel({ images }: { images: { id: string; src: string; alt: string }[] }) {
  if (images.length === 0) return null

  const half = Math.ceil(images.length / 2)
  const colA = images.slice(0, half)
  const colB = images.slice(half)

  // Duplicate each column for seamless looping
  const trackA = [...colA, ...colA]
  const trackB = [...colB, ...colB]

  return (
    <div className="w-full flex-1 flex gap-3 h-[360px] max-[900px]:h-[260px] max-[640px]:h-[200px] max-[640px]:gap-2 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col animate-[scroll-up_12s_linear_infinite]">
          {trackA.map((img, i) => (
            <div key={`a-${i}`} className={TILE}>
              <Image src={img.src} alt={img.alt} fill sizes={SIZES} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col animate-[scroll-down_12s_linear_infinite]">
          {trackB.map((img, i) => (
            <div key={`b-${i}`} className={TILE}>
              <Image src={img.src} alt={img.alt} fill sizes={SIZES} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
