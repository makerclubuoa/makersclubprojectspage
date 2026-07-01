import Link from 'next/link'
import { container } from '@/lib/ui'

const NAVLINK = 'text-sm text-ink-2 transition-colors duration-150 hover:text-ink'
const SOCIAL = 'text-ink opacity-60 transition-opacity duration-200 flex hover:opacity-100'
const H5 = 'text-[11px] tracking-[0.1em] uppercase text-muted mb-3.5 font-semibold'

export default function Footer() {
  return (
    <footer className="border-t border-rule">

      {/* Main footer row */}
      <div className="py-10">
        <div className={container}>
          <div className="flex items-start justify-between gap-12 max-[900px]:flex-col max-[900px]:gap-8">

            {/* Brand + tagline + socials */}
            <div className="flex flex-col gap-2.5">
              <a className="flex items-center gap-[9px] font-bold text-base" href="https://makeuoa.nz">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/aumc-logo.svg" alt="UoA Maker Club" className="h-8 w-auto block dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo_h_w.svg" alt="UoA Maker Club" className="h-8 w-auto hidden dark:block" />
              </a>
              <p className="text-sm text-ink-2 m-0">A community of creators.</p>
              <div className="flex gap-3 items-center mt-1">
                <a href="https://www.instagram.com/make.uoa/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={SOCIAL}>
                  <svg width="19" height="19" viewBox="2 2 28 28" fill="currentColor"><path d="M16 2.66675C19.6226 2.66675 20.0746 2.68008 21.496 2.74675C22.916 2.81341 23.8826 3.03608 24.7333 3.36675C25.6133 3.70541 26.3546 4.16408 27.096 4.90408C27.774 5.57061 28.2986 6.37687 28.6333 7.26675C28.9626 8.11608 29.1866 9.08408 29.2533 10.5041C29.316 11.9254 29.3333 12.3774 29.3333 16.0001C29.3333 19.6227 29.32 20.0747 29.2533 21.4961C29.1866 22.9161 28.9626 23.8827 28.6333 24.7334C28.2995 25.6238 27.7748 26.4302 27.096 27.0961C26.4292 27.7738 25.623 28.2984 24.7333 28.6334C23.884 28.9627 22.916 29.1867 21.496 29.2534C20.0746 29.3161 19.6226 29.3334 16 29.3334C12.3773 29.3334 11.9253 29.3201 10.504 29.2534C9.08396 29.1867 8.11729 28.9627 7.26663 28.6334C6.37639 28.2994 5.57 27.7747 4.90396 27.0961C4.22583 26.4297 3.7012 25.6234 3.36663 24.7334C3.03596 23.8841 2.81329 22.9161 2.74663 21.4961C2.68396 20.0747 2.66663 19.6227 2.66663 16.0001C2.66663 12.3774 2.67996 11.9254 2.74663 10.5041C2.81329 9.08275 3.03596 8.11741 3.36663 7.26675C3.70027 6.37632 4.22503 5.56984 4.90396 4.90408C5.57019 4.22572 6.37653 3.70105 7.26663 3.36675C8.11729 3.03608 9.08263 2.81341 10.504 2.74675C11.9253 2.68408 12.3773 2.66675 16 2.66675ZM16 9.33341C14.2318 9.33341 12.5362 10.0358 11.2859 11.286C10.0357 12.5363 9.33329 14.232 9.33329 16.0001C9.33329 17.7682 10.0357 19.4639 11.2859 20.7141C12.5362 21.9644 14.2318 22.6667 16 22.6667C17.7681 22.6667 19.4638 21.9644 20.714 20.7141C21.9642 19.4639 22.6666 17.7682 22.6666 16.0001C22.6666 14.232 21.9642 12.5363 20.714 11.286C19.4638 10.0358 17.7681 9.33341 16 9.33341ZM24.6666 9.00008C24.6666 8.55805 24.491 8.13413 24.1785 7.82157C23.8659 7.50901 23.442 7.33341 23 7.33341C22.5579 7.33341 22.134 7.50901 21.8214 7.82157C21.5089 8.13413 21.3333 8.55805 21.3333 9.00008C21.3333 9.44211 21.5089 9.86603 21.8214 10.1786C22.134 10.4912 22.5579 10.6667 23 10.6667C23.442 10.6667 23.8659 10.4912 24.1785 10.1786C24.491 9.86603 24.6666 9.44211 24.6666 9.00008Z"/></svg>
                </a>
                <a href="https://discord.gg/6NFXUU2euN" target="_blank" rel="noopener noreferrer" aria-label="Discord" className={SOCIAL}>
                  <svg width="19" height="19" viewBox="0 0 71 55" fill="currentColor"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/></svg>
                </a>
                <a href="https://www.facebook.com/makeuoa" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={SOCIAL}>
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor"><path d="M14 0.666748C6.63596 0.666748 0.666626 6.63608 0.666626 14.0001C0.666626 20.6547 5.54262 26.1707 11.9173 27.1721V17.8534H8.53063V14.0001H11.9173V11.0627C11.9173 7.72141 13.9066 5.87608 16.9533 5.87608C18.412 5.87608 19.9373 6.13608 19.9373 6.13608V9.41608H18.2573C16.6 9.41608 16.084 10.4441 16.084 11.4987V14.0001H19.7813L19.1906 17.8534H16.084V27.1721C22.4573 26.1721 27.3333 20.6534 27.3333 14.0001C27.3333 6.63608 21.364 0.666748 14 0.666748Z"/></svg>
                </a>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex gap-12 max-[560px]:gap-8">
              <div>
                <h5 className={H5}>Club</h5>
                <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                  <li><a className={NAVLINK} href="https://makeuoa.nz/about/">About</a></li>
                  <li><a className={NAVLINK} href="https://makeuoa.nz/tag/updates/">Updates</a></li>
                  <li><a className={NAVLINK} href="https://makeuoa.nz/code-of-conduct/">Code of Conduct</a></li>
                  <li><a className={NAVLINK} href="https://discord.gg/6NFXUU2euN">Discord</a></li>
                  <li><a className={NAVLINK} href="https://vend.makeuoa.nz/">Vending Machine</a></li>
                </ul>
              </div>
              <div>
                <h5 className={H5}>Projects</h5>
                <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                  <li><Link className={NAVLINK} href="/">Archive</Link></li>
                  <li><Link className={NAVLINK} href="/submit">Submit a project</Link></li>
                  <li><Link className={NAVLINK} href="/login">Sign in</Link></li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-rule py-[18px] text-xs text-muted">
        <div className={container}>
          <span>© 2026 University of Auckland Makers Club</span>
        </div>
      </div>

    </footer>
  )
}
