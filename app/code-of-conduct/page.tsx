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
  faqList,
} from "@/lib/ui";

export const dynamic = "force-static";

// Prose card. Preflight is off, so p/ul/ol keep their UA margins — they're
// zeroed here and the column gap owns the vertical rhythm instead (same
// arrangement as faqAns).
const CARD = `${faqCard} flex flex-col gap-4 px-7 py-7 max-[640px]:px-5 text-[13.5px] md:text-sm font-medium leading-[1.7] text-ink-2 [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0`;
const LINK =
  "font-semibold text-pop-violet underline underline-offset-2 transition-colors duration-150 hover:text-pop-magenta";
// Sub-heading inside a card, for the sections the source page breaks out.
const SUBHEAD =
  "m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-pop-violet";

export default async function CodeOfConduct() {
  const photos = await getPhotos();
  return (
    <div className={pageWrap}>
      <div className="relative flex h-[38dvh] min-h-[240px] w-full items-center justify-center overflow-hidden border-b-4">
        <Image
          src={photos[2]?.src ?? placeholder}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover brightness-[0.55]"
        />
        {/* pt-6 balances the fixed nav overlaying the top of the photo. */}
        <div className="relative z-[1] flex flex-col items-center gap-2 px-5 pt-6 text-center">
          <p className={`${holt} text-4xl md:text-5xl text-white`}>
            Code of Conduct
          </p>
          <p className="max-w-[52ch] text-md md:text-lg font-semibold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
            Our code of conduct is built around creating a safe, supportive
            environment for everyone in our spaces. It&apos;s worth a read ❤️
          </p>
        </div>
      </div>

      <div className={`${container} py-14`}>
        <div className="mx-auto flex max-w-[860px] flex-col gap-12">
          <section className="flex flex-col gap-4">
            <div className={secHeadRow}>
              <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
                Who this applies to
              </h2>
              <span className={`${secHint} text-white/90`}>
                All Maker Club spaces
              </span>
            </div>
            <div className={CARD}>
              <p>
                The University of Auckland Maker Club (Maker Club) is dedicated
                to providing a harassment-free experience for everyone. We do
                not tolerate harassment of members or non-members in any form.
                In addition to this code of conduct, all members are expected to
                abide by the{" "}
                <a
                  className={LINK}
                  href="https://www.auckland.ac.nz/en/on-campus/life-on-campus/code-of-conduct.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  University of Auckland&apos;s Code of Conduct
                </a>
                .
              </p>
              <p>
                This code of conduct applies to all Maker Club spaces, including
                at all Maker Club events (no matter where they take place),
                online on our Discord, Facebook, and website, and all other
                places on the internet managed by the club. Anyone who violates
                this code of conduct may be sanctioned or expelled from these
                spaces at the discretion of the committee.
              </p>
              <p>
                Some Maker Club spaces may have additional rules in place, which
                will be made clearly available to members. Members are
                responsible for knowing and abiding by these rules.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className={secHeadRow}>
              <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
                What counts as harassment
              </h2>
            </div>
            <div className={CARD}>
              <p className="font-semibold text-ink">Harassment includes:</p>
              <ul className={faqList}>
                <li>
                  Offensive comments related to gender, gender identity and
                  expression, sexual orientation, disability, mental illness,
                  neuro(a)typicality, physical appearance, body size, age, race,
                  or religion.
                </li>
                <li>
                  Unwelcome comments regarding a person&apos;s lifestyle choices
                  and practices, including those related to food, health,
                  parenting, drugs, and employment.
                </li>
                <li>
                  Deliberate misgendering or use of &ldquo;dead&rdquo; or
                  rejected names.
                </li>
                <li>
                  Gratuitous or off-topic sexual images or behaviour in spaces
                  where they&apos;re not appropriate.
                </li>
                <li>
                  Physical contact and simulated physical contact (eg, textual
                  descriptions like &ldquo;<em>hug</em>&rdquo; or &ldquo;
                  <em>backrub</em>&rdquo;) without consent or after a request to
                  stop.
                </li>
                <li>Threats of violence.</li>
                <li>
                  Incitement of violence towards any individual, including
                  encouraging a person to commit suicide or to engage in
                  self-harm.
                </li>
                <li>Deliberate intimidation.</li>
                <li>Stalking or following.</li>
                <li>
                  Harassing photography or recording, including logging online
                  activity for harassment purposes.
                </li>
                <li>Sustained disruption of discussion.</li>
                <li>Unwelcome sexual attention.</li>
                <li>
                  Pattern of inappropriate social contact, such as
                  requesting/assuming inappropriate levels of intimacy with
                  others.
                </li>
                <li>
                  Continued one-on-one communication after requests to cease.
                </li>
                <li>
                  Deliberate &ldquo;outing&rdquo; of any aspect of a
                  person&apos;s identity without their consent except as
                  necessary to protect vulnerable people from intentional abuse.
                </li>
                <li>Publication of non-harassing private communication.</li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className={secHeadRow}>
              <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
                Safety over comfort
              </h2>
            </div>
            <div className={CARD}>
              <p>
                The Maker Club prioritizes marginalized people&apos;s safety
                over privileged people&apos;s comfort. The Committee reserves
                the right not to act on complaints regarding:
              </p>
              <ul className={faqList}>
                <li>
                  &ldquo;Reverse&rdquo; -isms, including &ldquo;reverse
                  racism,&rdquo; &ldquo;reverse sexism,&rdquo; and
                  &ldquo;cisphobia&rdquo;
                </li>
                <li>
                  Reasonable communication of boundaries, such as &ldquo;leave
                  me alone,&rdquo; &ldquo;go away,&rdquo; or &ldquo;I&apos;m not
                  discussing this with you.&rdquo;
                </li>
                <li>
                  Communicating in a &ldquo;tone&rdquo; you don&apos;t find
                  congenial
                </li>
                <li>
                  Criticizing racist, sexist, cissexist, or otherwise oppressive
                  behavior or assumptions
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className={secHeadRow}>
              <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
                Reporting
              </h2>
              <span className={`${secHint} text-white/90`}>
                We respond as promptly as we can
              </span>
            </div>
            <div className={CARD}>
              <p>
                If you are being harassed by a member of the Maker Club, notice
                that someone else is being harassed, or have any other concerns,
                please contact the committee at{" "}
                <a className={LINK} href="mailto:makerclubuoa@gmail.com">
                  makerclubuoa@gmail.com
                </a>
                , via private-messaging a committee member on{" "}
                <a
                  className={LINK}
                  href="https://discord.gg/67GaUhQTE2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
                , or by talking to us in person. If the person who is harassing
                you is on the team, they will recuse themselves from handling
                your incident. We will respond as promptly as we can.
              </p>
              <p>
                This code of conduct applies to Maker Club spaces, but if you
                are being harassed by a member of Maker Club outside our spaces,
                we still want to know about it. We will take all good-faith
                reports of harassment by Maker Club members, especially the
                committee, seriously. This includes harassment outside our
                spaces and harassment that took place at any point in time. The
                abuse team reserves the right to exclude people from the Maker
                Club based on their past behavior, including behavior outside
                Maker Club spaces and behavior towards people who are not in the
                Maker Club.
              </p>
              <p>
                In order to protect volunteers from abuse and burnout, we
                reserve the right to reject any report we believe to have been
                made in bad faith. Reports intended to silence legitimate
                criticism may be deleted without response.
              </p>
              <p>
                We will respect confidentiality requests for the purpose of
                protecting victims of abuse. At our discretion, we may publicly
                name a person about whom we&apos;ve received harassment
                complaints, or privately warn third parties about them, if we
                believe that doing so will increase the safety of Maker Club
                members or the general public. We will not name harassment
                victims without their affirmative consent.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className={secHeadRow}>
              <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
                Consequences
              </h2>
            </div>
            <div className={CARD}>
              <p>
                Members asked to stop any harassing behavior are expected to
                comply immediately.
              </p>
              <p>
                If a member engages in harassing behaviour, the committee may
                take any action they deem appropriate, up to and including
                expulsion from all Maker Club spaces, identification of the
                member as a harasser to other Maker Club members or the general
                public, and reporting of the breach of conduct to the University
                of Auckland.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className={secHeadRow}>
              <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
                Getting help
              </h2>
            </div>
            <div className={CARD}>
              <p className="font-semibold text-ink">
                Sexual assault hotline —{" "}
                <a className={LINK} href="tel:0800883300">
                  0800 883 300
                </a>
              </p>
              <div className="flex flex-col gap-2">
                <p className={SUBHEAD}>At the University of Auckland</p>
                <p>
                  If an incident takes place on campus you can phone University
                  Security on{" "}
                  <a className={LINK} href="tel:+6493737599">
                    +64 9 373 7599
                  </a>{" "}
                  extension 85000, or dial 85000 directly if you use an internal
                  University telephone. You can read more about{" "}
                  <a
                    className={LINK}
                    href="https://www.auckland.ac.nz/en/on-campus/student-support/personal-support/safety-on-campus.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    safety on campus
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          <div
            className={`${faqCard} flex flex-col items-center gap-4 px-7 py-9 text-center max-[640px]:px-5`}
          >
            <h3 className={`${secHead} text-pop-pink`}>
              Questions about any of this?
            </h3>
            <p className="m-0 max-w-[46ch] text-sm font-semibold text-ink-2 leading-[1.6]">
              Talk to the committee — we&apos;d rather hear from you early than
              not at all.
            </p>
            <LinkButton
              link="mailto:makerclubuoa@gmail.com"
              bgColour="pop-pink"
              textColour="white"
              typeOverride="text-base md:text-lg lg:text-xl"
            >
              Email the committee
            </LinkButton>
          </div>

          <p className="m-0 text-center text-xs font-semibold text-white/80 italic">
            This code of conduct is adapted from the{" "}
            <a
              className="underline underline-offset-2 transition-opacity duration-150 hover:opacity-70"
              href="https://geekfeminism.wikia.org/wiki/Community_anti-harassment/Policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Geek Feminism Wiki&apos;s Community anti-harassment policy
              template
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
