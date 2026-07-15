import { getPhotos } from "@/lib/ghost/photos";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import JoinSection from "../components/homepage/JoinSection";
import LinkButton from "../components/global/LinkButton";
import Link from "next/link";

export default async function FAQ() {
  const photos = await getPhotos();
  return (
    <div className="">
      <div className="h-dvh w-full">
        <div className="h-1/3  w-full flex flex-col justify-center">
          <div className="w-full h-1/3 absolute border-b-4">
            <Image
              src={photos[4].src ?? placeholder}
              alt="Background."
              fill
              sizes="100vh"
              className="brightness-75 object-cover -z-10"
            />
            <div className="flex h-full w-full items-center justify-center">
              <p
                className={`font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white`}
              >
                FAQ
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-3/4 flex flex-col pt-5">
            <p className="font-bold text-3xl">Maker Club Questions</p>
            <details className="faq">
              <summary className="faq-q">
                What events does Maker Club run?
              </summary>
              <div>
                <p className="faq-ans">
                  We run hands-on workshops where members can build, create,
                  learn new skills, and meet other makers. You'll often get to
                  take something home too.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                When are Maker Club events held?
              </summary>
              <div>
                <p className="faq-ans">
                  Events are usually held on Friday evenings after 5:00pm unless
                  otherwise specified. Announcements are posted in the
                  announcements channel and on Instagram at least one week in
                  advance.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">How do I join an event?</summary>
              <div>
                <p className="faq-ans">
                  Event capacity is limited for health and safety reasons.
                  Register through the Humanitix link provided for the event. If
                  you can no longer attend, please refund your ticket so it can
                  be offered to someone on the waitlist.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                Can non-UoA students attend events?
              </summary>
              <div>
                <p className="faq-ans">
                  Yes. Non-UoA students are welcome at Maker Club events, but do
                  not have access to the Makerspace outside of designated Open
                  Nights.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                How much does Maker Club membership cost?
              </summary>
              <div>
                <p className="faq-ans">
                  Membership is free. Some special events may have a ticket fee
                  to help cover materials and event costs.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                What is the Maker Club Vending Machine?
              </summary>
              <div>
                <p className="faq-ans">
                  The Vending Machine allows makers, artists, and small
                  businesses to display and sell their creations. 100% of
                  revenue goes directly to the maker.
                </p>
              </div>
            </details>

            <p className="font-bold text-3xl">Makerspace Questions</p>
            <details className="faq">
              <summary className="faq-q">
                What is the difference between the Maker Club and the
                Makerspace?
              </summary>
              <div>
                <p className="faq-ans">
                  While we work closely together, the Maker Club is an
                  independent, student-run university club whereas the
                  Makerspace is the curated workspace run by the CIE.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">Where is the Makerspace?</summary>
              <div>
                <p className="faq-ans">
                  The Makerspace is located on the 4th floor of Engineering
                  Building 402, directly to your left if you enter through the
                  main doors off Symonds Street.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                What equipment is in the Makerspace?
              </summary>
              <div>
                <ul className="faq-ans list-disc pl-6 space-y-1">
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
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">When is the Makerspace open?</summary>
              <div>
                <div className="faq-ans space-y-2">
                  <p>10:00am – 2:00pm: Public Hours</p>
                  <p>2:00pm – 4:00pm: Maker Space Residencies*</p>
                  <p>
                    *If no residency is scheduled, public hours continue as
                    normal until 4:00pm.
                  </p>
                  <p>
                    Opening hours may vary as the space is sometimes booked for
                    courses, workshops, and events. The space is also closed
                    during holiday periods.
                  </p>
                </div>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">Who can use the Makerspace?</summary>
              <div>
                <p className="faq-ans">
                  The Makerspace is open to all University of Auckland students
                  and staff. Membership is completely free and gives you access
                  to the Canvas page, equipment training resources, and
                  certification videos.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">How can I use the Makerspace?</summary>
              <div>
                <div className="faq-ans">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Sign in and out using the iPads at the entrance.</li>
                    <li>
                      Store bags under the tables, tie back long hair, and wear
                      closed-toe shoes.
                    </li>
                    <li>No food or drinks are permitted in the space.</li>
                    <li>
                      Ask a Creative Technologist (CT) if you need help using
                      equipment.
                    </li>
                    <li>
                      CTs are trained in first aid and fire safety and can be
                      identified by the <strong>@Staff 🔥</strong> role on
                      Discord.
                    </li>
                    <li>Report equipment faults, accidents, or near misses.</li>
                    <li>
                      Always have a CT check your setup before pressing print,
                      cut, or start, even if you're certified.
                    </li>
                  </ul>
                </div>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                How do I get certified to use equipment?
              </summary>
              <div>
                <div className="faq-ans">
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      Watch the relevant certification videos on the Makerspace
                      Canvas page.
                    </li>
                    <li>
                      Complete the benchmark project available at the equipment
                      station.
                    </li>
                    <li>Show your completed benchmark to the CT on duty.</li>
                    <li>
                      Once approved, you'll be certified to use that equipment
                      for future projects.
                    </li>
                  </ol>

                  <p className="mt-4">
                    If you get stuck at any point, a CT will always be available
                    to help.
                  </p>
                </div>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                Is there storage for my projects?
              </summary>
              <div>
                <p className="faq-ans">
                  Completed 3D prints that finish after hours will be stored in
                  the designated 3D Prints tray for collection. General project
                  storage is not available.
                </p>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">Are materials free?</summary>
              <div>
                <p className="faq-ans">
                  The Makerspace's equipment and materials are available free of
                  charge to University of Auckland students and staff.
                </p>

                <ul className="faq-ans list-disc pl-6 space-y-1 mt-3">
                  <li>Some materials have usage limits.</li>
                  <li>
                    Larger projects may require you to supply your own
                    materials.
                  </li>
                  <li>Please check with a CT if you're unsure.</li>
                </ul>
              </div>
            </details>

            <details className="faq">
              <summary className="faq-q">
                Can I use the Makerspace for course-related projects?
              </summary>
              <div>
                <p className="faq-ans">
                  Generally, the Makerspace is intended for personal projects
                  rather than coursework.
                </p>

                <p className="faq-ans mt-3">
                  Exceptions may apply for approved prototyping projects,
                  specific courses, or programmes that work directly with the
                  Makerspace. If you're unsure, please ask a CT.
                </p>
              </div>
            </details>
            <div className="font-bold text-2xl text-center pb-10">
              <Link
                href="www.auckland.ac.nz/en/cie/locations/unleash-space.html"
                className="underline"
              >
                Still have more questions? Click here to checkout out the CIE
                website for more information.
              </Link>
            </div>
          </div>
        </div>
        <div className="h-[50dvh]">
          <JoinSection />
        </div>
      </div>
    </div>
  );
}
