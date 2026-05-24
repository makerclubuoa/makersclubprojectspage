'use client'

export default function CTACarousel({ images }: { images: { id: string; src: string; alt: string }[] }) {
  const half = Math.ceil(images.length / 2)
  const colA = images.slice(0, half)
  const colB = images.slice(half)

  // Duplicate each column for seamless looping
  const trackA = [...colA, ...colA]
  const trackB = [...colB, ...colB]

  return (
    <div className="cta-carousel">
      <div className="cta-carousel__col cta-carousel__col--up">
        <div className="cta-carousel__track cta-carousel__track--up">
          {trackA.map((img, i) => (
            <img key={`a-${i}`} src={img.src} alt={img.alt} className="footer__cta-img" />
          ))}
        </div>
      </div>
      <div className="cta-carousel__col cta-carousel__col--down">
        <div className="cta-carousel__track cta-carousel__track--down">
          {trackB.map((img, i) => (
            <img key={`b-${i}`} src={img.src} alt={img.alt} className="footer__cta-img" />
          ))}
        </div>
      </div>
    </div>
  )
}
