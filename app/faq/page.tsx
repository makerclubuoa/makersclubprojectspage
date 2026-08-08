import { getPhotos } from "@/lib/ghost/photos";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import LinkButton from "../components/global/LinkButton";
import {
  container,
  pageWrap,
  holt,
  secHeadRow,
  secHead,
  secHint,
  faqCard,
  faqItem,
  faqQ,
  faqMark,
  faqAns,
  faqList,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

type Entry = { q: string; a: React.ReactNode };

const CLUB: Entry[] = [
  {
    q: "What events does Maker Club run?",
    a: (
      <p>
        We run hands-on workshops where members can build, create, learn new
        skills, and meet other makers. You&apos;ll often get to take something
        home too.
      </p>
    ),
  },
  {
    q: "When are Maker Club events held?",
    a: (
      <p>
        Events are usually held on Friday evenings after 5:00pm unless otherwise
        specified. Announcements are posted in the announcements channel and on
        Instagram at least one week in advance.
      </p>
    ),
  },
  {
    q: "How do I join an event?",
    a: (
      <p>
        Event capacity is limited for health and safety reasons. Register
        through the Humanitix link provided for the event. If you can no longer
        attend, please refund your ticket so it can be offered to someone on the
        waitlist.
      </p>
    ),
  },
  {
    q: "Can non-UoA students attend events?",
    a: (
      <p>
        Yes. Non-UoA students are welcome at Maker Club events, but do not have
        access to the Makerspace outside of designated Open Nights.
      </p>
    ),
  },
  {
    q: "How much does Maker Club membership cost?",
    a: (
      <p>
        Membership is free. Some special events may have a ticket fee to help
        cover materials and event costs.
      </p>
    ),
  },
  {
    q: "What is the Maker Club Vending Machine?",
    a: (
      <p>
        The Vending Machine allows makers, artists, and small businesses to
        display and sell their creations. 100% of revenue goes directly to the
        maker.
      </p>
    ),
  },
];

const MAKERSPACE: Entry[] = [
  {
    q: "What is the difference between the Maker Club and the Makerspace?",
    a: (
      <p>
        While we work closely together, the Maker Club is an independent,
        student-run university club whereas the Makerspace is the curated
        workspace run by the CIE.
      </p>
    ),
  },
  {
    q: "Where is the Makerspace?",
    a: (
      <p>
        The Makerspace is located on the 4th floor of Engineering Building 402,
        directly to your left if you enter through the main doors off Symonds
        Street.
      </p>
    ),
  },
  {
    q: "What equipment is in the Makerspace?",
    a: (
      <ul className={faqList}>
        <li>Laser Cutter</li>
        <li>3D Printers</li>
        <li>Vinyl Cutters</li>
        <li>Cricut Machines</li>
        <li>Sublimation Printers</li>
        <li>Sewing Machines</li>
        <li>Soldering Irons</li>
        <li>Woodworking Tools</li>
        <li>CNC Router</li>
        <li>Painting Station</li>
        <li>Electronics Supplies</li>
      </ul>
    ),
  },
  {
    q: "When is the Makerspace open?",
    a: (
      <>
        <p>10:00am – 2:00pm: Public Hours</p>
        <p>2:00pm – 4:00pm: Maker Space Residencies*</p>
        <p>
          *If no residency is scheduled, public hours continue as normal until
          4:00pm.
        </p>
        <p>
          Opening hours may vary as the space is sometimes booked for courses,
          workshops, and events. The space is also closed during holiday
          periods.
        </p>
      </>
    ),
  },
  {
    q: "Who can use the Makerspace?",
    a: (
      <p>
        The Makerspace is open to all University of Auckland students and staff.
        Membership is completely free and gives you access to the Canvas page,
        equipment training resources, and certification videos.
      </p>
    ),
  },
  {
    q: "How can I use the Makerspace?",
    a: (
      <ul className={faqList}>
        <li>Sign in and out using the iPads at the entrance.</li>
        <li>
          Store bags under the tables, tie back long hair, and wear closed-toe
          shoes.
        </li>
        <li>No food or drinks are permitted in the space.</li>
        <li>Ask a Creative Technologist (CT) if you need help using equipment.</li>
        <li>
          CTs are trained in first aid and fire safety and can be identified by
          the <strong className="text-ink">@Staff 🔥</strong> role on Discord.
        </li>
        <li>Report equipment faults, accidents, or near misses.</li>
        <li>
          Always have a CT check your setup before pressing print, cut, or
          start, even if you&apos;re certified.
        </li>
      </ul>
    ),
  },
  {
    q: "How do I get certified to use equipment?",
    a: (
      <>
        <ol className={`${faqList} list-decimal`}>
          <li>
            Watch the relevant certification videos on the Makerspace Canvas
            page.
          </li>
          <li>
            Complete the benchmark project available at the equipment station.
          </li>
          <li>Show your completed benchmark to the CT on duty.</li>
          <li>
            Once approved, you&apos;ll be certified to use that equipment for
            future projects.
          </li>
        </ol>
        <p>If you get stuck at any point, a CT will always be available to help.</p>
      </>
    ),
  },
  {
    q: "Is there storage for my projects?",
    a: (
      <p>
        Completed 3D prints that finish after hours will be stored in the
        designated 3D Prints tray for collection. General project storage is not
        available.
      </p>
    ),
  },
  {
    q: "Are materials free?",
    a: (
      <>
        <p>
          The Makerspace&apos;s equipment and materials are available free of
          charge to University of Auckland students and staff.
        </p>
        <ul className={faqList}>
          <li>Some materials have usage limits.</li>
          <li>Larger projects may require you to supply your own materials.</li>
          <li>Please check with a CT if you&apos;re unsure.</li>
        </ul>
      </>
    ),
  },
  {
    q: "Can I use the Makerspace for course-related projects?",
    a: (
      <>
        <p>
          Generally, the Makerspace is intended for personal projects rather
          than coursework.
        </p>
        <p>
          Exceptions may apply for approved prototyping projects, specific
          courses, or programmes that work directly with the Makerspace. If
          you&apos;re unsure, please ask a CT.
        </p>
      </>
    ),
  },
];

function FaqGroup({
  title,
  colour,
  entries,
}: {
  title: string;
  colour: string;
  entries: Entry[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className={secHeadRow}>
        <h2 className={`${secHead} ${colour} text-2xl md:text-3xl`}>{title}</h2>
        <span className={`${secHint} text-white/90`}>Click to expand</span>
      </div>
      <div className={faqCard}>
        {entries.map((entry) => (
          <details key={entry.q} className={faqItem}>
            <summary className={faqQ}>
              <span className={faqMark} aria-hidden="true">
                +
              </span>
              <span className="flex-1">{entry.q}</span>
            </summary>
            <div className={faqAns}>{entry.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function FAQ() {
  const photos = await getPhotos();
  return (
    <div className={pageWrap}>
      <div className="relative flex h-[38dvh] min-h-[240px] w-full items-center justify-center overflow-hidden border-b-4">
        <Image
          src={photos[4]?.src ?? placeholder}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover brightness-[0.55]"
        />
        {/* pt-6 balances the fixed nav overlaying the top of the photo. */}
        <div className="relative z-[1] flex flex-col items-center gap-2 px-5 pt-6 text-center">
          <p className={`${holt} text-4xl md:text-5xl text-white`}>FAQ</p>
          <p className="max-w-[52ch] text-md md:text-lg font-semibold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
            Everything about the club, our events, and how to use the
            Makerspace.
          </p>
        </div>
      </div>

      <div className={`${container} py-14`}>
        <div className="mx-auto flex max-w-[860px] flex-col gap-12">
          <FaqGroup
            title="Maker Club Questions"
            colour="text-white"
            entries={CLUB}
          />
          <FaqGroup
            title="Makerspace Questions"
            colour="text-white"
            entries={MAKERSPACE}
          />

          <div
            className={`${faqCard} flex flex-col items-center gap-4 px-7 py-9 text-center max-[640px]:px-5`}
          >
            <h3 className={`${secHead} text-pop-pink`}>
              Still have questions?
            </h3>
            <p className="m-0 max-w-[46ch] text-sm font-semibold text-ink-2 leading-[1.6]">
              The CIE&apos;s Unleash Space site has more on the Makerspace, its
              hours and its equipment.
            </p>
            <LinkButton
              link="https://www.auckland.ac.nz/en/cie/locations/unleash-space.html"
              bgColour="pop-pink"
              textColour="white"
              typeOverride="text-base md:text-lg lg:text-xl"
            >
              Visit the CIE site
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
