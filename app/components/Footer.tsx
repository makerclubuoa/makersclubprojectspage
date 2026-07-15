'use client'

import Link from 'next/link'
import Image from 'next/image'
import { container } from '@/lib/ui'
import Button from './global/Button'
import art from '@/public/maker-club-art.png'

const FOOTERLINK =
  'text-white font-bold text-[15px] md:text-base transition-opacity duration-150 hover:opacity-75'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      id="site-footer"
      className="relative overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(146deg, #567dff 3%, #9f42d1 26%, #f04ab9 45%, #ff25c7 66%, #ff3c6d 82%, #ff856a 100%)',
      }}
    >
      <div className={`relative z-[2] ${container} py-12 md:py-16`}>
        <Image
          src="/maker-club-logo.svg"
          alt="Maker Club"
          width={64}
          height={64}
          className="w-12 h-12 md:w-16 md:h-16 mb-6"
        />

        <ul className="list-none p-0 m-0 flex flex-col gap-3 mb-8 max-w-[70%] md:max-w-none">
          <li><a className={FOOTERLINK} href="https://makeuoa.nz/about/">About</a></li>
          <li><a className={FOOTERLINK} href="https://makeuoa.nz/faq/">Frequently Asked Questions</a></li>
          <li><a className={FOOTERLINK} href="https://makeuoa.nz/events/">Events</a></li>
          <li><Link className={FOOTERLINK} href="/projects">Projects</Link></li>
          <li><a className={FOOTERLINK} href="https://vend.makeuoa.nz/">Vending Machine</a></li>
        </ul>

        <Button onClick={() => {}} bgColour="pop-pink" typeOverride="mb-8">
          Join Now!
        </Button>

        <p className="text-white text-[13px] font-semibold m-0">
          © The University of Auckland Maker Club {year}
        </p>
      </div>

      {/* Corner illustration (flipped so the mascot lands bottom-right) */}
      <div className="absolute bottom-0 right-0 z-[1] w-[220px] h-[170px] md:w-[320px] md:h-[245px] overflow-hidden pointer-events-none select-none">
        <Image
          src={art}
          alt=""
          className="absolute bottom-[-6%] right-[-14%] w-[720px] max-w-none [transform:scaleX(-1)] md:w-[1040px]"
        />
      </div>
    </footer>
  )
}
